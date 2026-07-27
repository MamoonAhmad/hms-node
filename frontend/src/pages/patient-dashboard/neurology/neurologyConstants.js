export const NEUROLOGY_SECTIONS = [
  { id: 'focused-exam', label: 'Focused Neuro Exam' },
  { id: 'headache-seizure-diary', label: 'Headache / Seizure Diary' },
  { id: 'fall-cognition', label: 'Fall Risk / Cognition' },
];

export const YES_NO_OPTIONS = ['Yes', 'No'];

export const MENTAL_STATUS_OPTIONS = [
  'Alert and oriented x3',
  'Alert and oriented x2',
  'Alert and oriented x1',
  'Confused',
  'Lethargic',
  'Obtunded',
  'Stuporous',
  'Comatose',
];

export const CRANIAL_NERVE_OPTIONS = [
  'CN II–XII intact',
  'Visual field deficit',
  'Pupillary asymmetry',
  'Extraocular movement deficit',
  'Facial asymmetry',
  'Hearing deficit',
  'Dysarthria',
  'Tongue deviation',
  'Other deficit',
];

export const MOTOR_STRENGTH_GRADES = ['0', '1', '2', '3', '4', '4+', '5'];

export const MOTOR_REGIONS = [
  'RUE',
  'LUE',
  'RLE',
  'LLE',
  'Grip R',
  'Grip L',
];

export const SENSORY_OPTIONS = [
  'Intact to light touch',
  'Intact to pinprick',
  'Hemisensory loss',
  'Stocking-glove',
  'Dermatomal deficit',
  'Proprioception impaired',
  'Vibration impaired',
];

export const REFLEX_GRADES = ['0', '1+', '2+', '3+', '4+', 'Clonus'];

export const REFLEX_SITES = ['Biceps', 'Triceps', 'Brachioradialis', 'Patellar', 'Achilles', 'Plantar'];

export const COORDINATION_OPTIONS = [
  'Finger-nose intact',
  'Heel-shin intact',
  'Dysmetria',
  'Intention tremor',
  'Rapid alternating movements impaired',
];

export const GAIT_OPTIONS = [
  'Normal',
  'Antalgic',
  'Ataxic',
  'Spastic',
  'Parkinsonian',
  'Steppage',
  'Trendelenburg',
  'Unable to ambulate',
  'Uses assistive device',
];

export const DIARY_ENTRY_TYPES = ['Headache', 'Seizure', 'Aura only', 'Migraine'];

export const HEADACHE_SEVERITY_OPTIONS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export const HEADACHE_QUALITY_OPTIONS = [
  'Throbbing',
  'Pressure',
  'Sharp',
  'Dull',
  'Band-like',
  'Stabbing',
];

export const HEADACHE_LOCATION_OPTIONS = [
  'Unilateral L',
  'Unilateral R',
  'Bilateral',
  'Frontal',
  'Temporal',
  'Occipital',
  'Periorbital',
  'Whole head',
];

export const HEADACHE_TRIGGERS = [
  'Stress',
  'Sleep deprivation',
  'Missed meal',
  'Caffeine',
  'Alcohol',
  'Weather',
  'Menses',
  'Screen time',
  'Food trigger',
  'Unknown',
];

export const SEIZURE_TYPE_OPTIONS = [
  'Focal aware',
  'Focal impaired awareness',
  'Focal to bilateral tonic-clonic',
  'Generalized tonic-clonic',
  'Absence',
  'Myoclonic',
  'Atonic',
  'Unknown / unclassified',
];

export const SEIZURE_DURATION_OPTIONS = [
  '< 30 sec',
  '30–60 sec',
  '1–2 min',
  '2–5 min',
  '> 5 min',
  'Unknown',
];

export const FALL_RISK_QUESTIONS = [
  { id: 'presented-due-to-fall', label: 'Presented due to fall (syncope, seizure, LOC)', yesPoints: 20 },
  { id: 'recent-fall', label: 'History of fall (within last 3 months)', yesPoints: 15 },
  { id: 'altered-mental-status', label: 'Altered mental status', yesPoints: 15 },
  { id: 'impaired-mobility', label: 'Impaired mobility / gait instability', yesPoints: 15 },
  { id: 'neuro-meds', label: 'High-risk neuro meds (AEDs, benzos, opioids, sedatives)', yesPoints: 10 },
  { id: 'prior-stroke', label: 'Prior stroke / TIA with residual deficit', yesPoints: 10 },
  { id: 'nurse-judgement', label: 'Clinician judgement (dizziness, incontinence, vision)', yesPoints: 10 },
];

export const COGNITION_DOMAINS = [
  { id: 'orientation', label: 'Orientation (person / place / time)', max: 10 },
  { id: 'registration', label: 'Registration / immediate recall', max: 3 },
  { id: 'attention', label: 'Attention / calculation', max: 5 },
  { id: 'recall', label: 'Delayed recall', max: 3 },
  { id: 'language', label: 'Language (naming / repetition / comprehension)', max: 9 },
  { id: 'visuospatial', label: 'Visuospatial / executive', max: 5 },
];

export const COGNITION_INTERPRETATION = [
  { min: 27, label: 'Normal / no impairment', variant: 'success' },
  { min: 21, label: 'Mild cognitive impairment', variant: 'warning' },
  { min: 11, label: 'Moderate impairment', variant: 'warning' },
  { min: 0, label: 'Severe impairment', variant: 'danger' },
];

export const PRECAUTION_OPTIONS = [
  'Yellow fall-risk ID band',
  'Bed/chair alarm',
  'Assist with ambulation',
  'Non-skid footwear',
  'Call light within reach',
  'Supervised toileting',
  'Cognitive reorientation',
  'Caregiver education',
  'PT / OT referral considered',
];
