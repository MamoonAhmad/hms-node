import { Clock, X, FilePen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Right-side drawer showing the full version history for a single screening.
 * `records` is the list of completed versions (newest first). `definition`
 * supplies score labelling and a per-payload summary renderer.
 */
export function ScreeningHistoryDrawer({ open, onClose, definition, records = [] }) {
  if (!open) return null;

  const total = records.length;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/40"
        aria-label="Close history"
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
              <h2 className="text-lg font-semibold">Screening History</h2>
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground">{definition?.name}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
          {total === 0 ? (
            <p className="text-sm text-muted-foreground">No completed versions yet.</p>
          ) : (
            records.map((r, idx) => {
              const version = total - idx;
              const isEdited = r.updatedAt && r.updatedAt !== r.createdAt;
              const result = r.payload?.result;
              return (
                <div key={r.id} className="rounded-lg border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-medium text-foreground">
                      {isEdited && <FilePen className="h-4 w-4 text-amber-600" />}
                      Version {version}
                      {idx === 0 && <Badge variant="secondary" className="text-[10px]">Current</Badge>}
                    </span>
                    <span className="text-lg font-semibold text-primary">
                      {r.score ?? '—'}
                    </span>
                  </div>

                  {result?.label && (
                    <div>
                      <Badge variant={result.variant || 'secondary'}>{result.label}</Badge>
                      {result.interpretation && (
                        <p className="mt-1 text-xs text-muted-foreground">{result.interpretation}</p>
                      )}
                    </div>
                  )}

                  <dl className="grid grid-cols-1 gap-1 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Completed</dt>
                      <dd className="text-right text-foreground">{formatDateTime(r.createdAt)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Completed by</dt>
                      <dd className="text-right text-foreground">{r.createdByName || '—'}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Last updated</dt>
                      <dd className="text-right text-foreground">{formatDateTime(r.updatedAt || r.createdAt)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Updated by</dt>
                      <dd className="text-right text-foreground">{r.updatedByName || r.createdByName || '—'}</dd>
                    </div>
                  </dl>

                  {definition?.renderHistory && (
                    <div className="rounded-md border bg-background p-3 text-sm">
                      {definition.renderHistory(r.payload || {})}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
