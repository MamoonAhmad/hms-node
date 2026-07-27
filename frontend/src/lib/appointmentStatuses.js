import {
  APPOINTMENT_STATUS,
  CANONICAL_APPOINTMENT_STATUSES,
  normalizeAppointmentStatus,
} from '@/lib/appointmentStatusWorkflow';
import { getStatusSoftClass, getStatusSolidClass } from '@/lib/statusColors';

/**
 * Default appointment statuses — colors align with design-system semantic tokens.
 * Used as fallback / timeline solid fills when catalog has no custom color.
 */
export const DEFAULT_APPOINTMENT_STATUSES = [
  { id: 'status-scheduled', name: APPOINTMENT_STATUS.SCHEDULED, color: '#1a73e8' },
  { id: 'status-checked-in', name: APPOINTMENT_STATUS.CHECKED_IN, color: '#e37400' },
  { id: 'status-in-progress', name: APPOINTMENT_STATUS.IN_PROGRESS, color: '#1967d2' },
  { id: 'status-checked-out', name: APPOINTMENT_STATUS.CHECKED_OUT, color: '#188038' },
  { id: 'status-completed', name: APPOINTMENT_STATUS.COMPLETED, color: '#137333' },
  { id: 'status-cancelled', name: APPOINTMENT_STATUS.CANCELLED, color: '#d93025' },
  { id: 'status-no-show', name: APPOINTMENT_STATUS.NO_SHOW, color: '#5f6368' },
  { id: 'status-rescheduled', name: APPOINTMENT_STATUS.RESCHEDULED, color: '#b06000' },
  { id: 'status-lwbs', name: APPOINTMENT_STATUS.LWBS, color: '#c5221f' },
];

/** Soft token styles for list badges / filter chips (readable, high-contrast text). */
const STATUS_SOFT_INLINE = {
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
  'In Progress': {
    backgroundColor: 'var(--status-info-bg)',
    color: 'var(--status-info-fg)',
    borderColor: 'var(--status-info-border)',
  },
  'Checked Out': {
    backgroundColor: 'var(--status-success-bg)',
    color: 'var(--status-success-fg)',
    borderColor: 'var(--status-success-border)',
  },
  Completed: {
    backgroundColor: 'var(--status-success-bg)',
    color: 'var(--status-success-fg)',
    borderColor: 'var(--status-success-border)',
  },
  Cancelled: {
    backgroundColor: 'var(--status-danger-bg)',
    color: 'var(--status-danger-fg)',
    borderColor: 'var(--status-danger-border)',
  },
  'No Show': {
    backgroundColor: 'var(--status-muted-bg)',
    color: 'var(--status-muted-fg)',
    borderColor: 'var(--status-muted-border)',
  },
  Rescheduled: {
    backgroundColor: 'var(--status-warning-bg)',
    color: 'var(--status-warning-fg)',
    borderColor: 'var(--status-warning-border)',
  },
  'Left Without Being Seen (LWBS)': {
    backgroundColor: 'var(--status-danger-bg)',
    color: 'var(--status-danger-fg)',
    borderColor: 'var(--status-danger-border)',
  },
};

const STATUS_SOLID_INLINE = {
  Scheduled: {
    backgroundColor: 'var(--info)',
    color: 'var(--info-foreground)',
    borderColor: 'var(--info)',
  },
  'Checked In': {
    backgroundColor: 'var(--warning)',
    color: 'var(--warning-foreground)',
    borderColor: 'var(--warning)',
  },
  'In Progress': {
    backgroundColor: 'var(--info)',
    color: 'var(--info-foreground)',
    borderColor: 'var(--info)',
  },
  'Checked Out': {
    backgroundColor: 'var(--success)',
    color: 'var(--success-foreground)',
    borderColor: 'var(--success)',
  },
  Completed: {
    backgroundColor: 'var(--success)',
    color: 'var(--success-foreground)',
    borderColor: 'var(--success)',
  },
  Cancelled: {
    backgroundColor: 'var(--destructive)',
    color: 'var(--destructive-foreground)',
    borderColor: 'var(--destructive)',
  },
  'No Show': {
    backgroundColor: '#5f6368',
    color: '#ffffff',
    borderColor: '#5f6368',
  },
  Rescheduled: {
    backgroundColor: 'var(--warning)',
    color: 'var(--warning-foreground)',
    borderColor: 'var(--warning)',
  },
  'Left Without Being Seen (LWBS)': {
    backgroundColor: 'var(--destructive)',
    color: 'var(--destructive-foreground)',
    borderColor: 'var(--destructive)',
  },
};

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

