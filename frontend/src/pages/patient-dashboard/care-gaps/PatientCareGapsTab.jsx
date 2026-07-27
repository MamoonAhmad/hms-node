import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  ShieldAlert,
  ShieldCheck,
  Syringe,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { getStatusSoftClass } from '@/lib/statusColors';
import { usePatientChart } from '../PatientChartContext';
import {
  ChartTabShell,
  EmptyState,
  RowActionMenu,
  SectionCard,
  StatCard,
  StatusBadge,
} from '../components/chart-ui';
import { OPEN_CARE_GAP_STATUSES } from './careGapProtocols';
import {
  countOpenCareGaps,
  evaluateCareGaps,
  formatCareGapDate,
  loadCareGapOverrides,
  saveCareGapOverrides,
} from './careGapUtils';

const FILTERS = [
  { id: 'open', label: 'Needs attention' },
  { id: 'all', label: 'All' },
  { id: 'Screening', label: 'Screenings' },
  { id: 'Immunization', label: 'Immunizations' },
  { id: 'Health Maintenance', label: 'Health maintenance' },
  { id: 'Completed', label: 'Completed' },
];

const CATEGORY_ICON = {
  Screening: ShieldAlert,
  Immunization: Syringe,
  'Health Maintenance': ShieldCheck,
};

function CareGapStatusBadge({ status }) {
  return (
    <StatusBadge
      status={status}
      className={cn('whitespace-nowrap', getStatusSoftClass(status))}
    />
  );
}

function gapMatchesFilter(gap, filter) {
  if (filter === 'all') return true;
  if (filter === 'open') return OPEN_CARE_GAP_STATUSES.has(gap.status);
  if (filter === 'Completed') return gap.status === 'Completed';
  return gap.category === filter;
}

function CareGapActionMenu({ gap, onAction, disabled }) {
  const open = OPEN_CARE_GAP_STATUSES.has(gap.status);
  const items = [
    {
      id: 'order',
      label: gap.orderHint ? `Order: ${gap.orderHint}` : 'Go to Orders',
      icon: ClipboardList,
      hidden: !open && gap.status !== 'Ordered',
    },
    {
      id: 'complete',
      label: 'Document completed',
      icon: FileCheck2,
      hidden: gap.status === 'Completed',
    },
    {
      id: 'decline',
      label: 'Document declined',
      icon: XCircle,
      hidden: gap.status === 'Declined',
    },
    {
      id: 'na',
      label: 'Mark not applicable',
      icon: CheckCircle2,
      hidden: gap.status === 'N/A',
    },
    {
      id: 'reset',
      label: 'Clear visit documentation',
      icon: AlertTriangle,
      hidden: !gap.documentedAt,
    },
  ];

  return (
    <RowActionMenu
      items={items}
      disabled={disabled}
      label={`Actions for ${gap.name}`}
      menuWidth={240}
      onSelect={(actionId) => onAction?.(actionId, gap)}
    />
  );
}

