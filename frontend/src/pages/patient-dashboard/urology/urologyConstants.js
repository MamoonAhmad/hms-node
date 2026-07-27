export const UROLOGY_SECTIONS = [
  { id: 'luts-aua', label: 'LUTS / AUA Score' },
  { id: 'hematuria', label: 'Hematuria Workup' },
  { id: 'stone-voiding', label: 'Stone / Voiding Symptoms' },
];

export const YES_NO_OPTIONS = ['Yes', 'No'];

export const YES_NO_UNKNOWN_OPTIONS = ['Yes', 'No', 'Unknown'];

export const FOLLOW_UP_INTERVAL_OPTIONS = [
  '1 Week',
  '2 Weeks',
  '4 Weeks',
  '6 Weeks',
  '3 Months',
  '6 Months',
  '12 Months',
  'As Needed',
];

/** AUA Symptom Index (IPSS) — 7 items scored 0–5 */
export const AUA_SYMPTOM_QUESTIONS = [
  {
    id: 'incompleteEmptying',
    label: 'Incomplete emptying',
    prompt:
      'Over the past month, how often have you had a sensation of not emptying your bladder completely after you finished urinating?',
  },
  {
    id: 'frequency',
    label: 'Frequency',
    prompt:
      'Over the past month, how often have you had to urinate again less than two hours after you finished urinating?',
  },
  {
    id: 'intermittency',
    label: 'Intermittency',
    prompt:
      'Over the past month, how often have you found you stopped and started again several times when you urinated?',
  },
  {
    id: 'urgency',
    label: 'Urgency',
    prompt:
      'Over the past month, how often have you found it difficult to postpone urination?',
  },
  {
    id: 'weakStream',
    label: 'Weak stream',
    prompt:
      'Over the past month, how often have you had a weak urinary stream?',
  },
  {
    id: 'straining',
    label: 'Straining',
    prompt:
      'Over the past month, how often have you had to push or strain to begin urination?',
  },
  {
    id: 'nocturia',
    label: 'Nocturia',
    prompt:
      'Over the past month, how many times did you most typically get up to urinate from the time you went to bed until the time you got up in the morning?',
  },
];

export const AUA_FREQUENCY_OPTIONS = [
  { value: '0', label: '0 — Not at all' },
  { value: '1', label: '1 — Less than 1 time in 5' },
  { value: '2', label: '2 — Less than half the time' },
  { value: '3', label: '3 — About half the time' },
  { value: '4', label: '4 — More than half the time' },
  { value: '5', label: '5 — Almost always' },
];

export const AUA_NOCTURIA_OPTIONS = [
  { value: '0', label: '0 — None' },
  { value: '1', label: '1 — 1 time' },
  { value: '2', label: '2 — 2 times' },
  { value: '3', label: '3 — 3 times' },
  { value: '4', label: '4 — 4 times' },
  { value: '5', label: '5 — 5 or more times' },
];

export const AUA_QOL_OPTIONS = [
  { value: '0', label: '0 — Delighted' },
  { value: '1', label: '1 — Pleased' },
  { value: '2', label: '2 — Mostly satisfied' },
  { value: '3', label: '3 — Mixed' },
  { value: '4', label: '4 — Mostly dissatisfied' },
  { value: '5', label: '5 — Unhappy' },
  { value: '6', label: '6 — Terrible' },
];

export const LUTS_VISIT_TYPE_OPTIONS = [
  'New LUTS evaluation',
  'BPH / LUTS follow-up',
  'Post-procedure review',
  'Medication titration',
  'Pre-op assessment',
  'Other',
];

export const LUTS_DURATION_OPTIONS = [
  '< 1 month',
  '1–3 months',
  '3–6 months',
  '6–12 months',
  '> 1 year',
  'Unknown',
];

export const LUTS_PLAN_OPTIONS = [
  'Watchful waiting',
  'Behavioral / lifestyle counseling',
  'Start alpha-blocker',
  'Start 5-ARI',
  'Anticholinergic / beta-3 agonist',
  'PDE5 inhibitor',
  'Uroflow / PVR',
  'Cystoscopy',
  'Referral — urology procedure',
  'Patient education',
  'Follow-up appointment',
];

