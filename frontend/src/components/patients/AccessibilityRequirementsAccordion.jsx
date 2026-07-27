import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ACCESSIBILITY_REQUIREMENT_GROUPS,
} from '@/components/patients/patientRegistrationConstants';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function AccessibilityRequirementsAccordion({
  selected = [],
  notes = '',
  onChangeSelected,
  onChangeNotes,
  disabled = false,
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const selectedSet = new Set(selected);
  const selectedCount = selected.length;

  const toggle = (value) => {
    if (disabled) return;
    const next = new Set(selectedSet);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChangeSelected?.([...next]);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 bg-primary px-5 py-4 text-left text-primary-foreground transition-colors hover:bg-[var(--primary-hover)]"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary-foreground">Accessibility requirements</p>
          <p className="mt-0.5 text-xs text-primary-foreground/80">
            {selectedCount > 0
              ? `${selectedCount} accommodation${selectedCount === 1 ? '' : 's'} selected · select all that apply`
              : 'Optional accommodations — use checkboxes to select all that apply'}
          </p>
        </div>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-primary-foreground transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="space-y-8 px-5 py-6">
          {ACCESSIBILITY_REQUIREMENT_GROUPS.map((group) => (
            <div key={group.id} className="space-y-4">
              <div className="border-b border-border/50 pb-2">
                <p className="text-sm font-semibold text-foreground">{group.label}</p>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {group.options.map((opt) => {
                  const isChecked = selectedSet.has(opt.value);
                  return (
                    <label
                      key={opt.value}
                      htmlFor={`accessibility-${opt.value}`}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 text-sm leading-snug transition-colors',
                        isChecked
                          ? 'border-primary/30 bg-primary/[0.06] text-foreground'
                          : 'border-border/60 bg-muted/15 text-foreground hover:bg-muted/40',
                        disabled && 'cursor-not-allowed opacity-60',
                      )}
                    >
                      <input
                        type="checkbox"
                        id={`accessibility-${opt.value}`}
                        checked={isChecked}
                        onChange={() => toggle(opt.value)}
                        disabled={disabled}
                        className="mt-0.5 size-4 shrink-0 cursor-pointer rounded-[4px] border-2 border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed"
                      />
                      <span className="font-medium">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="space-y-2 border-t border-border/60 pt-6">
            <Label htmlFor="accessibilityRequirementsNotes" className="text-sm font-semibold text-foreground">
              Additional notes
            </Label>
            <Textarea
              id="accessibilityRequirementsNotes"
              value={notes}
              onChange={(e) => onChangeNotes?.(e.target.value)}
              rows={3}
              disabled={disabled}
              placeholder="Any other accessibility or accommodation details"
              className="min-h-[5.5rem]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
