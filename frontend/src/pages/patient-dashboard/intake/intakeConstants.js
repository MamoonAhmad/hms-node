export const INTAKE_SECTIONS = {
  CHIEF_COMPLAINT_HPI: 'chief_complaint_hpi',
  VITALS: 'vitals',
  MEDICATION_RECONCILIATION: 'medication_reconciliation',
  ROS: 'ros',
  MEDICATION_HISTORY: 'medication_history',
  IMMUNIZATION: 'immunization',
  SURGICAL_HISTORY: 'surgical_history',
  SOCIAL_HISTORY: 'social_history',
  FAMILY_HISTORY: 'family_history',
  MENSTRUAL_ASSESSMENT: 'menstrual_assessment',
  HOSPITAL_ED_VISIT: 'hospital_ed_visit',
  GROWTH_CHART: 'growth_chart',
};

export const MENSTRUAL_REGULARITY_OPTIONS = [
  'Regular',
  'Irregular',
  'Amenorrhea',
  'Post-Menopausal',
  'Not Applicable',
];

export const MENSTRUAL_FLOW_OPTIONS = ['Light', 'Moderate', 'Heavy', 'Spotting'];

export const MENSTRUAL_PAIN_OPTIONS = ['None', 'Mild', 'Moderate', 'Severe'];

export const MENSTRUAL_SYMPTOMS = [
  'Cramps',
  'Bloating',
  'Headache',
  'Mood changes',
  'Breast tenderness',
  'Fatigue',
  'Nausea',
  'Back pain',
];

export const CONTRACEPTION_OPTIONS = [
  'None',
  'Oral contraceptive',
  'IUD',
  'Implant',
  'Injection',
  'Patch / Ring',
  'Barrier',
  'Sterilization',
  'Other',
];

export const FEEDING_TYPE_OPTIONS = [
  'Breastfed',
  'Formula',
  'Mixed feeding',
  'Solid foods',
  'Not applicable',
];


export const SCREENING_SECTIONS = {
  FALL_RISK: 'screening_fall_risk',
  SUICIDE: 'screening_suicide',
  HUNGER: 'screening_hunger',
  PHQ9: 'screening_phq9',
  DAST10: 'screening_dast10',
  GAD7: 'screening_gad7',
  NIH_STROKE: 'screening_nih_stroke',
  PAIN: 'screening_pain',
};

export const SCREENING_LABELS = {
  [SCREENING_SECTIONS.FALL_RISK]: 'Fall Risk',
  [SCREENING_SECTIONS.SUICIDE]: 'Suicide Assessment',
  [SCREENING_SECTIONS.HUNGER]: 'Hunger Screening',
  [SCREENING_SECTIONS.PHQ9]: 'PHQ-9 Depression Screening',
  [SCREENING_SECTIONS.DAST10]: 'Drug Abuse Screening (DAST-10)',
  [SCREENING_SECTIONS.GAD7]: 'GAD-7 Anxiety Severity',
  [SCREENING_SECTIONS.NIH_STROKE]: 'NIH Stroke Scale',
  [SCREENING_SECTIONS.PAIN]: 'Pain Assessment',
};

export const HPI_ONSET_OPTIONS = [
  'Sudden', 'Gradual', 'Insidious', 'Unknown',
];

export const HPI_LOCATION_OPTIONS = [
  'Head', 'Chest', 'Abdomen', 'Back', 'Extremities', 'Generalized', 'Other',
];

export const HPI_DURATION_OPTIONS = [
  'Minutes', 'Hours', 'Days', 'Weeks', 'Months', 'Years', 'Intermittent',
];

export const HPI_CHARACTER_OPTIONS = [
  'Sharp', 'Dull', 'Burning', 'Aching', 'Throbbing', 'Cramping', 'Pressure',
];

export const HPI_TIMING_OPTIONS = [
  'Constant', 'Intermittent', 'Worse in morning', 'Worse at night', 'Activity-related',
];

export const HPI_SEVERITY_OPTIONS = [
  'Mild', 'Moderate', 'Severe', 'Worst ever',
];

export const HPI_ASSOCIATED_SYMPTOMS = [
  'Fever', 'Nausea', 'Vomiting', 'Diarrhea', 'Shortness of breath',
  'Dizziness', 'Fatigue', 'Cough', 'Sweating', 'Weakness',
];

export const MEDICATION_ACTIONS = [
  'Take', 'Apply', 'Inject', 'Inhale', 'Instill', 'Chew', 'Dissolve',
];

export const MEDICATION_ROUTES = [
  'Oral', 'Topical', 'IV', 'IM', 'Subcutaneous', 'Inhalation', 'Rectal', 'Sublingual',
];

