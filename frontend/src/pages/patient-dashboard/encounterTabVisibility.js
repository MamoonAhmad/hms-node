/**
 * Encounter chart tab visibility by department, patient age, and gender.
 */

import {
  DEPARTMENT_ENCOUNTER_DEPARTMENTS,
  encounterMatchesDepartment,
  getDepartmentBySlug,
} from '@/pages/others/departmentEncounterDepartments';
import { isFemalePatient, showGrowthChartTab } from './intake/intakeConstants';

/** Departments where Women's Health / OB-GYN chart tab is appropriate. */
const WOMENS_HEALTH_DEPARTMENTS = new Set(['ob-gyn', 'internal-medicine']);

/**
 * Generic PatientDashboard specialty tab id → department slug.
 * Only the matching department's specialty tab is shown.
 */
export const SPECIALTY_CHART_TAB_DEPARTMENTS = {
  'womens-health': 'ob-gyn',
  'orthopedics-msk': 'orthopedics',
  dermatology: 'dermatology',
  ophthalmology: 'ophthalmology',
  neurology: 'neurology',
  psychiatry: 'psychiatry',
  endocrinology: 'endocrinology',
  pulmonology: 'pulmonology',
  rheumatology: 'rheumatology',
  'oncology-hematology': 'oncology-hematology',
  urology: 'urology',
  nephrology: 'nephrology',
  'pmr-pt': 'pmr-pt',
  ent: 'ent',
  gastroenterology: 'gastroenterology',
};

function normalizeDeptText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_/&]+/g, ' ')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ');
}

function specialtyCandidateTexts({ appointment, chartSummary } = {}) {
  const specialty = chartSummary?.provider?.specialty || appointment?.provider?.specialty;
  const specialtyParts =
    specialty && typeof specialty === 'object'
      ? [specialty.name, specialty.code, specialty.displayName]
      : [specialty];

  return [
    ...specialtyParts,
    appointment?.providerRef?.specialty?.name,
    appointment?.providerRef?.specialty,
    appointment?.Provider?.specialty,
    appointment?.departmentRef?.departmentName,
    appointment?.department,
    appointment?.departmentName,
    appointment?.specialty,
  ]
    .map(normalizeDeptText)
    .filter(Boolean);
}

/** Resolve encounter department slug from route or appointment/provider context. */
export function resolveEncounterDepartmentSlug({
  departmentSlug,
  appointment,
  chartSummary,
} = {}) {
  if (departmentSlug && getDepartmentBySlug(departmentSlug)) {
    return departmentSlug;
  }

  for (const dept of DEPARTMENT_ENCOUNTER_DEPARTMENTS) {
    if (encounterMatchesDepartment(appointment, dept)) {
      return dept.slug;
    }
  }

  const candidates = specialtyCandidateTexts({ appointment, chartSummary });
  if (!candidates.length) return null;

  for (const dept of DEPARTMENT_ENCOUNTER_DEPARTMENTS) {
    const aliases = [
      dept.name,
      dept.slug.replace(/-/g, ' '),
      ...(dept.aliases || []),
    ].map(normalizeDeptText);

    const matched = candidates.some((text) =>
      aliases.some(
        (alias) => text === alias || text.includes(alias) || alias.includes(text),
      ),
    );
    if (matched) return dept.slug;
  }

  return null;
}

/** Growth Chart: age < 10, or Pediatrics department. */
export function showGrowthChartForEncounter(patient, departmentSlug) {
  if (departmentSlug === 'pediatrics') return true;
  return showGrowthChartTab(patient);
}

/**
 * Women's Health / OB-GYN tab: female patients in OB/GYN, Internal Medicine,
 * or when department is unknown (treat as primary-care style chart).
 */
export function showWomensHealthTab(patient, departmentSlug) {
  if (!isFemalePatient(patient)) return false;
  if (!departmentSlug) return true;
  return WOMENS_HEALTH_DEPARTMENTS.has(departmentSlug);
}

/** Whether OB/GYN specialty workspace tabs may appear. */
export function showObGynSpecialtyTabs(patient) {
  return isFemalePatient(patient);
}

/** Demo / Sample Patient chart: show every specialty workspace regardless of department. */
export function showAllChartTabsForPatient(patient) {
  return Boolean(patient?.showAllChartTabs || patient?.id === 'sample');
}

/**
 * Whether a generic-dashboard specialty tab should appear for this encounter.
 * Core tabs are not passed here — they are always shown.
 */
export function shouldShowSpecialtyChartTab(
  tabId,
  { patient, departmentSlug, resolvedDepartmentSlug } = {},
) {
  if (showAllChartTabsForPatient(patient)) return true;

  const dept = resolvedDepartmentSlug ?? departmentSlug ?? null;

  if (tabId === 'growth-chart') {
    return showGrowthChartForEncounter(patient, dept);
  }

  if (tabId === 'womens-health') {
    return showWomensHealthTab(patient, dept);
  }

  const requiredDept = SPECIALTY_CHART_TAB_DEPARTMENTS[tabId];
  if (!requiredDept) return true;

  // No department context → hide specialty workspaces (core-only chart).
  if (!dept) return false;

  return dept === requiredDept;
}
