import { useCallback, useMemo, useState } from 'react';
import { Wind, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { usePatientChart } from '../PatientChartContext';
import { ChartTabShell } from '../components/chart-ui';
import { AsthmaCopdAssessmentSection } from './AsthmaCopdAssessmentSection';
import { SpirometryO2Section } from './SpirometryO2Section';
import { InhalerAdherenceSection } from './InhalerAdherenceSection';
import { SmokingVapingScreenSection } from './SmokingVapingScreenSection';
import { PULMONOLOGY_SECTIONS } from './pulmonologyConstants';
import {
  loadPulmonologyHistory,
  loadPulmonologyState,
  providerDisplayName,
  savePulmonologyState,
} from './pulmonologyUtils';

function todayInputValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function PatientPulmonologyTab() {
  const { patientId, appointmentId, appointment } = usePatientChart();
  const provider = providerDisplayName(appointment);
  return (
    <PulmonologyTabInner
      key={`${patientId || 'unknown'}::${appointmentId || 'no-appt'}`}
      patientId={patientId}
      appointmentId={appointmentId}
      provider={provider}
    />
  );
}

function PulmonologyTabInner({ patientId, appointmentId, provider }) {
  const { patient, loading, error, refreshChart } = usePatientChart();

  const defaults = useMemo(
    () => ({
      examinationDate: todayInputValue(),
      provider: provider || '',
    }),
    [provider],
  );

  const initial = loadPulmonologyState(patientId, appointmentId, defaults);
  if (!initial.asthmaCopd.provider && provider) {
    initial.asthmaCopd.provider = provider;
  }

  const [section, setSection] = useState('asthma-copd');
  const [state, setState] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(initial.updatedAt);
  const [saveMessage, setSaveMessage] = useState('');
  const [history, setHistory] = useState(() => loadPulmonologyHistory(patientId));

  const persist = useCallback(
    (next) => {
      const saved = savePulmonologyState(patientId, appointmentId, next);
      setState(saved);
      setSavedAt(saved.updatedAt);
      setHistory(loadPulmonologyHistory(patientId));
      setDirty(false);
      setSaveMessage('Saved Pulmonology documentation for this encounter. Longitudinal history updated.');
    },
    [patientId, appointmentId],
  );

  const updateAsthmaCopd = (asthmaCopd) => {
    setState((prev) => ({ ...prev, asthmaCopd }));
    setDirty(true);
  };

  const updateSpirometry = (spirometry) => {
    setState((prev) => ({ ...prev, spirometry }));
    setDirty(true);
  };

  const updateInhaler = (inhaler) => {
    setState((prev) => ({ ...prev, inhaler }));
    setDirty(true);
  };

  const updateSmoking = (smoking) => {
    setState((prev) => ({ ...prev, smoking }));
    setDirty(true);
  };

  const subtitle = useMemo(() => {
    const name = [patient?.firstName, patient?.lastName].filter(Boolean).join(' ');
    return name
      ? `Asthma/COPD assessment, spirometry & O₂, inhaler adherence, and smoking/vaping screen for ${name}.`
      : 'Document asthma/COPD assessment, spirometry & oxygen status, inhaler adherence, and smoking/vaping screening.';
  }, [patient]);

  const latestHistory = useMemo(() => {
    const current = {
      at: savedAt || new Date().toISOString(),
      appointmentId,
      examinationDate: state.asthmaCopd?.examinationDate,
      diseaseFocus: state.asthmaCopd?.diseaseFocus,
      asthmaControl: state.asthmaCopd?.asthmaControl,
      actScore: state.asthmaCopd?.actScore,
      goldStage: state.asthmaCopd?.goldStage,
      catScore: state.asthmaCopd?.catScore,
      fev1PercentPredicted: state.spirometry?.fev1PercentPredicted,
      spo2RoomAir: state.spirometry?.spo2RoomAir,
      homeOxygenStatus: state.spirometry?.homeOxygenStatus,
      overallAdherence: state.inhaler?.overallAdherence,
      tobaccoStatus: state.smoking?.tobaccoStatus,
      vapingStatus: state.smoking?.vapingStatus,
    };
    const rest = history.filter((h) => h.appointmentId !== appointmentId);
    return [current, ...rest];
  }, [history, appointmentId, savedAt, state]);

  return (
    <ChartTabShell
      eyebrow="Pulmonology"
      title="Pulmonology"
      description={subtitle}
      loading={loading && !patient}
      error={error}
      onRetry={refreshChart}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {dirty && (
            <span className="text-xs font-medium text-amber-700">Unsaved changes</span>
          )}
          {!dirty && savedAt && (
            <span className="text-xs text-muted-foreground">
              Saved {new Date(savedAt).toLocaleString()}
            </span>
          )}
          <Button type="button" size="sm" disabled={!dirty} onClick={() => persist(state)}>
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Save
          </Button>
        </div>
      }
    >
      {saveMessage && (
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          {saveMessage}
        </div>
      )}

      <Tabs value={section} onValueChange={setSection} className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 rounded-xl bg-muted/50 p-1 sm:grid-cols-2 lg:grid-cols-4">
          {PULMONOLOGY_SECTIONS.map((item) => (
            <TabsTrigger
              key={item.id}
              value={item.id}
              className={cn(
                'rounded-lg data-[state=active]:shadow-sm',
                item.id === 'asthma-copd' && 'gap-1.5',
              )}
            >
              {item.id === 'asthma-copd' && (
                <Wind className="h-3.5 w-3.5 opacity-80" aria-hidden />
              )}
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="asthma-copd" className="mt-6 focus-visible:outline-none">
          <AsthmaCopdAssessmentSection
            value={state.asthmaCopd}
            onChange={updateAsthmaCopd}
            history={latestHistory}
          />
        </TabsContent>

        <TabsContent value="spirometry-o2" className="mt-6 focus-visible:outline-none">
          <SpirometryO2Section
            value={state.spirometry}
            onChange={updateSpirometry}
            history={latestHistory}
          />
        </TabsContent>

        <TabsContent value="inhaler-adherence" className="mt-6 focus-visible:outline-none">
          <InhalerAdherenceSection
            value={state.inhaler}
            onChange={updateInhaler}
            history={latestHistory}
          />
        </TabsContent>

        <TabsContent value="smoking-vaping" className="mt-6 focus-visible:outline-none">
          <SmokingVapingScreenSection
            value={state.smoking}
            onChange={updateSmoking}
            history={latestHistory}
          />
        </TabsContent>
      </Tabs>

      {state.auditLog?.length > 0 && (
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Audit trail
          </p>
          <ul className="mt-2 space-y-1">
            {[...state.auditLog]
              .reverse()
              .slice(0, 5)
              .map((entry) => (
                <li key={`${entry.at}-${entry.note}`} className="text-xs text-muted-foreground">
                  {new Date(entry.at).toLocaleString()} — {entry.note}
                </li>
              ))}
          </ul>
        </div>
      )}
    </ChartTabShell>
  );
}
