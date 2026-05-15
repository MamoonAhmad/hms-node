import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

/** Title-case words for dropdown display (e.g. "john doe" → "John Doe"). Preserves numbers, punctuation-only tokens, and short ALL-CAPS tokens (e.g. CMS). */
function formatDropdownLabel(text) {
  if (text == null || text === '') return '';
  return String(text)
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (!word) return word;
      if (!/[a-zA-Z]/.test(word)) return word;
      if (/^[A-Z]{2,6}$/.test(word)) return word;
      if (/\d/.test(word) && /[()]/.test(word)) return word;
      return word.split('/').map((part) => {
        if (!part.length) return part;
        if (!/[a-zA-Z]/.test(part)) return part;
        if (/^[A-Z]{2,6}$/.test(part)) return part;
        if (/^\d/.test(part)) return part;
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      }).join('/');
    })
    .join(' ');
}

function normalizeSelectOption(o) {
  const value = typeof o === 'string' ? o : String(o.value ?? o);
  const rawLabel = typeof o === 'string' ? o : String(o.label ?? o.value ?? '');
  return { value, label: rawLabel, displayLabel: formatDropdownLabel(rawLabel) };
}

function sortOptionsAZWithOtherLast(options) {
  const normalized = (options || []).map(normalizeSelectOption);

  const isOther = (o) => {
    const t = String(o.label).trim().toLowerCase();
    return t === 'other' || t === 'others';
  };

  const others = normalized.filter((o) => isOther(o));
  const rest = normalized.filter((o) => !isOther(o));

  rest.sort((a, b) =>
    String(a.displayLabel).localeCompare(String(b.displayLabel), undefined, { sensitivity: 'base' })
  );
  return [...rest, ...others];
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Select',
  disabled = false,
  className,
  triggerClassName,
}) {
  const [query, setQuery] = useState('');

  const normalizedOptions = useMemo(
    () => sortOptionsAZWithOtherLast(options || []),
    [options]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter((o) => {
      const hay = `${o.label} ${o.displayLabel}`.toLowerCase();
      return hay.includes(q);
    });
  }, [normalizedOptions, query]);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={cn('w-full', triggerClassName, className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <div className="p-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="h-8"
            onKeyDown={(e) => e.stopPropagation()}
            disabled={disabled}
          />
        </div>
        {filtered.length === 0 ? (
          <div className="px-2 py-2 text-sm text-muted-foreground">No matches</div>
        ) : (
          filtered.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.displayLabel}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

export const POLICY_TYPE_OPTIONS = [
  'auto insurance policy',
  'group policy',
  'individual policy',
  'long term policy',
  'ligitation',
  'medicare primary',
  'self payment',
  'supplimental policy',
  'Others',
];

export const REFERRAL_TYPE_OPTIONS = [
  { value: 'Prior Auth Number', label: 'Prior Auth Number' },
  { value: 'Referral Number', label: 'Referral Number' },
  { value: 'None', label: 'None' },
];

export function defaultInsuranceDetails() {
  return {
    memberId: '',
    policyType: 'auto insurance policy',
    copayDue: '0.00',
    groupNumber: '',
    claimControlRef: '',
    authorizationNumber: '',
    referralType: 'Prior Auth Number',
  };
}

export function InsuranceDetailsBlock({ title, details, onUpdate }) {
  return (
    <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
      {title && <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label className="text-sm">Member ID</Label>
          <Input value={details.memberId} onChange={(e) => onUpdate('memberId', e.target.value)} placeholder="e.g. 1234321" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Policy Type</Label>
          <SearchableSelect
            value={details.policyType}
            onValueChange={(v) => onUpdate('policyType', v)}
            options={POLICY_TYPE_OPTIONS}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Copay Due</Label>
          <Input type="number" step="0.01" value={details.copayDue} onChange={(e) => onUpdate('copayDue', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Group Number</Label>
          <Input value={details.groupNumber} onChange={(e) => onUpdate('groupNumber', e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-sm">Claim Control / Original Ref. #</Label>
          <Input value={details.claimControlRef} onChange={(e) => onUpdate('claimControlRef', e.target.value)} />
        </div>
        <div className="space-y-2 flex flex-col sm:col-span-2 lg:col-span-3">
          <Label className="text-sm">Authorization #</Label>
          <div className="flex gap-2 items-center">
            <Input value={details.authorizationNumber} onChange={(e) => onUpdate('authorizationNumber', e.target.value)} className="flex-1 max-w-xs" />
            <button type="button" className="text-sm text-primary hover:underline whitespace-nowrap">Copy Auth from Patient</button>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Referral Type</Label>
          <SearchableSelect
            value={details.referralType}
            onValueChange={(v) => onUpdate('referralType', v)}
            options={REFERRAL_TYPE_OPTIONS}
          />
        </div>
      </div>
    </div>
  );
}
