import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ChartTabShell({
  eyebrow = 'Chart',
  title,
  description,
  actions,
  children,
  loading = false,
  loadingMessage = 'Loading…',
  error,
  onRetry,
  className,
}) {
  return (
    <div className={cn('chart-tab space-y-6', className)}>
      <div className="chart-tab-header flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-wider text-primary/80">{eyebrow}</p>
          )}
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h2>
          {description && (
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2.5 rounded-xl border border-border bg-card py-16 text-muted-foreground shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
          <span className="text-sm font-medium">{loadingMessage}</span>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 shadow-sm">
          <p className="text-sm font-medium text-destructive">{error}</p>
          {onRetry && (
            <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
              Retry
            </Button>
          )}
        </div>
      )}

      {!loading && !error && children}
    </div>
  );
}
