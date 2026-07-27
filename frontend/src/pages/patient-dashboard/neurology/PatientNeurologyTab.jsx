import { useCallback, useMemo, useState } from 'react';
import { Brain, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { usePatientChart } from '../PatientChartContext';
import { ChartTabShell } from '../components/chart-ui';
import { FocusedNeuroExamSection } from './FocusedNeuroExamSection';
import { HeadacheSeizureDiarySection } from './HeadacheSeizureDiarySection';
import { FallRiskCognitionSection } from './FallRiskCognitionSection';
import { NEUROLOGY_SECTIONS } from './neurologyConstants';
import { loadNeurologyState, saveNeurologyState } from './neurologyUtils';

export function PatientNeurologyTab() {
  const { patientId, appointmentId } = usePatientChart();
  return (
    <NeurologyTabInner
      key={`${patientId || 'unknown'}::${appointmentId || 'no-appt'}`}
      patientId={patientId}
      appointmentId={appointmentId}
    />
  );
}

function NeurologyTabInner({ patientId, appointmentId }) {
  const { patient, loading, error, refreshChart } = usePatientChart();

  const initial = loadNeurologyState(patientId, appointmentId);
  const [section, setSection] = useState('focused-exam');
  const [state, setState] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(initial.updatedAt);
  const [saveMessage, setSaveMessage] = useState('');

  const persist = useCallback(
    (next) => {
      const saved = saveNeurologyState(patientId, appointmentId, next);
      setState(saved);
      setSavedAt(saved.updatedAt);
      setDirty(false);
      setSaveMessage(
        'Saved for this encounter. Diary baseline and precautions carry forward on follow-up visits.',
      );
    },
    [patientId, appointmentId],
  );

  const updateExam = (exam) => {
    setState((prev) => ({ ...prev, exam }));
    setDirty(true);
  };

  const updateDiary = (diary) => {
    setState((prev) => ({ ...prev, diary }));
    setDirty(true);
  };

  const updateFallCognition = (fallCognition) => {
    setState((prev) => ({ ...prev, fallCognition }));
    setDirty(true);
  };

  const subtitle = useMemo(() => {
    const name = [patient?.firstName, patient?.lastName].filter(Boolean).join(' ');
    return name
      ? `Focused neuro exam, headache/seizure diary, and fall-risk / cognition workflow for ${name}.`
      : 'Focused neuro exam, headache / seizure diary, and fall-risk / cognition specialty workflow.';
  }, [patient]);

  return (
    <ChartTabShell
      eyebrow="Neurology"
      title="Neurology"
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
          {NEUROLOGY_SECTIONS.map((item) => (
            <TabsTrigger
              key={item.id}
              value={item.id}
              className={cn(
                'rounded-lg data-[state=active]:shadow-sm',
                item.id === 'focused-exam' && 'gap-1.5',
              )}
            >
              {item.id === 'focused-exam' && (
                <Brain className="h-3.5 w-3.5 opacity-80" aria-hidden />
              )}
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="focused-exam" className="mt-6 focus-visible:outline-none">
          <FocusedNeuroExamSection value={state.exam} onChange={updateExam} />
        </TabsContent>

        <TabsContent value="headache-seizure-diary" className="mt-6 focus-visible:outline-none">
          <HeadacheSeizureDiarySection value={state.diary} onChange={updateDiary} />
        </TabsContent>

        <TabsContent value="fall-cognition" className="mt-6 focus-visible:outline-none">
          <FallRiskCognitionSection
            value={state.fallCognition}
            onChange={updateFallCognition}
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
