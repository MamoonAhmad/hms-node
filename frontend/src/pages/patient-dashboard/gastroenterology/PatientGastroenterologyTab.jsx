import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, Stethoscope, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { medicationOrderApi } from '@/services/api/medicationOrder.api';
import { usePatientChart } from '../PatientChartContext';
import { ChartTabShell } from '../components/chart-ui';
import { GiSymptomsForm } from './GiSymptomsForm';
import { EndoscopyTrackerForm } from './EndoscopyTrackerForm';
import { IbdLiverForm } from './IbdLiverForm';
import { GiAssessmentPlanForm } from './GiAssessmentPlanForm';
import { GASTROENTEROLOGY_SECTIONS } from './gastroenterologyConstants';
import {
  alarmPlanRequired,
  hasAlarmFeatures,
  loadGastroenterologyHistory,
  loadGastroenterologyState,
  providerDisplayName,
  saveGastroenterologyState,
} from './gastroenterologyUtils';

export function PatientGastroenterologyTab() {
  const { patientId, appointmentId, appointment } = usePatientChart();
  const provider = providerDisplayName(appointment);
  return (
    <GastroenterologyTabInner
      key={`${patientId || 'unknown'}::${appointmentId || 'no-appt'}`}
      patientId={patientId}
      appointmentId={appointmentId}
      provider={provider}
    />
  );
}

