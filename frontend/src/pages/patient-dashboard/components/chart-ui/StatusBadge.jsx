import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { resolveStatusVariant, STATUS_BADGE_CLASSES } from './chartStatusUtils';

export function StatusBadge({ status, className, children }) {
  const label = children ?? status;
  if (!label) return null;

  const variant = resolveStatusVariant(status ?? label);
  const badgeVariant =
    variant === 'destructive'
      ? 'destructive'
      : variant === 'outline'
        ? 'outline'
        : variant;

  return (
    <Badge
      variant={badgeVariant}
      className={cn(
        'font-medium capitalize',
        variant === 'outline' ? STATUS_BADGE_CLASSES.muted : '',
        className,
      )}
    >
      {label}
    </Badge>
  );
}
