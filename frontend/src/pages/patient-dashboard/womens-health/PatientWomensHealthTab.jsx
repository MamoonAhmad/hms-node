import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Heart, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { usePatientChart } from '../PatientChartContext';
import { ChartTabShell } from '../components/chart-ui';
import { ObstetricPrenatalForm } from './ObstetricPrenatalForm';
import { GynExaminationForm } from './GynExaminationForm';
import { PrenatalLabsTracker } from './PrenatalLabsTracker';
import { WOMENS_HEALTH_SECTIONS } from './womensHealthConstants';
import {
  createEmptyWomensHealthState,
  loadWomensHealthState,
  saveWomensHealthState,
} from './womensHealthUtils';

export function PatientWomensHealthTab() {
  const { patientId, appointmentId, patient, loading, error, refreshChart } = usePatientChart();
  const [, setSearchParams] = useSearchParams();

  const [section, setSection] = useState('obstetric');
  const [state, setState] = useState(() => createEmptyWomensHealthState());
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const loaded = loadWomensHealthState(patientId, appointmentId);
    setState(loaded);
    setSavedAt(loaded.updatedAt);
    setDirty(false);
    setSaveMessage('');
  }, [patientId, appointmentId]);

  const persist = useCallback(
    (next) => {
      const saved = saveWomensHealthState(patientId, appointmentId, next);
      setState(saved);
      setSavedAt(saved.updatedAt);
      setDirty(false);
      setSaveMessage('Saved for this encounter.');
    },
    [patientId, appointmentId],
  );

  const updateObstetric = (obstetric) => {
    setState((prev) => ({ ...prev, obstetric }));
    setDirty(true);
  };

  const updateGyn = (gyn) => {
    setState((prev) => ({ ...prev, gyn }));
    setDirty(true);
  };

  const updateLabs = (labs) => {
    setState((prev) => ({ ...prev, labs }));
    setDirty(true);
  };

  const goToTab = (tabId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tabId);
      return next;
    }, { replace: true });
  };

  const subtitle = useMemo(() => {
    const name = [patient?.firstName, patient?.lastName].filter(Boolean).join(' ');
    return name
      ? `Document obstetric, GYN exam, and prenatal labs for ${name}.`
      : 'Document obstetric visits, GYN exams, and prenatal laboratory tracking.';
  }, [patient]);

  return (
    <ChartTabShell
      eyebrow="Women's Health"
      title="Women's Health / OB-GYN"
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
          {WOMENS_HEALTH_SECTIONS.map((item) => (
            <TabsTrigger
              key={item.id}
              value={item.id}
              className={cn(
                'rounded-lg data-[state=active]:shadow-sm',
                item.id === 'obstetric' && 'gap-1.5',
              )}
            >
              {item.id === 'obstetric' && <Heart className="h-3.5 w-3.5 opacity-80" aria-hidden />}
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="obstetric" className="mt-6 focus-visible:outline-none">
          <ObstetricPrenatalForm
            value={state.obstetric}
            onChange={updateObstetric}
            patientId={patientId}
            appointmentId={appointmentId}
            onOpenMedications={() => goToTab('medications')}
          />
        </TabsContent>

        <TabsContent value="gyn" className="mt-6 focus-visible:outline-none">
          <GynExaminationForm value={state.gyn} onChange={updateGyn} />
        </TabsContent>

        <TabsContent value="prenatal-labs" className="mt-6 focus-visible:outline-none">
          <PrenatalLabsTracker
            rows={state.labs}
            onChange={updateLabs}
            onOpenOrders={() => goToTab('orders')}
          />
        </TabsContent>
      </Tabs>
    </ChartTabShell>
  );
}