/** Soft CSS class for appointment status chips (list view, filters). */
export function appointmentStatusSoftClass(name) {
  return getStatusSoftClass(normalizeAppointmentStatus(name));
}

/** Solid CSS class for selected filter chips / filled surfaces. */
export function appointmentStatusSolidClass(name) {
  return getStatusSolidClass(normalizeAppointmentStatus(name));
}

/** Soft inline styles using design tokens (preferred for list badges). */
export function statusSoftChipStyle(name) {
  const canonical = normalizeAppointmentStatus(name);
  return (
    STATUS_SOFT_INLINE[canonical] || {
      backgroundColor: 'var(--status-muted-bg)',
      color: 'var(--status-muted-fg)',
      borderColor: 'var(--status-muted-border)',
    }
  );
}

/**
 * Solid chip styles for timeline cards.
 * Prefers semantic tokens; falls back to catalog hex when customized.
 */
export function statusChipStyle(name, catalog = []) {
  const canonical = normalizeAppointmentStatus(name);
  const tokenStyle = STATUS_SOLID_INLINE[canonical];
  const row =
    catalog.find((s) => normalizeAppointmentStatus(s.name) === canonical) ||
    DEFAULT_APPOINTMENT_STATUSES.find((s) => s.name === canonical);
  const defaultHex = normalizeHexColor(
    DEFAULT_APPOINTMENT_STATUSES.find((s) => s.name === canonical)?.color,
  );
  const catalogHex = normalizeHexColor(row?.color);

  // Use catalog color only when it differs from the built-in default (admin customization).
  if (catalogHex && defaultHex && catalogHex !== defaultHex) {
    const light = isLightHexColor(catalogHex);
    return {
      backgroundColor: catalogHex,
      color: light ? '#202124' : '#ffffff',
      borderColor: catalogHex,
    };
  }

  return (
    tokenStyle || {
      backgroundColor: catalogHex || '#5f6368',
      color: isLightHexColor(catalogHex || '#5f6368') ? '#202124' : '#ffffff',
      borderColor: catalogHex || '#5f6368',
    }
  );
}

/** Fallback when the API is unavailable (offline / unauthenticated). */
export function getAppointmentStatusesFallback() {
  return [...DEFAULT_APPOINTMENT_STATUSES];
}

/** Prefer canonical workflow statuses; merge active API rows by normalized name. */
export function getCanonicalAppointmentStatuses(catalog = []) {
  const byName = new Map();
  DEFAULT_APPOINTMENT_STATUSES.forEach((row) => byName.set(row.name, { ...row }));
  (catalog || []).forEach((row) => {
    const name = normalizeAppointmentStatus(row.name);
    if (!CANONICAL_APPOINTMENT_STATUSES.includes(name)) return;
    byName.set(name, {
      ...byName.get(name),
      ...row,
      name,
    });
  });
  return CANONICAL_APPOINTMENT_STATUSES.map((name) => byName.get(name)).filter(Boolean);
}

/**
 * Ops dashboard board: full canonical workflow set, then any active custom
 * statuses from the appointment-status catalog (admin).
 */
export function getOpsDashboardAppointmentStatuses(catalog = []) {
  const canonical = getCanonicalAppointmentStatuses(catalog);
  const canonicalNames = new Set(
    canonical.map((row) => normalizeAppointmentStatus(row.name)),
  );
  const customs = (catalog || [])
    .filter((row) => {
      const name = String(row?.name || '').trim();
      if (!name) return false;
      return !canonicalNames.has(normalizeAppointmentStatus(name));
    })
    .map((row) => ({
      ...row,
      name: String(row.name).trim(),
    }))
    .sort((a, b) => {
      const orderDiff = (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0);
      if (orderDiff !== 0) return orderDiff;
      return a.name.localeCompare(b.name);
    });
  return [...canonical, ...customs];
}

/** @deprecated Use appointmentStatusApi.getActive() — sync fallback only */
export function getAppointmentStatuses() {
  return getAppointmentStatusesFallback();
}

export function getDefaultAppointmentStatusName(catalog = getAppointmentStatusesFallback()) {
  return catalog[0]?.name || APPOINTMENT_STATUS.SCHEDULED;
}

export { normalizeAppointmentStatus, APPOINTMENT_STATUS };
