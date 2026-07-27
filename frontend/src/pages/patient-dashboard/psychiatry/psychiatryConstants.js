export const PSYCHIATRY_SECTIONS = [
  { id: 'safety-si-hi', label: 'Safety / SI-HI' },
  { id: 'psychopharmacology-therapy', label: 'Psychopharmacology / Therapy' },
];

export const YES_NO_OPTIONS = ['Yes', 'No'];
export const YES_NO_UNKNOWN_OPTIONS = ['Yes', 'No', 'Unknown'];

export const VISIT_TYPE_OPTIONS = [
  'New Patient',
  'Medication Management',
  'Therapy Coordination',
  'Crisis / Safety Evaluation',
  'Follow-up',
  'Bridge Visit',
  'Urgent Visit',
];

export const SI_HI_QUESTIONS = [
  {
    id: 'siWishDead',
    label: 'Wish to be dead or not wake up (passive SI)',
    domain: 'SI',
    riskWeight: 1,
  },
  {
    id: 'siActiveThoughts',
    label: 'Active thoughts of killing self',
    domain: 'SI',
    riskWeight: 2,
  },
  {
    id: 'siMethod',
    label: 'Thoughts about method / how they might do this',
    domain: 'SI',
    riskWeight: 2,
    dependsOn: 'siActiveThoughts',
  },
  {
    id: 'siIntent',
    label: 'Intent to act on suicidal thoughts',
    domain: 'SI',
    riskWeight: 3,
    dependsOn: 'siActiveThoughts',
  },
  {
    id: 'siPlan',
    label: 'Plan with details and intent to carry out',
    domain: 'SI',
    riskWeight: 3,
    dependsOn: 'siActiveThoughts',
  },
  {
    id: 'siBehavior',
    label: 'Lifetime suicidal behavior / preparation (pills, note, weapon, etc.)',
    domain: 'SI',
    riskWeight: 2,
  },
  {
    id: 'siBehaviorRecent',
    label: 'Suicidal behavior / preparation within past 3 months',
    domain: 'SI',
    riskWeight: 3,
    dependsOn: 'siBehavior',
  },
  {
    id: 'hiThoughts',
    label: 'Thoughts of harming others (homicidal ideation)',
    domain: 'HI',
    riskWeight: 2,
  },
  {
    id: 'hiTarget',
    label: 'Identifiable target / person of concern',
    domain: 'HI',
    riskWeight: 2,
    dependsOn: 'hiThoughts',
  },
  {
    id: 'hiPlan',
    label: 'Plan or intent to harm others',
    domain: 'HI',
    riskWeight: 3,
    dependsOn: 'hiThoughts',
  },
  {
    id: 'hiAccessMeans',
    label: 'Access to means to harm others',
    domain: 'HI',
    riskWeight: 2,
    dependsOn: 'hiThoughts',
  },
];

export const PROTECTIVE_FACTOR_OPTIONS = [
  'Family / social supports',
  'Spiritual / cultural beliefs',
  'Future orientation / goals',
  'Responsibility to children / pets',
  'Engaged in treatment',
  'Hope for improvement',
  'Fear of dying / pain',
  'No access to lethal means',
  'Other',
];

export const RISK_FACTOR_OPTIONS = [
  'Prior suicide attempt',
  'Prior psychiatric hospitalization',
  'Active psychosis',
  'Severe depression / hopelessness',
  'Substance intoxication / withdrawal',
  'Recent loss / crisis',
  'Impulsivity',
  'Access to firearms / lethal means',
  'Command hallucinations',
  'Domestic violence / abuse',
  'Social isolation',
  'Other',
];

export const SAFETY_PRECAUTION_OPTIONS = [
  '1:1 observation',
  'Line-of-sight observation',
  'Remove ligature / sharp risks',
  'Secure belongings',
  'Firearm / means counseling',
  'Do not leave unattended',
  'Immediate physician / BH notify',
  'ED / crisis transfer considered',
  'Safety contract discussed',
  'Written safety plan completed',
];

export const DISPOSITION_OPTIONS = [
  'Outpatient — routine follow-up',
  'Outpatient — urgent BH follow-up',
  'Crisis / mobile crisis referral',
  'ED evaluation',
  'Inpatient psychiatric admission',
  'Involuntary hold considered / initiated',
  'Return to community with supports',
];

export const MEDICATION_CLASS_OPTIONS = [
  'SSRI',
  'SNRI',
  'Atypical antidepressant',
  'Mood stabilizer',
  'Atypical antipsychotic',
  'Typical antipsychotic',
  'Benzodiazepine',
  'Stimulant / ADHD',
  'Hypnotic / sleep aid',
  'Other psychotropic',
];

export const SIDE_EFFECT_OPTIONS = [
  'Sedation',
  'Insomnia',
  'Weight gain',
  'Weight loss',
  'Sexual side effects',
  'GI upset',
  'Akathisia / restlessness',
  'EPS / tremor',
  'Metabolic concerns',
  'QTc concern',
  'Emotional blunting',
  'None reported',
];

export const ADHERENCE_OPTIONS = [
  'Excellent (>80%)',
  'Fair (50–80%)',
  'Poor (<50%)',
  'Unknown',
  'Not started',
];

export const THERAPY_MODALITY_OPTIONS = [
  'CBT',
  'DBT',
  'IPT',
  'Supportive psychotherapy',
  'Family / couples therapy',
  'Group therapy',
  'Trauma-focused / EMDR',
  'Substance counseling',
  'Case management',
  'None currently',
];

export const THERAPY_STATUS_OPTIONS = [
  'Not referred',
  'Referral pending',
  'Actively engaged',
  'Infrequent attendance',
  'Declined',
  'Completed / graduated',
  'Waitlisted',
];

export const COORDINATION_ACTIONS = [
  'Spoke with therapist',
  'Message / note sent to therapist',
  'ROI on file',
  'Care conference scheduled',
  'Crisis plan shared with supports',
  'PCP notified',
  'Pharmacy coordination',
  'Prior auth / coverage discussed',
  'None this visit',
];

export const FOLLOW_UP_INTERVAL_OPTIONS = [
  '1 Week',
  '2 Weeks',
  '1 Month',
  '3 Months',
  '6 Months',
  'As Needed',
  'Crisis / PRN return',
];
