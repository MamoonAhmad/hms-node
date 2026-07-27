import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { usePatientChart } from '../PatientChartContext';
import { ChartTabShell } from '../components/chart-ui';
import { VisionAcuitySection } from './VisionAcuitySection';
import { EyeExaminationSection } from './EyeExaminationSection';
import { IopTreatmentPlanSection } from './IopTreatmentPlanSection';
import { OPHTHALMOLOGY_SECTIONS } from './ophthalmologyConstants';
import {
  loadOphthalmologyHistory,
  loadOphthalmologyState,
  providerDisplayName,
  saveOphthalmologyState,
} from './ophthalmologyUtils';

function todayInputValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function PatientOphthalmologyTab() {
  const { patientId, appointmentId, appointment } = usePatientChart();
  const provider = providerDisplayName(appointment);
  return (
    <OphthalmologyTabInner
      key={`${patientId || 'unknown'}::${appointmentId || 'no-appt'}`}
      patientId={patientId}
      appointmentId={appointmentId}
      provider={provider}
    />
  );
}

function OphthalmologyTabInner({ patientId, appointmentId, provider }) {
  const { patient, loading, error, refreshChart } = usePatientChart();
  const [, setSearchParams] = useSearchParams();

  const defaults = useMemo(
    () => ({
      examinationDate: todayInputValue(),
      provider: provider || '',
    }),
    [provider],
  );

  const initial = loadOphthalmologyState(patientId, appointmentId, defaults);
  if (!initial.vision.provider && provider) {
    initial.vision.provider = provider;
  }
  const [section, setSection] = useState('vision-acuity');
  const [state, setState] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(initial.updatedAt);
  const [saveMessage, setSaveMessage] = useState('');
  const [history, setHistory] = useState(() => loadOphthalmologyHistory(patientId));

  const persist = useCallback(
    (next) => {
      const saved = saveOphthalmologyState(patientId, appointmentId, next);
      setState(saved);
      setSavedAt(saved.updatedAt);
      setHistory(loadOphthalmologyHistory(patientId));
      setDirty(false);
      setSaveMessage('Saved for this encounter. Longitudinal acuity / IOP trends updated.');
    },
    [patientId, appointmentId],
  );

  const updateVision = (vision) => {
    setState((prev) => ({ ...prev, vision }));
    setDirty(true);
  };

  const updateExam = (exam) => {
    setState((prev) => ({ ...prev, exam }));
    setDirty(true);
  };

  const updatePlan = (plan) => {
    setState((prev) => ({ ...prev, plan }));
    setDirty(true);
  };

  const goToTab = (tabId) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tabId);
        return next;
      },
      { replace: true },
    );
  };

  const subtitle = useMemo(() => {
    const name = [patient?.firstName, patient?.lastName].filter(Boolean).join(' ');
    return name
      ? `Document vision acuity, eye examination, IOP, and ocular treatment for ${name}.`
      : 'Document vision acuity, comprehensive eye examination, IOP, and ocular treatment plans.';
  }, [patient]);

  const latestHistory = useMemo(() => {
    const current = {
      at: savedAt || new Date().toISOString(),
      appointmentId,
      examinationDate: state.vision?.examinationDate,
      odCorrected: state.vision?.odCorrected,
      osCorrected: state.vision?.osCorrected,
      ouCorrected: state.vision?.ouCorrected,
      iopOd: state.plan?.iopOd,
      iopOs: state.plan?.iopOs,
      cupToDiscOd: state.exam?.cupToDiscOd,
      cupToDiscOs: state.exam?.cupToDiscOs,
      retina: state.exam?.retina || [],
    };
    const rest = history.filter((h) => h.appointmentId !== appointmentId);
    return [current, ...rest];
  }, [history, appointmentId, savedAt, state]);

  return (
    <ChartTabShell
      eyebrow="Ophthalmology"
      title="Ophthalmology"
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
          {OPHTHALMOLOGY_SECTIONS.map((item) => (
            <TabsTrigger
              key={item.id}
              value={item.id}
              className={cn(
                'rounded-lg data-[state=active]:shadow-sm',
                item.id === 'vision-acuity' && 'gap-1.5',
              )}
            >
              {item.id === 'vision-acuity' && (
                <Eye className="h-3.5 w-3.5 opacity-80" aria-hidden />
              )}
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="vision-acuity" className="mt-6 focus-visible:outline-none">
          <VisionAcuitySection
            value={state.vision}
            onChange={updateVision}
            history={latestHistory}
          />
        </TabsContent>

        <TabsContent value="eye-exam" className="mt-6 focus-visible:outline-none">
          <EyeExaminationSection value={state.exam} onChange={updateExam} />
        </TabsContent>

        <TabsContent value="iop-plan" className="mt-6 focus-visible:outline-none">
          <IopTreatmentPlanSection
            value={state.plan}
            onChange={updatePlan}
            history={latestHistory}
            onOpenOrders={() => goToTab('orders')}
            onOpenMedications={() => goToTab('medications')}
            onOpenReferrals={() => goToTab('referrals')}
            onOpenResults={() => goToTab('results')}
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