export function PatientCareGapsTab() {
  const { patient, patientId, appointmentId, loading: chartLoading } = usePatientChart();
  const [, setSearchParams] = useSearchParams();
  const [overrides, setOverrides] = useState({});
  const [filter, setFilter] = useState('open');
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    setOverrides(loadCareGapOverrides(patientId, appointmentId));
  }, [patientId, appointmentId]);

  const persistOverrides = useCallback(
    (next) => {
      setOverrides(next);
      saveCareGapOverrides(patientId, appointmentId, next);
    },
    [patientId, appointmentId],
  );

  const gaps = useMemo(
    () => (patient ? evaluateCareGaps(patient, overrides) : []),
    [patient, overrides],
  );

  const openCount = useMemo(() => countOpenCareGaps(patient, overrides), [patient, overrides]);
  const overdueCount = useMemo(
    () => gaps.filter((g) => g.status === 'Overdue').length,
    [gaps],
  );
  const dueCount = useMemo(
    () => gaps.filter((g) => g.status === 'Due' || g.status === 'Due Soon').length,
    [gaps],
  );
  const completedCount = useMemo(
    () => gaps.filter((g) => g.status === 'Completed').length,
    [gaps],
  );

  const visibleGaps = useMemo(
    () => gaps.filter((gap) => gapMatchesFilter(gap, filter)),
    [gaps, filter],
  );

  const goToOrders = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'orders');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const handleAction = useCallback(
    (actionId, gap) => {
      const now = new Date().toISOString();

      if (actionId === 'order') {
        persistOverrides({
          ...overrides,
          [gap.id]: {
            ...(overrides[gap.id] || {}),
            status: 'Ordered',
            lastPerformed: overrides[gap.id]?.lastPerformed ?? gap.lastPerformed,
            documentedAt: now,
            documentedBy: 'Encounter provider',
            notes: gap.orderHint ? `Ordered: ${gap.orderHint}` : 'Ordered from Care Gaps',
          },
        });
        setBanner({
          message: gap.orderHint
            ? `Marked “${gap.name}” as ordered. Place “${gap.orderHint}” on the Orders tab.`
            : `Marked “${gap.name}” as ordered. Continue on the Orders tab.`,
          showOrders: true,
        });
        return;
      }

      if (actionId === 'reset') {
        const next = { ...overrides };
        delete next[gap.id];
        persistOverrides(next);
        setBanner({ message: `Cleared visit documentation for “${gap.name}”.` });
        return;
      }

      const statusMap = {
        complete: 'Completed',
        decline: 'Declined',
        na: 'N/A',
      };
      const status = statusMap[actionId];
      if (!status) return;

      persistOverrides({
        ...overrides,
        [gap.id]: {
          status,
          lastPerformed:
            status === 'Completed' ? now.slice(0, 10) : overrides[gap.id]?.lastPerformed ?? gap.lastPerformed,
          documentedAt: now,
          documentedBy: 'Encounter provider',
          notes:
            status === 'Completed'
              ? 'Documented as completed during this encounter'
              : status === 'Declined'
                ? 'Declined by patient during this encounter'
                : 'Marked not applicable for this patient',
        },
      });
      setBanner({ message: `Updated “${gap.name}” → ${status}.` });
    },
    [overrides, persistOverrides],
  );

  if (chartLoading && !patient) {
    return (
      <ChartTabShell
        eyebrow="Preventive care"
        title="Care Gaps"
        description="Loading preventive care recommendations…"
        loading
        loadingMessage="Loading care gaps…"
      />
    );
  }

  return (
    <ChartTabShell
      eyebrow="Preventive care"
      title="Care Gaps"
      description="Preventive screenings, immunisations, and health maintenance recommended for this patient based on age, sex, and organisational protocols. Document or order due items without leaving the encounter."
      actions={
        openCount > 0 ? (
          <Badge variant="outline" className={cn('border', getStatusSoftClass('Due'))}>
            {openCount} due this visit
          </Badge>
        ) : null
      }
    >
      {banner && (
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="min-w-0 flex-1">{banner.message}</p>
            <div className="flex shrink-0 items-center gap-2">
              {banner.showOrders && (
                <Button type="button" size="sm" onClick={goToOrders}>
                  Open Orders
                </Button>
              )}
              <Button type="button" variant="ghost" size="sm" onClick={() => setBanner(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Needs attention"
          value={openCount}
          subtext="Overdue, due, or due soon"
          icon={AlertTriangle}
          accent={openCount > 0 ? 'warning' : 'success'}
          onClick={() => setFilter('open')}
        />
        <StatCard
          label="Overdue"
          value={overdueCount}
          subtext="Past recommended interval"
          icon={ShieldAlert}
          accent={overdueCount > 0 ? 'danger' : 'muted'}
          onClick={() => setFilter('open')}
        />
        <StatCard
          label="Due / due soon"
          value={dueCount}
          subtext="Address during this visit"
          icon={ClipboardList}
          accent={dueCount > 0 ? 'warning' : 'muted'}
          onClick={() => setFilter('open')}
        />
        <StatCard
          label="Up to date"
          value={completedCount}
          subtext="Within recommended interval"
          icon={CheckCircle2}
          accent="success"
          onClick={() => setFilter('Completed')}
        />
      </div>

      <SectionCard
        title="Preventive care gaps"
        description="Each row is a recommended preventive service. Use actions to order or document without leaving the encounter."
        icon={ShieldCheck}
        accent={openCount > 0 ? 'warning' : 'success'}
        actions={
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <Button
                key={f.id}
                type="button"
                size="sm"
                variant={filter === f.id ? 'default' : 'outline'}
                className="h-8"
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        }
      >
        {visibleGaps.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title={
              filter === 'open'
                ? 'No open care gaps'
                : 'No preventive items in this filter'
            }
            description={
              filter === 'open'
                ? 'All applicable screenings, immunisations, and health maintenance items are up to date or already documented for this visit.'
                : 'Try another filter to review the full preventive care list.'
            }
            action={filter !== 'all' ? () => setFilter('all') : undefined}
            actionLabel={filter !== 'all' ? 'Show all' : undefined}
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="min-w-[220px]">Preventive item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last performed</TableHead>
                  <TableHead>Next due</TableHead>
                  <TableHead className="min-w-[200px]">Why recommended</TableHead>
                  <TableHead className="w-[56px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleGaps.map((gap) => {
                  const CatIcon = CATEGORY_ICON[gap.category] || ShieldCheck;
                  const needsAttention = OPEN_CARE_GAP_STATUSES.has(gap.status);
                  return (
                    <TableRow
                      key={gap.id}
                      className={cn(needsAttention && 'bg-[var(--status-warning-bg)]/25')}
                    >
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium text-foreground">{gap.name}</p>
                          <p className="text-xs text-muted-foreground">{gap.description}</p>
                          {gap.notes && (
                            <p className="text-xs text-muted-foreground italic">{gap.notes}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                          <CatIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                          {gap.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <CareGapStatusBadge status={gap.status} />
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {formatCareGapDate(gap.lastPerformed)}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {formatCareGapDate(gap.nextDue)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {gap.reason}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {needsAttention && gap.orderHint && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 hidden lg:inline-flex"
                              onClick={() => handleAction('order', gap)}
                            >
                              Order
                            </Button>
                          )}
                          <CareGapActionMenu gap={gap} onAction={handleAction} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </ChartTabShell>
  );
}
