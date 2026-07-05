import { cn } from '@/lib/utils';
import { TRACKING_INDICATORS } from './nurseTrackingBoardConstants';

function StatCard({ item, count, activeIndicator, onSelectIndicator }) {
  const isTotal = item.key === 'total';
  const isActive = isTotal ? !activeIndicator : activeIndicator === item.filterKey;
  const isClickable = isTotal || item.filterKey != null;

  return (
    <button
      type="button"
      disabled={!isClickable}
      onClick={() => {
        if (isTotal) onSelectIndicator(null);
        else if (item.filterKey != null) {
          onSelectIndicator(activeIndicator === item.filterKey ? null : item.filterKey);
        }
      }}
      className={cn(
        'relative flex min-w-0 flex-col rounded-lg border bg-card p-3 text-left shadow-sm transition-colors sm:p-4',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isClickable && 'cursor-pointer hover:bg-muted/40',
        !isClickable && 'cursor-default',
        isActive && 'border-primary/40 bg-primary/5 ring-1 ring-primary/20',
        !isActive && 'border-border',
      )}
    >
      <span
        className={cn(
          'absolute left-0 top-3 bottom-3 w-1 rounded-full',
          item.key === 'total' ? 'bg-primary' : 'bg-muted-foreground',
        )}
        aria-hidden
      />
      <div className="pl-3">
        <p className="text-xl font-bold tabular-nums tracking-tight sm:text-2xl">{count}</p>
        <p className="mt-1 text-xs font-medium text-foreground sm:text-sm">{item.label}</p>
      </div>
    </button>
  );
}

export function TrackingBoardStatusSummary({ indicators, activeIndicator, onSelectIndicator }) {
  return (
    <section
      aria-label="Patient status summary"
      className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8"
    >
      {TRACKING_INDICATORS.map((item) => (
        <StatCard
          key={item.key}
          item={item}
          count={indicators?.[item.countKey] ?? 0}
          activeIndicator={activeIndicator}
          onSelectIndicator={onSelectIndicator}
        />
      ))}
    </section>
  );
}
