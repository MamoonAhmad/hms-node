/**
 * Canonical appointment statuses and automatic transition helpers.
 *
 * Scheduled → Checked In / Cancelled / Rescheduled / No Show
 * Checked In → In Progress / Cancelled / No Show / LWBS
 * In Progress (roomed | arrived | with provider | provider out) → Checked Out / LWBS
 * Checked Out → Completed
 * Completed / Cancelled / No Show / LWBS → terminal
 * Rescheduled → Checked In / Cancelled / No Show
 */

const APPOINTMENT_STATUS = {
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

const CANONICAL_STATUSES = Object.values(APPOINTMENT_STATUS);

/** Legacy / granular values → canonical appointment status */
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
  Noshow: APPOINTMENT_STATUS.NO_SHOW,
  Rescheduled: APPOINTMENT_STATUS.RESCHEDULED,
  LWBS: APPOINTMENT_STATUS.LWBS,
  'Left Without Being Seen': APPOINTMENT_STATUS.LWBS,
  'Left Without Being Seen (LWBS)': APPOINTMENT_STATUS.LWBS,
};

const STATUS_RANK = {
  [APPOINTMENT_STATUS.SCHEDULED]: 10,
  [APPOINTMENT_STATUS.RESCHEDULED]: 10,
  [APPOINTMENT_STATUS.CHECKED_IN]: 20,
  [APPOINTMENT_STATUS.IN_PROGRESS]: 30,
  [APPOINTMENT_STATUS.CHECKED_OUT]: 40,
  [APPOINTMENT_STATUS.COMPLETED]: 50,
  [APPOINTMENT_STATUS.CANCELLED]: 0,
  [APPOINTMENT_STATUS.NO_SHOW]: 0,
  [APPOINTMENT_STATUS.LWBS]: 0,
};

const TERMINAL_STATUSES = new Set([
  APPOINTMENT_STATUS.COMPLETED,
  APPOINTMENT_STATUS.CANCELLED,
  APPOINTMENT_STATUS.NO_SHOW,
  APPOINTMENT_STATUS.LWBS,
]);

const OPEN_APPOINTMENT_STATUSES = [
  APPOINTMENT_STATUS.SCHEDULED,
  APPOINTMENT_STATUS.CHECKED_IN,
  APPOINTMENT_STATUS.IN_PROGRESS,
  APPOINTMENT_STATUS.RESCHEDULED,
];

/** Manual overrides still allowed from the UI / API */
const MANUAL_STATUSES = new Set([
  APPOINTMENT_STATUS.CANCELLED,
  APPOINTMENT_STATUS.NO_SHOW,
  APPOINTMENT_STATUS.LWBS,
  APPOINTMENT_STATUS.RESCHEDULED,
]);

const ALLOWED_TRANSITIONS = {
  [APPOINTMENT_STATUS.SCHEDULED]: [
    APPOINTMENT_STATUS.CHECKED_IN,
    APPOINTMENT_STATUS.CANCELLED,
    APPOINTMENT_STATUS.RESCHEDULED,
    APPOINTMENT_STATUS.NO_SHOW,
  ],
  [APPOINTMENT_STATUS.CHECKED_IN]: [
    APPOINTMENT_STATUS.IN_PROGRESS,
    APPOINTMENT_STATUS.CANCELLED,
    APPOINTMENT_STATUS.NO_SHOW,
    APPOINTMENT_STATUS.LWBS,
    APPOINTMENT_STATUS.RESCHEDULED,
  ],
  [APPOINTMENT_STATUS.IN_PROGRESS]: [
    APPOINTMENT_STATUS.CHECKED_OUT,
    APPOINTMENT_STATUS.LWBS,
    APPOINTMENT_STATUS.CANCELLED,
  ],
  [APPOINTMENT_STATUS.CHECKED_OUT]: [APPOINTMENT_STATUS.COMPLETED, APPOINTMENT_STATUS.IN_PROGRESS],
  [APPOINTMENT_STATUS.COMPLETED]: [],
  [APPOINTMENT_STATUS.CANCELLED]: [],
  [APPOINTMENT_STATUS.NO_SHOW]: [],
  [APPOINTMENT_STATUS.RESCHEDULED]: [
    APPOINTMENT_STATUS.CHECKED_IN,
    APPOINTMENT_STATUS.CANCELLED,
    APPOINTMENT_STATUS.NO_SHOW,
  ],
  [APPOINTMENT_STATUS.LWBS]: [],
};

function normalizeAppointmentStatus(status) {
  if (!status) return APPOINTMENT_STATUS.SCHEDULED;
  const trimmed = String(status).trim();
  if (STATUS_ALIASES[trimmed]) return STATUS_ALIASES[trimmed];
  const lowerMap = Object.fromEntries(
    Object.entries(STATUS_ALIASES).map(([k, v]) => [k.toLowerCase(), v]),
  );
  return lowerMap[trimmed.toLowerCase()] || trimmed;
}

