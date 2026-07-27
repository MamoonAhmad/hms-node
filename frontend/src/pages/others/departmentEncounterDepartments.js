/** Specialty department encounter workspaces under Others / Pending. */

export const DEPARTMENT_ENCOUNTER_DEPARTMENTS = [
  {
    name: 'Internal Medicine',
    slug: 'internal-medicine',
    aliases: ['internal medicine', 'im', 'general medicine', 'primary care'],
    focus: 'Adult chronic disease, preventive care, and complex multi-system visits',
    clinicalChecks: [
      'Review active problems and chronic meds',
      'Update preventive care gaps',
      'Reconcile allergies and home medications',
      'Document assessment & plan for each problem',
    ],
    commonOrders: ['CMP', 'CBC', 'HbA1c', 'Lipid panel', 'EKG'],
  },
  {
    name: 'Pediatrics',
    slug: 'pediatrics',
    aliases: ['pediatrics', 'paediatrics', 'pediatric', 'peds'],
    focus: 'Well-child, acute illness, growth, and immunization workflows',
    clinicalChecks: [
      'Plot growth / BMI percentile',
      'Review immunization status',
      'Screen development milestones',
      'Document guardian consent / caregivers',
    ],
    commonOrders: ['Vaccine administration', 'Rapid strep', 'Flu swab', 'CBC'],
  },
  {
    name: 'OB/GYN',
    slug: 'ob-gyn',
    aliases: ['ob/gyn', 'obgyn', 'obstetrics', 'gynecology', 'women\'s health'],
    focus: 'Prenatal, gynecologic, and postpartum encounter workflows',
    clinicalChecks: [
      'Confirm LMP / EDD and pregnancy status',
      'Review prenatal labs and imaging',
      'Document fetal heart tones when indicated',
      'Screen for GYN symptoms and pap/HPV status',
    ],
    commonOrders: ['Urine hCG', 'Prenatal panel', 'Pelvic US', 'Pap smear'],
  },
  {
    name: 'Cardiology',
    slug: 'cardiology',
    aliases: ['cardiology', 'cardiac', 'heart'],
    focus: 'Chest pain, arrhythmia, heart failure, and CV risk management',
    clinicalChecks: [
      'Review chest pain / SOB history',
      'Document ECG findings',
      'Reconcile antiplatelets / anticoagulants',
      'Assess NYHA class or ACS risk when relevant',
    ],
    commonOrders: ['12-lead ECG', 'Troponin', 'Echo', 'BNP', 'Stress test'],
  },
  {
    name: 'Orthopedics',
    slug: 'orthopedics',
    aliases: ['orthopedics', 'orthopaedics', 'ortho', 'sports medicine'],
    focus: 'MSK injury, joint pain, fracture follow-up, and procedural visits',
    clinicalChecks: [
      'Document mechanism of injury',
      'Neurovascular exam distal to injury',
      'Review imaging and weight-bearing status',
      'Plan PT / bracing / surgical follow-up',
    ],
    commonOrders: ['X-ray', 'MRI', 'PT referral', 'Ortho injection'],
  },
  {
    name: 'Dermatology',
    slug: 'dermatology',
    aliases: ['dermatology', 'derm', 'skin'],
    focus: 'Rash, lesion, biopsy, and chronic skin disease visits',
    clinicalChecks: [
      'Describe lesion morphology and distribution',
      'Capture / attach clinical photos',
      'Review prior biopsy pathology',
      'Counsel on topicals and sun protection',
    ],
    commonOrders: ['Skin biopsy', 'KOH prep', 'Dermatology photo', 'Patch testing'],
  },
  {
    name: 'Ophthalmology',
    slug: 'ophthalmology',
    aliases: ['ophthalmology', 'eye', 'vision'],
    focus: 'Vision complaints, eye pressure, and ocular procedure visits',
    clinicalChecks: [
      'Document visual acuity OD/OS',
      'Review IOP and pupil exam',
      'Screen for diabetic retinopathy risk',
      'Update ocular meds and drops',
    ],
    commonOrders: ['Visual acuity', 'Tonometry', 'Fundus photo', 'OCT'],
  },
  {
    name: 'ENT',
    slug: 'ent',
    aliases: ['ent', 'otolaryngology', 'ear nose throat', 'otology'],
    focus: 'Ear, nose, throat, and sinus outpatient encounters',
    clinicalChecks: [
      'Document otoscopic / nasal findings',
      'Screen hearing / tinnitus complaints',
      'Review prior imaging or audiograms',
      'Assess airway / swallowing red flags',
    ],
    commonOrders: ['Audiogram', 'Sinus CT', 'Throat culture', 'Nasal endoscopy'],
  },
  {
    name: 'Gastroenterology',
    slug: 'gastroenterology',
    aliases: ['gastroenterology', 'gi', 'digestive'],
    focus: 'GI symptom evaluation, IBD, and procedure follow-up',
    clinicalChecks: [
      'Characterize abdominal pain / bleeding / reflux',
      'Review prior endoscopy / pathology',
      'Screen alarm symptoms',
      'Reconcile PPI / biologic therapy',
    ],
    commonOrders: ['H. pylori', 'Colonoscopy', 'EGD', 'Fecal calprotectin', 'LFTs'],
  },
  {
    name: 'Endocrinology',
    slug: 'endocrinology',
    aliases: ['endocrinology', 'endocrine', 'diabetes', 'thyroid'],
    focus: 'Diabetes, thyroid, and hormonal disorder management',
    clinicalChecks: [
      'Review glycemic trends / CGM if available',
      'Reconcile insulin and endocrine meds',
      'Check thyroid / adrenal symptoms',
      'Update foot / eye screening status for diabetes',
    ],
    commonOrders: ['HbA1c', 'TSH', 'Free T4', 'CMP', 'Lipid panel'],
  },
  {
    name: 'Pulmonology',
    slug: 'pulmonology',
    aliases: ['pulmonology', 'pulmonary', 'respiratory', 'lung'],
    focus: 'Asthma, COPD, dyspnea, and sleep-related respiratory visits',
    clinicalChecks: [
      'Document dyspnea / cough / oxygen needs',
      'Review spirometry or home O2 status',
      'Assess inhaler technique and adherence',
      'Screen smoking / vaping history',
    ],
    commonOrders: ['Spirometry', 'Chest X-ray', 'CT chest', 'Sleep study', 'ABG'],
  },
  {
    name: 'Neurology',
    slug: 'neurology',
    aliases: ['neurology', 'neuro', 'neurologic'],
    focus: 'Headache, seizure, neuropathy, and stroke follow-up visits',
    clinicalChecks: [
      'Perform focused neuro exam',
      'Review seizure / headache diary',
      'Reconcile antiepileptics / migraine prophylaxis',
      'Screen fall risk and cognition when indicated',
    ],
    commonOrders: ['MRI brain', 'EEG', 'EMG/NCS', 'Carotid US'],
  },
  {
    name: 'Urology',
    slug: 'urology',
    aliases: ['urology', 'uro'],
    focus: 'LUTS, stone disease, hematuria, and urologic procedures',
    clinicalChecks: [
      'Document voiding symptoms / AUA score when relevant',
      'Review UA / imaging',
      'Screen hematuria red flags',
      'Reconcile alpha-blockers / anticholinergics',
    ],
    commonOrders: ['UA', 'Urine culture', 'Renal US', 'PSA', 'CT urogram'],
  },
  {
    name: 'Psychiatry',
    slug: 'psychiatry',
    aliases: ['psychiatry', 'behavioral health', 'mental health', 'psych'],
    focus: 'Mood, anxiety, safety, and psychopharmacology visits',
    clinicalChecks: [
      'Complete PHQ-9 / GAD-7 as indicated',
      'Document safety / SI-HI assessment',
      'Reconcile psychotropics and side effects',
      'Coordinate therapy / social supports',
    ],
    commonOrders: ['PHQ-9', 'GAD-7', 'Toxicology screen', 'TSH', 'CBC'],
  },
  {
    name: 'Rheumatology',
    slug: 'rheumatology',
    aliases: ['rheumatology', 'rheum', 'autoimmune'],
    focus: 'Joint pain, autoimmune disease, and biologic therapy visits',
    clinicalChecks: [
      'Document joint count / morning stiffness',
      'Review inflammatory markers and serologies',
      'Screen infection risk before biologics',
      'Assess functional limitation and flares',
    ],
    commonOrders: ['ESR', 'CRP', 'ANA', 'RF/Anti-CCP', 'X-ray joints'],
  },
  {
    name: 'Nephrology',
    slug: 'nephrology',
    aliases: ['nephrology', 'renal', 'kidney'],
    focus: 'CKD, electrolyte disorders, and hypertension specialty visits',
    clinicalChecks: [
      'Review eGFR trend and proteinuria',
      'Reconcile nephrotoxic medications',
      'Assess volume status and BP control',
      'Update dialysis / transplant status if applicable',
    ],
    commonOrders: ['BMP', 'Urine ACR', 'CBC', 'PTH', 'Renal US'],
  },
  {
    name: 'Oncology / Hematology',
    slug: 'oncology-hematology',
    aliases: ['oncology', 'hematology', 'oncology / hematology', 'cancer', 'heme/onc'],
    focus: 'Cancer treatment, survivorship, and hematologic disorder visits',
    clinicalChecks: [
      'Review staging / treatment cycle day',
      'Screen for fever / neutropenia symptoms',
      'Reconcile chemo / supportive meds',
      'Update pain, nutrition, and advance care preferences',
    ],
    commonOrders: ['CBC with diff', 'CMP', 'Tumor markers', 'CT staging', 'Transfusion'],
  },
  {
    name: 'Allergy & Immunology',
    slug: 'allergy-immunology',
    aliases: ['allergy', 'immunology', 'allergy & immunology', 'allergy and immunology'],
    focus: 'Allergic disease, asthma comorbidity, and immunotherapy visits',
    clinicalChecks: [
      'Review allergen triggers and anaphylaxis history',
      'Confirm epinephrine auto-injector access',
      'Document skin / IgE testing results',
      'Assess asthma control when allergic airway disease present',
    ],
    commonOrders: ['Allergy skin test', 'IgE panel', 'Spirometry', 'Immunotherapy'],
  },
  {
    name: 'PM&R / PT',
    slug: 'pmr-pt',
    aliases: ['pm&r', 'pmr', 'physical medicine', 'rehabilitation', 'pt', 'physical therapy'],
    focus: 'Rehab goals, functional status, and therapy plan visits',
    clinicalChecks: [
      'Document functional goals and barriers',
      'Assess pain / ROM / strength',
      'Review therapy attendance and home exercise',
      'Update assistive device / work restrictions',
    ],
    commonOrders: ['PT evaluation', 'OT evaluation', 'X-ray', 'Functional assessment'],
  },
];

