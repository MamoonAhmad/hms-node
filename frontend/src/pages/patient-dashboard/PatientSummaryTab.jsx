import { useMemo, useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  Calendar,
  ClipboardList,
  FileText,
  Loader2,
  LogOut,
  Shield,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { patientApi } from '@/services/api/patient.api';
import { usePatientChart } from './PatientChartContext';
import { ChartTabShell, EmptyState, SectionCard, StatCard, StatusBadge } from './components/chart-ui';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function VisitDetails({ visit, emptyMessage }) {
  if (!visit) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
        <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</dt>
        <dd className="mt-0.5 font-medium">{formatDate(visit.encounterDate || visit.appointmentDate)}</dd>
      </div>
      {visit.appointmentTime && (
        <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time</dt>
          <dd className="mt-0.5 font-medium">{visit.appointmentTime}</dd>
        </div>
      )}
      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
        <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Visit type</dt>
        <dd className="mt-0.5 font-medium">{visit.visitType || '—'}</dd>
      </div>
      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
        <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Provider</dt>
        <dd className="mt-0.5 font-medium">{visit.providerName || '—'}</dd>
      </div>
      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
        <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</dt>
        <dd className="mt-0.5 font-medium">{visit.location || '—'}</dd>
      </div>
      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
        <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</dt>
        <dd className="mt-1">
          <StatusBadge status={visit.status} />
        </dd>
      </div>
    </dl>
  );
}

