import { cn } from '@/lib/utils';
import { NURSING_STATUS_STYLE } from './nurseTrackingBoardConstants';

const SUMMARY_ITEMS = [
  {
    key: 'total',
    countKey: 'total',
    label: 'Total patients',
    shortLabel: 'All on board',
    tabId: 'all',
  },
  {
    key: 'vitalsPending',
    countKey: 'vitalsPending',
    label: 'Vitals pending',
    shortLabel: 'Awaiting vitals',
    tabId: 'vitals-pending',
    status: 'Vitals Pending',
  },
  {
    key: 'readyForProvider',
    countKey: 'readyForProvider',
    label: 'Ready for provider',
    shortLabel: 'Ready to be seen',
    tabId: 'ready-for-provider',
    status: 'Ready for Provider',
  },
  {
    key: 'withProvider',
    countKey: 'withProvider',
    label: 'With provider',
    shortLabel: 'In visit',
    tabId: null,
    status: 'With Provider',
  },
  {
    key: 'discharged',
    countKey: 'discharged',
    label: 'Discharged',
    shortLabel: 'Cleanup / departed',
    tabId: 'completed',
    status: 'Discharged/Cleanup',
  },
];

function StatCard({ item, count, activeTab, onSelectTab }) {
  const style = item.status ? NURSING_STATUS_STYLE[item.status] : null;
  const isActive = item.tabId != null && activeTab === item.tabId;
  const isClickable = item.tabId != null;

  return (
    <button
      type="button"
      disabled={!isClickable}
      onClick={() => isClickable && onSelectTab(item.tabId)}
      className={cn(
        'relative flex min-w-0 flex-col rounded-lg border bg-card p-4 text-left shadow-sm transition-colors',
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
          item.key === 'total' ? 'bg-primary' : style?.stripe ?? 'bg-muted-foreground',
        )}
        aria-hidden
      />
      <div className="pl-3">
        <p
          className={cn(
            'text-2xl font-bold tabular-nums tracking-tight',
            item.key === 'total' ? 'text-foreground' : 'text-foreground',
          )}
        >
          {count}
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">{item.label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{item.shortLabel}</p>
      </div>
    </button>
  );
}

export function TrackingBoardStatusSummary({ statusCounts, activeTab, onSelectTab }) {
  return (
    <section
      aria-label="Patient status summary"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
    >
      {SUMMARY_ITEMS.map((item) => (
        <StatCard
          key={item.key}
          item={item}
          count={statusCounts[item.countKey] ?? 0}
          activeTab={activeTab}
          onSelectTab={onSelectTab}
        />
      ))}
    </section>
  );
}
