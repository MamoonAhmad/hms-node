import { Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function WaitlistEventsSidebar({ open, onClose, events = [], isLoading, title }) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/40"
        aria-label="Close waitlist history"
        onClick={onClose}
      />
      <aside
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l bg-card shadow-xl',
          'animate-in slide-in-from-right duration-200',
        )}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Waitlist history</h2>
              {title && <p className="text-xs text-muted-foreground">{title}</p>}
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading history…</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          ) : (
            events.map((entry) => (
              <div key={entry.id} className="rounded-lg border bg-muted/20 p-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-foreground">{entry.summary || entry.action}</p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(entry.createdAt)}
                  </span>
                </div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{entry.action}</p>
                {(entry.createdByName || entry.createdBy) && (
                  <p className="text-sm text-muted-foreground">
                    By{' '}
                    <span className="text-foreground">{entry.createdByName || entry.createdBy}</span>
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
