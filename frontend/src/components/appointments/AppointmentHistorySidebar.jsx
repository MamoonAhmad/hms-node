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

export function AppointmentHistorySidebar({ open, onClose, history = [], isLoading }) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/40"
        aria-label="Close appointment history"
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
            <h2 className="text-lg font-semibold">Appointment History</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading history…</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history recorded yet.</p>
          ) : (
            history.map((entry) => (
              <div key={entry.id} className="rounded-lg border bg-muted/20 p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-foreground">{entry.summary || entry.action}</p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(entry.createdAt)}
                  </span>
                </div>

                {entry.action === 'created' && Array.isArray(entry.changes) && (
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {entry.changes.map((change) => (
                      <li key={`${entry.id}-${change.label}`}>
                        <span className="font-medium text-foreground">{change.label}:</span>{' '}
                        {change.to != null ? String(change.to) : '—'}
                      </li>
                    ))}
                  </ul>
                )}

                {entry.action === 'updated' && (
                  <>
                    {(entry.changedByName || entry.changedBy) && (
                      <p className="text-sm text-muted-foreground">
                        Updated by:{' '}
                        <span className="text-foreground">{entry.changedByName || entry.changedBy}</span>
                      </p>
                    )}
                    {Array.isArray(entry.changes) && entry.changes.length > 0 && (
                      <ul className="space-y-1 text-sm">
                        {entry.changes.map((change) => (
                          <li key={`${entry.id}-${change.field}`} className="text-muted-foreground">
                            <span className="font-medium text-foreground">{change.label}</span>
                            {change.from != null && (
                              <>
                                {' '}
                                from <span className="text-foreground">{String(change.from)}</span>
                              </>
                            )}
                            {change.to != null && (
                              <>
                                {' '}
                                to <span className="text-foreground">{String(change.to)}</span>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}

                {['cancelled', 'no_show', 'rescheduled', 'rescheduled_from'].includes(
                  entry.action,
                ) && (
                  <>
                    {(entry.changedByName || entry.changedBy) && (
                      <p className="text-sm text-muted-foreground">
                        By:{' '}
                        <span className="text-foreground">
                          {entry.changedByName || entry.changedBy}
                        </span>
                      </p>
                    )}
                    {Array.isArray(entry.changes) && entry.changes.length > 0 && (
                      <ul className="space-y-1 text-sm">
                        {entry.changes.map((change) => (
                          <li key={`${entry.id}-${change.field}`} className="text-muted-foreground">
                            <span className="font-medium text-foreground">{change.label}</span>
                            {change.from != null && (
                              <>
                                {' '}
                                from <span className="text-foreground">{String(change.from)}</span>
                              </>
                            )}
                            {change.to != null && (
                              <>
                                {' '}
                                to <span className="text-foreground">{String(change.to)}</span>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
