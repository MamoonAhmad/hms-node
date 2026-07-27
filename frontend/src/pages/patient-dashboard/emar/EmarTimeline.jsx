import { cn } from '@/lib/utils';
import { TIMELINE_EVENT_LABELS } from './emarConstants';

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

const EVENT_COLORS = {
  medication_ordered: 'border-[var(--status-info-border)] status-soft-info',
  medication_administered: 'border-[var(--status-success-border)] status-soft-success',
  medication_held: 'border-[var(--status-warning-border)] status-soft-warning',
  medication_refused: 'border-[var(--status-danger-border)] status-soft-danger',
  medication_missed: 'border-[var(--status-danger-border)] status-soft-danger',
  medication_discontinued: 'border-[var(--status-muted-border)] status-soft-muted',
  medication_completed: 'border-[var(--status-success-border)] status-soft-success',
};

export function EmarTimeline({ events, loading }) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading timeline…</p>;
  }

  if (!events?.length) {
    return <p className="text-sm text-muted-foreground">No medication events recorded yet.</p>;
  }

  return (
    <div className="space-y-3">
      {events.map((event, idx) => (
        <div
          key={`${event.type}-${event.timestamp}-${idx}`}
          className={cn(
            'rounded-lg border-l-4 px-4 py-3',
            EVENT_COLORS[event.type] || 'border-[var(--status-muted-border)] status-soft-muted',
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">
                {TIMELINE_EVENT_LABELS[event.type] || event.type}
              </p>
              {event.medicationName && (
                <p className="text-sm text-muted-foreground">{event.medicationName}</p>
              )}
              {event.details && (
                <p className="mt-1 text-xs text-muted-foreground">{event.details}</p>
              )}
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <div>{formatDateTime(event.timestamp)}</div>
              {event.user && <div>{event.user}</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
