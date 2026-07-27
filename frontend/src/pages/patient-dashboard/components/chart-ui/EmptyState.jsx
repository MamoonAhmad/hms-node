import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function EmptyState({ icon: Icon, title, description, action, actionLabel, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center',
        className,
      )}
    >
      {Icon && (
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      )}
      {title && <p className="text-sm font-semibold text-foreground">{title}</p>}
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && actionLabel && (
        <Button variant="outline" size="sm" className="mt-4" onClick={action}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
