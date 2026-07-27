import { getStatusSoftClass } from '@/lib/statusColors';

export const EVENT_STATUS_OPTIONS = [
  'Scheduled',
  'Checked In',
  'Roomed',
  'Consent Form Not Signed',
  'Registration Complete',
];

/** Soft token styles — matches clinical status system (readable contrast). */
export const EVENT_STATUS_STYLES = {
  Scheduled: {
    backgroundColor: 'var(--status-info-bg)',
    color: 'var(--status-info-fg)',
    borderColor: 'var(--status-info-border)',
  },
  'Checked In': {
    backgroundColor: 'var(--status-warning-bg)',
    color: 'var(--status-warning-fg)',
    borderColor: 'var(--status-warning-border)',
  },
  Roomed: {
    backgroundColor: 'var(--status-info-bg)',
    color: 'var(--status-info-fg)',
    borderColor: 'var(--status-info-border)',
  },
  'Consent Form Not Signed': {
    backgroundColor: 'var(--status-danger-bg)',
    color: 'var(--status-danger-fg)',
    borderColor: 'var(--status-danger-border)',
  },
  'Registration Complete': {
    backgroundColor: 'var(--status-success-bg)',
    color: 'var(--status-success-fg)',
    borderColor: 'var(--status-success-border)',
  },
};

export function eventStatusChipStyle(status) {
  return (
    EVENT_STATUS_STYLES[status] || {
      backgroundColor: 'var(--status-muted-bg)',
      color: 'var(--status-muted-fg)',
      borderColor: 'var(--status-muted-border)',
    }
  );
}

/** Soft CSS class for event-status badges in list views. */
export function eventStatusChipClass(status) {
  return getStatusSoftClass(status || 'Scheduled');
}

function normalizeEventStatus(status) {
  return String(status || '').trim().toLowerCase();
}

/** True once the patient has been roomed (by event status or assigned room). */
export function isAppointmentRoomed(appointmentOrStatus) {
  if (!appointmentOrStatus) return false;
  if (typeof appointmentOrStatus === 'string') {
    return normalizeEventStatus(appointmentOrStatus) === 'roomed';
  }
  const status = normalizeEventStatus(appointmentOrStatus.eventStatus);
  return status === 'roomed' || Boolean(appointmentOrStatus.roomId);
}

export function canCheckIn(eventStatus, appointment) {
  const appt = appointment || (typeof eventStatus === 'object' ? eventStatus : null);
  if (isAppointmentRoomed(appt || eventStatus)) return false;
  const status = typeof eventStatus === 'object' ? eventStatus?.eventStatus : eventStatus;
  return ['Scheduled', 'Consent Form Not Signed', 'Registration Complete'].includes(status);
}

export function canRoomPatient(eventStatus, appointment) {
  const appt = appointment || (typeof eventStatus === 'object' ? eventStatus : null);
  if (isAppointmentRoomed(appt || eventStatus)) return false;
  const status = typeof eventStatus === 'object' ? eventStatus?.eventStatus : eventStatus;
  return ['Checked In', 'Registration Complete', 'Scheduled'].includes(status);
}
