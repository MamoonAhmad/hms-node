import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { usePatientChart } from '../PatientChartContext';
import { ChartTabShell } from '../components/chart-ui';
import { DiabetesCgmForm } from './DiabetesCgmForm';
import { ThyroidForm } from './ThyroidForm';
import { HormoneBoneAdrenalForm } from './HormoneBoneAdrenalForm';
import { ENDOCRINOLOGY_SECTIONS } from './endocrinologyConstants';
import {
  loadEndocrinologyState,
  providerDisplayName,
  saveEndocrinologyState,
} from './endocrinologyUtils';

function todayInputValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function PatientEndocrinologyTab() {
  const { patientId, appointmentId, appointment } = usePatientChart();
  const provider = providerDisplayName(appointment);
  return (
    <EndocrinologyTabInner
      key={`${patientId || 'unknown'}::${appointmentId || 'no-appt'}`}
      patientId={patientId}
      appointmentId={appointmentId}
      provider={provider}
    />
  );
}

function EndocrinologyTabInner({ patientId, appointmentId, provider }) {
  const { patient, loading, error, refreshChart } = usePatientChart();
  const [, setSearchParams] = useSearchParams();

  const defaults = useMemo(
    () => ({
      examinationDate: todayInputValue(),
      provider: provider || '',
    }),
    [provider],
  );

  const initial = loadEndocrinologyState(patientId, appointmentId, defaults);
  if (!initial.diabetes.provider && provider) initial.diabetes.provider = provider;
  if (!initial.thyroid.provider && provider) initial.thyroid.provider = provider;
  if (!initial.hormone.provider && provider) initial.hormone.provider = provider;

  const [section, setSection] = useState('diabetes-cgm');
  const [state, setState] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(initial.updatedAt);
  const [saveMessage, setSaveMessage] = useState('');

  const persist = useCallback(
    (next) => {
      const saved = saveEndocrinologyState(patientId, appointmentId, next);
      setState(saved);
      setSavedAt(saved.updatedAt);
      setDirty(false);
      setSaveMessage(
        'Saved for this encounter. Diabetes, thyroid, and hormone carry-forward updated for follow-up visits.',
      );
    },
    [patientId, appointmentId],
  );

  const updateDiabetes = (diabetes) => {
    setState((prev) => ({ ...prev, diabetes }));
    setDirty(true);
  };

  const updateThyroid = (thyroid) => {
    setState((prev) => ({ ...prev, thyroid }));
    setDirty(true);
  };

  const updateHormone = (hormone) => {
    setState((prev) => ({ ...prev, hormone }));
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
      ? `Document diabetes / CGM, thyroid, and hormone–bone–adrenal workup for ${name}.`
      : 'Document diabetes / CGM, thyroid assessment, and broader hormone / bone / adrenal workup.';
  }, [patient]);

  return (
    <ChartTabShell
      eyebrow="Endocrinology"
      title="Endocrinology"
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
          {ENDOCRINOLOGY_SECTIONS.map((item) => (
            <TabsTrigger
              key={item.id}
              value={item.id}
              className={cn(
                'rounded-lg data-[state=active]:shadow-sm',
                item.id === 'diabetes-cgm' && 'gap-1.5',
              )}
            >
              {item.id === 'diabetes-cgm' && (
                <Activity className="h-3.5 w-3.5 opacity-80" aria-hidden />
              )}
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="diabetes-cgm" className="mt-6 focus-visible:outline-none">
          <DiabetesCgmForm value={state.diabetes} onChange={updateDiabetes} />
        </TabsContent>

        <TabsContent value="thyroid" className="mt-6 focus-visible:outline-none">
          <ThyroidForm value={state.thyroid} onChange={updateThyroid} />
        </TabsContent>

        <TabsContent value="hormone-bone-adrenal" className="mt-6 focus-visible:outline-none">
          <HormoneBoneAdrenalForm
            value={state.hormone}
            onChange={updateHormone}
            onOpenOrders={() => goToTab('orders')}
            onOpenReferrals={() => goToTab('referrals')}
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
