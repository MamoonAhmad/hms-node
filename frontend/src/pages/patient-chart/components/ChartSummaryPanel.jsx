import {
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  PanelRightClose,
  PanelRightOpen,
  Stethoscope,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/pages/patient-dashboard/components/chart-ui';
import { formatDate, isHighSeverity } from '../patientChartHelpers';

function PanelBlock({ icon: Icon, title, count, children, onOpen }) {
  return (
    <section className="rounded-xl border border-border bg-background p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
        {count != null && (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-muted-foreground">
            {count}
          </span>
        )}
        {onOpen && (
          <button
            type="button"
            onClick={onOpen}
            className="ml-auto text-xs font-medium text-primary hover:underline"
          >
            View
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

export function ChartSummaryPanel({ summary, orders, collapsed, onToggle, onOpenSection }) {
  const allergies = summary?.allergies || [];
  const nkda = summary?.noKnownDrugAllergies;
  const problems = (summary?.problems || []).filter((p) => (p.status || '').toLowerCase() !== 'resolved');
  const upcoming = summary?.upcomingVisit;
  const openOrders = (orders || []).filter(
    (o) => !['Completed', 'Cancelled', 'Resulted'].includes(o.status),
  );

  if (collapsed) {
    return (
      <div className="hidden shrink-0 border-l border-border bg-card xl:flex xl:flex-col">
        <Button
          variant="ghost"
          size="icon"
          className="m-3 h-9 w-9"
          onClick={onToggle}
          aria-label="Expand summary panel"
        >
          <PanelRightOpen className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Patient summary"
      className="hidden w-80 shrink-0 overflow-y-auto border-l border-border bg-muted/20 xl:block"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">At a glance</p>
          <p className="text-sm font-semibold text-foreground">Clinical summary</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggle} aria-label="Collapse summary panel">
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3 p-4">
        <PanelBlock
          icon={AlertTriangle}
          title="Allergies"
          count={nkda ? 0 : allergies.length}
          onOpen={() => onOpenSection('allergies')}
        >
          {nkda ? (
            <StatusBadge status="Verified">NKDA</StatusBadge>
          ) : allergies.length ? (
            <ul className="space-y-2">
              {allergies.slice(0, 4).map((a) => (
                <li key={a.id || a.allergenName} className="flex items-start gap-2 text-sm">
                  <span
                    className={cn(
                      'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                      isHighSeverity(a.severity) ? 'bg-red-500' : 'bg-amber-500',
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{a.allergenName}</span>
                    {a.severity && <span className="text-xs text-muted-foreground">{a.severity}</span>}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Not documented</p>
          )}
        </PanelBlock>

        <PanelBlock
          icon={Stethoscope}
          title="Active Problems"
          count={problems.length}
          onOpen={() => onOpenSection('problems')}
        >
          {problems.length ? (
            <ul className="space-y-2">
              {problems.slice(0, 5).map((p) => (
                <li key={p.id} className="text-sm">
                  <span className="font-mono text-xs text-muted-foreground">
                    {p.icd10Code || p.problemCode || '—'}
                  </span>
                  <p className="truncate font-medium">
                    {p.diagnosisDescription || p.problemDescription}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No active problems</p>
          )}
        </PanelBlock>

        <PanelBlock icon={CalendarClock} title="Upcoming" onOpen={() => onOpenSection('appointments')}>
          {upcoming ? (
            <div className="space-y-1 text-sm">
              <p className="font-medium">
                {formatDate(upcoming.appointmentDate)} {upcoming.appointmentTime || ''}
              </p>
              <p className="text-muted-foreground">
                {upcoming.visitType || 'Visit'} · {upcoming.providerName || 'Provider TBD'}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">None scheduled</p>
          )}
        </PanelBlock>

        <PanelBlock
          icon={ClipboardList}
          title="Open Orders"
          count={openOrders.length}
          onOpen={() => onOpenSection('orders')}
        >
          {openOrders.length ? (
            <ul className="space-y-2">
              {openOrders.slice(0, 5).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{o.procedureName || o.orderName}</span>
                  <StatusBadge status={o.status} className="shrink-0 text-[10px]" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No outstanding orders</p>
          )}
        </PanelBlock>
      </div>
    </aside>
  );
}
