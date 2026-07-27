import { useCallback, useMemo, useState } from 'react';
import { Brain, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { usePatientChart } from '../PatientChartContext';
import { ChartTabShell } from '../components/chart-ui';
import { SafetySiHiSection } from './SafetySiHiSection';
import { PsychopharmacologyTherapySection } from './PsychopharmacologyTherapySection';
import { PSYCHIATRY_SECTIONS } from './psychiatryConstants';
import {
  countPositiveSiHi,
  interpretSafetyRisk,
  loadPsychiatryHistory,
  loadPsychiatryState,
  providerDisplayName,
  savePsychiatryState,
} from './psychiatryUtils';

function todayInputValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function PatientPsychiatryTab() {
  const { patientId, appointmentId, appointment } = usePatientChart();
  const provider = providerDisplayName(appointment);
  return (
    <PsychiatryTabInner
      key={`${patientId || 'unknown'}::${appointmentId || 'no-appt'}`}
      patientId={patientId}
      appointmentId={appointmentId}
      provider={provider}
    />
  );
}

function PsychiatryTabInner({ patientId, appointmentId, provider }) {
  const { patient, loading, error, refreshChart } = usePatientChart();

  const defaults = useMemo(
    () => ({
      examinationDate: todayInputValue(),
      provider: provider || '',
    }),
    [provider],
  );

  const initial = loadPsychiatryState(patientId, appointmentId, defaults);
  if (!initial.safety.provider && provider) initial.safety.provider = provider;
  if (!initial.psychopharm.provider && provider) initial.psychopharm.provider = provider;

  const [section, setSection] = useState('safety-si-hi');
  const [state, setState] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(initial.updatedAt);
  const [saveMessage, setSaveMessage] = useState('');
  const [history, setHistory] = useState(() => loadPsychiatryHistory(patientId));

  const persist = useCallback(
    (next) => {
      const saved = savePsychiatryState(patientId, appointmentId, next);
      setState(saved);
      setSavedAt(saved.updatedAt);
      setHistory(loadPsychiatryHistory(patientId));
      setDirty(false);
      setSaveMessage(
        'Saved Psychiatry / Behavioral Health documentation for this encounter. Longitudinal history updated.',
      );
    },
    [patientId, appointmentId],
  );

  const updateSafety = (safety) => {
    setState((prev) => ({ ...prev, safety }));
    setDirty(true);
  };

  const updatePsychopharm = (psychopharm) => {
    setState((prev) => ({ ...prev, psychopharm }));
    setDirty(true);
  };

  const subtitle = useMemo(() => {
    const name = [patient?.firstName, patient?.lastName].filter(Boolean).join(' ');
    return name
      ? `Safety / SI-HI workspace and psychopharmacology / therapy coordination for ${name}.`
      : 'Document safety / SI-HI assessment and psychopharmacology / therapy coordination.';
  }, [patient]);

  const latestHistory = useMemo(() => {
    const risk = interpretSafetyRisk(state.safety?.responses || {});
    const current = {
      at: savedAt || new Date().toISOString(),
      appointmentId,
      examinationDate: state.safety?.examinationDate,
      riskLabel: risk.label,
      positiveSiHi: countPositiveSiHi(state.safety?.responses || {}),
      disposition: state.safety?.disposition,
      medCount: state.psychopharm?.medications?.length || 0,
      therapyStatus: state.psychopharm?.therapyStatus,
      overallAdherence: state.psychopharm?.overallAdherence,
    };
    const rest = history.filter((h) => h.appointmentId !== appointmentId);
    return [current, ...rest];
  }, [history, appointmentId, savedAt, state]);

  return (
    <ChartTabShell
      eyebrow="Psychiatry / Behavioral Health"
      title="Psychiatry / Behavioral Health"
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
        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 rounded-xl bg-muted/50 p-1 sm:grid-cols-2">
          {PSYCHIATRY_SECTIONS.map((item) => (
            <TabsTrigger
              key={item.id}
              value={item.id}
              className={cn(
                'rounded-lg data-[state=active]:shadow-sm',
                item.id === 'safety-si-hi' && 'gap-1.5',
              )}
            >
              {item.id === 'safety-si-hi' && (
                <Brain className="h-3.5 w-3.5 opacity-80" aria-hidden />
              )}
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="safety-si-hi" className="mt-6 focus-visible:outline-none">
          <SafetySiHiSection
            value={state.safety}
            onChange={updateSafety}
            history={latestHistory}
          />
        </TabsContent>

        <TabsContent
          value="psychopharmacology-therapy"
          className="mt-6 focus-visible:outline-none"
        >
          <PsychopharmacologyTherapySection
            value={state.psychopharm}
            onChange={updatePsychopharm}
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
