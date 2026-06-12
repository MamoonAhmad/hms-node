export const APPOINTMENT_STATUSES_STORAGE_KEY = 'hms_appointment_statuses';

export const DEFAULT_APPOINTMENT_STATUSES = [
  { id: 'status-scheduled', name: 'Scheduled', color: '#3b82f6' },
  { id: 'status-checked-in', name: 'Checked-In', color: '#ca8a04' },
  { id: 'status-in-progress', name: 'In Progress', color: '#9333ea' },
  { id: 'status-completed', name: 'Completed', color: '#16a34a' },
  { id: 'status-cancelled', name: 'Cancelled', color: '#dc2626' },
  { id: 'status-no-show', name: 'No-Show', color: '#6b7280' },
  { id: 'status-rescheduled', name: 'Rescheduled', color: '#ea580c' },
];

function readStored() {
  try {
    const raw = localStorage.getItem(APPOINTMENT_STATUSES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAppointmentStatuses(list) {
  localStorage.setItem(APPOINTMENT_STATUSES_STORAGE_KEY, JSON.stringify(list));
}

/** Returns appointment statuses from localStorage, seeding defaults on first use. */
export function getAppointmentStatuses() {
  const stored = readStored();
  if (stored.length === 0) {
    saveAppointmentStatuses(DEFAULT_APPOINTMENT_STATUSES);
    return [...DEFAULT_APPOINTMENT_STATUSES];
  }
  return stored;
}

export function normalizeHexColor(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed.toLowerCase()}`;
  return null;
}

export function getDefaultAppointmentStatusName() {
  const statuses = getAppointmentStatuses();
  return statuses[0]?.name || 'Scheduled';
}
