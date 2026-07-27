import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export function Field({ label, required, hint, className, children }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-xs font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TextInput({ value, onChange, type = 'text', placeholder, disabled, readOnly, min, max, step }) {
  return (
    <Input
      type={type}
      value={value ?? ''}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(e.target.value)}
      className={cn(readOnly && 'bg-muted/40')}
    />
  );
}

export function TextSelect({ value, onChange, options = [], placeholder = 'Select…', disabled }) {
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function TextTextarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <Textarea
      value={value ?? ''}
      placeholder={placeholder}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function CheckboxField({ checked, onCheckedChange, label, id }) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-2 rounded-md border border-border/80 bg-card px-3 py-2 text-sm hover:bg-muted/40"
    >
      <Checkbox
        id={id}
        checked={Boolean(checked)}
        onCheckedChange={(v) => onCheckedChange(Boolean(v))}
      />
      <span>{label}</span>
    </label>
  );
}

export function MultiSelectChips({ values = [], options = [], onToggle, idPrefix }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = values.includes(opt);
        const id = `${idPrefix}-${opt.replace(/\s+/g, '-').toLowerCase()}`;
        return (
          <label
            key={opt}
            htmlFor={id}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors',
              selected
                ? 'border-primary/40 bg-primary/5 text-foreground'
                : 'border-border bg-card text-muted-foreground hover:bg-muted/40',
            )}
          >
            <Checkbox
              id={id}
              checked={selected}
              onCheckedChange={() => onToggle(opt)}
            />
            {opt}
          </label>
        );
      })}
    </div>
  );
}
