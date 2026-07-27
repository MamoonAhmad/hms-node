import { Clock, X, FilePen } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
 * Right-side drawer showing the amendment/version history for an intake record.
 * `renderPayload` receives a payload object and returns a react node summarising it.
 */
export function IntakeHistoryDrawer({
  open,
  onClose,
  title = 'History',
  subtitle,
  record,
  renderPayload,
}) {
  if (!open || !record) return null;

  const addendums = record.addendums || [];
  const versions = [
    {
      key: 'original',
      label: 'Original Entry',
      at: record.createdAt,
      by: record.createdByName,
      notes: record.notes,
      payload: addendums.length === 0 ? record.payload : null,
    },
    ...addendums.map((a, i) => ({
      key: a.id || `addendum-${i}`,
      label: `Amendment ${i + 1}`,
      at: a.createdAt,
      by: a.createdByName,
      notes: a.notes,
      payload: a.payload,
    })),
  ];

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
              <h2 className="text-lg font-semibold">{title}</h2>
            </div>
            {subtitle && <p className="mt-1 truncate text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
          {versions.map((v, idx) => (
            <div key={v.key} className="rounded-lg border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  {idx > 0 && <FilePen className="h-4 w-4 text-amber-600" />}
                  {v.label}
                </span>
                <span className="text-xs text-muted-foreground">{formatDateTime(v.at)}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                By: <span className="text-foreground">{v.by || '—'}</span>
              </p>
              {v.payload && renderPayload && (
                <div className="rounded-md border bg-background p-3 text-sm">
                  {renderPayload(v.payload)}
                </div>
              )}
              {v.notes && (
                <p className="text-sm text-muted-foreground">
                  Notes: <span className="text-foreground">{v.notes}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
