import { cn } from '@/lib/utils';
import { STATUS_BADGE_CLASSES } from '@/lib/statusColors';

const VARIANT_CLASSES = {
  default: 'border border-transparent bg-primary text-primary-foreground shadow-sm',
  secondary: 'border border-transparent bg-secondary text-secondary-foreground',
  destructive: cn('border', STATUS_BADGE_CLASSES.destructive),
  outline: 'border border-border bg-background text-foreground',
  success: cn('border', STATUS_BADGE_CLASSES.success),
  warning: cn('border', STATUS_BADGE_CLASSES.warning),
  info: cn('border', STATUS_BADGE_CLASSES.info),
  muted: cn('border', STATUS_BADGE_CLASSES.muted),
};

export function Badge({ children, variant = 'default', className, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        VARIANT_CLASSES[variant] || VARIANT_CLASSES.default,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
