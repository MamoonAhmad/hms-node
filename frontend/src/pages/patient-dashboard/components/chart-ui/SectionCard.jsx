import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ACCENT_BORDER = {
  default: '',
  info: 'border-l-4 border-l-blue-500',
  success: 'border-l-4 border-l-green-500',
  warning: 'border-l-4 border-l-amber-500',
  danger: 'border-l-4 border-l-red-500',
  primary: 'border-l-4 border-l-primary',
};

export function SectionCard({
  title,
  description,
  icon: Icon,
  accent = 'default',
  actions,
  children,
  className,
  contentClassName,
  id,
}) {
  return (
    <Card
      id={id}
      className={cn('chart-section-card', id && 'scroll-mt-4', ACCENT_BORDER[accent], className)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              {Icon && <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />}
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {actions && <CardAction>{actions}</CardAction>}
        </div>
      </CardHeader>
      <CardContent className={cn('space-y-4', contentClassName)}>{children}</CardContent>
    </Card>
  );
}
