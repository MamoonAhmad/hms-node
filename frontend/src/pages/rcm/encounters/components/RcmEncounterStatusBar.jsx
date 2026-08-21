import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRcmEncounter } from '../RcmEncounterContext';
import { BILLING_STATUS_FLOW } from '../rcmEncounterConstants';

export function RcmEncounterStatusBar() {
  const { encounter, updateBillingStatus, saving } = useRcmEncounter();
  if (!encounter) return null;

  const flow = encounter.billingStatusFlow?.length
    ? encounter.billingStatusFlow
    : BILLING_STATUS_FLOW;
  const currentIndex = flow.indexOf(encounter.billingStatus);

  const advance = async () => {
    if (currentIndex < 0 || currentIndex >= flow.length - 1) return;
    const next = flow[currentIndex + 1];
    // Skip mutually exclusive terminal-ish branches when advancing linearly
    if (encounter.billingStatus === 'Submitted' && next === 'Denied') {
      await updateBillingStatus('Paid');
      return;
    }
    await updateBillingStatus(next);
  };

  return (
    <div
      className="border-b border-border bg-accent/30 px-4 py-2.5 sm:px-5"
      role="region"
      aria-label="Billing status"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1">
          {flow.map((step, i) => (
            <span
              key={step}
              className={cn(
                'rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
                i <= currentIndex
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground ring-1 ring-border',
              )}
            >
              {step}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={saving || encounter.billingStatus === 'Coding'}
            onClick={() => updateBillingStatus('Coding')}
          >
            Start coding
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={saving || encounter.billingStatus === 'Ready to submit'}
            onClick={() => updateBillingStatus('Ready to submit')}
          >
            Mark ready
          </Button>
          <Button
            size="sm"
            disabled={saving || encounter.billingStatus === 'Submitted'}
            onClick={() => updateBillingStatus('Submitted')}
          >
            Mark submitted
          </Button>
          <Button size="sm" variant="secondary" disabled={saving} onClick={advance}>
            Advance
          </Button>
        </div>
      </div>
    </div>
  );
}
