import { useCallback, useMemo, useState } from 'react';
import { Hand, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { usePatientChart } from '../PatientChartContext';
import { ChartTabShell } from '../components/chart-ui';
import { JointCountStiffnessSection } from './JointCountStiffnessSection';
import { FlareAssessmentSection } from './FlareAssessmentSection';
import { BiologicInfectionRiskSection } from './BiologicInfectionRiskSection';
import { RHEUMATOLOGY_SECTIONS } from './rheumatologyConstants';
import { loadRheumatologyState, saveRheumatologyState } from './rheumatologyUtils';

export function PatientRheumatologyTab() {
  const { patientId, appointmentId } = usePatientChart();
  return (
    <RheumatologyTabInner
      key={`${patientId || 'unknown'}::${appointmentId || 'no-appt'}`}
      patientId={patientId}
      appointmentId={appointmentId}
    />
  );
}

function RheumatologyTabInner({ patientId, appointmentId }) {
  const { patient, loading, error, refreshChart } = usePatientChart();

  const initial = loadRheumatologyState(patientId, appointmentId);
  const [section, setSection] = useState('joint-count');
  const [state, setState] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(initial.updatedAt);
  const [saveMessage, setSaveMessage] = useState('');

  const persist = useCallback(
    (next) => {
      const saved = saveRheumatologyState(patientId, appointmentId, next);
      setState(saved);
      setSavedAt(saved.updatedAt);
      setDirty(false);
      setSaveMessage(
        'Saved for this encounter. Biologic screening and joint-count method carry forward on follow-up visits.',
      );
    },
    [patientId, appointmentId],
  );

  const updateJointCount = (jointCount) => {
    setState((prev) => ({ ...prev, jointCount }));
    setDirty(true);
  };

  const updateFlare = (flare) => {
    setState((prev) => ({ ...prev, flare }));
    setDirty(true);
  };

  const updateBiologicRisk = (biologicRisk) => {
    setState((prev) => ({ ...prev, biologicRisk }));
    setDirty(true);
  };

  const subtitle = useMemo(() => {
    const name = [patient?.firstName, patient?.lastName].filter(Boolean).join(' ');
    return name
      ? `Joint count / morning stiffness, flare assessment, and biologic infection-risk screen for ${name}.`
      : 'Joint count / morning stiffness, flare assessment, and biologic infection-risk specialty workflow.';
  }, [patient]);

  return (
    <ChartTabShell
      eyebrow="Rheumatology"
      title="Rheumatology"
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
          {RHEUMATOLOGY_SECTIONS.map((item) => (
            <TabsTrigger
              key={item.id}
              value={item.id}
              className={cn(
                'rounded-lg data-[state=active]:shadow-sm',
                item.id === 'joint-count' && 'gap-1.5',
              )}
            >
              {item.id === 'joint-count' && (
                <Hand className="h-3.5 w-3.5 opacity-80" aria-hidden />
              )}
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="joint-count" className="mt-6 focus-visible:outline-none">
          <JointCountStiffnessSection value={state.jointCount} onChange={updateJointCount} />
        </TabsContent>

        <TabsContent value="flare-assessment" className="mt-6 focus-visible:outline-none">
          <FlareAssessmentSection value={state.flare} onChange={updateFlare} />
        </TabsContent>

        <TabsContent
          value="biologic-infection-risk"
          className="mt-6 focus-visible:outline-none"
        >
          <BiologicInfectionRiskSection
            value={state.biologicRisk}
            onChange={updateBiologicRisk}
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
