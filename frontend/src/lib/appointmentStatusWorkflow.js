/**
 * Canonical appointment statuses (mirrors backend appointmentStatusWorkflow).
 */

export const APPOINTMENT_STATUS = {
  SCHEDULED: 'Scheduled',
  CHECKED_IN: 'Checked In',
  IN_PROGRESS: 'In Progress',
  CHECKED_OUT: 'Checked Out',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show',
  RESCHEDULED: 'Rescheduled',
  LWBS: 'Left Without Being Seen (LWBS)',
};

export const CANONICAL_APPOINTMENT_STATUSES = [
  APPOINTMENT_STATUS.SCHEDULED,
  APPOINTMENT_STATUS.CHECKED_IN,
  APPOINTMENT_STATUS.IN_PROGRESS,
  APPOINTMENT_STATUS.CHECKED_OUT,
  APPOINTMENT_STATUS.COMPLETED,
  APPOINTMENT_STATUS.CANCELLED,
  APPOINTMENT_STATUS.NO_SHOW,
  APPOINTMENT_STATUS.RESCHEDULED,
  APPOINTMENT_STATUS.LWBS,
];

const STATUS_ALIASES = {
  Scheduled: APPOINTMENT_STATUS.SCHEDULED,
  'Checked In': APPOINTMENT_STATUS.CHECKED_IN,
  'Checked-In': APPOINTMENT_STATUS.CHECKED_IN,
  'Checked-in': APPOINTMENT_STATUS.CHECKED_IN,
  Arrived: APPOINTMENT_STATUS.IN_PROGRESS,
  Roomed: APPOINTMENT_STATUS.IN_PROGRESS,
  'In Intake': APPOINTMENT_STATUS.IN_PROGRESS,
  'In Progress': APPOINTMENT_STATUS.IN_PROGRESS,
  'With Provider': APPOINTMENT_STATUS.IN_PROGRESS,
  'Provider Out': APPOINTMENT_STATUS.IN_PROGRESS,
  'Checked Out': APPOINTMENT_STATUS.CHECKED_OUT,
  Checkout: APPOINTMENT_STATUS.CHECKED_OUT,
  Completed: APPOINTMENT_STATUS.COMPLETED,
  'Visit Completed': APPOINTMENT_STATUS.COMPLETED,
  'Claim Ready': APPOINTMENT_STATUS.COMPLETED,
  Cancelled: APPOINTMENT_STATUS.CANCELLED,
  Canceled: APPOINTMENT_STATUS.CANCELLED,
  'No Show': APPOINTMENT_STATUS.NO_SHOW,
  'No-Show': APPOINTMENT_STATUS.NO_SHOW,
  Rescheduled: APPOINTMENT_STATUS.RESCHEDULED,
  LWBS: APPOINTMENT_STATUS.LWBS,
  'Left Without Being Seen': APPOINTMENT_STATUS.LWBS,
  'Left Without Being Seen (LWBS)': APPOINTMENT_STATUS.LWBS,
};

export function normalizeAppointmentStatus(status) {
  if (!status) return APPOINTMENT_STATUS.SCHEDULED;
  const trimmed = String(status).trim();
  if (STATUS_ALIASES[trimmed]) return STATUS_ALIASES[trimmed];
  const lowerMap = Object.fromEntries(
    Object.entries(STATUS_ALIASES).map(([k, v]) => [k.toLowerCase(), v]),
  );
  return lowerMap[trimmed.toLowerCase()] || trimmed;
}

export const OPEN_APPOINTMENT_STATUSES = [
  APPOINTMENT_STATUS.SCHEDULED,
  APPOINTMENT_STATUS.CHECKED_IN,
  APPOINTMENT_STATUS.IN_PROGRESS,
  APPOINTMENT_STATUS.RESCHEDULED,
];

export function isOpenAppointmentStatus(status) {
  return OPEN_APPOINTMENT_STATUSES.includes(normalizeAppointmentStatus(status));
}

/** Primary forward status shown in appointment action menus. */
export const PRIMARY_NEXT_APPOINTMENT_STATUS = {
  [APPOINTMENT_STATUS.SCHEDULED]: APPOINTMENT_STATUS.CHECKED_IN,
  [APPOINTMENT_STATUS.RESCHEDULED]: APPOINTMENT_STATUS.CHECKED_IN,
  [APPOINTMENT_STATUS.CHECKED_IN]: APPOINTMENT_STATUS.IN_PROGRESS,
  [APPOINTMENT_STATUS.IN_PROGRESS]: APPOINTMENT_STATUS.CHECKED_OUT,
  [APPOINTMENT_STATUS.CHECKED_OUT]: APPOINTMENT_STATUS.COMPLETED,
};

const CANCELABLE_APPOINTMENT_STATUSES = new Set([
  APPOINTMENT_STATUS.SCHEDULED,
  APPOINTMENT_STATUS.RESCHEDULED,
  APPOINTMENT_STATUS.CHECKED_IN,
]);

const NO_SHOW_APPOINTMENT_STATUSES = new Set([
  APPOINTMENT_STATUS.SCHEDULED,
  APPOINTMENT_STATUS.RESCHEDULED,
  APPOINTMENT_STATUS.CHECKED_IN,
]);

/** Next clinical status for the action menu (or null when terminal / none). */
export function getNextAppointmentStatus(status) {
  const canonical = normalizeAppointmentStatus(status);
  return PRIMARY_NEXT_APPOINTMENT_STATUS[canonical] || null;
}

/** Cancel is offered for Scheduled, Rescheduled, and Checked In. */
export function canCancelAppointment(status) {
  return CANCELABLE_APPOINTMENT_STATUSES.has(normalizeAppointmentStatus(status));
}

/** No Show is offered for Scheduled, Rescheduled, and Checked In. */
export function canMarkNoShowAppointment(status) {
  return NO_SHOW_APPOINTMENT_STATUSES.has(normalizeAppointmentStatus(status));
}

/** Aggregate raw status-count maps onto canonical keys. */
export function aggregateStatusCounts(rawCounts = {}) {
  const counts = { all: rawCounts.all || 0 };
  CANONICAL_APPOINTMENT_STATUSES.forEach((name) => {
    counts[name] = 0;
  });
  Object.entries(rawCounts).forEach(([key, value]) => {
    if (key === 'all') return;
    const canonical = normalizeAppointmentStatus(key);
    counts[canonical] = (counts[canonical] || 0) + (value || 0);
  });
  return counts;
}