function rankOf(status) {
  return STATUS_RANK[normalizeAppointmentStatus(status)] ?? 0;
}

function isTerminalStatus(status) {
  return TERMINAL_STATUSES.has(normalizeAppointmentStatus(status));
}

function isOpenAppointmentStatus(status) {
  return OPEN_APPOINTMENT_STATUSES.includes(normalizeAppointmentStatus(status));
}

/** True when automated workflow may move current → next (forward only, except reopen). */
function shouldAdvanceStatus(current, next) {
  if (!next) return false;
  const from = normalizeAppointmentStatus(current);
  const to = normalizeAppointmentStatus(next);
  if (from === to) return false;
  if (isTerminalStatus(from) && to !== APPOINTMENT_STATUS.IN_PROGRESS) return false;
  // Allow checkout reopen: Checked Out → In Progress
  if (from === APPOINTMENT_STATUS.CHECKED_OUT && to === APPOINTMENT_STATUS.IN_PROGRESS) {
    return true;
  }
  return rankOf(to) > rankOf(from);
}

function canTransition(current, next) {
  const from = normalizeAppointmentStatus(current);
  const to = normalizeAppointmentStatus(next);
  if (from === to) return true;
  const allowed = ALLOWED_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

/**
 * Resolve the appointment status that should be applied for a workflow action.
 * Returns null when no status change is needed.
 */
function resolveAutomaticStatus(currentStatus, action) {
  const current = normalizeAppointmentStatus(currentStatus);
  const actions = {
    create: APPOINTMENT_STATUS.SCHEDULED,
    check_in: APPOINTMENT_STATUS.CHECKED_IN,
    start_encounter: APPOINTMENT_STATUS.IN_PROGRESS, // roomed / arrived / with provider / provider out
    check_out: APPOINTMENT_STATUS.CHECKED_OUT,
    complete: APPOINTMENT_STATUS.COMPLETED,
    cancel: APPOINTMENT_STATUS.CANCELLED,
    no_show: APPOINTMENT_STATUS.NO_SHOW,
    reschedule: APPOINTMENT_STATUS.RESCHEDULED,
    lwbs: APPOINTMENT_STATUS.LWBS,
    reopen_checkout: APPOINTMENT_STATUS.IN_PROGRESS,
  };
  const next = actions[action];
  if (!next) return null;
  if (action === 'create') return next;
  if (action === 'reopen_checkout') {
    return current === APPOINTMENT_STATUS.CHECKED_OUT ? next : null;
  }
  if (action === 'reschedule') {
    if (isTerminalStatus(current) || current === APPOINTMENT_STATUS.CHECKED_OUT) return null;
    if (
      current === APPOINTMENT_STATUS.SCHEDULED ||
      current === APPOINTMENT_STATUS.CHECKED_IN ||
      current === APPOINTMENT_STATUS.IN_PROGRESS ||
      current === APPOINTMENT_STATUS.RESCHEDULED
    ) {
      return APPOINTMENT_STATUS.RESCHEDULED;
    }
    return null;
  }
  if (action === 'check_in') {
    if (
      current === APPOINTMENT_STATUS.SCHEDULED ||
      current === APPOINTMENT_STATUS.RESCHEDULED
    ) {
      return next;
    }
    return null;
  }
  if (action === 'start_encounter') {
    if (
      current === APPOINTMENT_STATUS.SCHEDULED ||
      current === APPOINTMENT_STATUS.CHECKED_IN ||
      current === APPOINTMENT_STATUS.RESCHEDULED
    ) {
      return next;
    }
    return null;
  }
  if (!shouldAdvanceStatus(current, next) && !canTransition(current, next)) return null;
  if (shouldAdvanceStatus(current, next) || canTransition(current, next)) {
    if (current === next) return null;
    return next;
  }
  return null;
}

function isManualStatusOverride(status) {
  return MANUAL_STATUSES.has(normalizeAppointmentStatus(status));
}

/** All known DB spellings that normalize to the same canonical status (for filters). */
function statusMatchValues(status) {
  const canonical = normalizeAppointmentStatus(status);
  const values = new Set([canonical]);
  Object.entries(STATUS_ALIASES).forEach(([alias, mapped]) => {
    if (mapped === canonical) values.add(alias);
  });
  return [...values];
}

module.exports = {
  APPOINTMENT_STATUS,
  CANONICAL_STATUSES,
  STATUS_ALIASES,
  STATUS_RANK,
  TERMINAL_STATUSES,
  OPEN_APPOINTMENT_STATUSES,
  MANUAL_STATUSES,
  ALLOWED_TRANSITIONS,
  normalizeAppointmentStatus,
  rankOf,
  isTerminalStatus,
  isOpenAppointmentStatus,
  shouldAdvanceStatus,
  canTransition,
  resolveAutomaticStatus,
  isManualStatusOverride,
  statusMatchValues,
};