export function PatientSummaryTab() {
  const { patient, patientId, appointmentId, isSampleChart, refreshKey } = usePatientChart();
  const [, setSearchParams] = useSearchParams();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canFetch = Boolean(patientId && patientId !== 'sample' && !isSampleChart);

  const loadSummary = useCallback(async () => {
    if (!canFetch) {
      setSummary(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await patientApi.getSummary(patientId, {
        encounterId: appointmentId || undefined,
      });
      setSummary(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load summary');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [canFetch, patientId, appointmentId]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary, refreshKey]);

  const goToProblemsTab = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'problems');
      return next;
    });
  }, [setSearchParams]);

  const goToCheckoutTab = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'patient-checkout');
      if (appointmentId) next.set('appointmentId', appointmentId);
      return next;
    });
  }, [setSearchParams, appointmentId]);

  const overview = useMemo(() => {
    if (!summary && !patient) return null;
    return {
      mrn: summary?.mrn || patient?.mrn || '—',
      currentEncounterId: summary?.currentEncounterId || appointmentId || null,
    };
  }, [summary, patient, appointmentId]);

  if (!patient) return null;

  if (isSampleChart || patientId === 'sample') {
    return (
      <ChartTabShell
        title="Patient summary"
        description="Clinical overview for the current patient and encounter."
      >
        <EmptyState
          icon={FileText}
          title="No patient selected"
          description="Open a registered patient chart to view the clinical summary."
        />
      </ChartTabShell>
    );
  }

  const problemCount = summary?.problems?.length ?? 0;
  const allergyCount = summary?.noKnownDrugAllergies ? 0 : (summary?.allergies?.length ?? 0);
  const orderCount = summary?.orders?.length ?? 0;

  return (
    <ChartTabShell
      title="Patient summary"
      description={
        overview
          ? `Clinical overview · MRN ${overview.mrn}`
          : 'Clinical overview for the current patient and encounter.'
      }
      actions={
        patient?.id ? (
          <Button variant="outline" size="sm" asChild>
            <Link to={`/patients/edit/${patient.id}`}>Edit registration</Link>
          </Button>
        ) : null
      }
      loading={loading}
      loadingMessage="Loading summary…"
      error={error}
      onRetry={loadSummary}
    >
      {summary && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Active problems"
              value={problemCount}
              icon={Stethoscope}
              accent="info"
              onClick={goToProblemsTab}
            />
            <StatCard
              label="Allergies"
              value={summary.noKnownDrugAllergies ? 'NKDA' : allergyCount}
              icon={AlertTriangle}
              accent={allergyCount > 0 ? 'danger' : 'success'}
            />
            <StatCard
              label="Current orders"
              value={orderCount}
              icon={ClipboardList}
              accent="warning"
            />
            <StatCard
              label="Insurance"
              value={summary.insuranceEligibilityStatus || 'Not verified'}
              icon={Shield}
              accent="info"
            />
          </div>

          <SectionCard title="Chief complaint" icon={FileText} accent="primary" className="lg:col-span-2">
            {summary.chiefComplaint ? (
              <p className="text-sm leading-relaxed text-foreground">{summary.chiefComplaint}</p>
            ) : (
              <EmptyState title="No chief complaint recorded" />
            )}
          </SectionCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Overview" icon={Calendar} accent="info">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
                  <span className="text-muted-foreground">Patient MRN</span>
                  <span className="font-mono font-semibold">{summary.mrn}</span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
                  <span className="text-muted-foreground">Current encounter</span>
                  <span className="font-medium text-right">
                    {summary.currentEncounterId ? `${summary.currentEncounterId.slice(0, 8)}…` : '—'}
                  </span>
                </div>
                {appointmentId && (
                  <Button type="button" variant="success" size="sm" className="w-full gap-2" onClick={goToCheckoutTab}>
                    <LogOut className="h-4 w-4" />
                    Start Checkout
                  </Button>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Provider" icon={Stethoscope} accent="info">
              {summary.provider?.name ? (
                <dl className="space-y-3 text-sm">
                  <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Provider name</dt>
                    <dd className="mt-0.5 font-semibold">{summary.provider.name}</dd>
                  </div>
                  {summary.provider.specialty && (
                    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Specialty</dt>
                      <dd className="mt-0.5 font-medium">{summary.provider.specialty}</dd>
                    </div>
                  )}
                </dl>
              ) : (
                <EmptyState title="No provider assigned" />
              )}
            </SectionCard>

            <SectionCard title="Last visit" icon={Calendar}>
              <VisitDetails visit={summary.lastVisit} emptyMessage="No previous visit found." />
            </SectionCard>

            <SectionCard title="Upcoming visit" icon={Calendar}>
              <VisitDetails visit={summary.upcomingVisit} emptyMessage="No upcoming visit scheduled." />
            </SectionCard>

            <SectionCard title="Insurance eligibility" icon={Shield} accent="info">
              {summary.insuranceEligibilityStatus ? (
                <StatusBadge status={summary.insuranceEligibilityStatus} />
              ) : (
                <EmptyState title="Eligibility not verified" />
              )}
            </SectionCard>
          </div>

          <SectionCard
            title="Problems"
            icon={Stethoscope}
            accent="info"
            actions={
              <Button variant="link" size="sm" className="h-auto px-0" onClick={goToProblemsTab}>
                View all
              </Button>
            }
          >
            {summary.problems?.length > 0 ? (
              <div className="chart-table-wrap">
                <Table>
                  <TableHeader sticky>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Clinical status</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead>Onset</TableHead>
                      <TableHead>Resolved</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.problems.map((problem) => (
                      <TableRow
                        key={problem.id}
                        className="cursor-pointer"
                        onClick={goToProblemsTab}
                      >
                        <TableCell className="font-mono text-xs">
                          {problem.icd10Code || problem.problemCode || '—'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {problem.diagnosisDescription || problem.problemDescription}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={problem.status} />
                        </TableCell>
                        <TableCell>{problem.clinicalStatus || '—'}</TableCell>
                        <TableCell>{problem.verificationStatus || problem.verification || '—'}</TableCell>
                        <TableCell>{formatDate(problem.onsetDate)}</TableCell>
                        <TableCell>{formatDate(problem.resolvedDate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState
                title="No problems recorded"
                action={goToProblemsTab}
                actionLabel="Add problem"
              />
            )}
          </SectionCard>

          <SectionCard
            title="Allergies"
            icon={AlertTriangle}
            accent={summary.noKnownDrugAllergies ? 'success' : allergyCount > 0 ? 'danger' : 'default'}
          >
            {summary.noKnownDrugAllergies ? (
              <div className="flex items-center gap-2">
                <StatusBadge status="Verified">No Known Drug Allergies (NKDA)</StatusBadge>
              </div>
            ) : summary.allergies?.length > 0 ? (
              <div className="chart-table-wrap">
                <Table>
                  <TableHeader sticky>
                    <TableRow>
                      <TableHead>Allergen</TableHead>
                      <TableHead>Reaction</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Onset</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Comment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.allergies.map((allergy) => (
                      <TableRow key={allergy.id}>
                        <TableCell className="font-medium">{allergy.allergenName}</TableCell>
                        <TableCell>{allergy.reaction || '—'}</TableCell>
                        <TableCell>{allergy.severity || '—'}</TableCell>
                        <TableCell>{formatDate(allergy.onsetDate)}</TableCell>
                        <TableCell>
                          <StatusBadge status={allergy.status} />
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{allergy.comment || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState title="No allergies recorded" />
            )}
          </SectionCard>

          <SectionCard title="Orders" icon={ClipboardList} accent="warning">
            {summary.orders?.length > 0 ? (
              <div className="chart-table-wrap">
                <Table>
                  <TableHeader sticky>
                    <TableRow>
                      <TableHead>Order name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ordered by</TableHead>
                      <TableHead>Ordered date</TableHead>
                      <TableHead>Priority</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderName}</TableCell>
                        <TableCell>{order.orderType}</TableCell>
                        <TableCell>
                          <StatusBadge status={order.orderStatus} />
                        </TableCell>
                        <TableCell>{order.orderedBy || '—'}</TableCell>
                        <TableCell>{formatDateTime(order.orderedDate)}</TableCell>
                        <TableCell>{order.priority || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState title="No current orders" />
            )}
          </SectionCard>
        </div>
      )}
    </ChartTabShell>
  );
}
