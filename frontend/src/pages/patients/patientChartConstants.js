export const CHART_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'demographics', label: 'Demographics' },
  { id: 'coverage', label: 'Coverage' },
  { id: 'guarantor', label: 'Guarantor' },
  { id: 'ledger', label: 'Account' },
  { id: 'visits', label: 'Visits' },
  { id: 'claims', label: 'Claims' },
  { id: 'documents', label: 'Documents' },
];

export const CHART_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'deceased', label: 'Deceased' },
];

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' },
];

export const PAYMENT_TYPES = [
  { value: 'payment', label: 'Patient payment' },
  { value: 'copay_payment', label: 'Copay' },
  { value: 'insurance_payment', label: 'Insurance payment' },
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'discount', label: 'Discount' },
  { value: 'write_off', label: 'Write-off' },
  { value: 'refund', label: 'Refund' },
];

export const CLAIM_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'ready', label: 'Ready to submit' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'denied', label: 'Denied' },
  { value: 'paid', label: 'Paid' },
  { value: 'partial', label: 'Partial payment' },
  { value: 'appealing', label: 'Appealing' },
  { value: 'voided', label: 'Voided' },
];

export function formatMoney(value) {
  const n = Number(value || 0);
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export function displayName(patient) {
  if (!patient) return 'Patient';
  const prefix = patient.prefix
    ? `${String(patient.prefix).charAt(0).toUpperCase()}${String(patient.prefix).slice(1)}. `
    : '';
  return `${prefix}${[patient.firstName, patient.middleName, patient.lastName, patient.suffix].filter(Boolean).join(' ')}`;
}

export function billingTypeLabel(value) {
  const raw = String(value || '').replace('_', '-');
  if (raw === 'self-pay' || raw === 'self_pay') return 'Self-pay';
  if (raw === 'insurance') return 'Insurance';
  return value || '—';
}

export function statusTone(status) {
  const value = String(status || '').toLowerCase();
  if (['active', 'paid', 'completed', 'signed', 'accepted'].includes(value)) {
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }
  if (['denied', 'failed', 'inactive', 'terminated', 'rejected', 'deceased'].includes(value)) {
    return 'bg-red-100 text-red-800 border-red-200';
  }
  if (['pending', 'draft', 'stale', 'warning', 'partial', 'appealing'].includes(value)) {
    return 'bg-amber-100 text-amber-900 border-amber-200';
  }
  return 'bg-muted text-foreground border-border';
}

export function alertTone(severity) {
  if (severity === 'error') return 'border-destructive/40 bg-destructive/10 text-destructive';
  if (severity === 'warning') return 'border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100';
  return 'border-border bg-muted/40 text-foreground';
}
