export const RHEUMATOLOGY_SECTIONS = [
  { id: 'joint-count', label: 'Joint Count / Morning Stiffness' },
  { id: 'flare-assessment', label: 'Flare Assessment' },
  { id: 'biologic-infection-risk', label: 'Biologic Infection-Risk Screen' },
];

export const YES_NO_OPTIONS = ['Yes', 'No'];

export const YES_NO_UNKNOWN_OPTIONS = ['Yes', 'No', 'Unknown'];

/** Standard 28-joint DAS28 set (bilateral). */
export const JOINT_28_SET = [
  { id: 'shoulder-r', label: 'Shoulder R', side: 'R' },
  { id: 'shoulder-l', label: 'Shoulder L', side: 'L' },
  { id: 'elbow-r', label: 'Elbow R', side: 'R' },
  { id: 'elbow-l', label: 'Elbow L', side: 'L' },
  { id: 'wrist-r', label: 'Wrist R', side: 'R' },
  { id: 'wrist-l', label: 'Wrist L', side: 'L' },
  { id: 'mcp1-r', label: 'MCP1 R', side: 'R' },
  { id: 'mcp1-l', label: 'MCP1 L', side: 'L' },
  { id: 'mcp2-r', label: 'MCP2 R', side: 'R' },
  { id: 'mcp2-l', label: 'MCP2 L', side: 'L' },
  { id: 'mcp3-r', label: 'MCP3 R', side: 'R' },
  { id: 'mcp3-l', label: 'MCP3 L', side: 'L' },
  { id: 'mcp4-r', label: 'MCP4 R', side: 'R' },
  { id: 'mcp4-l', label: 'MCP4 L', side: 'L' },
  { id: 'mcp5-r', label: 'MCP5 R', side: 'R' },
  { id: 'mcp5-l', label: 'MCP5 L', side: 'L' },
  { id: 'pip1-r', label: 'PIP1 R', side: 'R' },
  { id: 'pip1-l', label: 'PIP1 L', side: 'L' },
  { id: 'pip2-r', label: 'PIP2 R', side: 'R' },
  { id: 'pip2-l', label: 'PIP2 L', side: 'L' },
  { id: 'pip3-r', label: 'PIP3 R', side: 'R' },
  { id: 'pip3-l', label: 'PIP3 L', side: 'L' },
  { id: 'pip4-r', label: 'PIP4 R', side: 'R' },
  { id: 'pip4-l', label: 'PIP4 L', side: 'L' },
  { id: 'pip5-r', label: 'PIP5 R', side: 'R' },
  { id: 'pip5-l', label: 'PIP5 L', side: 'L' },
  { id: 'knee-r', label: 'Knee R', side: 'R' },
  { id: 'knee-l', label: 'Knee L', side: 'L' },
];

export const JOINT_COUNT_METHODS = [
  '28-joint (DAS28)',
  '66/68 tender / swollen',
  'Clinical estimate',
];

export const MORNING_STIFFNESS_DURATION = [
  'None',
  '< 15 min',
  '15–30 min',
  '30–60 min',
  '1–2 hours',
  '> 2 hours',
  'All day',
];

export const VAS_OPTIONS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export const FLARE_SEVERITY_OPTIONS = ['Mild', 'Moderate', 'Severe', 'Life-threatening'];

export const FLARE_TRIGGERS = [
  'Missed / delayed meds',
  'Infection',
  'Stress',
  'Weather change',
  'Overexertion',
  'Steroid taper',
  'New medication',
  'Unknown',
  'Other',
];

export const FLARE_SYSTEMIC_SYMPTOMS = [
  'Fever',
  'Fatigue',
  'Malaise',
  'Night sweats',
  'Rash',
  'Eye inflammation',
  'Serositis symptoms',
  'Weight loss',
];

export const FUNCTIONAL_IMPACT_OPTIONS = [
  'None',
  'Mild limitation',
  'Moderate limitation',
  'Severe limitation / unable to work',
  'Requires assistance with ADLs',
];

export const FLARE_ACTIONS = [
  'Increase DMARD / bridge steroid',
  'Short steroid burst',
  'Biologic dose review',
  'Urgent labs (ESR/CRP)',
  'Imaging',
  'Same-day / urgent clinic follow-up',
  'ED / hospital if red flags',
  'Patient education / rest',
];

/** Infection-risk items for biologic / JAK-inhibitor screening. */
export const BIOLOGIC_RISK_QUESTIONS = [
  {
    id: 'active-infection',
    label: 'Active bacterial, fungal, or viral infection',
    yesBlocks: true,
  },
  {
    id: 'fever-or-sepsis-signs',
    label: 'Fever, sepsis signs, or unexplained leukocytosis',
    yesBlocks: true,
  },
  {
    id: 'latent-tb-positive',
    label: 'Latent TB positive without completed treatment',
    yesBlocks: true,
  },
  {
    id: 'tb-screen-missing',
    label: 'TB screen (IGRA / PPD) missing or outdated (>12 months)',
    yesBlocks: false,
  },
  {
    id: 'hep-b-risk',
    label: 'HBsAg+ or untreated chronic Hep B / unknown Hep B status',
    yesBlocks: true,
  },
  {
    id: 'hep-c-untreated',
    label: 'Untreated Hep C with advanced liver disease',
    yesBlocks: true,
  },
  {
    id: 'hiv-uncontrolled',
    label: 'Uncontrolled HIV / AIDS-defining illness',
    yesBlocks: true,
  },
  {
    id: 'recent-live-vaccine',
    label: 'Live vaccine within last 4 weeks',
    yesBlocks: true,
  },
  {
    id: 'chronic-ulcer-abscess',
    label: 'Chronic skin ulcer, abscess, or osteomyelitis',
    yesBlocks: true,
  },
  {
    id: 'dental-infection',
    label: 'Untreated dental / sinus infection',
    yesBlocks: false,
  },
  {
    id: 'planned-major-surgery',
    label: 'Major elective surgery planned within 2–4 weeks',
    yesBlocks: false,
  },
  {
    id: 'recurrent-infections',
    label: 'Recurrent serious infections on current therapy',
    yesBlocks: false,
  },
];

export const TB_STATUS_OPTIONS = [
  'IGRA negative',
  'PPD negative',
  'Latent TB — treated',
  'Latent TB — on treatment',
  'Latent TB — untreated',
  'Active TB history',
  'Pending',
  'Not done',
];

export const HEP_STATUS_OPTIONS = [
  'Negative / non-immune documented',
  'Immune (vaccinated / resolved)',
  'Chronic — managed',
  'Positive — needs hepatology',
  'Pending',
  'Not done',
];

export const BIOLOGIC_CLEARANCE_OPTIONS = [
  'Cleared to start / continue',
  'Cleared with precautions',
  'Defer — complete screening',
  'Defer — treat infection first',
  'Contraindicated at this time',
];

export const VACCINE_CHECK_OPTIONS = [
  'Influenza (inactivated) up to date',
  'Pneumococcal considered / given',
  'COVID-19 per guidelines',
  'Shingles (RZV) considered',
  'Hep B series complete / immune',
  'Live vaccines deferred while on biologic',
];
