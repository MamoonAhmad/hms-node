export const PREGNANCY_STATUS_OPTIONS = [
  'Pregnant',
  'Not Pregnant',
  'Postpartum',
  'Unknown',
];

export const PREGNANCY_RISK_FACTORS = [
  'Diabetes',
  'Hypertension',
  'Multiple Gestation',
  'Advanced Maternal Age',
  'Prior Preterm Birth',
  'Obesity',
  'Smoking',
  'Previous Cesarean',
  'Thyroid Disorder',
  'Autoimmune Disease',
  'Other',
];

export const DATING_METHOD_OPTIONS = [
  'LMP',
  'First Trimester Ultrasound',
  'IVF',
  'Unknown',
];

export const PREGNANCY_CONFIRMED_BY_OPTIONS = [
  'Urine hCG',
  'Serum hCG',
  'Ultrasound',
  'Clinical',
  'Unknown',
];

export const YES_NO_OPTIONS = ['Yes', 'No'];

export const FETAL_MOVEMENT_OPTIONS = ['Present', 'Absent', 'Reduced'];

export const FETAL_PRESENTATION_OPTIONS = [
  'Cephalic',
  'Breech',
  'Transverse',
  'Oblique',
  'Unknown',
  'N/A',
];

export const OEDEMA_OPTIONS = ['None', 'Mild', 'Moderate', 'Severe'];

export const PREGNANCY_SYMPTOMS = [
  'Nausea',
  'Vomiting',
  'Heartburn',
  'Constipation',
  'Back Pain',
  'Pelvic Pain',
  'Headache',
  'Visual Disturbance',
  'Swelling',
  'Shortness of Breath',
  'Decreased Fetal Movement',
  'Contractions',
];

export const PREGNANCY_COMPLICATIONS = [
  'Gestational Diabetes',
  'Chronic Hypertension',
  'Gestational Hypertension',
  'Preeclampsia',
  'Placenta Previa',
  'Placental Abruption',
  'IUGR',
  'Polyhydramnios',
  'Oligohydramnios',
  'Rh Negative',
  'Preterm Labour',
  'Multiple Gestation',
];

export const PREGNANCY_MEDICATION_FLAGS = [
  { key: 'prenatalVitamins', label: 'Prenatal Vitamins' },
  { key: 'aspirin', label: 'Aspirin' },
  { key: 'iron', label: 'Iron' },
  { key: 'calcium', label: 'Calcium' },
  { key: 'folicAcid', label: 'Folic Acid' },
];

export const FOLLOW_UP_INTERVAL_OPTIONS = [
  '1 week',
  '2 weeks',
  '3 weeks',
  '4 weeks',
  'As needed',
  'Other',
];

export const GYN_VISIT_TYPES = [
  'Annual Well Woman',
  'Problem Visit',
  'Follow-up',
  'Pregnancy Visit',
  'Postpartum',
];

export const MENOPAUSE_STATUS_OPTIONS = [
  'Premenopausal',
  'Perimenopausal',
  'Postmenopausal',
  'Surgical menopause',
  'Unknown',
];

export const FLOW_OPTIONS = ['Light', 'Moderate', 'Heavy', 'Spotting'];

export const BREAST_EXAM_FINDINGS = [
  'Normal',
  'Mass',
  'Tenderness',
  'Nipple Discharge',
  'Skin Changes',
  'Lymphadenopathy',
];

export const EXTERNAL_GENITALIA_FINDINGS = [
  'Normal',
  'Lesion',
  'Rash',
  'Ulcer',
  'Swelling',
  'Other',
];

export const VAGINAL_EXAM_FINDINGS = [
  'Normal',
  'Discharge',
  'Atrophy',
  'Bleeding',
  'Lesion',
  'Foreign Body',
];

export const CERVIX_FINDINGS = [
  'Normal',
  'Erosion',
  'Polyp',
  'Friable',
  'Bleeding',
  'Lesion',
  'Cervicitis',
];

export const UTERUS_FINDINGS = [
  'Normal',
  'Enlarged',
  'Tender',
  'Fibroid',
  'Retroverted',
];

export const ADNEXA_FINDINGS = ['Normal', 'Tenderness', 'Mass', 'Fullness'];

export const RECTOVAGINAL_OPTIONS = ['Performed', 'Normal', 'Abnormal', 'Not performed'];

export const BETHESDA_OPTIONS = [
  'NILM',
  'ASC-US',
  'ASC-H',
  'LSIL',
  'HSIL',
  'AGC',
  'AIS',
  'Squamous cell carcinoma',
  'Unsatisfactory',
  'Pending',
  'N/A',
];

