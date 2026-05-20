import { ChevronLeft, ChevronRight, ClipboardList, FlaskConical, Pill } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePatientChart } from '../PatientChartContext';

export function PatientChartStoryboard({ open, onOpenChange, onNavigateTab }) {
  const { orders, tabCounts } = usePatientChart();

  const recentOrders = orders.slice(0, 4);
  const labPending = orders
    .filter((o) => o.category === 'Lab' && o.status === 'Scheduled')
    .slice(0, 3);

  if (!open) {
    return (
      <div className="hidden shrink-0 border-r border-border bg-card lg:flex lg:flex-col">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="m-2 h-9 w-9"
          onClick={() => onOpenChange?.(true)}
          aria-label="Show storyboard"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card lg:flex">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <p className="text-xs font-semibold text-muted-foreground">At a glance</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onOpenChange?.(false)}
          aria-label="Hide storyboard"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <section className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
            <ClipboardList className="h-3.5 w-3.5" />
            Orders
            {tabCounts.pendingOrders > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {tabCounts.pendingOrders}
              </Badge>
            )}
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
            {recentOrders.length === 0 && <li>None on file</li>}
            {recentOrders.map((o) => (
              <li key={o.id} className="truncate text-foreground">{o.procedureName}</li>
            ))}
          </ul>
          <Button
            variant="link"
            className="mt-2 h-auto p-0 text-xs"
            onClick={() => onNavigateTab?.('orders')}
          >
            View all
          </Button>
        </section>

        <section className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <FlaskConical className="h-3.5 w-3.5" />
            Labs
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
            {labPending.length === 0 && <li>No pending</li>}
            {labPending.map((o) => (
              <li key={o.id} className="truncate">{o.procedureName}</li>
            ))}
          </ul>
          <Button
            variant="link"
            className="mt-2 h-auto p-0 text-xs"
            onClick={() => onNavigateTab?.('results')}
          >
            Review
          </Button>
        </section>

        <section className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <Pill className="h-3.5 w-3.5" />
            Medications
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Open prescriptions for the full list.</p>
          <Button
            variant="link"
            className={cn('mt-1 h-auto p-0 text-xs')}
            onClick={() => onNavigateTab?.('prescriptions')}
          >
            Open Rx
          </Button>
        </section>
      </div>
    </aside>
  );
}
