export const PULMONOLOGY_SECTIONS = [
  { id: 'asthma-copd', label: 'Asthma / COPD Assessment' },
  { id: 'spirometry-o2', label: 'Spirometry / O2 Status' },
  { id: 'inhaler-adherence', label: 'Inhaler Adherence' },
  { id: 'smoking-vaping', label: 'Smoking / Vaping Screen' },
];

export const YES_NO_OPTIONS = ['Yes', 'No'];
export const YES_NO_UNKNOWN_OPTIONS = ['Yes', 'No', 'Unknown'];

export const VISIT_TYPE_OPTIONS = [
  'New Patient',
  'Follow-up',
  'Asthma Follow-up',
  'COPD Follow-up',
  'Post-exacerbation',
  'Pre-operative Clearance',
  'Oxygen Evaluation',
  'Urgent Visit',
];

export const DISEASE_FOCUS_OPTIONS = [
  'Asthma',
  'COPD',
  'Asthma-COPD Overlap',
  'Other Restrictive / Interstitial',
  'Undifferentiated Dyspnea',
];

export const ASTHMA_CLASS_OPTIONS = [
  'Intermittent',
  'Mild Persistent',
  'Moderate Persistent',
  'Severe Persistent',
  'Not Classified',
];

export const ASTHMA_CONTROL_OPTIONS = [
  'Well Controlled',
  'Not Well Controlled',
  'Very Poorly Controlled',
];

export const COPD_GOLD_OPTIONS = ['GOLD 1', 'GOLD 2', 'GOLD 3', 'GOLD 4', 'Not Staged'];

export const COPD_GROUP_OPTIONS = ['A', 'B', 'E', 'Not Grouped'];

export const MMRC_OPTIONS = [
  '0 — Dyspnea only with strenuous exercise',
  '1 — Dyspnea when hurrying or walking up a slight hill',
  '2 — Walks slower than peers / stops for breath',
  '3 — Stops for breath after ~100 m or a few minutes',
  '4 — Too breathless to leave the house / breathless dressing',
];

export const RESPIRATORY_SYMPTOM_OPTIONS = [
  'Dyspnea',
  'Wheeze',
  'Cough',
  'Sputum Production',
  'Chest Tightness',
  'Nocturnal Symptoms',
  'Exercise Limitation',
  'Hemoptysis',
  'Frequent URI',
];

export const TRIGGER_OPTIONS = [
  'Allergens',
  'Cold Air',
  'Exercise',
  'Infection / URI',
  'Smoke / Irritants',
  'Occupational Exposures',
  'Strong Odors',
  'Weather Change',
  'GERD',
  'Unknown',
];

export const SPIROMETRY_INTERPRETATION_OPTIONS = [
  'Normal',
  'Obstructive',
  'Restrictive Pattern',
  'Mixed Obstructive / Restrictive',
  'Nonspecific',
  'Not Performed',
];

export const SPIROMETRY_QUALITY_OPTIONS = [
  'Acceptable / Reproducible',
  'Acceptable / Not Reproducible',
  'Suboptimal Effort',
  'Unable to Perform',
  'Pending',
];

export const O2_DELIVERY_OPTIONS = [
  'Nasal Cannula',
  'Simple Face Mask',
  'Venturi Mask',
  'Non-rebreather',
  'High-flow Nasal Cannula',
  'CPAP / BiPAP',
  'Other',
];

export const HOME_O2_STATUS_OPTIONS = [
  'None',
  'Continuous',
  'Nocturnal Only',
  'Exertional / PRN',
  'Pending Qualification',
];

export const INHALER_TYPE_OPTIONS = [
  'SABA (Rescue)',
  'ICS',
  'ICS/LABA',
  'LABA',
  'LAMA',
  'LAMA/LABA',
  'ICS/LAMA/LABA',
  'LTRA',
  'Biologic',
  'Nebulizer Therapy',
  'Other',
];

export const INHALER_DEVICE_OPTIONS = [
  'MDI',
  'DPI',
  'Soft Mist Inhaler',
  'Nebulizer',
  'Autoinjector / Injection',
  'Other',
];

export const ADHERENCE_OPTIONS = [
  'Excellent (>80%)',
  'Fair (50–80%)',
  'Poor (<50%)',
  'Unknown',
];

export const TECHNIQUE_OPTIONS = [
  'Correct Technique',
  'Needs Coaching',
  'Incorrect Technique',
  'Not Observed',
];

export const ADHERENCE_BARRIER_OPTIONS = [
  'Cost / Coverage',
  'Forgets Doses',
  'Complex Regimen',
  'Side Effects',
  'Difficulty with Device',
  'Does Not Perceive Benefit',
  'Language / Health Literacy',
  'None Identified',
];

export const EDUCATION_OPTIONS = [
  'Inhaler Technique Reviewed',
  'Spacer / Chamber Education',
  'Asthma Action Plan Reviewed',
  'COPD Action Plan Reviewed',
  'Peak Flow Monitoring Education',
  'Rescue vs Controller Education',
  'Written Instructions Provided',
];

export const TOBACCO_STATUS_OPTIONS = [
  'Never Smoker',
  'Former Smoker',
  'Current Every-Day Smoker',
  'Current Some-Day Smoker',
  'Unknown',
];

export const VAPING_STATUS_OPTIONS = [
  'Never',
  'Former',
  'Current Daily',
  'Current Occasional',
  'Unknown',
];

export const PRODUCT_OPTIONS = [
  'Cigarettes',
  'Cigars / Pipe',
  'Chewing Tobacco / Snuff',
  'E-cigarettes / Vape',
  'Hookah',
  'Cannabis Smoking',
  'Other Inhaled Product',
];

export const QUIT_READINESS_OPTIONS = [
  'Not Ready',
  'Thinking About Quitting',
  'Ready in Next 30 Days',
  'Actively Quitting',
  'Recently Quit (<6 months)',
];

export const CESSATION_INTERVENTION_OPTIONS = [
  'Brief Advice Given (5 As)',
  'NRT Discussed / Offered',
  'Varenicline Discussed',
  'Bupropion Discussed',
  'Quitline Referral',
  'Behavioral Counseling Referral',
  'Follow-up Scheduled',
  'Patient Declined',
];

export const FOLLOW_UP_INTERVAL_OPTIONS = [
  '1 Week',
  '2 Weeks',
  '1 Month',
  '3 Months',
  '6 Months',
  '12 Months',
  'As Needed',
  'PRN / Return if worse',
];
