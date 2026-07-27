export const ONCOLOGY_HEMATOLOGY_SECTIONS = [
  { id: 'staging-cycle', label: 'Staging / Cycle Day' },
  { id: 'neutropenia-fever', label: 'Neutropenia / Fever Screen' },
  { id: 'supportive-advance', label: 'Chemo Supportive / Advance Care' },
];

export const YES_NO_OPTIONS = ['Yes', 'No'];
export const YES_NO_UNKNOWN_OPTIONS = ['Yes', 'No', 'Unknown'];

export const VISIT_TYPE_OPTIONS = [
  'New Consult',
  'Treatment Visit',
  'Cycle Check',
  'Survivorship',
  'Urgent / Sick Visit',
  'Infusion Day',
  'Post-treatment Follow-up',
];

export const DISEASE_CATEGORY_OPTIONS = [
  'Solid Tumor',
  'Hematologic Malignancy',
  'Benign Hematology',
  'Survivorship / Late Effects',
  'Undiagnosed / Workup',
];

export const PRIMARY_SITE_OPTIONS = [
  'Breast',
  'Lung / Thoracic',
  'Colorectal',
  'Prostate',
  'Gynecologic',
  'Head & Neck',
  'Melanoma / Skin',
  'Pancreas / Hepatobiliary',
  'Kidney / Bladder',
  'Lymphoma',
  'Leukemia',
  'Multiple Myeloma',
  'Other / Specify',
];

export const TNM_T_OPTIONS = ['Tx', 'Tis', 'T0', 'T1', 'T2', 'T3', 'T4', 'Not Applicable'];
export const TNM_N_OPTIONS = ['Nx', 'N0', 'N1', 'N2', 'N3', 'Not Applicable'];
export const TNM_M_OPTIONS = ['Mx', 'M0', 'M1', 'Not Applicable'];

export const STAGE_GROUP_OPTIONS = [
  '0',
  'I',
  'IA',
  'IB',
  'II',
  'IIA',
  'IIB',
  'III',
  'IIIA',
  'IIIB',
  'IIIC',
  'IV',
  'IVA',
  'IVB',
  'Not Staged',
  'Unknown',
];

export const TREATMENT_INTENT_OPTIONS = [
  'Curative / Definitive',
  'Neoadjuvant',
  'Adjuvant',
  'Palliative / Disease Control',
  'Maintenance',
  'Watch & Wait',
  'Supportive Care Only',
];

export const TREATMENT_MODALITY_OPTIONS = [
  'Cytotoxic Chemotherapy',
  'Immunotherapy',
  'Targeted Therapy',
  'Hormonal Therapy',
  'Radiation',
  'Surgery',
  'Stem Cell Transplant',
  'Transfusion Support',
  'Clinical Trial',
  'Observation',
];

export const ECOG_OPTIONS = [
  '0 — Fully active',
  '1 — Restricted strenuous activity',
  '2 — Ambulatory, unable to work',
  '3 — Limited self-care, >50% in bed/chair',
  '4 — Completely disabled',
  '5 — Dead',
  'Not Assessed',
];

export const CYCLE_PHASE_OPTIONS = [
  'Pre-treatment',
  'On Cycle',
  'Between Cycles',
  'Holding / Delay',
  'Completed Protocol',
  'Progression / Change of Therapy',
];

export const FEVER_SOURCE_OPTIONS = [
  'Home / Patient Report',
  'Clinic',
  'Infusion Suite',
  'ED',
  'Inpatient',
  'Unknown',
];

export const NEUTROPENIA_SYMPTOM_OPTIONS = [
  'Fever ≥38.0°C (100.4°F)',
  'Chills / Rigors',
  'Mucositis',
  'Cough / Dyspnea',
  'Dysuria',
  'Diarrhea',
  'Abdominal Pain',
  'Skin / Line Redness',
  'Hypotension / Shock Concerns',
  'Altered Mental Status',
  'None Reported',
];

export const ANC_RISK_OPTIONS = [
  'ANC ≥1500 (Normal)',
  'ANC 1000–1499 (Mild)',
  'ANC 500–999 (Moderate)',
  'ANC <500 (Severe)',
  'Unknown / Pending',
];

export const FN_RISK_OPTIONS = [
  'Low Risk',
  'Intermediate Risk',
  'High Risk',
  'Not Stratified',
];

export const FN_DISPOSITION_OPTIONS = [
  'Home with Precautions',
  'Oral Antibiotics / Close Follow-up',
  'ED Evaluation',
  'Hospital Admission',
  'Already Inpatient',
  'Continue Current Plan',
];

export const SUPPORTIVE_CARE_OPTIONS = [
  'Antiemetic Prophylaxis Reviewed',
  'G-CSF / Growth Factor',
  'Antimicrobial Prophylaxis',
  'Tumor Lysis Precautions',
  'Hydration Plan',
  'Transfusion Support Plan',
  'Pain Management Reviewed',
  'Nutrition / Appetite Support',
  'Constipation / Diarrhea Plan',
  'Mucositis Care',
  'VTE Prophylaxis',
  'Fertility / Contraception Counseling',
];

export const ADVANCE_DIRECTIVE_OPTIONS = [
  'On File / Reviewed',
  'Discussed — Patient Completing',
  'Not Discussed',
  'Patient Declined Discussion',
  'Unknown',
];

export const CODE_STATUS_OPTIONS = [
  'Full Code',
  'DNR',
  'DNI',
  'DNR/DNI',
  'Limited Intervention',
  'Comfort Measures Only',
  'Not Discussed',
  'Unknown',
];

export const GOALS_OF_CARE_OPTIONS = [
  'Cure-directed',
  'Life-prolonging / Disease control',
  'Symptom-focused / Comfort',
  'Transitioning goals',
  'Not Discussed Today',
];

export const FOLLOW_UP_INTERVAL_OPTIONS = [
  '24–48 Hours',
  '1 Week',
  '2 Weeks',
  'Next Cycle Day',
  '1 Month',
  '3 Months',
  'As Needed / PRN',
  'ED / Urgent if fever',
];
