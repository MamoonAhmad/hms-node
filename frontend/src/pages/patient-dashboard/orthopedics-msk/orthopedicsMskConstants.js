export const ORTHO_MSK_SECTIONS = [
  { id: 'injury-moi', label: 'Injury / MOI' },
  { id: 'msk-exam', label: 'MSK Examination' },
  { id: 'imaging-plan', label: 'Imaging / Brace / PT' },
];

export const YES_NO_OPTIONS = ['Yes', 'No'];

export const INJURY_TYPE_OPTIONS = [
  'Sprain',
  'Strain',
  'Fracture',
  'Dislocation',
  'Contusion',
  'Tendon Injury',
  'Ligament Injury',
  'Muscle Tear',
  'Meniscus Injury',
  'Rotator Cuff Injury',
  'Repetitive Stress Injury',
  'Sports Injury',
  'Work-related Injury',
  'Motor Vehicle Accident',
  'Fall',
  'Crush Injury',
  'Laceration',
  'Other',
];

export const INJURY_SIDE_OPTIONS = ['Left', 'Right', 'Bilateral'];

export const BODY_REGION_OPTIONS = [
  'Neck',
  'Shoulder',
  'Elbow',
  'Wrist',
  'Hand',
  'Fingers',
  'Thoracic Spine',
  'Lumbar Spine',
  'Hip',
  'Pelvis',
  'Knee',
  'Ankle',
  'Foot',
  'Toes',
];

export const SPECIFIC_BODY_PART_OPTIONS = [
  'Cervical Spine',
  'AC Joint',
  'Glenohumeral Joint',
  'Rotator Cuff',
  'Biceps Tendon',
  'Lateral Epicondyle',
  'Medial Epicondyle',
  'Carpal Tunnel',
  'TFCC',
  'Thumb CMC',
  'MCP Joint',
  'PIP Joint',
  'DIP Joint',
  'SI Joint',
  'Labrum',
  'Meniscus',
  'ACL',
  'PCL',
  'MCL',
  'LCL',
  'Patella',
  'Achilles Tendon',
  'ATFL',
  'CFL',
  'Plantar Fascia',
  'Other',
];

export const INJURY_STATUS_OPTIONS = ['Acute', 'Subacute', 'Chronic'];

export const VISIT_TYPE_OPTIONS = ['New Injury', 'Follow-up', 'Post-operative'];

export const MECHANISM_OPTIONS = [
  'Fall',
  'Slip',
  'Trip',
  'Motor Vehicle Accident',
  'Sports Activity',
  'Lifting',
  'Twisting',
  'Pushing',
  'Pulling',
  'Running',
  'Jumping',
  'Collision',
  'Work Accident',
  'Assault',
  'Other',
];

export const MOI_FLAG_FIELDS = [
  { key: 'injuryWitnessed', label: 'Injury Witnessed' },
  { key: 'directBlow', label: 'Direct Blow' },
  { key: 'twistingInjury', label: 'Twisting Injury' },
  { key: 'hyperextension', label: 'Hyperextension' },
  { key: 'hyperflexion', label: 'Hyperflexion' },
  { key: 'repetitiveMotion', label: 'Repetitive Motion' },
  { key: 'contactInjury', label: 'Contact Injury' },
  { key: 'nonContactInjury', label: 'Non-contact Injury' },
];

export const SYMPTOM_OPTIONS = [
  'Pain',
  'Swelling',
  'Bruising',
  'Weakness',
  'Stiffness',
  'Locking',
  'Catching',
  'Instability',
  'Clicking',
  'Popping',
  'Numbness',
  'Tingling',
  'Limited Motion',
  'Difficulty Walking',
  'Difficulty Weight Bearing',
];

export const PAIN_QUALITY_OPTIONS = [
  'Sharp',
  'Dull',
  'Aching',
  'Burning',
  'Throbbing',
  'Stabbing',
  'Shooting',
];

export const PAIN_PATTERN_OPTIONS = ['Constant', 'Intermittent'];

export const AGGRAVATING_FACTORS = [
  'Walking',
  'Running',
  'Stairs',
  'Squatting',
  'Lifting',
  'Overhead Activity',
  'Sitting',
  'Standing',
  'Lying Down',
  'Weight Bearing',
  'Twisting',
  'Cold Weather',
];

