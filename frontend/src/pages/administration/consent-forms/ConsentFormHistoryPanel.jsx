import { History, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  formatHistoryAction,
  formatHistoryTimestamp,
  getConsentFormHistoryTimeline,
} from '@/pages/administration/consent-forms/consentFormHistory';
import { cn } from '@/lib/utils';

export function ConsentFormHistoryPanel({ record, open, onClose }) {
  const timeline = getConsentFormHistoryTimeline(record);

  if (!open || !record) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close history"
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
      />
      <aside
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-2xl',
          'animate-in slide-in-from-right duration-200',
        )}
        role="dialog"
        aria-labelledby="consent-history-title"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-primary">
              <History className="h-5 w-5 shrink-0" />
              <h2 id="consent-history-title" className="text-lg font-semibold text-foreground">
                Form history
              </h2>
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground">{record.consentTitle}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history recorded for this form.</p>
          ) : (
            <ol className="relative space-y-0 border-l border-border pl-6">
              {timeline.map((entry, index) => (
                <li key={entry.id || `${entry.at}-${index}`} className="relative pb-8 last:pb-0">
                  <span className="absolute -left-[25px] top-1 flex h-3 w-3 rounded-full border-2 border-background bg-primary ring-2 ring-primary/20" />
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={entry.action === 'created' ? 'default' : 'secondary'}>
                        {formatHistoryAction(entry.action)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatHistoryTimestamp(entry.at)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{entry.user || 'System'}</p>

                    {entry.changes?.length > 0 ? (
                      <ul className="space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                        {entry.changes.map((change) => (
                          <li key={`${change.field}-${change.label}`} className="space-y-1">
                            <p className="font-medium text-foreground">{change.label}</p>
                            <div className="grid gap-1 text-xs">
                              <p className="text-muted-foreground">
                                <span className="font-medium text-foreground/80">From:</span>{' '}
                                {change.from}
                              </p>
                              <p className="text-foreground">
                                <span className="font-medium">To:</span> {change.to}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : entry.action === 'created' ? (
                      <p className="text-sm text-muted-foreground">Initial template created.</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </aside>
    </>
  );
}
