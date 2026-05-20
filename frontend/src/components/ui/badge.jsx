import { cn } from '@/lib/utils';

export function Badge({ children, variant = 'default', className, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold transition-colors',
        variant === 'default' && 'border border-transparent bg-primary text-primary-foreground',
        variant === 'secondary' && 'border border-transparent bg-secondary text-secondary-foreground',
        variant === 'destructive' && 'border border-transparent bg-destructive text-destructive-foreground',
        variant === 'outline' && 'border border-input bg-background text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}


