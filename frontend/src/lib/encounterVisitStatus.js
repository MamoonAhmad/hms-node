import {
  APPOINTMENT_STATUS,
  OPEN_APPOINTMENT_STATUSES,
  normalizeAppointmentStatus,
} from '@/lib/appointmentStatusWorkflow';

/** Clinical encounter visit statuses written to appointment.status (simplified workflow). */
export const ENCOUNTER_VISIT_STATUS = {
  SCHEDULED: APPOINTMENT_STATUS.SCHEDULED,
  CHECKED_IN: APPOINTMENT_STATUS.CHECKED_IN,
  IN_INTAKE: APPOINTMENT_STATUS.IN_PROGRESS,
  WITH_PROVIDER: APPOINTMENT_STATUS.IN_PROGRESS,
  PROVIDER_OUT: APPOINTMENT_STATUS.IN_PROGRESS,
  CHECKED_OUT: APPOINTMENT_STATUS.CHECKED_OUT,
  VISIT_COMPLETED: APPOINTMENT_STATUS.COMPLETED,
  IN_PROGRESS: APPOINTMENT_STATUS.IN_PROGRESS,
  COMPLETED: APPOINTMENT_STATUS.COMPLETED,
};

const STATUS_RANK = {
  [APPOINTMENT_STATUS.SCHEDULED]: 10,
  [APPOINTMENT_STATUS.RESCHEDULED]: 10,
  [APPOINTMENT_STATUS.CHECKED_IN]: 20,
  [APPOINTMENT_STATUS.IN_PROGRESS]: 30,
  [APPOINTMENT_STATUS.CHECKED_OUT]: 40,
  [APPOINTMENT_STATUS.COMPLETED]: 50,
};

export const OPEN_ENCOUNTER_STATUSES = [
  ...OPEN_APPOINTMENT_STATUSES,
  'Checked-In',
  'In Intake',
  'With Provider',
  'Provider Out',
];

export function rankOfEncounterStatus(status) {
  if (!status) return 0;
  return STATUS_RANK[normalizeAppointmentStatus(status)] ?? 0;
}

export function shouldAdvanceEncounterStatus(current, next) {
  if (!next) return false;
  const from = normalizeAppointmentStatus(current);
  const to = normalizeAppointmentStatus(next);
  if (!current) return true;
  if (from === to) return false;
  // Allow checkout reopen
  if (from === APPOINTMENT_STATUS.CHECKED_OUT && to === APPOINTMENT_STATUS.IN_PROGRESS) {
    return true;
  }
  return rankOfEncounterStatus(to) > rankOfEncounterStatus(from);
}

/** Full encounter progress steps shown on the patient dashboard bar. */
export const ENCOUNTER_STATUS_FLOW = [
  'Arrived',
  'In Intake',
  'With Provider',
  'Provider Out',
  'Checked Out',
  'Visit Completed',
];

/**
 * Chart bar / encounters-list step derived from appointment.status.
 * Prefer an already-stored granular visit step when present; otherwise map
 * canonical appointment statuses (with optional eventStatus hint).
 */
export function mapAppointmentStatusToVisitStep(status, eventStatus) {
  const raw = String(status || '').trim();
  if (ENCOUNTER_STATUS_FLOW.includes(raw)) return raw;

  const canonical = normalizeAppointmentStatus(status);
  if (canonical === APPOINTMENT_STATUS.CHECKED_OUT) return 'Checked Out';
  if (canonical === APPOINTMENT_STATUS.COMPLETED) return 'Visit Completed';
  if (canonical === APPOINTMENT_STATUS.CHECKED_IN) return 'Arrived';
  if (canonical === APPOINTMENT_STATUS.IN_PROGRESS) {
    if (eventStatus === 'Roomed') return 'In Intake';
    if (eventStatus === 'Checked In') return 'Arrived';
    return 'With Provider';
  }
  const legacyMap = {
    Scheduled: 'Arrived',
    Rescheduled: 'Arrived',
    Cancelled: 'Arrived',
    'No Show': 'Arrived',
    [APPOINTMENT_STATUS.LWBS]: 'Arrived',
  };
  return legacyMap[canonical] || 'Arrived';
}

/** Badge variants for visit workflow steps (matches chart bar semantics). */
export const VISIT_STEP_BADGE_VARIANT = {
  Arrived: 'success',
  'In Intake': 'success',
  'With Provider': 'info',
  'Provider Out': 'warning',
  'Checked Out': 'default',
  'Visit Completed': 'muted',
};

export function getVisitStepBadgeVariant(step) {
  return VISIT_STEP_BADGE_VARIANT[step] || 'muted';
}

export function getEncounterStatusFlowIndex(statusOrStep, eventStatus) {
  const step = ENCOUNTER_STATUS_FLOW.includes(statusOrStep)
    ? statusOrStep
    : mapAppointmentStatusToVisitStep(statusOrStep, eventStatus);
  const idx = ENCOUNTER_STATUS_FLOW.indexOf(step);
  return idx >= 0 ? idx : 0;
}

/** Maps a bar step label to the appointment.status persisted in the API. */
export function mapVisitStepToAppointmentStatus(step) {
  const map = {
    Arrived: APPOINTMENT_STATUS.CHECKED_IN,
    'In Intake': APPOINTMENT_STATUS.IN_PROGRESS,
    Roomed: APPOINTMENT_STATUS.IN_PROGRESS,
    'With Provider': APPOINTMENT_STATUS.IN_PROGRESS,
    'Provider Out': APPOINTMENT_STATUS.IN_PROGRESS,
    'Checked Out': APPOINTMENT_STATUS.CHECKED_OUT,
    Checkout: APPOINTMENT_STATUS.CHECKED_OUT,
    'Visit Completed': APPOINTMENT_STATUS.COMPLETED,
  };
  return map[step] || null;
}

export function isOpenEncounterStatus(status) {
  return OPEN_ENCOUNTER_STATUSES.includes(status)
    || OPEN_APPOINTMENT_STATUSES.includes(normalizeAppointmentStatus(status));
}
