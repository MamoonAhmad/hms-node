import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bone, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { usePatientChart } from '../PatientChartContext';
import { ChartTabShell } from '../components/chart-ui';
import { InjuryMoiSection } from './InjuryMoiSection';
import { MskExaminationSection } from './MskExaminationSection';
import { ImagingPlanSection } from './ImagingPlanSection';
import { ORTHO_MSK_SECTIONS } from './orthopedicsMskConstants';
import { loadOrthoMskState, saveOrthoMskState } from './orthopedicsMskUtils';

export function PatientOrthopedicsMskTab() {
  const { patientId, appointmentId } = usePatientChart();
  return (
    <OrthoMskTabInner
      key={`${patientId || 'unknown'}::${appointmentId || 'no-appt'}`}
      patientId={patientId}
      appointmentId={appointmentId}
    />
  );
}

function OrthoMskTabInner({ patientId, appointmentId }) {
  const { patient, loading, error, refreshChart } = usePatientChart();
  const [, setSearchParams] = useSearchParams();

  const initial = loadOrthoMskState(patientId, appointmentId);
  const [section, setSection] = useState('injury-moi');
  const [state, setState] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(initial.updatedAt);
  const [saveMessage, setSaveMessage] = useState('');

  const persist = useCallback(
    (next) => {
      const saved = saveOrthoMskState(patientId, appointmentId, next);
      setState(saved);
      setSavedAt(saved.updatedAt);
      setDirty(false);
      setSaveMessage('Saved for this encounter. Carry-forward fields updated for follow-up visits.');
    },
    [patientId, appointmentId],
  );

  const updateInjury = (injury) => {
    setState((prev) => ({ ...prev, injury }));
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
      ? `Document injury, MSK examination, imaging, and rehab plans for ${name}.`
      : 'Document injury / MOI, MSK examination, imaging, braces, and physical therapy plans.';
  }, [patient]);

  return (
    <ChartTabShell
      eyebrow="Orthopedics"
      title="Orthopedics / MSK"
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
          {ORTHO_MSK_SECTIONS.map((item) => (
            <TabsTrigger
              key={item.id}
              value={item.id}
              className={cn(
                'rounded-lg data-[state=active]:shadow-sm',
                item.id === 'injury-moi' && 'gap-1.5',
              )}
            >
              {item.id === 'injury-moi' && (
                <Bone className="h-3.5 w-3.5 opacity-80" aria-hidden />
              )}
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="injury-moi" className="mt-6 focus-visible:outline-none">
          <InjuryMoiSection
            value={state.injury}
            onChange={updateInjury}
            patientId={patientId}
            appointmentId={appointmentId}
          />
        </TabsContent>

        <TabsContent value="msk-exam" className="mt-6 focus-visible:outline-none">
          <MskExaminationSection
            value={state.exam}
            onChange={updateExam}
            bodyRegions={state.injury?.bodyRegion || state.injury?.injuryLocations || []}
          />
        </TabsContent>

        <TabsContent value="imaging-plan" className="mt-6 focus-visible:outline-none">
          <ImagingPlanSection
            value={state.plan}
            onChange={updatePlan}
            onOpenOrders={() => goToTab('orders')}
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
