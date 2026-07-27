import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ScanFace, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { medicationOrderApi } from '@/services/api/medicationOrder.api';
import { usePatientChart } from '../PatientChartContext';
import { ChartTabShell } from '../components/chart-ui';
import { SkinExaminationForm } from './SkinExaminationForm';
import { BiopsyProcedureForm } from './BiopsyProcedureForm';
import { DermatologyTreatmentPlanForm } from './DermatologyTreatmentPlanForm';
import { DERMATOLOGY_SECTIONS } from './dermatologyConstants';
import {
  createEmptyDermatologyState,
  formatLesionLabel,
  loadDermatologyHistory,
  loadDermatologyState,
  saveDermatologyState,
} from './dermatologyUtils';

function providerDisplayName(appointment) {
  if (!appointment) return '';
  const p = appointment.provider || appointment.Provider;
  if (!p) {
    return (
      appointment.providerName ||
      appointment.providerFullName ||
      [appointment.providerFirstName, appointment.providerLastName].filter(Boolean).join(' ') ||
      ''
    );
  }
  if (typeof p === 'string') return p;
  return (
    p.fullName ||
    [p.firstName, p.lastName].filter(Boolean).join(' ') ||
    p.name ||
    ''
  );
}

export function PatientDermatologyTab() {
  const {
    patientId,
    appointmentId,
    appointment,
    patient,
    loading,
    error,
    refreshChart,
  } = usePatientChart();
  const [, setSearchParams] = useSearchParams();

  const [section, setSection] = useState('skin-exam');
  const [state, setState] = useState(() => createEmptyDermatologyState());
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [medications, setMedications] = useState([]);
  const [medicationsLoading, setMedicationsLoading] = useState(false);

  const performingProvider = useMemo(
    () => providerDisplayName(appointment),
    [appointment],
  );

  useEffect(() => {
    const loaded = loadDermatologyState(patientId, appointmentId);
    setState(loaded);
    setSavedAt(loaded.updatedAt);
    setDirty(false);
    setSaveMessage('');
    setHistory(loadDermatologyHistory(patientId));
  }, [patientId, appointmentId]);

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
      // Sync lesion biopsy status from procedures
      const procedures = next.biopsy?.procedures || [];
      const lesions = (next.exam?.lesions || []).map((lesion) => {
        const linked = procedures.filter((p) => p.lesionId === lesion.id);
        if (!linked.length) return lesion;
        const hasPending = linked.some(
          (p) => p.specimenSentToPathology === 'Yes' && p.pathologyStatus !== 'Resulted',
        );
        const hasResulted = linked.every((p) => p.pathologyStatus === 'Resulted');
        return {
          ...lesion,
          biopsyStatus: hasResulted
            ? 'Resulted'
            : hasPending
              ? 'Pending Pathology'
              : 'Performed',
        };
      });

      const synced = { ...next, exam: { ...next.exam, lesions } };
      const saved = saveDermatologyState(patientId, appointmentId, synced);
      setState(saved);
      setSavedAt(saved.updatedAt);
      setDirty(false);
      setHistory(loadDermatologyHistory(patientId));
      const reminderCount = saved.reminders?.length || 0;
      setSaveMessage(
        reminderCount
          ? `Saved for this encounter. ${reminderCount} follow-up reminder(s) generated. Carry-forward updated for future visits.`
          : 'Saved for this encounter. Carry-forward updated for future visits.',
      );
    },
    [patientId, appointmentId],
  );

  const updateExam = (exam) => {
    setState((prev) => ({ ...prev, exam }));
    setDirty(true);
  };

  const updateBiopsy = (biopsy) => {
    setState((prev) => ({ ...prev, biopsy }));
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

  const pullDiagnosesFromExam = () => {
    const lesions = state.exam?.lesions || [];
    const withDx = lesions.find((l) => l.primaryDiagnosisCode || l.clinicalDiagnosis);
    const codes = [];
    for (const l of lesions) {
      if (l.primaryDiagnosisCode && !codes.some((c) => c.code === l.primaryDiagnosisCode)) {
        codes.push({
          code: l.primaryDiagnosisCode,
          description: l.primaryDiagnosisDescription || l.clinicalDiagnosis || '',
          id: l.primaryDiagnosisId || '',
        });
      }
    }
    updatePlan({
      ...state.plan,
      primaryDiagnosis:
        state.plan.primaryDiagnosis ||
        withDx?.clinicalDiagnosis ||
        withDx?.primaryDiagnosisDescription ||
        '',
      primaryDiagnosisCode: state.plan.primaryDiagnosisCode || withDx?.primaryDiagnosisCode || '',
      primaryDiagnosisId: state.plan.primaryDiagnosisId || withDx?.primaryDiagnosisId || '',
      icd10Codes: state.plan.icd10Codes?.length ? state.plan.icd10Codes : codes,
    });
  };

  const subtitle = useMemo(() => {
    const name = [patient?.firstName, patient?.lastName].filter(Boolean).join(' ');
    return name
      ? `Skin examination, biopsy procedures, and dermatology treatment plan for ${name}.`
      : 'Document skin examination / morphology, biopsy procedures, and dermatology treatment plans.';
  }, [patient]);

  const lesionCount = state.exam?.lesions?.length || 0;
  const biopsyCount = state.biopsy?.procedures?.length || 0;
  const reminderCount = state.reminders?.length || 0;

  return (
    <ChartTabShell
      eyebrow="Dermatology"
      title="Dermatology"
      description={subtitle}
      loading={loading && !patient}
      error={error}
      onRetry={refreshChart}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {lesionCount > 0 && (
            <Badge variant="outline" className="status-soft-info">
              {lesionCount} lesion{lesionCount === 1 ? '' : 's'}
            </Badge>
          )}
          {biopsyCount > 0 && (
            <Badge variant="outline" className="status-soft-warning">
              {biopsyCount} biopsy{biopsyCount === 1 ? '' : 'ies'}
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

      {reminderCount > 0 && (
        <div className="rounded-lg border border-l-4 border-l-amber-500 border-border bg-card px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pathology & follow-up reminders
          </p>
          <ul className="mt-2 space-y-1">
            {state.reminders.map((r) => (
              <li key={r.id} className="text-sm text-foreground">
                {r.label}
                {r.dueDate ? (
                  <span className="ml-2 text-xs text-muted-foreground">Due {r.dueDate}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Tabs value={section} onValueChange={setSection} className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 rounded-xl bg-muted/50 p-1 sm:grid-cols-3">
          {DERMATOLOGY_SECTIONS.map((item) => (
            <TabsTrigger
              key={item.id}
              value={item.id}
              className={cn(
                'rounded-lg data-[state=active]:shadow-sm',
                item.id === 'skin-exam' && 'gap-1.5',
              )}
            >
              {item.id === 'skin-exam' && (
                <ScanFace className="h-3.5 w-3.5 opacity-80" aria-hidden />
              )}
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="skin-exam" className="mt-6 focus-visible:outline-none">
          <SkinExaminationForm value={state.exam} onChange={updateExam} />
        </TabsContent>

        <TabsContent value="biopsy" className="mt-6 focus-visible:outline-none">
          <BiopsyProcedureForm
            value={state.biopsy}
            onChange={updateBiopsy}
            lesions={state.exam?.lesions || []}
            performingProvider={performingProvider}
            onLinkPathology={() => goToTab('orders')}
          />
        </TabsContent>

        <TabsContent value="treatment-plan" className="mt-6 focus-visible:outline-none">
          <DermatologyTreatmentPlanForm
            value={state.plan}
            onChange={updatePlan}
            linkedMedications={medications}
            medicationsLoading={medicationsLoading}
            onRefreshMedications={loadMedications}
            onOpenMedications={() => goToTab('medications')}
            onOpenOrders={() => goToTab('orders')}
            onOpenReferrals={() => goToTab('referrals')}
            onPullDiagnosesFromExam={pullDiagnosesFromExam}
          />
        </TabsContent>
      </Tabs>

      {(state.exam?.lesions || []).length > 0 && (
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Lesion summary
          </p>
          <ul className="mt-2 space-y-1">
            {state.exam.lesions.map((l, i) => (
              <li key={l.id} className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{formatLesionLabel(l, i)}</span>
                {(l.bodyLocations || []).length > 0 && ` · ${(l.bodyLocations || []).join(', ')}`}
                {l.biopsyStatus && l.biopsyStatus !== 'None' && ` · ${l.biopsyStatus}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {history.length > 0 && (
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Prior dermatology documentation
          </p>
          <ul className="mt-2 space-y-1">
            {history.slice(0, 5).map((entry) => (
              <li key={`${entry.appointmentId}-${entry.savedAt}`} className="text-xs text-muted-foreground">
                {entry.savedAt ? new Date(entry.savedAt).toLocaleString() : '—'}
                {entry.examinationType ? ` · ${entry.examinationType}` : ''}
                {entry.lesionCount != null ? ` · ${entry.lesionCount} lesion(s)` : ''}
                {entry.outcome ? ` · ${entry.outcome}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {state.auditLog?.length > 0 && (
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Audit trail
          </p>
          <ul className="mt-2 space-y-1">
            {[...state.auditLog].reverse().slice(0, 5).map((entry) => (
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
