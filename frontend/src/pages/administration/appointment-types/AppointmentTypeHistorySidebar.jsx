import { Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function formatUsAuditDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  const time = d.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${month}-${day}-${year} ${time}`;
}

export function AppointmentTypeHistorySidebar({
  open,
  onClose,
  appointmentTypeName,
  history = [],
  isLoading,
}) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/40"
        aria-label="Close appointment type history"
        onClick={onClose}
      />
      <aside
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l bg-card shadow-xl',
          'animate-in slide-in-from-right duration-200',
        )}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 shrink-0 text-primary" />
              <h2 className="text-lg font-semibold">Update History</h2>
            </div>
            {appointmentTypeName && (
              <p className="mt-1 truncate text-sm text-muted-foreground">{appointmentTypeName}</p>
            )}
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading history…</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No update history recorded yet.</p>
          ) : (
            history.map((entry) => (
              <div key={entry.id} className="rounded-lg border bg-muted/20 p-4 space-y-3">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{entry.summary || entry.action}</p>
                  <p className="text-sm text-muted-foreground">
                    Updated by:{' '}
                    <span className="text-foreground">{entry.changedByName || '—'}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Updated on:{' '}
                    <span className="text-foreground">{formatUsAuditDateTime(entry.createdAt)}</span>
                  </p>
                </div>

                {Array.isArray(entry.changes) && entry.changes.length > 0 && (
                  <ul className="space-y-2 text-sm">
                    {entry.changes.map((change) => (
                      <li
                        key={`${entry.id}-${change.field || change.label}`}
                        className="rounded-md border bg-background p-3 space-y-1"
                      >
                        <p className="font-medium text-foreground">{change.label}</p>
                        {entry.action === 'created' ? (
                          <p className="text-muted-foreground">
                            Value:{' '}
                            <span className="text-foreground">
                              {change.to != null ? String(change.to) : '—'}
                            </span>
                          </p>
                        ) : (
                          <>
                            <p className="text-muted-foreground">
                              Previous:{' '}
                              <span className="text-foreground">
                                {change.from != null ? String(change.from) : '—'}
                              </span>
                            </p>
                            <p className="text-muted-foreground">
                              Updated:{' '}
                              <span className="text-foreground">
                                {change.to != null ? String(change.to) : '—'}
                              </span>
                            </p>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
