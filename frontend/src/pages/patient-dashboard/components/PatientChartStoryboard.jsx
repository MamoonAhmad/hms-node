import { ChevronLeft, ChevronRight, ClipboardList, FlaskConical, Pill } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './chart-ui';
import { cn } from '@/lib/utils';
import { usePatientChart } from '../PatientChartContext';

function StoryboardSection({ icon: Icon, title, count, children, onViewAll, viewLabel = 'View all' }) {
  return (
    <section className="rounded-xl border border-border/80 bg-gradient-to-br from-card to-muted/20 p-3.5 shadow-sm">
      <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
          <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
        </span>
        {title}
        {count > 0 && (
          <Badge variant="warning" className="h-5 px-1.5 text-[10px]">
            {count}
          </Badge>
        )}
      </p>
      <div className="mt-2.5">{children}</div>
      {onViewAll && (
        <Button
          variant="link"
          className="mt-2 h-auto p-0 text-xs font-semibold"
          onClick={onViewAll}
        >
          {viewLabel}
        </Button>
      )}
    </section>
  );
}

export function PatientChartStoryboard({ open, onOpenChange, onNavigateTab }) {
  const { orders, tabCounts } = usePatientChart();

  const openStatuses = new Set(['Scheduled', 'Pending', 'In Progress']);
  const recentOrders = orders.filter((o) => openStatuses.has(o.status)).slice(0, 4);
  const labPending = orders
    .filter(
      (o) =>
        (o.category === 'Lab' || o.category === 'Radiology') &&
        openStatuses.has(o.status),
    )
    .slice(0, 3);

  if (!open) {
    return (
      <div className="hidden shrink-0 border-r border-border bg-card lg:flex lg:flex-col">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="m-2 h-9 w-9 rounded-lg"
          onClick={() => onOpenChange?.(true)}
          aria-label="Show storyboard"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card/95 lg:flex">
      <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">At a glance</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg"
          onClick={() => onOpenChange?.(false)}
          aria-label="Hide storyboard"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <StoryboardSection
          icon={ClipboardList}
          title="Orders"
          count={tabCounts.pendingOrders}
          onViewAll={() => onNavigateTab?.('orders')}
        >
          <ul className="space-y-2 text-xs">
            {recentOrders.length === 0 && (
              <li className="text-muted-foreground">None on file</li>
            )}
            {recentOrders.map((o) => (
              <li key={o.id} className="flex items-start justify-between gap-2">
                <span className="truncate font-medium text-foreground">{o.procedureName}</span>
                {o.status && <StatusBadge status={o.status} className="shrink-0 text-[10px]" />}
              </li>
            ))}
          </ul>
        </StoryboardSection>

        <StoryboardSection
          icon={FlaskConical}
          title="Labs"
          onViewAll={() => onNavigateTab?.('results')}
          viewLabel="Review results"
        >
          <ul className="space-y-2 text-xs">
            {labPending.length === 0 && (
              <li className="text-muted-foreground">No pending labs</li>
            )}
            {labPending.map((o) => (
              <li key={o.id} className="truncate font-medium text-foreground">
                {o.procedureName}
              </li>
            ))}
          </ul>
        </StoryboardSection>

        <StoryboardSection
          icon={Pill}
          title="Medications"
          count={tabCounts.pendingEmar}
        >
          <p className="text-xs leading-relaxed text-muted-foreground">
            Clinic and sample medications appear in eMAR after signing.
          </p>
          <div className="mt-2 flex flex-col items-start gap-1">
            <Button
              variant="link"
              className={cn('h-auto p-0 text-xs font-semibold')}
              onClick={() => onNavigateTab?.('emar')}
            >
              Open eMAR
            </Button>
            <Button
              variant="link"
              className={cn('h-auto p-0 text-xs font-semibold')}
              onClick={() => onNavigateTab?.('medications')}
            >
              Order medications
            </Button>
          </div>
        </StoryboardSection>
      </div>
    </aside>
  );
}
