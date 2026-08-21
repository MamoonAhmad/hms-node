export const RCM_ENCOUNTER_TABS = [
  { id: 'summary', label: 'Summary' },
  { id: 'demographics', label: 'Demographics' },
  { id: 'coverage', label: 'Coverage' },
  { id: 'diagnoses', label: 'Diagnoses (ICD)' },
  { id: 'charges', label: 'Charges (CPT)' },
  { id: 'claim', label: 'Claim' },
  { id: 'payments', label: 'Payments' },
  { id: 'documents', label: 'Documents' },
  { id: 'follow-up', label: 'Follow-up / Audit' },
];

export const BILLING_STATUS_FLOW = [
  'Unbilled',
  'Coding',
  'Ready to submit',
  'Submitted',
  'Denied',
  'Paid',
  'Follow-up',
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

export function billingStatusTone(status) {
  switch (status) {
    case 'Paid':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Submitted':
    case 'Ready to submit':
      return 'bg-teal-100 text-teal-900 border-teal-200';
    case 'Denied':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Follow-up':
    case 'Coding':
      return 'bg-amber-100 text-amber-900 border-amber-200';
    default:
      return 'bg-muted text-foreground border-border';
  }
}