export const MEDICATION_FREQUENCIES = [
  'Once daily', 'Twice daily', 'Three times daily', 'Four times daily',
  'Every 4 hours', 'Every 6 hours', 'Every 8 hours', 'Every 12 hours',
  'As needed', 'Weekly', 'Monthly',
];

export const FAMILY_RELATIONSHIPS = [
  'Mother', 'Father', 'Sister', 'Brother', 'Daughter', 'Son',
  'Maternal Grandmother', 'Maternal Grandfather', 'Paternal Grandmother', 'Paternal Grandfather',
  'Maternal Aunt', 'Maternal Uncle', 'Paternal Aunt', 'Paternal Uncle',
  'Cousin', 'Twin', 'Other Relative',
];

export const VISIT_TYPES = [
  'Emergency Department Visit',
  'Inpatient Admission',
  'Observation Stay',
  'Urgent Care Visit',
  'Same Day Surgery',
  'Skilled Nursing Facility',
  'Rehabilitation Facility',
  'Other',
];

export const VISIT_OUTCOMES = [
  'Discharged Home',
  'Admitted',
  'Transferred',
  'Left Against Medical Advice (AMA)',
  'Expired',
  'Observation',
  'Unknown',
];

export const ANESTHESIA_TYPES = [
  'General', 'Local', 'Regional', 'Spinal', 'Epidural', 'Sedation', 'None', 'Unknown',
];

export const SURGICAL_OUTCOMES = [
  'Successful', 'Partially Successful', 'Unsuccessful', 'Complication Occurred', 'Unknown',
];

export const PROBLEM_STATUSES = ['Active', 'Inactive', 'Resolved', 'Chronic'];
export const PROBLEM_SEVERITIES = ['Mild', 'Moderate', 'Severe', 'Critical', 'Unknown'];
export const PROBLEM_CHRONICITIES = ['Acute', 'Chronic', 'Intermittent', 'Recurrent', 'Unknown'];

export function buildHpiNarrative(hpi) {
  const parts = [];
  if (hpi.onset) parts.push(`Onset: ${hpi.onset}`);
  if (hpi.location) parts.push(`Location: ${hpi.location}`);
  if (hpi.duration) parts.push(`Duration: ${hpi.duration}`);
  if (hpi.character) parts.push(`Character: ${hpi.character}`);
  if (hpi.timing) parts.push(`Timing: ${hpi.timing}`);
  if (hpi.severity) parts.push(`Severity: ${hpi.severity}`);
  if (hpi.aggravating) parts.push(`Aggravating factors: ${hpi.aggravating}`);
  if (hpi.relieving) parts.push(`Relieving factors: ${hpi.relieving}`);
  if (hpi.associatedSymptoms?.length) {
    parts.push(`Associated symptoms: ${hpi.associatedSymptoms.join(', ')}`);
  }
  if (hpi.additionalNotes) parts.push(hpi.additionalNotes);
  return parts.join('. ');
}

export function calculateAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

/**
 * True when the patient should see female-specific clinical intake sections
 * (e.g. Menstrual Assessment).
 *
 * Checks sex/gender and gender identity independently — do not short-circuit on
 * the first field, because registration can store sex as male while identity is
 * female (or AFAB patients with transgender-male identity).
 */
export function isFemalePatient(patient) {
  if (!patient) return false;

  const candidates = [
    patient.gender,
    patient.sex,
    patient.sexAssignedAtBirth,
    patient.biologicalSex,
    patient.genderIdentity,
  ]
    .map((v) => String(v || '').toLowerCase().trim())
    .filter(Boolean);

  return candidates.some((g) => {
    if (g === 'f' || g === 'female' || g === 'woman') return true;
    if (g === 'transgender-female' || g === 'transgender female') return true;
    // Catch labeled variants like "Female (assigned at birth)"
    if (g.includes('female') && !g.includes('male')) return true;
    return false;
  });
}

export function showFemaleVitalsFields(patient) {
  const age = calculateAge(patient?.dateOfBirth);
  return isFemalePatient(patient) && age !== null && age >= 8;
}

export function showChildbearingFields(patient) {
  const age = calculateAge(patient?.dateOfBirth);
  return isFemalePatient(patient) && age !== null && age >= 12 && age <= 55;
}

/** Menstrual Assessment section: female patients older than 11 years. */
export function showMenstrualAssessment(patient) {
  const age = calculateAge(patient?.dateOfBirth);
  return isFemalePatient(patient) && age !== null && age > 11;
}

/** Growth Chart tab: pediatric patients under 10 years. */
export function showGrowthChartTab(patient) {
  const age = calculateAge(patient?.dateOfBirth);
  return age !== null && age < 10;
}
