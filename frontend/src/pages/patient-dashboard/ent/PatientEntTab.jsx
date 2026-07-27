import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Ear, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { medicationOrderApi } from '@/services/api/medicationOrder.api';
import { usePatientChart } from '../PatientChartContext';
import { ChartTabShell } from '../components/chart-ui';
import { EarAssessmentSection } from './EarAssessmentSection';
import { NoseSinusAssessmentSection } from './NoseSinusAssessmentSection';
import { ThroatAirwayAssessmentSection } from './ThroatAirwayAssessmentSection';
import { ENT_SECTIONS } from './entConstants';
import {
  getPresentAirwayRedFlags,
  hasUnresolvedAirwayEmergency,
  loadEntHistory,
  loadEntState,
  providerDisplayName,
  saveEntState,
} from './entUtils';

function todayInputValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function PatientEntTab() {
  const { patientId, appointmentId, appointment } = usePatientChart();
  const provider = providerDisplayName(appointment);
  return (
    <EntTabInner
      key={`${patientId || 'unknown'}::${appointmentId || 'no-appt'}`}
      patientId={patientId}
      appointmentId={appointmentId}
      provider={provider}
    />
  );
}

function EntTabInner({ patientId, appointmentId, provider }) {
  const { patient, loading, error, refreshChart } = usePatientChart();
  const [, setSearchParams] = useSearchParams();

  const defaults = useMemo(
    () => ({
      examinationDate: todayInputValue(),
      provider: provider || '',
    }),
    [provider],
  );

  const initial = loadEntState(patientId, appointmentId, defaults);
  if (!initial.ear.provider && provider) {
    initial.ear.provider = provider;
  }

  const [section, setSection] = useState('ear-assessment');
  const [state, setState] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(initial.updatedAt);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [history, setHistory] = useState(() => loadEntHistory(patientId));
  const [medications, setMedications] = useState([]);
  const [medicationsLoading, setMedicationsLoading] = useState(false);

  const loadMedications = useCallback(async () => {
    if (!patientId) return;
    setMedicationsLoading(true);
    try {
      const res = await medicationOrderApi.getOrders(patientId, {
        appointmentId: appointmentId || undefined,
      });
      const list = res?.data || res || [];
      setMedications(Array.isArray(list) ? list : []);
    } catch {
      setMedications([]);
    } finally {
      setMedicationsLoading(false);
    }
  }, [patientId, appointmentId]);

  useEffect(() => {
    loadMedications();
  }, [loadMedications]);

  const persist = useCallback(
    (next) => {
      const saved = saveEntState(patientId, appointmentId, next);
      setState(saved);
      setSavedAt(saved.updatedAt);
      setHistory(loadEntHistory(patientId));
      setDirty(false);
      setSaveError('');
      const flags = getPresentAirwayRedFlags(saved.throat);
      if (hasUnresolvedAirwayEmergency(saved.throat)) {
        setSection('throat-airway');
        setSaveError(
          'Airway red flags are Present. Acknowledge and document an immediate management plan before checkout can be completed.',
        );
        setSaveMessage('Saved draft ENT findings. Encounter completion remains blocked until airway plan is documented.');
        return;
      }
      setSaveMessage(
        flags.length
          ? 'Saved ENT documentation with acknowledged airway emergency plan. Longitudinal history updated.'
          : 'Saved ENT documentation for this encounter. Longitudinal ENT history updated.',
      );
    },
    [patientId, appointmentId],
  );

  const updateEar = (ear) => {
    setState((prev) => ({ ...prev, ear }));
    setDirty(true);
    setSaveError('');
  };

  const updateNose = (nose) => {
    setState((prev) => ({ ...prev, nose }));
    setDirty(true);
  };

  const updateThroat = (throat) => {
    setState((prev) => ({ ...prev, throat }));
    setDirty(true);
    setSaveError('');
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
      ? `Document ear, nose/sinus, and throat & airway assessments for ${name}.`
      : 'Document ear (otoscopy & audiogram), nose & sinus, and throat & airway assessments.';
  }, [patient]);

  const presentFlags = getPresentAirwayRedFlags(state.throat);
  const latestHistory = useMemo(() => {
    const current = {
      at: savedAt || new Date().toISOString(),
      appointmentId,
      examinationDate: state.ear?.examinationDate,
      affectedEar: state.ear?.affectedEar,
      hearingLossType: state.ear?.hearingLossType,
      severity: state.ear?.severity,
      noseDiagnoses: state.nose?.diagnoses || [],
      tonsilGrade: state.throat?.tonsilGrade,
      airwayRedFlags: presentFlags,
      primaryEarDx: state.ear?.primaryDiagnosisDisplay || state.ear?.primaryDiagnosisCode || '',
      primaryThroatDx:
        state.throat?.primaryDiagnosisDisplay || state.throat?.primaryDiagnosisCode || '',
    };
    const rest = history.filter((h) => h.appointmentId !== appointmentId);
    return [current, ...rest];
  }, [history, appointmentId, savedAt, state, presentFlags]);

  return (
    <ChartTabShell
      eyebrow="ENT"
      title="ENT"
      description={subtitle}
      loading={loading && !patient}
      error={error}
      onRetry={refreshChart}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {presentFlags.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {presentFlags.length} airway red flag{presentFlags.length === 1 ? '' : 's'}
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
      {saveError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 border-l-4 border-l-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {saveError}
        </div>
      )}

      <Tabs value={section} onValueChange={setSection} className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 rounded-xl bg-muted/50 p-1 sm:grid-cols-3">
          {ENT_SECTIONS.map((item) => (
            <TabsTrigger
              key={item.id}
              value={item.id}
              className={cn(
                'rounded-lg data-[state=active]:shadow-sm',
                item.id === 'throat-airway' &&
                  presentFlags.length > 0 &&
                  'text-destructive data-[state=active]:text-destructive',
              )}
            >
              {item.id === 'ear-assessment' && (
                <Ear className="mr-1.5 h-3.5 w-3.5 opacity-80" aria-hidden />
              )}
              {item.label}
              {item.id === 'throat-airway' && presentFlags.length > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                  {presentFlags.length}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="ear-assessment" className="mt-6 focus-visible:outline-none">
          <EarAssessmentSection
            value={state.ear}
            onChange={updateEar}
            history={latestHistory}
          />
        </TabsContent>

        <TabsContent value="nose-sinus" className="mt-6 focus-visible:outline-none">
          <NoseSinusAssessmentSection
            value={state.nose}
            onChange={updateNose}
            history={latestHistory}
            onOpenOrders={() => goToTab('orders')}
            onOpenResults={() => goToTab('results')}
          />
        </TabsContent>

        <TabsContent value="throat-airway" className="mt-6 focus-visible:outline-none">
          <ThroatAirwayAssessmentSection
            value={state.throat}
            onChange={updateThroat}
            history={latestHistory}
            linkedMedications={medications}
            medicationsLoading={medicationsLoading}
            onRefreshMedications={loadMedications}
            onOpenOrders={() => goToTab('orders')}
            onOpenMedications={() => goToTab('medications')}
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
