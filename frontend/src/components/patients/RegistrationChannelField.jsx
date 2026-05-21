import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { REGISTRATION_CHANNEL_OPTIONS } from '@/components/patients/patientRegistrationQueue';

export function RegistrationChannelField({ value, onChange, disabled = false }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">Arrival Mode</Label>
      <div
        role="radiogroup"
        aria-label="Arrival Mode"
        className={cn(
          'flex flex-wrap items-center gap-6',
          disabled && 'pointer-events-none opacity-60',
        )}
      >
        {REGISTRATION_CHANNEL_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground"
          >
            <input
              type="radio"
              name="registrationChannel"
              value={opt.value}
              checked={value === opt.value}
              disabled={disabled}
              className="h-4 w-4 shrink-0 accent-primary"
              onChange={() => onChange(opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {value === 'walk_in'
          ? 'Walk-in patients are registered without a scheduled appointment.'
          : 'Appointment patients are linked to a scheduled outpatient visit.'}
      </p>
    </div>
  );
}
