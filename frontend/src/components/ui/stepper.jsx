import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Horizontal numbered stepper. Completed steps show a check.
 * Click is allowed for the current step and any earlier step.
 */
export function Stepper({ steps, currentStep, onStepClick, maxClickableStep, className }) {
  const maxClick = maxClickableStep ?? currentStep;
  return (
    <nav aria-label="Form steps" className={cn('w-full', className)}>
      <ol className="flex items-start gap-0">
        {steps.map((step, index) => {
          const isCurrent = index === currentStep;
          const isComplete = index < currentStep;
          const clickable = typeof onStepClick === 'function' && index <= maxClick;

          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-start">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick(index)}
                className={cn(
                  'flex w-full min-w-0 flex-col items-center gap-1.5 px-0.5 text-center',
                  clickable ? 'cursor-pointer' : 'cursor-default',
                )}
              >
                <span className="flex w-full items-center">
                  <span
                    className={cn(
                      'h-px flex-1',
                      index === 0 ? 'bg-transparent' : isComplete || isCurrent ? 'bg-primary' : 'bg-border',
                    )}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                      isCurrent && 'border-primary bg-primary text-primary-foreground',
                      isComplete && 'border-primary bg-primary text-primary-foreground',
                      !isCurrent && !isComplete && 'border-border bg-card text-muted-foreground',
                    )}
                  >
                    {isComplete ? <Check className="size-3.5" strokeWidth={2.5} /> : index + 1}
                  </span>
                  <span
                    className={cn(
                      'h-px flex-1',
                      index === steps.length - 1
                        ? 'bg-transparent'
                        : isComplete
                          ? 'bg-primary'
                          : 'bg-border',
                    )}
                    aria-hidden
                  />
                </span>
                <span
                  className={cn(
                    'w-full truncate text-[11px] font-medium leading-tight',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
