import { calcAge } from '../patientChartUtils';
import {
  OPEN_CARE_GAP_STATUSES,
  PREVENTIVE_CARE_PROTOCOLS,
} from './careGapProtocols';

function normalizeSex(patient) {
  const raw = String(patient?.gender || patient?.sex || patient?.genderIdentity || '')
    .trim()
    .toLowerCase();
  if (raw.startsWith('f')) return 'Female';
  if (raw.startsWith('m')) return 'Male';
  return null;
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatReason(template, { age, sex }) {
  return String(template || '')
    .replaceAll('{age}', age != null ? String(age) : '—')
    .replaceAll('{sex}', sex || 'patient');
}

/** Stable pseudo-random 0–1 from patient + protocol ids (demo last-performed). */
function demoUnit(patientId, protocolId) {
  const key = `${patientId || 'sample'}::${protocolId}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return (hash % 1000) / 1000;
}

/**
 * Build a plausible last-performed date for demo charts when history is unknown.
 * Returns null for never-done items (creates overdue/due gaps).
 */
function demoLastPerformed(protocol, patientId, today) {
  const unit = demoUnit(patientId, protocol.id);
  // ~25% never documented → open gap
  if (unit < 0.25) return null;

  const monthsAgo = Math.round(protocol.intervalMonths * (0.4 + unit * 0.9));
  const last = addMonths(today, -monthsAgo);
  return startOfDay(last);
}

function deriveStatus(nextDue, today) {
  if (!nextDue) return 'Due';
  const due = startOfDay(nextDue);
  const now = startOfDay(today);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntil = Math.round((due - now) / msPerDay);

  if (daysUntil < 0) return 'Overdue';
  if (daysUntil <= 30) return 'Due';
  if (daysUntil <= 90) return 'Due Soon';
  return 'Completed';
}

export function isProtocolEligible(protocol, { age, sex }) {
  if (age == null || Number.isNaN(age)) return false;
  if (protocol.minAge != null && age < protocol.minAge) return false;
  if (protocol.maxAge != null && age > protocol.maxAge) return false;
  if (protocol.sex && sex && protocol.sex !== sex) return false;
  // Sex-specific items require known sex
  if (protocol.sex && !sex) return false;
  return true;
}

/**
 * Evaluate preventive care gaps for a patient.
 * Overrides (from visit documentation) merge on top of computed rows.
 *
 * @param {object|null} patient
 * @param {Record<string, object>} [overrides]
 * @returns {object[]}
 */
export function evaluateCareGaps(patient, overrides = {}) {
  const age = calcAge(patient?.dateOfBirth);
  const sex = normalizeSex(patient);
  const today = startOfDay(new Date());
  const patientId = patient?.id;

  return PREVENTIVE_CARE_PROTOCOLS.filter((protocol) =>
    isProtocolEligible(protocol, { age, sex }),
  ).map((protocol) => {
    const override = overrides[protocol.id] || null;
    const lastPerformed =
      override?.lastPerformed !== undefined
        ? override.lastPerformed
          ? startOfDay(override.lastPerformed)
          : null
        : demoLastPerformed(protocol, patientId, today);

    const nextDue = lastPerformed
      ? addMonths(lastPerformed, protocol.intervalMonths)
      : today;

    let status = override?.status || deriveStatus(lastPerformed ? nextDue : null, today);
    // If still in cadence window and no override forcing open status, mark completed
    if (!override?.status && lastPerformed && status === 'Completed') {
      status = 'Completed';
    }

    return {
      id: protocol.id,
      name: protocol.name,
      category: protocol.category,
      description: protocol.description,
      status,
      lastPerformed: lastPerformed ? lastPerformed.toISOString() : null,
      nextDue: nextDue ? nextDue.toISOString() : null,
      intervalMonths: protocol.intervalMonths,
      reason: formatReason(protocol.reasonTemplate, { age, sex }),
      orderHint: protocol.orderHint,
      age,
      sex,
      notes: override?.notes || '',
      documentedAt: override?.documentedAt || null,
      documentedBy: override?.documentedBy || null,
    };
  });
}

export function countOpenCareGaps(patient, overrides = {}) {
  return evaluateCareGaps(patient, overrides).filter((gap) =>
    OPEN_CARE_GAP_STATUSES.has(gap.status),
  ).length;
}

export function careGapStorageKey(patientId, appointmentId) {
  return `hms.careGaps.v1.${patientId || 'unknown'}.${appointmentId || 'none'}`;
}

export function loadCareGapOverrides(patientId, appointmentId) {
  try {
    const raw = localStorage.getItem(careGapStorageKey(patientId, appointmentId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveCareGapOverrides(patientId, appointmentId, overrides) {
  try {
    localStorage.setItem(
      careGapStorageKey(patientId, appointmentId),
      JSON.stringify(overrides),
    );
    window.dispatchEvent(
      new CustomEvent('hms:care-gaps-updated', {
        detail: { patientId, appointmentId },
      }),
    );
  } catch {
    // ignore quota / private mode
  }
}

export function formatCareGapDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