function GastroenterologyTabInner({ patientId, appointmentId, provider }) {
  const { patient, loading, error, refreshChart } = usePatientChart();
  const [, setSearchParams] = useSearchParams();

  const defaults = useMemo(() => ({ performingProvider: provider || '' }), [provider]);
  const initial = loadGastroenterologyState(patientId, appointmentId, defaults);

  const [section, setSection] = useState('gi-symptoms');
  const [state, setState] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(initial.updatedAt);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [history, setHistory] = useState(() => loadGastroenterologyHistory(patientId));
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
      setSaveError('');
      try {
        const saved = saveGastroenterologyState(patientId, appointmentId, next);
        setState(saved);
        setSavedAt(saved.updatedAt);
        setHistory(loadGastroenterologyHistory(patientId));
        setDirty(false);
        const reminderCount = saved.reminders?.length || 0;
        setSaveMessage(
          reminderCount
            ? `Saved for this encounter. ${reminderCount} reminder(s) / surveillance alert(s) updated.`
            : 'Saved for this encounter. Longitudinal GI trends updated for future visits.',
        );
      } catch (err) {
        setSaveError(err?.message || 'Unable to save Gastroenterology documentation.');
        if (err?.code === 'ALARM_PLAN_REQUIRED') {
          setSection('gi-symptoms');
        }
      }
    },
    [patientId, appointmentId],
  );

  const updateSymptoms = (symptoms) => {
    setState((prev) => ({ ...prev, symptoms }));
    setDirty(true);
    setSaveMessage('');
    setSaveError('');
  };

  const updateEndoscopy = (endoscopy) => {
    setState((prev) => ({ ...prev, endoscopy }));
    setDirty(true);
    setSaveMessage('');
    setSaveError('');
  };

  const updateIbdLiver = (ibdLiver) => {
    setState((prev) => ({ ...prev, ibdLiver }));
    setDirty(true);
    setSaveMessage('');
    setSaveError('');
  };

  const updatePlan = (plan) => {
    setState((prev) => ({ ...prev, plan }));
    setDirty(true);
    setSaveMessage('');
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

  const pullFromSections = () => {
    const fromSymptoms = state.symptoms || {};
    const fromIbd = state.ibdLiver || {};
    updatePlan({
      ...state.plan,
      primaryDiagnosis:
        state.plan.primaryDiagnosis ||
        fromIbd.primaryDiagnosis ||
        fromSymptoms.primaryDiagnosis ||
        '',
      primaryDiagnosisCode:
        state.plan.primaryDiagnosisCode ||
        fromIbd.primaryDiagnosisCode ||
        fromSymptoms.primaryDiagnosisCode ||
        '',
      primaryDiagnosisId:
        state.plan.primaryDiagnosisId ||
        fromIbd.primaryDiagnosisId ||
        fromSymptoms.primaryDiagnosisId ||
        '',
      secondaryDiagnosis:
        state.plan.secondaryDiagnosis ||
        fromIbd.secondaryDiagnosis ||
        fromSymptoms.secondaryDiagnosis ||
        '',
      secondaryDiagnosisCode:
        state.plan.secondaryDiagnosisCode ||
        fromIbd.secondaryDiagnosisCode ||
        fromSymptoms.secondaryDiagnosisCode ||
        '',
      secondaryDiagnosisId:
        state.plan.secondaryDiagnosisId ||
        fromIbd.secondaryDiagnosisId ||
        fromSymptoms.secondaryDiagnosisId ||
        '',
      clinicalImpression:
        state.plan.clinicalImpression ||
        fromIbd.clinicalImpression ||
        fromSymptoms.clinicalImpression ||
        '',
      treatmentPlan: state.plan.treatmentPlan || fromIbd.treatmentPlan || '',
      lifestyleCounseling: state.plan.lifestyleCounseling || fromIbd.lifestyleCounseling || '',
      patientEducation: state.plan.patientEducation || fromIbd.patientEducation || '',
      followUpInterval:
        state.plan.followUpInterval || fromIbd.followUpInterval || '',
      referrals: state.plan.referrals?.length
        ? state.plan.referrals
        : fromIbd.referrals || [],
      providerNotes: state.plan.providerNotes || fromSymptoms.providerNotes || '',
    });
  };

  const subtitle = useMemo(() => {
    const name = [patient?.firstName, patient?.lastName].filter(Boolean).join(' ');
    return name
      ? `GI symptoms, endoscopy tracker, IBD/liver management, and assessment & plan for ${name}.`
      : 'Document GI symptoms, endoscopy, IBD & liver disease, and assessment & plan.';
  }, [patient]);

  const alarmActive = hasAlarmFeatures(state.symptoms);
  const alarmBlocking = alarmPlanRequired(state.symptoms);
  const procedureCount = state.endoscopy?.procedures?.length || 0;
  const reminderCount = state.reminders?.length || 0;

  return (
    <ChartTabShell
      eyebrow="Gastroenterology"
      title="Gastroenterology"
      description={subtitle}
      loading={loading && !patient}
      error={error}
      onRetry={refreshChart}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {alarmActive && (
            <Badge variant="outline" className="status-soft-danger">
              Alarm features
            </Badge>
          )}
          {procedureCount > 0 && (
            <Badge variant="outline" className="status-soft-info">
              {procedureCount} procedure{procedureCount === 1 ? '' : 's'}
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
          <Button
            type="button"
            size="sm"
            disabled={!dirty}
            onClick={() => persist(state)}
          >
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
        <div className="rounded-lg border border-l-4 border-l-destructive border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {saveError}
        </div>
      )}

      {alarmActive && (
        <div className="rounded-lg border border-l-4 border-l-destructive border-border bg-card px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-destructive">
                Urgent GI Evaluation Recommended
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {alarmBlocking
                  ? 'Document and acknowledge an alarm-feature management plan before saving.'
                  : 'Alarm features are documented. Ensure the management plan remains complete before encounter completion.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {reminderCount > 0 && (
        <div className="rounded-lg border border-l-4 border-l-amber-500 border-border bg-card px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Surveillance & follow-up reminders
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
        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 rounded-xl bg-muted/50 p-1 sm:grid-cols-2 lg:grid-cols-4">
          {GASTROENTEROLOGY_SECTIONS.map((item) => (
            <TabsTrigger
              key={item.id}
              value={item.id}
              className={cn(
                'rounded-lg data-[state=active]:shadow-sm',
                item.id === 'gi-symptoms' && alarmActive && 'text-destructive',
              )}
            >
              {item.id === 'gi-symptoms' && (
                <Stethoscope className="mr-1.5 h-3.5 w-3.5 opacity-80" aria-hidden />
              )}
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="gi-symptoms" className="mt-6 focus-visible:outline-none">
          <GiSymptomsForm value={state.symptoms} onChange={updateSymptoms} />
        </TabsContent>

        <TabsContent value="endoscopy" className="mt-6 focus-visible:outline-none">
          <EndoscopyTrackerForm
            value={state.endoscopy}
            onChange={updateEndoscopy}
            performingProvider={provider}
            onOpenOrders={() => goToTab('orders')}
            onOpenResults={() => goToTab('results')}
          />
        </TabsContent>

        <TabsContent value="ibd-liver" className="mt-6 focus-visible:outline-none">
          <IbdLiverForm
            value={state.ibdLiver}
            onChange={updateIbdLiver}
            linkedMedications={medications}
            medicationsLoading={medicationsLoading}
            onRefreshMedications={loadMedications}
            onOpenMedications={() => goToTab('medications')}
            onOpenOrders={() => goToTab('orders')}
            onOpenResults={() => goToTab('results')}
            onOpenReferrals={() => goToTab('referrals')}
          />
        </TabsContent>

        <TabsContent value="assessment-plan" className="mt-6 focus-visible:outline-none">
          <GiAssessmentPlanForm
            value={state.plan}
            onChange={updatePlan}
            linkedMedications={medications}
            medicationsLoading={medicationsLoading}
            onRefreshMedications={loadMedications}
            onOpenMedications={() => goToTab('medications')}
            onOpenOrders={() => goToTab('orders')}
            onOpenReferrals={() => goToTab('referrals')}
            onPullFromSections={pullFromSections}
          />
        </TabsContent>
      </Tabs>

      {history.length > 0 && (
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Prior gastroenterology documentation
          </p>
          <ul className="mt-2 space-y-1">
            {history.slice(0, 5).map((entry) => (
              <li
                key={`${entry.appointmentId}-${entry.savedAt}`}
                className="text-xs text-muted-foreground"
              >
                {entry.savedAt ? new Date(entry.savedAt).toLocaleString() : '—'}
                {entry.visitType ? ` · ${entry.visitType}` : ''}
                {entry.alarmCount ? ` · ${entry.alarmCount} alarm(s)` : ''}
                {entry.procedureCount != null
                  ? ` · ${entry.procedureCount} procedure(s)`
                  : ''}
                {entry.diseaseStatus ? ` · ${entry.diseaseStatus}` : ''}
                {entry.primaryDiagnosis ? ` · ${entry.primaryDiagnosis}` : ''}
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
