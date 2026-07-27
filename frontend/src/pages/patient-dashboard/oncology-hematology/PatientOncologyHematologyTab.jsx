import { useCallback, useMemo, useState } from 'react';
import { Microscope, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { usePatientChart } from '../PatientChartContext';
import { ChartTabShell } from '../components/chart-ui';
import { StagingCycleDaySection } from './StagingCycleDaySection';
import { NeutropeniaFeverScreenSection } from './NeutropeniaFeverScreenSection';
import { ChemoSupportiveAdvanceCareSection } from './ChemoSupportiveAdvanceCareSection';
import { ONCOLOGY_HEMATOLOGY_SECTIONS } from './oncologyHematologyConstants';
import {
  loadOncologyHistory,
  loadOncologyState,
  providerDisplayName,
  saveOncologyState,
} from './oncologyHematologyUtils';

function todayInputValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function PatientOncologyHematologyTab() {
  const { patientId, appointmentId, appointment } = usePatientChart();
  const provider = providerDisplayName(appointment);
  return (
    <OncologyHematologyTabInner
      key={`${patientId || 'unknown'}::${appointmentId || 'no-appt'}`}
      patientId={patientId}
      appointmentId={appointmentId}
      provider={provider}
    />
  );
}

function OncologyHematologyTabInner({ patientId, appointmentId, provider }) {
  const { patient, loading, error, refreshChart } = usePatientChart();

  const defaults = useMemo(
    () => ({
      examinationDate: todayInputValue(),
      provider: provider || '',
    }),
    [provider],
  );

  const initial = loadOncologyState(patientId, appointmentId, defaults);
  if (!initial.staging.provider && provider) {
    initial.staging.provider = provider;
  }

  const [section, setSection] = useState('staging-cycle');
  const [state, setState] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(initial.updatedAt);
  const [saveMessage, setSaveMessage] = useState('');
  const [history, setHistory] = useState(() => loadOncologyHistory(patientId));

  const persist = useCallback(
    (next) => {
      const saved = saveOncologyState(patientId, appointmentId, next);
      setState(saved);
      setSavedAt(saved.updatedAt);
      setHistory(loadOncologyHistory(patientId));
      setDirty(false);
      setSaveMessage(
        'Saved Oncology / Hematology documentation for this encounter. Staging and advance-care preferences carry forward on follow-up visits.',
      );
    },
    [patientId, appointmentId],
  );

  const updateStaging = (staging) => {
    setState((prev) => ({ ...prev, staging }));
    setDirty(true);
  };

  const updateNeutropenia = (neutropenia) => {
    setState((prev) => ({ ...prev, neutropenia }));
    setDirty(true);
  };

  const updateSupportive = (supportive) => {
    setState((prev) => ({ ...prev, supportive }));
    setDirty(true);
  };

  const subtitle = useMemo(() => {
    const name = [patient?.firstName, patient?.lastName].filter(Boolean).join(' ');
    return name
      ? `Staging / cycle day, neutropenia / fever screen, and chemo supportive / advance care for ${name}.`
      : 'Document staging / cycle day, neutropenia / fever screen, and chemo supportive / advance care notes.';
  }, [patient]);

  const latestHistory = useMemo(() => {
    const current = {
      at: savedAt || new Date().toISOString(),
      appointmentId,
      examinationDate: state.staging?.examinationDate,
      primarySite: state.staging?.primarySite,
      stageGroup: state.staging?.stageGroup,
      regimenName: state.staging?.regimenName,
      cycleNumber: state.staging?.cycleNumber,
      dayOfCycle: state.staging?.dayOfCycle,
      feverPresent: state.neutropenia?.feverPresent,
      ancRisk: state.neutropenia?.ancRisk,
      disposition: state.neutropenia?.disposition,
      codeStatus: state.supportive?.codeStatus,
      goalsOfCare: state.supportive?.goalsOfCare,
    };
    const rest = history.filter((h) => h.appointmentId !== appointmentId);
    return [current, ...rest];
  }, [history, appointmentId, savedAt, state]);

  return (
    <ChartTabShell
      eyebrow="Oncology / Hematology"
      title="Oncology / Hematology"
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
        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 rounded-xl bg-muted/50 p-1 sm:grid-cols-3">
          {ONCOLOGY_HEMATOLOGY_SECTIONS.map((item) => (
            <TabsTrigger
              key={item.id}
              value={item.id}
              className={cn(
                'rounded-lg data-[state=active]:shadow-sm',
                item.id === 'staging-cycle' && 'gap-1.5',
              )}
            >
              {item.id === 'staging-cycle' && (
                <Microscope className="h-3.5 w-3.5 opacity-80" aria-hidden />
              )}
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="staging-cycle" className="mt-6 focus-visible:outline-none">
          <StagingCycleDaySection
            value={state.staging}
            onChange={updateStaging}
            history={latestHistory}
          />
        </TabsContent>

        <TabsContent value="neutropenia-fever" className="mt-6 focus-visible:outline-none">
          <NeutropeniaFeverScreenSection
            value={state.neutropenia}
            onChange={updateNeutropenia}
            history={latestHistory}
          />
        </TabsContent>

        <TabsContent value="supportive-advance" className="mt-6 focus-visible:outline-none">
          <ChemoSupportiveAdvanceCareSection
            value={state.supportive}
            onChange={updateSupportive}
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