export const RELIEVING_FACTORS = [
  'Rest',
  'Ice',
  'Heat',
  'Elevation',
  'Medication',
  'Brace/Support',
  'Position Change',
  'Stretching',
  'Activity Modification',
];

export const INITIAL_TREATMENT_OPTIONS = [
  'Ice',
  'Heat',
  'Rest',
  'Compression',
  'Elevation',
  'NSAIDs',
  'Splint',
  'Brace',
  'Crutches',
  'Sling',
  'Emergency Department Visit',
  'Urgent Care Visit',
];

export const INSPECTION_OPTIONS = [
  'Normal',
  'Swelling',
  'Deformity',
  'Bruising',
  'Redness',
  'Muscle Atrophy',
  'Surgical Scar',
  'Effusion',
];

export const PALPATION_OPTIONS = [
  'Tenderness',
  'Warmth',
  'Crepitus',
  'Muscle Spasm',
  'Joint Line Tenderness',
  'Bony Tenderness',
  'Soft Tissue Tenderness',
];

export const ROM_MOVEMENTS = [
  'Flexion',
  'Extension',
  'Abduction',
  'Adduction',
  'Internal Rotation',
  'External Rotation',
];

/** Region → relevant ROM rows (empty = show all). */
export const ROM_BY_REGION = {
  Shoulder: ['Flexion', 'Extension', 'Abduction', 'Adduction', 'Internal Rotation', 'External Rotation'],
  Elbow: ['Flexion', 'Extension'],
  Wrist: ['Flexion', 'Extension', 'Abduction', 'Adduction'],
  Hip: ['Flexion', 'Extension', 'Abduction', 'Adduction', 'Internal Rotation', 'External Rotation'],
  Knee: ['Flexion', 'Extension'],
  Ankle: ['Flexion', 'Extension', 'Abduction', 'Adduction'],
  Neck: ['Flexion', 'Extension', 'Abduction', 'Adduction', 'Internal Rotation', 'External Rotation'],
  'Lumbar Spine': ['Flexion', 'Extension', 'Abduction', 'Adduction'],
  'Thoracic Spine': ['Flexion', 'Extension', 'Abduction', 'Adduction'],
};

export const STRENGTH_GROUPS = ['Flexion', 'Extension', 'Abduction', 'Grip Strength'];

export const MRC_GRADES = ['0', '1', '2', '3', '4', '5'];

export const JOINT_STABILITY_OPTIONS = [
  'Stable',
  'Mild Instability',
  'Moderate Instability',
  'Severe Instability',
];

export const NEURO_OPTIONS = [
  'Sensation Intact',
  'Motor Intact',
  'Reflexes Normal',
  'Tingling',
  'Numbness',
  'Weakness',
];

export const VASCULAR_OPTIONS = [
  'Pulses Present',
  'Capillary Refill',
  'Skin Colour',
  'Skin Temperature',
];

export const GAIT_OPTIONS = [
  'Normal',
  'Antalgic',
  'Limp',
  'Unable to Walk',
  'Uses Walker',
  'Uses Cane',
  'Uses Crutches',
];

export const SPECIAL_TEST_RESULT_OPTIONS = ['Positive', 'Negative', 'Not Performed'];

export const SPECIAL_TESTS_BY_REGION = {
  Shoulder: [
    'Neer Test',
    "Hawkins-Kennedy Test",
    'Empty Can Test',
    'Drop Arm Test',
    "Speed's Test",
  ],
  Knee: [
    'Lachman Test',
    'Anterior Drawer Test',
    'Posterior Drawer Test',
    'McMurray Test',
    'Thessaly Test',
    'Valgus Stress Test',
    'Varus Stress Test',
  ],
  Hip: ['FABER Test', 'FADIR Test', 'Trendelenburg Test'],
  Spine: ['Straight Leg Raise', 'Spurling Test'],
  Neck: ['Spurling Test'],
  'Lumbar Spine': ['Straight Leg Raise'],
  'Thoracic Spine': ['Straight Leg Raise'],
  Wrist: ['Tinel Sign', 'Phalen Test', 'Finkelstein Test'],
  Hand: ['Tinel Sign', 'Phalen Test', 'Finkelstein Test'],
  Ankle: ['Anterior Drawer Test'],
};

