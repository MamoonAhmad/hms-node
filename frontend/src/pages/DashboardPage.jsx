import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  UserX,
  CalendarClock,
  CircleDot,
} from 'lucide-react';
import { appointmentApi, appointmentStatusApi, patientApi } from '@/services/api';
import {
  getAppointmentStatusesFallback,
  getOpsDashboardAppointmentStatuses,
  normalizeAppointmentStatus,
} from '@/lib/appointmentStatuses';
import { aggregateStatusCounts } from '@/lib/appointmentStatusWorkflow';
import { getStatusSoftClass } from '@/lib/statusColors';
import { cn } from '@/lib/utils';

/** Facility "today" as YYYY-MM-DD in the browser/local facility clock. */
function toDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const STATUS_ICON = {
  Scheduled: Calendar,
  'Checked In': Clock,
  'In Progress': Clock,
  'Checked Out': CheckCircle2,
  Completed: CheckCircle2,
  Cancelled: XCircle,
  'No Show': UserX,
  Rescheduled: CalendarClock,
  'Left Without Being Seen (LWBS)': UserX,
};

const STATUS_FG = {
  'status-soft-info': 'text-[var(--status-info-fg)]',
  'status-soft-warning': 'text-[var(--status-warning-fg)]',
  'status-soft-success': 'text-[var(--status-success-fg)]',
  'status-soft-danger': 'text-[var(--status-danger-fg)]',
  'status-soft-muted': 'text-[var(--status-muted-fg)]',
};

function displayCount(value) {
  if (value === null || value === undefined) return '—';
  return value;
}

function MetricCard({ label, value, subtitle, icon: Icon }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 tabular-nums text-3xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

function StatusCard({ status, count, isLoading }) {
  const soft = getStatusSoftClass(status);
  const Icon = STATUS_ICON[normalizeAppointmentStatus(status)] || CircleDot;
  const iconColor = STATUS_FG[soft] || STATUS_FG['status-soft-muted'];

  return (
    <div className="rounded-lg border border-border bg-card shadow-[var(--shadow-panel)]">
      <div className="flex items-center justify-between px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', soft)}>
            <Icon className={cn('h-4 w-4', iconColor)} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{status}</p>
            <p className="text-xs text-muted-foreground">Appointments</p>
          </div>
        </div>
        <p className="ml-3 shrink-0 tabular-nums text-2xl font-bold text-foreground">
          {isLoading ? '—' : count}
        </p>
      </div>
    </div>
  );
}

function countForStatus(statusCounts, statusName) {
  if (!statusCounts) return 0;
  if (statusCounts[statusName] != null) return statusCounts[statusName] || 0;
  const canonical = normalizeAppointmentStatus(statusName);
  return statusCounts[canonical] || 0;
}

function mergeStatusCounts(raw = {}) {
  const counts = aggregateStatusCounts(raw);
  Object.entries(raw).forEach(([key, value]) => {
    if (key === 'all') return;
    if (counts[key] == null) counts[key] = value || 0;
  });
  return counts;
}

export function DashboardPage() {
  const [statusCounts, setStatusCounts] = useState(null);
  const [statusCatalog, setStatusCatalog] = useState(() => getAppointmentStatusesFallback());
  const [totalPatients, setTotalPatients] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState(null);

  useEffect(() => {
    let cancelled = false;

    appointmentStatusApi
      .getActive()
      .then((res) => {
        if (cancelled) return;
        const rows = Array.isArray(res.data) ? res.data : [];
        setStatusCatalog(getOpsDashboardAppointmentStatuses(rows));
      })
      .catch((err) => {
        console.error('Failed to fetch appointment status catalog:', err);
        if (!cancelled) setStatusCatalog(getAppointmentStatusesFallback());
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchDashboardData = async () => {
      const today = toDateKey();

      const [patientResult, statusResult] = await Promise.allSettled([
        patientApi.getAll({ limit: 1 }),
        appointmentApi.getStatusCounts({ date: today }),
      ]);

      if (cancelled) return;

      if (patientResult.status === 'fulfilled') {
        setTotalPatients(patientResult.value.pagination?.total ?? 0);
      } else {
        console.error('Failed to fetch patient total:', patientResult.reason);
      }

      if (statusResult.status === 'fulfilled') {
        const counts = mergeStatusCounts(statusResult.value.data || { all: 0 });
        setStatusCounts(counts);
        setTodayAppointments(counts.all ?? 0);
      } else {
        console.error('Failed to fetch appointment status counts:', statusResult.reason);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const statusLoading = statusCounts === null;

  return (
    <div className="ehr-page">
      <PageHeader
        title="Operations Dashboard"
        description="Real-time ops overview of registered patient volume and today's appointment status mix."
        breadcrumbs="Overview"
      />

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Key metrics
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total Patients"
            value={displayCount(totalPatients)}
            subtitle="Registered patients"
            icon={Users}
          />
          <MetricCard
            label="Appointments"
            value={displayCount(todayAppointments)}
            subtitle="Today's appointments"
            icon={Calendar}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Appointment status
        </h2>
        <p className="text-sm text-muted-foreground">Today&apos;s appointments by status</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {statusCatalog.map((statusRow) => (
            <StatusCard
              key={statusRow.id || statusRow.name}
              status={statusRow.name}
              count={countForStatus(statusCounts, statusRow.name)}
              isLoading={statusLoading}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
