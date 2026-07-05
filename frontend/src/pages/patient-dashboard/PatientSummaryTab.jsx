import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Stethoscope,
  Calendar,
  User,
  Shield,
  AlertTriangle,
  ClipboardList,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { patientApi } from '@/services/api';
import { usePatientChart } from './PatientChartContext';

function formatDateMMDDYYYY(value) {
  if (!value) return '—';
  const date = new Date(value);
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const yyyy = date.getUTCFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

function formatTime12h(time24) {
  if (!time24) return '—';
  const [h, m] = time24.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function EmptyState({ message }) {
  return <p className="text-sm text-muted-foreground">{message}</p>;
}

function FieldRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
      <span className="shrink-0 text-xs font-medium text-muted-foreground sm:w-36">{label}</span>
      <span className="text-sm text-foreground">{value || '—'}</span>
    </div>
  );
}

function SummaryCard({ title, icon: Icon, children, className }) {
  return (
    <Card className={cn('shadow-[var(--shadow-panel)]', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {Icon && <Icon className="h-4 w-4 text-primary" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EligibilityBadge({ status }) {
  const normalized = status || 'Eligibility not verified';
  const styles = {
    Verified: 'bg-green-100 text-green-800 border-green-200',
    'Not Verified': 'bg-red-50 text-red-800 border-red-200',
    Pending: 'bg-amber-50 text-amber-900 border-amber-200',
    Failed: 'bg-red-50 text-red-800 border-red-200',
    'Not Available': 'bg-muted text-muted-foreground border-border',
  };
  const style = styles[normalized] || 'bg-muted text-foreground border-border';
  return (
    <Badge variant="outline" className={cn('font-medium', style)}>
      {normalized}
    </Badge>
  );
}

export function PatientSummaryTab() {
  const {
    patient,
    patientId,
    appointmentId,
    appointments,
    orders,
    isSampleChart,
    summaryRefreshKey,
    loading: chartLoading,
  } = usePatientChart();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      if (!patientId || chartLoading) return;

      if (isSampleChart) {
        setSummary(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await patientApi.getSummary(patientId, {
          encounterId: appointmentId || undefined,
          mrn: patient?.mrn,
        });
        if (!cancelled) setSummary(res.data);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load summary');
          setSummary(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSummary();
    return () => {
      cancelled = true;
    };
  }, [patientId, appointmentId, patient?.mrn, isSampleChart, summaryRefreshKey, chartLoading]);

  const sampleSummary = useMemo(() => {
    if (!isSampleChart || !patient) return null;
    const sorted = [...(appointments || [])].sort(
      (a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate),
    );
    const current = sorted.find((a) => a.id === appointmentId) || sorted[0];
    const completed = sorted.filter((a) => a.status === 'Completed' && a.id !== current?.id);
    const upcoming = sorted
      .filter((a) => {
        const apptDay = new Date(a.appointmentDate).setHours(0, 0, 0, 0);
        const today = new Date().setHours(0, 0, 0, 0);
        return apptDay > today && a.status === 'Scheduled';
      })
      .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));

    return {
      chiefComplaint: current?.visitReason || null,
      lastVisit: completed[0]
        ? {
            encounterDate: completed[0].appointmentDate,
            visitType: completed[0].appointmentType,
            providerName: completed[0].provider,
            location: completed[0].department,
            status: completed[0].status,
          }
        : null,
      upcomingVisit: upcoming[0]
        ? {
            appointmentDate: upcoming[0].appointmentDate,
            appointmentTime: upcoming[0].appointmentTime,
            visitType: upcoming[0].appointmentType,
            providerName: upcoming[0].provider,
            location: upcoming[0].department,
            status: upcoming[0].status,
          }
        : null,
      provider: current?.provider
        ? { name: current.provider, specialty: null }
        : null,
      insuranceEligibilityStatus: patient.insuranceProvider?.name ? 'Verified' : 'Pending',
      problems: [],
      allergies: { nkda: false, items: [] },
      orders: (orders || []).map((o) => ({
        id: o.id,
        orderName: o.procedureName,
        orderType: o.category,
        orderStatus: o.status,
        orderedBy: o.orderedBy,
        orderedDate: o.orderDateTime,
        priority: 'Routine',
      })),
    };
  }, [isSampleChart, patient, appointments, appointmentId, orders]);

  const displaySummary = isSampleChart ? sampleSummary : summary;

  if (chartLoading || loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading summary…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  const chiefComplaint = displaySummary?.chiefComplaint || null;

  const lastVisit = displaySummary?.lastVisit;
  const upcomingVisit = displaySummary?.upcomingVisit;
  const provider = displaySummary?.provider;
  const eligibility = displaySummary?.insuranceEligibilityStatus;
  const problems = displaySummary?.problems || [];
  const allergies = displaySummary?.allergies;
  const orderRows = displaySummary?.orders || [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Current visit summary</p>
        <h2 className="text-xl font-bold text-foreground">Summary</h2>
        {patient?.mrn && (
          <p className="mt-1 text-sm text-muted-foreground">MRN {patient.mrn}</p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SummaryCard title="Chief Complaint" icon={Stethoscope}>
          {chiefComplaint ? (
            <p className="text-sm leading-relaxed text-foreground">{chiefComplaint}</p>
          ) : (
            <EmptyState message="No chief complaint recorded." />
          )}
        </SummaryCard>

        <SummaryCard title="Provider" icon={User}>
          {provider?.name ? (
            <div className="space-y-2">
              <FieldRow label="Provider Name" value={provider.name} />
              <FieldRow label="Specialty" value={provider.specialty} />
            </div>
          ) : (
            <EmptyState message="No provider assigned." />
          )}
        </SummaryCard>
      </div>

      <SummaryCard title="Visit Information" icon={Calendar}>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Last Visit</p>
            {lastVisit ? (
              <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                <FieldRow label="Encounter Date" value={formatDateMMDDYYYY(lastVisit.encounterDate)} />
                <FieldRow label="Visit Type" value={lastVisit.visitType} />
                <FieldRow label="Provider Name" value={lastVisit.providerName} />
                <FieldRow label="Location / Facility" value={lastVisit.location} />
                <FieldRow label="Encounter Status" value={lastVisit.status} />
              </div>
            ) : (
              <EmptyState message="No previous visit found." />
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Upcoming Visit</p>
            {upcomingVisit ? (
              <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                <FieldRow label="Appointment Date" value={formatDateMMDDYYYY(upcomingVisit.appointmentDate)} />
                <FieldRow label="Appointment Time" value={formatTime12h(upcomingVisit.appointmentTime)} />
                <FieldRow label="Visit Type" value={upcomingVisit.visitType} />
                <FieldRow label="Provider Name" value={upcomingVisit.providerName} />
                <FieldRow label="Location" value={upcomingVisit.location} />
                <FieldRow label="Appointment Status" value={upcomingVisit.status} />
              </div>
            ) : (
              <EmptyState message="No upcoming visit scheduled." />
            )}
          </div>
        </div>
      </SummaryCard>

      <SummaryCard title="Insurance Eligibility" icon={Shield}>
        {eligibility ? (
          <EligibilityBadge status={eligibility} />
        ) : (
          <EmptyState message="Eligibility not verified." />
        )}
      </SummaryCard>

      <SummaryCard title="Problems" icon={ClipboardList}>
        {problems.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Clinical Status</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Onset</TableHead>
                  <TableHead>Resolved</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {problems.map((problem) => (
                  <TableRow key={problem.id}>
                    <TableCell className="font-mono text-xs">{problem.problemCode || '—'}</TableCell>
                    <TableCell>{problem.description}</TableCell>
                    <TableCell>{problem.status}</TableCell>
                    <TableCell>{problem.clinicalStatus || '—'}</TableCell>
                    <TableCell>{problem.verification || '—'}</TableCell>
                    <TableCell>{formatDateMMDDYYYY(problem.onsetDate)}</TableCell>
                    <TableCell>{formatDateMMDDYYYY(problem.resolvedDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState message="No problems recorded." />
        )}
      </SummaryCard>

      <SummaryCard title="Allergies" icon={AlertTriangle} className="border-amber-200/60">
        {allergies?.nkda ? (
          <p className="text-sm font-medium text-foreground">No Known Drug Allergies (NKDA)</p>
        ) : allergies?.items?.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
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
                {allergies.items.map((allergy) => (
                  <TableRow key={allergy.id}>
                    <TableCell>{allergy.allergenName}</TableCell>
                    <TableCell>{allergy.reaction || '—'}</TableCell>
                    <TableCell>{allergy.severity || '—'}</TableCell>
                    <TableCell>{formatDateMMDDYYYY(allergy.onsetDate)}</TableCell>
                    <TableCell>{allergy.status}</TableCell>
                    <TableCell>{allergy.comment || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState message="No allergies recorded." />
        )}
      </SummaryCard>

      <SummaryCard title="Orders" icon={ClipboardList}>
        {orderRows.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ordered By</TableHead>
                  <TableHead>Ordered Date</TableHead>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderRows.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.orderName}</TableCell>
                    <TableCell>{order.orderType}</TableCell>
                    <TableCell>{order.orderStatus}</TableCell>
                    <TableCell>{order.orderedBy || '—'}</TableCell>
                    <TableCell>{formatDateMMDDYYYY(order.orderedDate)}</TableCell>
                    <TableCell>{order.priority || 'Routine'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState message="No current orders." />
        )}
      </SummaryCard>
    </div>
  );
}
