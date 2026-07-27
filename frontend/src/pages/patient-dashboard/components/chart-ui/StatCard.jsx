import { cn } from '@/lib/utils';

const ACCENT_STYLES = {
  default: 'border-border bg-card',
  info: 'border-[var(--status-info-border)] bg-[var(--status-info-bg)]/60',
  success: 'border-[var(--status-success-border)] bg-[var(--status-success-bg)]/60',
  warning: 'border-[var(--status-warning-border)] bg-[var(--status-warning-bg)]/60',
  danger: 'border-[var(--status-danger-border)] bg-[var(--status-danger-bg)]/60',
  muted: 'border-border bg-muted/40',
};

const ICON_STYLES = {
  default: 'bg-primary/10 text-primary',
  info: 'bg-[var(--status-info-bg)] text-[var(--status-info-fg)]',
  success: 'bg-[var(--status-success-bg)] text-[var(--status-success-fg)]',
  warning: 'bg-[var(--status-warning-bg)] text-[var(--status-warning-fg)]',
  danger: 'bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)]',
  muted: 'bg-muted text-muted-foreground',
};

export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  accent = 'default',
  onClick,
  className,
}) {
  const Comp = onClick ? 'button' : 'div';

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'group flex min-w-0 flex-col gap-3 rounded-xl border p-4 text-left shadow-sm transition-all',
        ACCENT_STYLES[accent] || ACCENT_STYLES.default,
        onClick && 'cursor-pointer hover:shadow-md hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        {Icon && (
          <span
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              ICON_STYLES[accent] || ICON_STYLES.default,
            )}
            aria-hidden
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">{value ?? '—'}</p>
        {subtext && <p className="mt-0.5 text-xs text-muted-foreground">{subtext}</p>}
      </div>
    </Comp>
  );
}