export const STI_TESTS = [
  'Gonorrhoea',
  'Chlamydia',
  'HIV',
  'Syphilis',
  'Trichomonas',
  'HSV',
];

export const GYN_PLAN_ACTIONS = [
  'Repeat Pap',
  'Colposcopy',
  'Biopsy',
  'Ultrasound',
  'Medication',
  'Referral',
  'Follow-up',
];

export const LAB_STATUS_OPTIONS = [
  'Ordered',
  'Scheduled',
  'Collected',
  'In Progress',
  'Completed',
  'Reviewed',
  'Abnormal',
  'Cancelled',
];

/** Default prenatal lab panel rows. */
export const PRENATAL_LAB_PANEL = [
  // First prenatal
  { id: 'blood-type', testName: 'Blood Type', trimester: 'First Prenatal', category: 'First Prenatal Labs' },
  { id: 'rh-factor', testName: 'Rh Factor', trimester: 'First Prenatal', category: 'First Prenatal Labs' },
  { id: 'antibody-screen', testName: 'Antibody Screen', trimester: 'First Prenatal', category: 'First Prenatal Labs' },
  { id: 'cbc-1', testName: 'CBC', trimester: 'First Prenatal', category: 'First Prenatal Labs' },
  { id: 'rubella', testName: 'Rubella Immunity', trimester: 'First Prenatal', category: 'First Prenatal Labs' },
  { id: 'varicella', testName: 'Varicella Immunity', trimester: 'First Prenatal', category: 'First Prenatal Labs' },
  { id: 'hiv-1', testName: 'HIV', trimester: 'First Prenatal', category: 'First Prenatal Labs' },
  { id: 'hbsag', testName: 'Hepatitis B Surface Antigen', trimester: 'First Prenatal', category: 'First Prenatal Labs' },
  { id: 'hcv', testName: 'Hepatitis C', trimester: 'First Prenatal', category: 'First Prenatal Labs' },
  { id: 'syphilis-1', testName: 'Syphilis (RPR/VDRL)', trimester: 'First Prenatal', category: 'First Prenatal Labs' },
  { id: 'gc-1', testName: 'Gonorrhoea', trimester: 'First Prenatal', category: 'First Prenatal Labs' },
  { id: 'ct-1', testName: 'Chlamydia', trimester: 'First Prenatal', category: 'First Prenatal Labs' },
  { id: 'ua', testName: 'Urinalysis', trimester: 'First Prenatal', category: 'First Prenatal Labs' },
  { id: 'urine-culture', testName: 'Urine Culture', trimester: 'First Prenatal', category: 'First Prenatal Labs' },
  // Second trimester
  { id: 'gct', testName: 'Glucose Challenge Test', trimester: 'Second Trimester', category: 'Second Trimester' },
  { id: 'gtt', testName: 'Glucose Tolerance Test', trimester: 'Second Trimester', category: 'Second Trimester' },
  { id: 'cbc-2', testName: 'Repeat CBC', trimester: 'Second Trimester', category: 'Second Trimester' },
  { id: 'mss', testName: 'Maternal Serum Screening', trimester: 'Second Trimester', category: 'Second Trimester' },
  // Third trimester
  { id: 'gbs', testName: 'Group B Streptococcus (GBS)', trimester: 'Third Trimester', category: 'Third Trimester' },
  { id: 'hiv-3', testName: 'Repeat HIV (if indicated)', trimester: 'Third Trimester', category: 'Third Trimester' },
  { id: 'syphilis-3', testName: 'Repeat Syphilis (if indicated)', trimester: 'Third Trimester', category: 'Third Trimester' },
  { id: 'cbc-3', testName: 'Repeat CBC', trimester: 'Third Trimester', category: 'Third Trimester' },
  // Genetic
  { id: 'nipt', testName: 'Cell-Free DNA / NIPT', trimester: 'Genetic Testing', category: 'Genetic Testing' },
  { id: 'carrier', testName: 'Carrier Screening', trimester: 'Genetic Testing', category: 'Genetic Testing' },
  { id: 'cf', testName: 'Cystic Fibrosis', trimester: 'Genetic Testing', category: 'Genetic Testing' },
  { id: 'sma', testName: 'SMA', trimester: 'Genetic Testing', category: 'Genetic Testing' },
  { id: 'hemoglobinopathy', testName: 'Hemoglobinopathy Screening', trimester: 'Genetic Testing', category: 'Genetic Testing' },
];

export const WOMENS_HEALTH_SECTIONS = [
  { id: 'obstetric', label: 'Obstetric / Prenatal' },
  { id: 'gyn', label: 'GYN Examination' },
  { id: 'prenatal-labs', label: 'Prenatal Labs' },
];