export const ALL_SPECIAL_TESTS = [
  ...new Set(Object.values(SPECIAL_TESTS_BY_REGION).flat()),
];

export const IMAGING_TYPE_OPTIONS = [
  'X-Ray',
  'CT Scan',
  'MRI',
  'Ultrasound',
  'Bone Scan',
  'DEXA',
];

export const IMAGING_PRIORITY_OPTIONS = ['Routine', 'Urgent', 'STAT'];

export const IMAGING_STATUS_OPTIONS = [
  'Ordered',
  'Scheduled',
  'In Progress',
  'Completed',
  'Cancelled',
];

export const DEVICE_OPTIONS = [
  'Knee Brace',
  'Ankle Brace',
  'Wrist Brace',
  'Elbow Brace',
  'Shoulder Sling',
  'Cervical Collar',
  'Lumbar Brace',
  'Walking Boot',
  'Splint',
  'Cast',
  'Orthotics',
  'Crutches',
  'Walker',
  'Cane',
];

export const THERAPY_FREQUENCY_OPTIONS = ['1x/week', '2x/week', '3x/week', 'As Needed'];

export const THERAPY_DURATION_OPTIONS = [
  '2 Weeks',
  '4 Weeks',
  '6 Weeks',
  '8 Weeks',
  '12 Weeks',
];

export const WEIGHT_BEARING_OPTIONS = [
  'Weight Bearing as Tolerated (WBAT)',
  'Full Weight Bearing (FWB)',
  'Partial Weight Bearing (PWB)',
  'Toe Touch Weight Bearing (TTWB)',
  'Non-Weight Bearing (NWB)',
];

export const ACTIVITY_RESTRICTION_OPTIONS = [
  'No Running',
  'No Jumping',
  'No Sports',
  'No Heavy Lifting',
  'No Overhead Activity',
  'Desk Duty Only',
  'Avoid Squatting',
  'Avoid Kneeling',
  'Limited Standing',
  'Use Assistive Device',
];

export const FOLLOW_UP_INTERVAL_OPTIONS = [
  '1 Week',
  '2 Weeks',
  '3 Weeks',
  '4 Weeks',
  '6 Weeks',
  '8 Weeks',
  '3 Months',
  'As Needed',
];

export const TREATMENT_PLAN_OPTIONS = [
  'Observation',
  'Conservative Management',
  'Physical Therapy',
  'Occupational Therapy',
  'Medication',
  'Joint Injection',
  'Aspiration',
  'Splint/Cast Application',
  'Brace Prescription',
  'Imaging Follow-up',
  'Orthopaedic Surgery Referral',
  'Pain Management Referral',
  'Home Exercise Programme',
  'Follow-up Appointment',
];

/** Map body regions to special-test / ROM template keys. */
export function resolveExamTemplates(bodyRegions = []) {
  const regions = Array.isArray(bodyRegions) ? bodyRegions : [];
  const templates = new Set();
  for (const region of regions) {
    if (['Lumbar Spine', 'Thoracic Spine', 'Neck'].includes(region)) {
      templates.add('Spine');
      if (region === 'Neck') templates.add('Neck');
      if (region === 'Lumbar Spine') templates.add('Lumbar Spine');
      if (region === 'Thoracic Spine') templates.add('Thoracic Spine');
    } else {
      templates.add(region);
    }
  }
  return [...templates];
}

export function getRomMovementsForRegions(bodyRegions = []) {
  const templates = resolveExamTemplates(bodyRegions);
  if (!templates.length) return ROM_MOVEMENTS;
  const movements = new Set();
  for (const t of templates) {
    const list = ROM_BY_REGION[t];
    if (list) list.forEach((m) => movements.add(m));
  }
  return movements.size ? [...movements] : ROM_MOVEMENTS;
}

export function getSpecialTestsForRegions(bodyRegions = []) {
  const templates = resolveExamTemplates(bodyRegions);
  if (!templates.length) return ALL_SPECIAL_TESTS;
  const tests = new Set();
  for (const t of templates) {
    const list = SPECIAL_TESTS_BY_REGION[t];
    if (list) list.forEach((name) => tests.add(name));
  }
  return tests.size ? [...tests] : ALL_SPECIAL_TESTS;
}