export const HEMATURIA_TYPE_OPTIONS = [
  'Gross (visible)',
  'Microscopic',
  'Not specified',
];

export const HEMATURIA_TIMING_OPTIONS = [
  'Initial (start of stream)',
  'Terminal (end of stream)',
  'Total (throughout)',
  'Unknown / intermittent',
];

export const HEMATURIA_DURATION_OPTIONS = [
  'Single episode',
  '< 1 week',
  '1–4 weeks',
  '1–3 months',
  '> 3 months',
  'Recurrent',
];

export const HEMATURIA_SYMPTOM_OPTIONS = [
  'Dysuria',
  'Frequency / urgency',
  'Flank pain',
  'Suprapubic pain',
  'Clots',
  'Fever',
  'Weight loss',
  'None',
];

export const HEMATURIA_RISK_OPTIONS = [
  'Age ≥ 35–40',
  'Smoking history',
  'Occupational chemical exposure',
  'Prior urologic disease',
  'Pelvic radiation',
  'Cyclophosphamide / ifosfamide',
  'Gross hematuria',
  'Irritative voiding symptoms',
  'History of UTI',
  'Anticoagulation / antiplatelet',
];

export const HEMATURIA_WORKUP_OPTIONS = [
  'Urinalysis',
  'Urine culture',
  'Urine cytology',
  'CBC',
  'BMP / creatinine',
  'CT urogram',
  'Renal ultrasound',
  'MR urogram',
  'Cystoscopy',
  'Referral — nephrology',
];

export const HEMATURIA_PLAN_OPTIONS = [
  'Complete risk-stratified workup',
  'Treat UTI / infection',
  'Hold / adjust anticoagulation (clinical judgment)',
  'Imaging ordered',
  'Cystoscopy scheduled',
  'Nephrology referral',
  'Urology follow-up',
  'Patient education',
  'Watchful waiting / repeat UA',
];

export const STONE_VISIT_TYPE_OPTIONS = [
  'Acute stone episode',
  'Known stone follow-up',
  'Post-procedure',
  'Metabolic stone workup',
  'Voiding symptom review',
  'Other',
];

export const STONE_SIDE_OPTIONS = ['Left', 'Right', 'Bilateral', 'Unknown'];

export const STONE_LOCATION_OPTIONS = [
  'Kidney',
  'UPJ',
  'Proximal ureter',
  'Mid ureter',
  'Distal ureter',
  'UVJ',
  'Bladder',
  'Passed / none seen',
  'Unknown',
];

export const STONE_PAIN_OPTIONS = [
  'None',
  'Mild flank / back',
  'Moderate colic',
  'Severe colic',
  'Resolved',
];

export const VOIDING_SYMPTOM_OPTIONS = [
  'Frequency',
  'Urgency',
  'Dysuria',
  'Hesitancy',
  'Weak stream',
  'Incomplete emptying',
  'Nocturia',
  'Incontinence',
  'Straining',
  'None',
];

export const STONE_IMAGING_OPTIONS = [
  'None / not done',
  'KUB',
  'Renal ultrasound',
  'Non-contrast CT',
  'CT urogram',
  'IVP',
  'Prior imaging only',
];

export const STONE_MANAGEMENT_OPTIONS = [
  'Medical expulsive therapy',
  'Analgesia / antiemetics',
  'Hydration counseling',
  'Strain urine',
  'SWL / ESWL',
  'Ureteroscopy',
  'PCNL',
  'Stent / nephrostomy',
  'Metabolic evaluation',
  'Dietary counseling',
  'Infection treatment',
  'Follow-up imaging',
  'Urology referral / procedure',
];

export const STONE_DIET_OPTIONS = [
  'Increase fluid intake',
  'Low sodium',
  'Moderate animal protein',
  'Citrate / lemon',
  'Oxalate awareness',
  'Calcium with meals',
  'None documented',
];
