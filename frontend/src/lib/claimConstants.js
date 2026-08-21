export const CLAIM_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'ready', label: 'Ready' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'paid', label: 'Paid' },
  { value: 'denied', label: 'Denied' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const SUBMISSION_STATUSES = [
  { value: 'not_submitted', label: 'Not submitted' },
  { value: 'queued', label: 'Queued' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
];

export const CHARGE_ROUTING_OPTIONS = [
  { value: 'no_change', label: 'No Change' },
  { value: 'clearinghouse', label: 'Clearinghouse' },
  { value: 'balance_due_patient', label: 'Balance Due Patient' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'user_print_mail', label: 'User Print & Mail' },
];

export const ICD_POINTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export function claimStatusLabel(status) {
  return CLAIM_STATUSES.find((s) => s.value === status)?.label || status || '—';
}

export function submissionStatusLabel(status) {
  return SUBMISSION_STATUSES.find((s) => s.value === status)?.label || status || '—';
}

export function chargeRoutingLabel(value) {
  return CHARGE_ROUTING_OPTIONS.find((s) => s.value === value)?.label || value || 'No Change';
}
