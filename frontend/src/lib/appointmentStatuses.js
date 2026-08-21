export const DEFAULT_APPOINTMENT_STATUSES = [
  { id: 'status-scheduled', name: 'Scheduled', color: '#123B5D' },
  { id: 'status-confirmed', name: 'Confirmed', color: '#0F8B8D' },
  { id: 'status-arrived', name: 'Arrived', color: '#b45309' },
  { id: 'status-checked-in', name: 'Checked-In', color: '#b45309' },
  { id: 'status-in-progress', name: 'In Progress', color: '#0F8B8D' },
  { id: 'status-completed', name: 'Completed', color: '#15803d' },
  { id: 'status-cancelled', name: 'Cancelled', color: '#b91c1c' },
  { id: 'status-no-show', name: 'No-Show', color: '#5c728a' },
  { id: 'status-rescheduled', name: 'Rescheduled', color: '#c2410c' },
];

/** Statuses selectable via quick dropdown (not cancel / no-show / reschedule). */
export function getManualStatusOptions(catalog = DEFAULT_APPOINTMENT_STATUSES) {
  const blocked = new Set(['Cancelled', 'No-Show', 'No Show', 'Rescheduled', 'Deleted']);
  return catalog.filter((s) => !blocked.has(s.name));
}

export function normalizeHexColor(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed.toLowerCase()}`;
  return null;
}

export function isLightHexColor(hex) {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return false;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

/** Inline styles for a status chip from the catalogue. */
export function statusChipStyle(name, catalog = []) {
  const row = catalog.find((s) => s.name === name);
  const hex = normalizeHexColor(row?.color) || '#6b7280';
  const light = isLightHexColor(hex);
  return {
    backgroundColor: hex,
    color: light ? '#1f2937' : '#ffffff',
    borderColor: hex,
  };
}

/** Fallback when the API is unavailable (offline / unauthenticated). */
export function getAppointmentStatusesFallback() {
  return [...DEFAULT_APPOINTMENT_STATUSES];
}

/** @deprecated Use appointmentStatusApi.getActive() — sync fallback only */
export function getAppointmentStatuses() {
  return getAppointmentStatusesFallback();
}

export function getDefaultAppointmentStatusName(catalog = getAppointmentStatusesFallback()) {
  return catalog[0]?.name || 'Scheduled';
}
