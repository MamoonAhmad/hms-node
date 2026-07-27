import { useCallback, useMemo, useState } from 'react';
import { Activity, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { usePatientChart } from '../PatientChartContext';
import { ChartTabShell } from '../components/chart-ui';
import { FunctionalGoalsBarriersForm } from './FunctionalGoalsBarriersForm';
import { PainRomStrengthForm } from './PainRomStrengthForm';
import { TherapyAttendanceForm } from './TherapyAttendanceForm';
import { PMR_PT_SECTIONS } from './pmrPtConstants';
import {
  loadPmrPtState,
  providerDisplayName,
  savePmrPtState,
  summarizePmrPtProgress,
} from './pmrPtUtils';

function todayInputValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function PatientPmrPtTab() {
  const { patientId, appointmentId, appointment } = usePatientChart();
  const provider = providerDisplayName(appointment);
  return (
    <PmrPtTabInner
      key={`${patientId || 'unknown'}::${appointmentId || 'no-appt'}`}
      patientId={patientId}
      appointmentId={appointmentId}
      provider={provider}
    />
  );
}

function PmrPtTabInner({ patientId, appointmentId, provider }) {
  const { patient, loading, error, refreshChart } = usePatientChart();

  const defaults = useMemo(
    () => ({
      examinationDate: todayInputValue(),
      provider: provider || '',
    }),
    [provider],
  );

  const initial = loadPmrPtState(patientId, appointmentId, defaults);
  if (!initial.functionalGoals.provider && provider) {
    initial.functionalGoals.provider = provider;
  }
  if (!initial.painRomStrength.provider && provider) {
    initial.painRomStrength.provider = provider;
  }
  if (!initial.therapyAttendance.provider && provider) {
    initial.therapyAttendance.provider = provider;
  }

  const [section, setSection] = useState('functional-goals');
  const [state, setState] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(initial.updatedAt);
  const [saveMessage, setSaveMessage] = useState('');

  const persist = useCallback(
    (next) => {
      const saved = savePmrPtState(patientId, appointmentId, next);
      setState(saved);
      setSavedAt(saved.updatedAt);
      setDirty(false);
      setSaveMessage(
        'Saved for this encounter. Goals, pain/ROM/strength, and therapy documentation updated for follow-up visits.',
      );
    },
    [patientId, appointmentId],
  );

  const updateFunctionalGoals = (functionalGoals) => {
    setState((prev) => ({ ...prev, functionalGoals }));
    setDirty(true);
    setSaveMessage('');
  };

  const updatePainRomStrength = (painRomStrength) => {
    setState((prev) => ({ ...prev, painRomStrength }));
    setDirty(true);
    setSaveMessage('');
  };

  const updateTherapyAttendance = (therapyAttendance) => {
    setState((prev) => ({ ...prev, therapyAttendance }));
    setDirty(true);
    setSaveMessage('');
  };

  const progress = summarizePmrPtProgress(state);

  const subtitle = useMemo(() => {
    const name = [patient?.firstName, patient?.lastName].filter(Boolean).join(' ');
    return name
      ? `Functional goals, pain / ROM / strength, and therapy plan for ${name}.`
      : 'Document functional goals / barriers, pain / ROM / strength, and therapy attendance.';
  }, [patient]);

  return (
    <ChartTabShell
      eyebrow="PM&R / PT"
      title="PM&R / PT"
      description={subtitle}
      loading={loading && !patient}
      error={error}
      onRetry={refreshChart}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="status-soft-info">
            {progress.done}/{progress.total} sections started
          </Badge>
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
          {PMR_PT_SECTIONS.map((item) => (
            <TabsTrigger
              key={item.id}
              value={item.id}
              className={cn(
                'rounded-lg data-[state=active]:shadow-sm',
                item.id === 'functional-goals' && 'gap-1.5',
              )}
            >
              {item.id === 'functional-goals' && (
                <Activity className="h-3.5 w-3.5 opacity-80" aria-hidden />
              )}
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="functional-goals" className="mt-6 focus-visible:outline-none">
          <FunctionalGoalsBarriersForm
            value={state.functionalGoals}
            onChange={updateFunctionalGoals}
          />
        </TabsContent>

        <TabsContent value="pain-rom-strength" className="mt-6 focus-visible:outline-none">
          <PainRomStrengthForm
            value={state.painRomStrength}
            onChange={updatePainRomStrength}
          />
        </TabsContent>

        <TabsContent value="therapy-attendance" className="mt-6 focus-visible:outline-none">
          <TherapyAttendanceForm
            value={state.therapyAttendance}
            onChange={updateTherapyAttendance}
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
