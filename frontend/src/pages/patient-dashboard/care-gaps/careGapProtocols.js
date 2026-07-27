/**
 * Organisational preventive care protocols for outpatient encounters.
 * Each item becomes a care-gap row when the patient matches eligibility.
 */

export const CARE_GAP_CATEGORIES = {
  Screening: 'Screening',
  Immunization: 'Immunization',
  'Health Maintenance': 'Health Maintenance',
};

export const CARE_GAP_STATUSES = {
  Overdue: 'Overdue',
  Due: 'Due',
  'Due Soon': 'Due Soon',
  Ordered: 'Ordered',
  Completed: 'Completed',
  Declined: 'Declined',
  'N/A': 'N/A',
};

/** Statuses that need provider attention during the visit. */
export const OPEN_CARE_GAP_STATUSES = new Set(['Overdue', 'Due', 'Due Soon']);

/**
 * @typedef {object} CareGapProtocol
 * @property {string} id
 * @property {string} name
 * @property {'Screening'|'Immunization'|'Health Maintenance'} category
 * @property {string} description
 * @property {number} [minAge]
 * @property {number} [maxAge]
 * @property {'Male'|'Female'|null} [sex]
 * @property {number} intervalMonths - recommended cadence
 * @property {string} reasonTemplate - why this applies (supports {age}, {sex})
 * @property {string} [orderHint] - suggested order wording
 */

/** @type {CareGapProtocol[]} */
export const PREVENTIVE_CARE_PROTOCOLS = [
  {
    id: 'colonoscopy',
    name: 'Colorectal cancer screening',
    category: 'Screening',
    description: 'Colonoscopy or FIT per organisational protocol.',
    minAge: 45,
    maxAge: 75,
    sex: null,
    intervalMonths: 120,
    reasonTemplate: 'Recommended for adults {age}–75 years.',
    orderHint: 'Colonoscopy screening',
  },
  {
    id: 'mammogram',
    name: 'Breast cancer screening (mammogram)',
    category: 'Screening',
    description: 'Biennial mammography for average-risk women.',
    minAge: 40,
    maxAge: 74,
    sex: 'Female',
    intervalMonths: 24,
    reasonTemplate: 'Recommended for women {age}–74 years.',
    orderHint: 'Screening mammogram',
  },
  {
    id: 'cervical',
    name: 'Cervical cancer screening',
    category: 'Screening',
    description: 'Pap / HPV co-testing per age band.',
    minAge: 21,
    maxAge: 65,
    sex: 'Female',
    intervalMonths: 36,
    reasonTemplate: 'Recommended for women {age}–65 years.',
    orderHint: 'Pap smear / HPV',
  },
  {
    id: 'lung-ldct',
    name: 'Lung cancer screening (LDCT)',
    category: 'Screening',
    description: 'Annual low-dose CT when smoking criteria are met.',
    minAge: 50,
    maxAge: 80,
    sex: null,
    intervalMonths: 12,
    reasonTemplate: 'Age {age}; confirm smoking history eligibility.',
    orderHint: 'LDCT lung cancer screening',
  },
  {
    id: 'dxa',
    name: 'Osteoporosis screening (DXA)',
    category: 'Screening',
    description: 'Bone density for postmenopausal / older adults.',
    minAge: 65,
    maxAge: null,
    sex: 'Female',
    intervalMonths: 24,
    reasonTemplate: 'Recommended for women ≥65 years.',
    orderHint: 'DXA bone density',
  },
  {
    id: 'depression',
    name: 'Depression screening',
    category: 'Screening',
    description: 'PHQ-2 / PHQ-9 health maintenance screen.',
    minAge: 18,
    maxAge: null,
    sex: null,
    intervalMonths: 12,
    reasonTemplate: 'Annual depression screen for adults.',
    orderHint: 'Depression screening (PHQ)',
  },
  {
    id: 'a1c',
    name: 'Diabetes screening (A1c / glucose)',
    category: 'Screening',
    description: 'Glycemic screening for adults in screening age band.',
    minAge: 35,
    maxAge: 70,
    sex: null,
    intervalMonths: 36,
    reasonTemplate: 'Recommended for adults {age}–70 years (or with risk factors).',
    orderHint: 'HbA1c',
  },
  {
    id: 'lipid',
    name: 'Lipid panel',
    category: 'Health Maintenance',
    description: 'Cardiovascular risk lipid profile.',
    minAge: 40,
    maxAge: null,
    sex: null,
    intervalMonths: 60,
    reasonTemplate: 'Lipid assessment for adults ≥40 years.',
    orderHint: 'Lipid panel',
  },
  {
    id: 'bp-counseling',
    name: 'Blood pressure / CVD risk review',
    category: 'Health Maintenance',
    description: 'Confirm BP control and lifestyle counseling.',
    minAge: 18,
    maxAge: null,
    sex: null,
    intervalMonths: 12,
    reasonTemplate: 'Annual cardiovascular risk review for adults.',
    orderHint: null,
  },
  {
    id: 'flu',
    name: 'Influenza vaccine',
    category: 'Immunization',
    description: 'Seasonal influenza immunisation.',
    minAge: 0,
    maxAge: null,
    sex: null,
    intervalMonths: 12,
    reasonTemplate: 'Annual influenza vaccine.',
    orderHint: 'Influenza vaccine',
  },
  {
    id: 'covid',
    name: 'COVID-19 vaccine',
    category: 'Immunization',
    description: 'Updated COVID-19 immunisation per season.',
    minAge: 18,
    maxAge: null,
    sex: null,
    intervalMonths: 12,
    reasonTemplate: 'Seasonal COVID-19 vaccine for adults.',
    orderHint: 'COVID-19 vaccine',
  },
  {
    id: 'shingles',
    name: 'Shingles (RZV) vaccine',
    category: 'Immunization',
    description: 'Recombinant zoster series for adults ≥50.',
    minAge: 50,
    maxAge: null,
    sex: null,
    intervalMonths: 120,
    reasonTemplate: 'Recommended for adults ≥50 years.',
    orderHint: 'Shingles (Shingrix) vaccine',
  },
  {
    id: 'pneumococcal',
    name: 'Pneumococcal vaccine',
    category: 'Immunization',
    description: 'PCV / PPSV per adult schedule.',
    minAge: 65,
    maxAge: null,
    sex: null,
    intervalMonths: 120,
    reasonTemplate: 'Recommended for adults ≥65 years.',
    orderHint: 'Pneumococcal vaccine',
  },
  {
    id: 'tdap',
    name: 'Tdap / Td booster',
    category: 'Immunization',
    description: 'Tetanus-diphtheria-pertussis booster every 10 years.',
    minAge: 19,
    maxAge: null,
    sex: null,
    intervalMonths: 120,
    reasonTemplate: 'Tdap/Td booster every 10 years for adults.',
    orderHint: 'Tdap vaccine',
  },
];
