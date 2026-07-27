import {
  buildAppointmentSubmitPayloadFromRegistration,
  parseNotesWithReferral,
  DEFAULT_VISIT_MODALITY,
} from '@/components/patients/patientRegistrationAppointmentConstants';
import { getDefaultAppointmentStatusName } from '@/lib/appointmentStatuses';
import { formatProviderListName } from '@/lib/appointmentUtils';

export const RESCHEDULED_APPOINTMENT_STATUS = 'Rescheduled';

const NON_EDITABLE_APPOINTMENT_STATUSES = new Set([
  'Cancelled',
  'Completed',
  'No Show',
  'No-Show',
  'Left Without Being Seen (LWBS)',
  'Checked Out',
]);

/** Schedule context + date/time fields — changing these marks the appointment Rescheduled. */
export const SCHEDULE_OR_SLOT_FIELDS = [
  'appointmentDepartmentId',
  'appointmentDepartment',
  'appointmentProviderId',
  'appointmentProvider',
  'appointmentVisitType',
  'appointmentTypeId',
  'appointmentTypeName',
  'visitModality',
  'appointmentDate',
  'appointmentTime',
  'appointmentStartTime',
  'appointmentEndTime',
];

function normalizeComparable(value) {
  if (value == null) return '';
  if (Array.isArray(value)) return JSON.stringify(value);
  return String(value).trim();
}

export function didScheduleOrSlotChange(baseline, current) {
  if (!baseline || !current) return false;
  return SCHEDULE_OR_SLOT_FIELDS.some(
    (field) => normalizeComparable(baseline[field]) !== normalizeComparable(current[field]),
  );
}

export function isAppointmentFormDirty(baseline, current) {
  if (!baseline || !current) return false;
  const keys = new Set([...Object.keys(baseline), ...Object.keys(current)]);
  for (const key of keys) {
    if (normalizeComparable(baseline[key]) !== normalizeComparable(current[key])) {
      return true;
    }
  }
  return false;
}

export function toDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function categorizeAppointments(appointments) {
  const now = new Date();
  const todayKey = toDateKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const past = [];
  const current = [];
  const future = [];

  for (const apt of appointments || []) {
    const dateKey = (apt.appointmentDate || '').split('T')[0];
    if (!dateKey) continue;

    if (dateKey < todayKey) {
      past.push(apt);
      continue;
    }
    if (dateKey > todayKey) {
      future.push(apt);
      continue;
    }

    const start = parseTimeToMinutes(apt.appointmentTime);
    const end = apt.appointmentEndTime
      ? parseTimeToMinutes(apt.appointmentEndTime)
      : start + (apt.duration || 30);

    if (nowMinutes >= start && nowMinutes <= end) {
      current.push(apt);
    } else if (nowMinutes > end) {
      past.push(apt);
    } else {
      future.push(apt);
    }
  }

  const byDateTime = (a, b) => {
    const dateCmp = (a.appointmentDate || '').localeCompare(b.appointmentDate || '');
    if (dateCmp !== 0) return dateCmp;
    return (a.appointmentTime || '').localeCompare(b.appointmentTime || '');
  };

  past.sort((a, b) => -byDateTime(a, b));
  current.sort(byDateTime);
  future.sort(byDateTime);

  return { past, current, future };
}

/** Prefer upcoming visit for patient edit form; fall back to today or most recent past. */
export function pickPrimaryEditableAppointment(appointments) {
  const { past, current, future } = categorizeAppointments(appointments);
  if (future.length) return future[0];
  if (current.length) return current[0];
  if (past.length) return past[0];
  return null;
}

export function isAppointmentEditable(appointment) {
  if (!appointment) return false;
  const status = appointment.status || '';
  return !NON_EDITABLE_APPOINTMENT_STATUSES.has(status);
}

/** Map API appointment row into patient registration / schedule form fields. */
export function mapAppointmentToRegistrationForm(appointment, defaultStatus) {
  if (!appointment) return null;
  const { appointmentNotes, referral } = parseNotesWithReferral(appointment.notes);
  const typeName =
    appointment.appointmentType ||
    appointment.appointmentTypeRef?.name ||
    '';

  return {
    appointmentDate: appointment.appointmentDate ? appointment.appointmentDate.split('T')[0] : '',
    appointmentTime: appointment.appointmentTime || '',
    appointmentStartTime: appointment.appointmentEndTime ? appointment.appointmentTime : '',
    appointmentEndTime: appointment.appointmentEndTime || '',
    appointmentVisitType: typeName,
    appointmentTypeId: appointment.appointmentTypeId || appointment.appointmentTypeRef?.id || '',
    appointmentTypeName: typeName,
    appointmentDepartment:
      appointment.department || appointment.departmentRef?.departmentName || '',
    appointmentDepartmentId: appointment.departmentId || appointment.departmentRef?.id || '',
    appointmentProvider:
      formatProviderListName(appointment.providerRef) ||
      appointment.provider ||
      '',
    appointmentProviderId: appointment.providerId || appointment.providerRef?.id || '',
    appointmentReason: appointment.visitReason || '',
    appointmentNotes,
    visitModality: appointment.visitModality || DEFAULT_VISIT_MODALITY,
    accessibilityRequirements: Array.isArray(appointment.accessibilityRequirements)
      ? appointment.accessibilityRequirements
      : [],
    accessibilityRequirementsNotes: appointment.accessibilityRequirementsNotes || '',
    status: appointment.status || defaultStatus || getDefaultAppointmentStatusName(),
    ...referral,
  };
}

export function buildRescheduledAppointmentUpdatePayload(formData, patientId, { timeSlotOptions } = {}) {
  const payload = buildAppointmentSubmitPayloadFromRegistration(formData, patientId, {
    defaultStatus: RESCHEDULED_APPOINTMENT_STATUS,
    timeSlotOptions,
  });
  payload.status = RESCHEDULED_APPOINTMENT_STATUS;
  return payload;
}

/**
 * Build update payload. Status becomes Rescheduled only when scheduling context or date/time changed.
 * Referring physician / visit notes / accessibility edits keep the existing appointment status and type.
 */
export function buildAppointmentUpdatePayload(
  formData,
  patientId,
  { baseline, timeSlotOptions } = {},
) {
  const scheduleChanged = didScheduleOrSlotChange(baseline, formData);
  const status = scheduleChanged
    ? RESCHEDULED_APPOINTMENT_STATUS
    : formData.status || baseline?.status || getDefaultAppointmentStatusName();

  const payload = buildAppointmentSubmitPayloadFromRegistration(formData, patientId, {
    defaultStatus: status,
    timeSlotOptions,
  });
  payload.status = status;

  if (!scheduleChanged && baseline) {
    // Keep appointment type identity when only non-schedule fields (e.g. referring physician) changed.
    if (baseline.appointmentVisitType) {
      payload.appointmentType =
        baseline.appointmentTypeName || baseline.appointmentVisitType || payload.appointmentType;
    }
    if (baseline.appointmentTypeId) {
      payload.appointmentTypeId = baseline.appointmentTypeId;
    }
  }

  return payload;
}

export async function updateLinkedAppointmentFromRegistration(
  appointmentId,
  formData,
  patientId,
  { appointmentApi },
) {
  if (!appointmentId || !appointmentApi) return null;
  const payload = buildRescheduledAppointmentUpdatePayload(formData, patientId);
  const response = await appointmentApi.update(appointmentId, payload);
  return response?.data ?? response;
}
