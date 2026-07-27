import { useCallback, useMemo, useState } from 'react';
import { HeartPulse, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { usePatientChart } from '../PatientChartContext';
import { ChartTabShell } from '../components/chart-ui';
import { CkdEgfrProteinuriaSection } from './CkdEgfrProteinuriaSection';
import { VolumeDialysisTransplantSection } from './VolumeDialysisTransplantSection';
import { NephrotoxicMedReviewSection } from './NephrotoxicMedReviewSection';
import { NEPHROLOGY_SECTIONS, ckdStageFromEgfr } from './nephrologyConstants';
import {
  loadNephrologyState,
  providerDisplayName,
  saveNephrologyState,
} from './nephrologyUtils';

function todayInputValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function PatientNephrologyTab() {
  const { patientId, appointmentId, appointment } = usePatientChart();
  const provider = providerDisplayName(appointment);
  return (
    <NephrologyTabInner
      key={`${patientId || 'unknown'}::${appointmentId || 'no-appt'}`}
      patientId={patientId}
      appointmentId={appointmentId}
      provider={provider}
    />
  );
}

function NephrologyTabInner({ patientId, appointmentId, provider }) {
  const { patient, loading, error, refreshChart } = usePatientChart();

  const defaults = useMemo(
    () => ({
      examinationDate: todayInputValue(),
      provider: provider || '',
    }),
    [provider],
  );

  const initial = loadNephrologyState(patientId, appointmentId, defaults);
  if (!initial.ckdTracker.provider && provider) initial.ckdTracker.provider = provider;
  if (!initial.volumeStatus.provider && provider) initial.volumeStatus.provider = provider;
  if (!initial.nephrotoxicReview.provider && provider) {
    initial.nephrotoxicReview.provider = provider;
  }

  const [section, setSection] = useState('ckd-egfr-proteinuria');
  const [state, setState] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(initial.updatedAt);
  const [saveMessage, setSaveMessage] = useState('');

  const persist = useCallback(
    (next) => {
      const saved = saveNephrologyState(patientId, appointmentId, next);
      setState(saved);
      setSavedAt(saved.updatedAt);
      setDirty(false);
      setSaveMessage(
        'Saved for this encounter. CKD stage, dialysis/transplant status, and med review carry forward on follow-up visits.',
      );
    },
    [patientId, appointmentId],
  );

  const updateCkdTracker = (ckdTracker) => {
    setState((prev) => ({ ...prev, ckdTracker }));
    setDirty(true);
    setSaveMessage('');
  };

  const updateVolumeStatus = (volumeStatus) => {
    setState((prev) => ({ ...prev, volumeStatus }));
    setDirty(true);
    setSaveMessage('');
  };

  const updateNephrotoxicReview = (nephrotoxicReview) => {
    setState((prev) => ({ ...prev, nephrotoxicReview }));
    setDirty(true);
    setSaveMessage('');
  };

  const egfrBand = ckdStageFromEgfr(state.ckdTracker?.egfr);

  const subtitle = useMemo(() => {
    const name = [patient?.firstName, patient?.lastName].filter(Boolean).join(' ');
    return name
      ? `CKD / eGFR / proteinuria tracker, volume & dialysis-transplant status, and nephrotoxic med review for ${name}.`
      : 'CKD / eGFR / proteinuria tracker, volume & dialysis-transplant status, and nephrotoxic med review.';
  }, [patient]);

  return (
    <ChartTabShell
      eyebrow="Nephrology"
      title="Nephrology"
      description={subtitle}
      loading={loading && !patient}
      error={error}
      onRetry={refreshChart}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {egfrBand && (
            <Badge
              variant="outline"
              className={cn(
                egfrBand.tone === 'danger' && 'status-soft-danger',
                egfrBand.tone === 'warning' && 'status-soft-warning',
                egfrBand.tone === 'success' && 'status-soft-success',
              )}
            >
              eGFR {state.ckdTracker.egfr} · {egfrBand.stage}
            </Badge>
          )}
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
          {NEPHROLOGY_SECTIONS.map((item) => (
            <TabsTrigger
              key={item.id}
              value={item.id}
              className={cn(
                'rounded-lg data-[state=active]:shadow-sm',
                item.id === 'ckd-egfr-proteinuria' && 'gap-1.5',
              )}
            >
              {item.id === 'ckd-egfr-proteinuria' && (
                <HeartPulse className="h-3.5 w-3.5 opacity-80" aria-hidden />
              )}
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="ckd-egfr-proteinuria" className="mt-6 focus-visible:outline-none">
          <CkdEgfrProteinuriaSection value={state.ckdTracker} onChange={updateCkdTracker} />
        </TabsContent>

        <TabsContent
          value="volume-dialysis-transplant"
          className="mt-6 focus-visible:outline-none"
        >
          <VolumeDialysisTransplantSection
            value={state.volumeStatus}
            onChange={updateVolumeStatus}
          />
        </TabsContent>

        <TabsContent value="nephrotoxic-med-review" className="mt-6 focus-visible:outline-none">
          <NephrotoxicMedReviewSection
            value={state.nephrotoxicReview}
            onChange={updateNephrotoxicReview}
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
