import { SCREENINGS } from './screeningDefinitions';
import { showMenstrualAssessment } from './intakeConstants';

/** Nurse Assessment sections — `id` must match the DOM id on each section card. */
export const NURSE_ASSESSMENT_NAV = [
  { id: 'assessment-chief-complaint', label: 'Chief complaint' },
  { id: 'assessment-vitals', label: 'Vitals' },
  { id: 'assessment-allergies', label: 'Allergies' },
  { id: 'assessment-med-reconciliation', label: 'Med reconciliation' },
  { id: 'assessment-ros', label: 'Review of systems' },
  { id: 'assessment-medication-history', label: 'Past medical history' },
  { id: 'assessment-immunization', label: 'Immunizations' },
  { id: 'assessment-surgical-history', label: 'Surgical history' },
  { id: 'assessment-social-history', label: 'Social history' },
  { id: 'assessment-family-history', label: 'Family history' },
  {
    id: 'assessment-menstrual',
    label: 'Menstrual assessment',
    visible: (patient) => showMenstrualAssessment(patient),
  },
  { id: 'assessment-hospital-ed', label: 'Hospital / ED visit' },
  { id: 'assessment-signature', label: 'Signature' },
];

export const PATIENT_SCREENING_NAV = SCREENINGS.map((item) => ({
  id: `screening-${item.id}`,
  label: item.definition?.name || item.id,
}));

export function getIntakeNavItems(mode, patient) {
  if (mode === 'patient-screening') return PATIENT_SCREENING_NAV;
  return NURSE_ASSESSMENT_NAV.filter((item) => {
    if (typeof item.visible === 'function') return item.visible(patient);
    return true;
  });
}
