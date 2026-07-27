/**
 * Clinical status color system — five semantic tones only.
 *
 * | Tone        | Meaning                                      |
 * |-------------|----------------------------------------------|
 * | success     | Completed, verified, active, approved        |
 * | info        | In progress, scheduled, sent, open encounter |
 * | warning     | Pending, due, needs attention, draft review  |
 * | danger      | Critical, cancelled, refused, denied         |
 * | muted       | Inactive, discontinued, archived, draft      |
 *
 * Prefer Badge variants or these class tokens — do not invent ad-hoc rainbow colors.
 */

export const STATUS_SOFT = {
  success: 'status-soft-success',
  info: 'status-soft-info',
  warning: 'status-soft-warning',
  danger: 'status-soft-danger',
  muted: 'status-soft-muted',
};

export const STATUS_SOLID = {
  success: 'status-solid-success',
  info: 'status-solid-info',
  warning: 'status-solid-warning',
  danger: 'status-solid-danger',
  muted: 'status-solid-muted',
};

/** Alias used by badges / StatusBadge (danger → destructive naming). */
export const STATUS_BADGE_CLASSES = {
  success: STATUS_SOFT.success,
  info: STATUS_SOFT.info,
  warning: STATUS_SOFT.warning,
  destructive: STATUS_SOFT.danger,
  danger: STATUS_SOFT.danger,
  muted: STATUS_SOFT.muted,
  outline: '',
};

const STATUS_VARIANT_MAP = {
  // Success
  active: 'success',
  completed: 'success',
  complete: 'success',
  signed: 'success',
  verified: 'success',
  normal: 'success',
  resolved: 'success',
  approved: 'success',
  authorized: 'success',
  accepted: 'success',
  administered: 'success',
  resulted: 'success',
  received: 'success',
  'report received': 'success',
  registered: 'success',

  // Info / in workflow
  open: 'info',
  arrived: 'info',
  roomed: 'info',
  'with provider': 'info',
  'in intake': 'info',
  'provider out': 'info',
  'checked out': 'success',
  'visit completed': 'success',
  'claim ready': 'success',
  sent: 'info',
  scheduled: 'info',
  'in progress': 'info',
  processing: 'info',
  collected: 'info',
  submitted: 'info',
  signed_pending_verify: 'info',

  // Warning / attention
  pending: 'warning',
  draft: 'warning',
  due: 'warning',
  'due soon': 'warning',
  ordered: 'info',
  declined: 'muted',
  'n/a': 'muted',
  unsigned: 'warning',
  overdue: 'warning',
  delayed: 'warning',
  checkout: 'warning',
  'authorization pending': 'warning',
  'on hold': 'warning',
  held: 'warning',
  'needs attention': 'warning',
  'not started': 'warning',
  'pending payment': 'warning',
  'pending clinical sign-off': 'warning',
  'pending follow-up': 'warning',
  rescheduled: 'warning',
  'checked-in': 'warning',
  'checked in': 'warning',
  urgent: 'warning',

  // Danger / critical
  cancelled: 'destructive',
  canceled: 'destructive',
  failed: 'destructive',
  rejected: 'destructive',
  critical: 'destructive',
  severe: 'destructive',
  refused: 'destructive',
  denied: 'destructive',
  missed: 'destructive',
  expired: 'destructive',
  'no-show': 'destructive',
  'no show': 'muted',
  lwbs: 'destructive',
  'left without being seen': 'destructive',
  'left without being seen (lwbs)': 'destructive',
  deceased: 'destructive',
  dismissed: 'destructive',
  'consent form not signed': 'destructive',
  'registration complete': 'success',

  // Muted / inactive
  inactive: 'muted',
  archived: 'muted',
  closed: 'muted',
  discontinued: 'muted',
  'not required': 'muted',
  'not available': 'muted',
  restricted: 'muted',
};

export function resolveStatusVariant(status) {
  if (!status) return 'outline';
  const key = String(status).toLowerCase().trim().replace(/_/g, ' ');
  return STATUS_VARIANT_MAP[key] || 'outline';
}

/** Soft badge classes for a free-form status string. */
export function getStatusSoftClass(status) {
  const variant = resolveStatusVariant(status);
  if (variant === 'outline') return STATUS_SOFT.muted;
  if (variant === 'destructive') return STATUS_SOFT.danger;
  return STATUS_SOFT[variant] || STATUS_SOFT.muted;
}

/** Solid surface classes (timeline cards, filled chips). */
export function getStatusSolidClass(status) {
  const variant = resolveStatusVariant(status);
  if (variant === 'outline') return STATUS_SOLID.muted;
  if (variant === 'destructive') return STATUS_SOLID.danger;
  return STATUS_SOLID[variant] || STATUS_SOLID.muted;
}
