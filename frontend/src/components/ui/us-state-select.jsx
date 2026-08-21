import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { resolveUsStateCode, US_STATES } from '@/lib/usStates';

export function UsStateSelect({
  id,
  value,
  onChange,
  disabled,
  placeholder = 'Select state',
  className,
  error,
}) {
  const resolved = resolveUsStateCode(value);
  const known = US_STATES.some((s) => s.code === resolved);

  return (
    <Select
      value={known ? resolved : ''}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        className={`w-full ${error ? 'border-destructive' : ''} ${className || ''}`}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {US_STATES.map((state) => (
          <SelectItem key={state.code} value={state.code}>
            {state.code} — {state.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
