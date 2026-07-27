/**
 * Encounter visit helpers — appointment.status uses the simplified workflow.
 * Granular clinical steps (intake / with provider / provider out) all map to
 * "In Progress" on the appointment status field.
 */
const {
  APPOINTMENT_STATUS,
  OPEN_APPOINTMENT_STATUSES,
  normalizeAppointmentStatus,
  rankOf,
  shouldAdvanceStatus,
  resolveAutomaticStatus,
  statusMatchValues,
  canTransition,
  isManualStatusOverride,
} = require('./appointmentStatusWorkflow');

const ENCOUNTER_VISIT_STATUS = {
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

const OPEN_ENCOUNTER_STATUSES = [
  ...OPEN_APPOINTMENT_STATUSES,
  // Legacy DB values still treated as open until backfill finishes
  'Checked-In',
  'In Intake',
  'With Provider',
  'Provider Out',
];

module.exports = {
  ENCOUNTER_VISIT_STATUS,
  STATUS_RANK,
  OPEN_ENCOUNTER_STATUSES,
  APPOINTMENT_STATUS,
  normalizeAppointmentStatus,
  rankOf,
  shouldAdvanceStatus,
  resolveAutomaticStatus,
  statusMatchValues,
  canTransition,
  isManualStatusOverride,
};
