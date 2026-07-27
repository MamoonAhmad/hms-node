/**
 * Outpatient visit timing helpers for Wait Time and TLOS (total length of stay).
 *
 * Wait Time: arrival/check-in → roomed (live until roomed, then frozen)
 * TLOS: arrival/check-in → checkout (live until checkout, then frozen)
 */

import { normalizeAppointmentStatus, APPOINTMENT_STATUS } from '@/lib/appointmentStatusWorkflow';

export function formatDurationMs(ms) {
  if (ms == null || Number.isNaN(ms) || ms < 0) return '—';
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function toTime(value) {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}

function combineAppointmentDateTime(appointmentDate, appointmentTime) {
  if (!appointmentDate) return null;
  const date = new Date(appointmentDate);
  if (Number.isNaN(date.getTime())) return null;
  const time = String(appointmentTime || '00:00').trim();
  const match = time.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  const hours = match ? Number(match[1]) : 0;
  const minutes = match ? Number(match[2]) : 0;
  const seconds = match ? Number(match[3] || 0) : 0;
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    hours,
    minutes,
    seconds,
    0,
  ).getTime();
}

function resolveArrivalMs(row) {
  const timing = row?.visitTiming || {};
  const fromApi = toTime(timing.checkedInAt);
  if (fromApi) return fromApi;

  const status = normalizeAppointmentStatus(row?.status);
  const event = String(row?.eventStatus || '').toLowerCase();
  const started =
    Boolean(timing.roomedAt) ||
    Boolean(timing.checkedOutAt) ||
    Boolean(row?.roomId) ||
    event.includes('checked in') ||
    event === 'roomed' ||
    [
      APPOINTMENT_STATUS.CHECKED_IN,
      APPOINTMENT_STATUS.IN_PROGRESS,
      APPOINTMENT_STATUS.CHECKED_OUT,
      APPOINTMENT_STATUS.COMPLETED,
      'In Intake',
      'With Provider',
      'Ready for Checkout',
    ].includes(status);

  if (!started) return null;

  const apptStart = combineAppointmentDateTime(row?.appointmentDate, row?.appointmentTime);
  const created = toTime(row?.createdAt);
  const roomed = toTime(timing.roomedAt);
  const checkedOut = toTime(timing.checkedOutAt);
  const endCap = checkedOut || Date.now();

  const candidates = [roomed, created, apptStart && apptStart <= endCap ? apptStart : null].filter(
    (v) => v != null,
  );
  return candidates.length ? Math.min(...candidates) : null;
}

/**
 * @param {object} row - appointment with visitTiming and/or eventStatus
 * @param {number} [nowMs]
 * @returns {{ label: string, ms: number|null, isLive: boolean, isLong: boolean }}
 */
export function getWaitTime(row, nowMs = Date.now()) {
  const timing = row?.visitTiming || {};
  const checkedInAt = resolveArrivalMs(row);
  let roomedAt = toTime(timing.roomedAt);

  if (!checkedInAt) {
    return { label: '—', ms: null, isLive: false, isLong: false };
  }

  const checkedOutAt = toTime(timing.checkedOutAt);
  const eventRoomed =
    String(row?.eventStatus || '').toLowerCase() === 'roomed' || Boolean(row?.roomId);

  // If already past waiting (roomed/checked out) but no roomed timestamp, freeze wait.
  if (!roomedAt && (eventRoomed || checkedOutAt)) {
    roomedAt = checkedOutAt || checkedInAt;
  }

  const end = roomedAt || nowMs;
  const ms = Math.max(0, end - checkedInAt);
  const isLive = !roomedAt && !checkedOutAt;

  return {
    label: formatDurationMs(ms),
    ms,
    isLive,
    isLong: isLive && ms >= 30 * 60 * 1000,
  };
}

/**
 * @param {object} row - appointment with visitTiming
 * @param {number} [nowMs]
 * @returns {{ label: string, ms: number|null, isLive: boolean, isLong: boolean }}
 */
export function getTlos(row, nowMs = Date.now()) {
  const timing = row?.visitTiming || {};
  const checkedInAt = resolveArrivalMs(row);
  let checkedOutAt = toTime(timing.checkedOutAt);

  if (!checkedInAt) {
    return { label: '—', ms: null, isLive: false, isLong: false };
  }

  const status = normalizeAppointmentStatus(row?.status);
  if (
    !checkedOutAt &&
    (status === APPOINTMENT_STATUS.CHECKED_OUT || status === APPOINTMENT_STATUS.COMPLETED)
  ) {
    checkedOutAt = toTime(row?.updatedAt) || nowMs;
  }

  const end = checkedOutAt || nowMs;
  const ms = Math.max(0, end - checkedInAt);
  const isLive = !checkedOutAt;

  return {
    label: formatDurationMs(ms),
    ms,
    isLive,
    isLong: isLive && ms >= 4 * 60 * 60 * 1000,
  };
}