export function departmentEncounterMenuLabel(name) {
  return `${name} - Encounter Detail Page`;
}

export function departmentEncounterHref(slug, patientId, appointmentId) {
  let path = `/others/departments/${slug}/encounter-detail`;
  if (patientId) path += `/${patientId}`;
  if (appointmentId) {
    path += `?appointmentId=${encodeURIComponent(appointmentId)}`;
  }
  return path;
}

export function getDepartmentBySlug(slug) {
  return DEPARTMENT_ENCOUNTER_DEPARTMENTS.find((d) => d.slug === slug) || null;
}

function normalizeDeptText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_/]+/g, ' ')
    .replace(/\s+/g, ' ');
}

/** Match appointment/DB department names to a specialty catalog entry. */
export function encounterMatchesDepartment(appointment, department) {
  if (!department) return false;
  const raw =
    appointment?.departmentRef?.departmentName ||
    appointment?.department ||
    appointment?.departmentName ||
    '';
  const text = normalizeDeptText(raw);
  if (!text) return false;

  const candidates = [
    department.name,
    department.slug.replace(/-/g, ' '),
    ...(department.aliases || []),
  ].map(normalizeDeptText);

  return candidates.some(
    (candidate) =>
      text === candidate ||
      text.includes(candidate) ||
      candidate.includes(text),
  );
}
