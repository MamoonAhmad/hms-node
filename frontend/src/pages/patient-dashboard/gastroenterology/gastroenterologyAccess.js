import {
  GI_ALLOWED_SPECIALTY_CODES,
  GI_ALLOWED_SPECIALTY_NAMES,
  GI_DEPARTMENT_ALIASES,
} from './gastroenterologyConstants';
import { getDepartmentBySlug } from '@/pages/others/departmentEncounterDepartments';

function normalizeSpecialtyText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_/&]+/g, ' ')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ');
}

function specialtyTokens(specialty) {
  if (!specialty) return [];
  if (typeof specialty === 'string') return [normalizeSpecialtyText(specialty)];
  return [specialty.name, specialty.code, specialty.displayName]
    .filter(Boolean)
    .map(normalizeSpecialtyText);
}

/**
 * Gastroenterology tab visibility for GI / Hepatology specialty matches
 * or GI department routes (optional clinic specialty override via localStorage).
 */
export function showGastroenterologyTab({
  user,
  appointment,
  chartSummary,
  departmentSlug,
} = {}) {
  if (departmentSlug && GI_DEPARTMENT_ALIASES.includes(normalizeSpecialtyText(departmentSlug))) {
    return true;
  }

  const giDept = getDepartmentBySlug('gastroenterology');
  // Encounter context only (appointment / chart provider) — not the signed-in user's specialty.
  const candidates = [
    ...specialtyTokens(chartSummary?.provider?.specialty),
    ...specialtyTokens(appointment?.providerRef?.specialty),
    ...specialtyTokens(appointment?.provider?.specialty),
    ...specialtyTokens(appointment?.Provider?.specialty),
    appointment?.departmentRef?.departmentName,
    appointment?.department,
    appointment?.departmentName,
    appointment?.specialty,
  ]
    .map(normalizeSpecialtyText)
    .filter(Boolean);

  if (!candidates.length) return false;

  const aliases = [
    ...GI_ALLOWED_SPECIALTY_NAMES,
    ...GI_ALLOWED_SPECIALTY_CODES,
    ...GI_DEPARTMENT_ALIASES,
    ...(giDept?.aliases || []),
    giDept?.name,
  ]
    .map(normalizeSpecialtyText)
    .filter(Boolean);

  // Optional clinic override: localStorage JSON array of specialty names/codes.
  try {
    const raw = localStorage.getItem('hms:gi-allowed-specialties');
    if (raw) {
      const configured = JSON.parse(raw);
      if (Array.isArray(configured)) {
        aliases.push(...configured.map(normalizeSpecialtyText).filter(Boolean));
      }
    }
  } catch {
    /* ignore */
  }

  return candidates.some((text) =>
    aliases.some(
      (alias) => text === alias || text.includes(alias) || alias.includes(text),
    ),
  );
}

/** @deprecated Prefer showGastroenterologyTab */
export function canAccessGastroenterologyTab(args) {
  return showGastroenterologyTab(args);
}
