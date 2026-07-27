/**
 * Specialty encounter tab definitions for department detail workspaces.
 * Tabs + sections drive a dynamic form renderer (local demo state).
 */

import {
  showGrowthChartForEncounter,
  showObGynSpecialtyTabs,
} from '@/pages/patient-dashboard/encounterTabVisibility';

const SHARED_CORE_TABS = [
  { id: 'intake', label: 'Intake', kind: 'core' },
  { id: 'problems', label: 'Problems', kind: 'core' },
  { id: 'care-gaps', label: 'Care Gaps', kind: 'core', countKey: 'dueCareGaps' },
  { id: 'notes', label: 'Notes', kind: 'core', dirtyKey: true },
  { id: 'orders', label: 'Orders', kind: 'core', countKey: 'pendingOrders' },
  { id: 'medications', label: 'Medications', kind: 'core', countKey: 'draftMedications' },
  { id: 'results', label: 'Results', kind: 'core', countKey: 'pendingResults' },
  { id: 'documents', label: 'Documents', kind: 'core' },
  { id: 'patient-checkout', label: 'Checkout', kind: 'core' },
  { id: 'charge-capture', label: 'Coding', kind: 'core' },
  { id: 'patient-profile', label: 'Profile', kind: 'core' },
];

const PMR_PT_TAB = {
  id: 'pmr-pt',
  label: 'PM&R / PT',
  kind: 'custom',
  component: 'pmr-pt',
  icon: 'Activity',
};

/** OB/GYN specialty workspace tabs — female patients only. */
const OB_GYN_GENDER_GATED_TAB_IDS = new Set(['ob-prenatal', 'gyn-exam', 'ob-labs']);

function overviewTab(title, description) {
  return {
    id: 'specialty-overview',
    label: 'Overview',
    kind: 'specialty',
    icon: 'LayoutDashboard',
    title,
    description,
  };
}

function workspaceTab({ id, label, icon, title, description, sections }) {
  return {
    id,
    label,
    kind: 'specialty',
    icon,
    title,
    description,
    sections,
  };
}

const field = (key, label, type = 'text', opts = {}) => ({
  key,
  label,
  type,
  ...opts,
});

export const SPECIALTY_ENCOUNTER_CONFIG = {
  'internal-medicine': {
    accentLabel: 'Adult Medicine',
    defaultTab: 'specialty-overview',
    specialtyTabs: [
      overviewTab(
        'Internal Medicine overview',
        'Chronic disease, preventive gaps, and multi-problem adult visit workspace.',
      ),
      workspaceTab({
        id: 'im-chronic',
        label: 'Chronic Disease',
        icon: 'Activity',
        title: 'Chronic disease management',
        description: 'Track HTN, diabetes, lipids, and other long-term conditions.',
        sections: [
          {
            title: 'Hypertension',
            accent: 'info',
            fields: [
              field('sbp', 'Systolic BP', 'number', { placeholder: '128', unit: 'mmHg' }),
              field('dbp', 'Diastolic BP', 'number', { placeholder: '78', unit: 'mmHg' }),
              field('htnGoal', 'BP goal', 'select', {
                options: ['<130/80', '<140/90', 'Individualized'],
              }),
              field('htnPlan', 'HTN plan', 'textarea', {
                placeholder: 'Med adjust, home BP log, lifestyle…',
              }),
            ],
          },
          {
            title: 'Diabetes / lipids',
            accent: 'warning',
            fields: [
              field('a1c', 'Last HbA1c', 'text', { placeholder: '7.1%' }),
              field('ldl', 'LDL', 'text', { placeholder: '98 mg/dL' }),
              field('dmComplications', 'Complication screen', 'select', {
                options: ['Up to date', 'Eye overdue', 'Foot overdue', 'Both overdue'],
              }),
              field('dmNotes', 'Notes', 'textarea'),
            ],
          },
        ],
      }),
      workspaceTab({
        id: 'im-preventive',
        label: 'Preventive',
        icon: 'ShieldCheck',
        title: 'Preventive care gaps',
        description: 'Screenings, vaccines, and counseling for this encounter.',
        sections: [
          {
            title: 'Screening status',
            fields: [
              field('colonoscopy', 'Colon cancer screening', 'select', {
                options: ['Due', 'Completed', 'Declined', 'N/A'],
              }),
              field('mammo', 'Breast / mammogram', 'select', {
                options: ['Due', 'Completed', 'Declined', 'N/A'],
              }),
              field('lung', 'Lung cancer (LDCT)', 'select', {
                options: ['Due', 'Completed', 'Declined', 'N/A'],
              }),
              field('vaccines', 'Adult vaccines due', 'textarea', {
                placeholder: 'Flu, COVID, shingles, pneumococcal…',
              }),
            ],
          },
        ],
      }),
      workspaceTab({
        id: 'im-ros',
        label: 'ROS / Exam',
        icon: 'Stethoscope',
        title: 'Review of systems & exam',
        description: 'Focused adult ROS and physical findings.',
        sections: [
          {
            title: 'Review of systems',
            fields: [
              field('rosCardio', 'Cardiovascular', 'textarea'),
              field('rosResp', 'Respiratory', 'textarea'),
              field('rosGi', 'GI', 'textarea'),
              field('rosNeuro', 'Neuro / psych', 'textarea'),
            ],
          },
          {
            title: 'Assessment & plan',
            accent: 'primary',
            fields: [
              field('assessment', 'Assessment', 'textarea'),
              field('plan', 'Plan', 'textarea'),
            ],
          },
        ],
      }),
    ],
  },

  pediatrics: {
    accentLabel: 'Pediatrics',
    defaultTab: 'specialty-overview',
    showGrowthChart: true,
    specialtyTabs: [
      overviewTab(
        'Pediatrics overview',
        'Well-child, acute illness, growth, development, and immunization workflows.',
      ),
      workspaceTab({
        id: 'peds-growth',
        label: 'Growth',
        icon: 'LineChart',
        title: 'Growth & nutrition',
        description: 'Plot and interpret growth parameters for this visit.',
        sections: [
          {
            title: 'Anthropometrics',
            fields: [
              field('weight', 'Weight', 'text', { placeholder: 'kg or lb' }),
              field('height', 'Height / length', 'text', { placeholder: 'cm or in' }),
              field('hc', 'Head circumference', 'text', { placeholder: 'cm (infants)' }),
              field('bmiPercentile', 'BMI / weight percentile', 'text', { placeholder: '55th %' }),
              field('growthConcern', 'Growth concern', 'select', {
                options: ['None', 'Failure to thrive', 'Obesity risk', 'Short stature'],
              }),
            ],
          },
        ],
      }),
      workspaceTab({
        id: 'peds-immunizations',
        label: 'Immunizations',
        icon: 'Syringe',
        title: 'Immunization review',
        description: 'Vaccine status, catch-up needs, and today’s administration.',
        sections: [
          {
            title: 'Vaccine status',
            accent: 'info',
            fields: [
              field('vaxStatus', 'Overall status', 'select', {
                options: ['Up to date', 'Catch-up needed', 'Deferred', 'Refused'],
              }),
              field('vaxDueToday', 'Due today', 'textarea', {
                placeholder: 'DTaP, MMR, Flu…',
              }),
              field('vaxGiven', 'Administered today', 'textarea'),
              field('vaxCounsel', 'Counseling documented', 'select', {
                options: ['Yes', 'No', 'Parent declined'],
              }),
            ],
          },
        ],
      }),
      workspaceTab({
        id: 'peds-development',
        label: 'Development',
        icon: 'Baby',
        title: 'Development & anticipatory guidance',
        description: 'Milestones, safety, and caregiver guidance.',
        sections: [
          {
            title: 'Development screen',
            fields: [
              field('milestones', 'Milestones', 'select', {
                options: ['Age-appropriate', 'Monitor', 'Refer'],
              }),
              field('asq', 'ASQ / screen result', 'text'),
              field('safety', 'Safety topics covered', 'textarea', {
                placeholder: 'Car seat, sleep, screens, water safety…',
              }),
              field('guidance', 'Anticipatory guidance', 'textarea'),
            ],
          },
        ],
      }),
    ],
  },

  'ob-gyn': {
    accentLabel: 'OB/GYN',
    defaultTab: 'specialty-overview',
    specialtyTabs: [
      overviewTab(
        'OB/GYN overview',
        'Prenatal, gynecologic exam, and women’s health encounter workspace.',
      ),
      workspaceTab({
        id: 'ob-prenatal',
        label: 'Obstetrics',
        icon: 'Heart',
        title: 'Obstetric / prenatal visit',
        description: 'Dating, fetal status, and prenatal visit elements.',
        sections: [
          {
            title: 'Pregnancy status',
            accent: 'info',
            fields: [
              field('gravida', 'G', 'number'),
              field('para', 'P', 'number'),
              field('lmp', 'LMP', 'date'),
              field('edd', 'EDD', 'date'),
              field('ga', 'Gestational age', 'text', { placeholder: '28w 3d' }),
              field('fht', 'Fetal heart tones', 'text', { placeholder: '140 bpm' }),
              field('fundal', 'Fundal height', 'text', { placeholder: '28 cm' }),
            ],
          },
          {
            title: 'Prenatal symptoms',
            fields: [
              field('obBleed', 'Bleeding / spotting', 'select', {
                options: ['None', 'Spotting', 'Active bleeding'],
              }),
              field('obPain', 'Contractions / pain', 'textarea'),
              field('obPlan', 'OB plan', 'textarea'),
            ],
          },
        ],
      }),
      workspaceTab({
        id: 'gyn-exam',
        label: 'GYN Exam',
        icon: 'ClipboardCheck',
        title: 'Gynecologic exam',
        description: 'Pelvic findings, pap/HPV, and GYN symptoms.',
        sections: [
          {
            title: 'GYN history & exam',
            fields: [
              field('cycle', 'Menstrual cycle', 'text'),
              field('contraception', 'Contraception', 'text'),
              field('papStatus', 'Pap / HPV status', 'select', {
                options: ['Up to date', 'Due', 'Abnormal follow-up', 'N/A'],
              }),
              field('pelvicFindings', 'Pelvic exam findings', 'textarea'),
              field('gynPlan', 'GYN plan', 'textarea'),
            ],
          },
        ],
      }),
      workspaceTab({
        id: 'ob-labs',
        label: 'Prenatal Labs',
        icon: 'TestTube2',
        title: 'Prenatal labs & imaging',
        description: 'Track prenatal panel, GBS, anatomy scan, and follow-ups.',
        sections: [
          {
            title: 'Lab / imaging tracker',
            fields: [
              field('prenatalPanel', 'Prenatal panel', 'select', {
                options: ['Ordered', 'Complete', 'Pending', 'N/A'],
              }),
              field('gbs', 'GBS', 'select', {
                options: ['Pending', 'Negative', 'Positive', 'N/A'],
              }),
              field('anatomyUs', 'Anatomy US', 'select', {
                options: ['Scheduled', 'Complete', 'Pending', 'N/A'],
              }),
              field('obLabNotes', 'Notes', 'textarea'),
            ],
          },
        ],
      }),
    ],
  },

  cardiology: {
    accentLabel: 'Cardiology',
    defaultTab: 'specialty-overview',
    specialtyTabs: [
      overviewTab(
        'Cardiology overview',
        'Chest pain, arrhythmia, heart failure, and cardiovascular risk workspace.',
      ),
      workspaceTab({
        id: 'cards-assessment',
        label: 'Cardiac Assess',
        icon: 'HeartPulse',
        title: 'Cardiac assessment',
        description: 'Chief cardiac complaints, risk factors, and functional class.',
        sections: [
          {
            title: 'Presentation',
            accent: 'danger',
            fields: [
              field('chestPain', 'Chest pain character', 'textarea', {
                placeholder: 'Onset, quality, radiation, exertional…',
              }),
              field('sob', 'Dyspnea / orthopnea', 'textarea'),
              field('syncope', 'Syncope / palpitations', 'textarea'),
              field('nyha', 'NYHA class', 'select', {
                options: ['I', 'II', 'III', 'IV', 'N/A'],
              }),
              field('ascvd', 'ASCVD risk notes', 'textarea'),
            ],
          },
        ],
      }),
      workspaceTab({
        id: 'cards-ecg',
        label: 'ECG / Rhythm',
        icon: 'Activity',
        title: 'ECG & rhythm review',
        description: 'Document ECG interpretation and arrhythmia plan.',
        sections: [
          {
            title: 'ECG findings',
            accent: 'info',
            fields: [
              field('ecgRate', 'Rate', 'text', { placeholder: '72 bpm' }),
              field('ecgRhythm', 'Rhythm', 'select', {
                options: ['NSR', 'Sinus tach', 'AFib', 'AFlutter', 'Other'],
              }),
              field('ecgIntervals', 'PR / QRS / QTc', 'text'),
              field('ecgInterp', 'Interpretation', 'textarea'),
              field('ecgCompare', 'Compared to prior', 'textarea'),
            ],
          },
        ],
      }),
      workspaceTab({
        id: 'cards-hf',
        label: 'HF / Meds',
        icon: 'Pill',
        title: 'Heart failure & cardiac meds',
        description: 'GDMT checklist and anticoagulation status.',
        sections: [
          {
            title: 'Therapy checklist',
            fields: [
              field('bb', 'Beta-blocker', 'select', {
                options: ['On therapy', 'Contraindicated', 'Not started', 'N/A'],
              }),
              field('aceArb', 'ACE/ARB/ARNI', 'select', {
                options: ['On therapy', 'Contraindicated', 'Not started', 'N/A'],
              }),
              field('sglt2', 'SGLT2i', 'select', {
                options: ['On therapy', 'Contraindicated', 'Not started', 'N/A'],
              }),
              field('anticoag', 'Anticoagulation', 'textarea'),
              field('cardsPlan', 'Cardiology plan', 'textarea'),
            ],
          },
        ],
      }),
    ],
  },

  orthopedics: {
    accentLabel: 'Orthopedics',
    defaultTab: 'specialty-overview',
    specialtyTabs: [
      overviewTab(
        'Orthopedics overview',
        'MSK injury, joint exam, imaging, and procedural orthopedic visits.',
      ),
      workspaceTab({
        id: 'ortho-injury',
        label: 'Injury',
        icon: 'Bone',
        title: 'Injury & mechanism',
        description: 'Document MOI, laterality, and weight-bearing status.',
        sections: [
          {
            title: 'Injury details',
            accent: 'warning',
            fields: [
              field('laterality', 'Laterality', 'select', {
                options: ['Left', 'Right', 'Bilateral', 'N/A'],
              }),
              field('bodyRegion', 'Body region', 'text', {
                placeholder: 'Knee, shoulder, ankle…',
              }),
              field('moi', 'Mechanism of injury', 'textarea'),
              field('wbStatus', 'Weight-bearing', 'select', {
                options: ['Full', 'Partial', 'Non–weight-bearing', 'N/A'],
              }),
              field('workStatus', 'Work / sport restrictions', 'textarea'),
            ],
          },
        ],
      }),
      workspaceTab({
        id: 'ortho-exam',
        label: 'MSK Exam',
        icon: 'Hand',
        title: 'Musculoskeletal exam',
        description: 'ROM, strength, special tests, neurovascular status.',
        sections: [
          {
            title: 'Exam findings',
            fields: [
              field('inspection', 'Inspection / swelling', 'textarea'),
              field('rom', 'Range of motion', 'textarea'),
              field('strength', 'Strength', 'textarea'),
              field('specialTests', 'Special tests', 'textarea'),
              field('nvStatus', 'Neurovascular distal', 'select', {
                options: ['Intact', 'Impaired', 'Needs urgent eval'],
              }),
            ],
          },
        ],
      }),
      workspaceTab({
        id: 'ortho-plan',
        label: 'Imaging / Plan',
        icon: 'Scan',
        title: 'Imaging & orthopedic plan',
        description: 'X-ray/MRI review, injection, bracing, and PT plan.',
        sections: [
          {
            title: 'Plan',
            accent: 'primary',
            fields: [
              field('imaging', 'Imaging review', 'textarea'),
              field('injection', 'Injection / procedure', 'textarea'),
              field('brace', 'Brace / DME', 'text'),
              field('pt', 'PT / rehab plan', 'textarea'),
              field('followUp', 'Follow-up', 'text'),
            ],
          },
        ],
      }),
    ],
  },

  dermatology: {
    accentLabel: 'Dermatology',
    defaultTab: 'specialty-overview',
    specialtyTabs: [
      overviewTab(
        'Dermatology overview',
        'Rash, lesion morphology, biopsy, and chronic skin disease visits.',
      ),
      {
        id: 'dermatology',
        label: 'Dermatology',
        kind: 'custom',
        component: 'dermatology',
        icon: 'ScanFace',
        title: 'Dermatology',
        description:
          'Skin examination / morphology, biopsy procedures, and dermatology treatment plan.',
      },
    ],
  },

  neurology: {
    accentLabel: 'Neurology',
    defaultTab: 'specialty-overview',
    specialtyTabs: [
      overviewTab(
        'Neurology overview',
        'Focused neuro exam, headache / seizure diary, and fall-risk / cognition visits.',
      ),
      {
        id: 'neurology',
        label: 'Neurology',
        kind: 'custom',
        component: 'neurology',
        icon: 'Brain',
        title: 'Neurology',
        description:
          'Focused neuro exam, headache / seizure diary, and fall risk / cognition specialty workflow.',
      },
    ],
  },

  ophthalmology: {
    accentLabel: 'Ophthalmology',
    defaultTab: 'specialty-overview',
    specialtyTabs: [
      overviewTab(
        'Ophthalmology overview',
        'Vision, IOP, anterior/posterior exam, and ocular procedure visits.',
      ),
      workspaceTab({
        id: 'oph-vision',
        label: 'Vision',
        icon: 'Eye',
        title: 'Visual acuity & refraction',
        description: 'Document OD/OS acuity and refractive status.',
        sections: [
          {
            title: 'Acuity',
            accent: 'info',
            fields: [
              field('vaOd', 'VA OD', 'text', { placeholder: '20/20' }),
              field('vaOs', 'VA OS', 'text', { placeholder: '20/25' }),
              field('vaOu', 'VA OU', 'text'),
              field('correction', 'With correction', 'select', {
                options: ['Yes', 'No', 'Pinhole'],
              }),
              field('visionComplaint', 'Vision complaint', 'textarea'),
            ],
          },
        ],
      }),
      workspaceTab({
        id: 'oph-exam',
        label: 'Eye Exam',
        icon: 'ScanEye',
        title: 'Ocular examination',
        description: 'Anterior segment, fundus, and diabetic retinopathy screen.',
        sections: [
          {
            title: 'Exam',
            fields: [
              field('pupils', 'Pupils', 'text'),
              field('anterior', 'Anterior segment', 'textarea'),
              field('fundus', 'Fundus / posterior', 'textarea'),
              field('drScreen', 'Diabetic retinopathy', 'select', {
                options: ['None', 'Mild NPDR', 'Moderate NPDR', 'PDR', 'N/A'],
              }),
            ],
          },
        ],
      }),
      workspaceTab({
        id: 'oph-iop',
        label: 'IOP / Plan',
        icon: 'Gauge',
        title: 'IOP & ocular plan',
        description: 'Pressures, drops, and procedure plan.',
        sections: [
          {
            title: 'IOP & plan',
            accent: 'primary',
            fields: [
              field('iopOd', 'IOP OD', 'text', { placeholder: '14 mmHg' }),
              field('iopOs', 'IOP OS', 'text', { placeholder: '15 mmHg' }),
              field('drops', 'Ocular meds / drops', 'textarea'),
              field('ophPlan', 'Plan / procedures', 'textarea'),
            ],
          },
        ],
      }),
    ],
  },

  ent: {
    accentLabel: 'ENT',
    defaultTab: 'specialty-overview',
    specialtyTabs: [
      overviewTab(
        'ENT overview',
        'Ear, nose, throat, and sinus outpatient encounter workspace.',
      ),
      {
        id: 'ent',
        label: 'ENT',
        kind: 'custom',
        component: 'ent',
        icon: 'Ear',
        title: 'ENT',
        description:
          'Ear assessment (otoscopy & audiogram), nose & sinus assessment, and throat & airway assessment.',
      },
    ],
  },

  gastroenterology: {
    accentLabel: 'Gastroenterology',
    defaultTab: 'specialty-overview',
    specialtyTabs: [
      overviewTab(
        'Gastroenterology overview',
        'GI symptoms, endoscopy, IBD, and liver disease visit workspace.',
      ),
      {
        id: 'gastroenterology',
        label: 'Gastroenterology',
        kind: 'custom',
        component: 'gastroenterology',
        icon: 'Stethoscope',
        title: 'Gastroenterology',
        description:
          'GI symptoms & alarm features, endoscopy tracker, IBD & liver disease management, and assessment & plan.',
      },
    ],
  },

  endocrinology: {
    accentLabel: 'Endocrinology',
    defaultTab: 'specialty-overview',
    specialtyTabs: [
      overviewTab(
        'Endocrinology overview',
        'Diabetes, thyroid, and hormonal disorder specialty workspace.',
      ),
      workspaceTab({
        id: 'endo-diabetes',
        label: 'Diabetes',
        icon: 'Droplets',
        title: 'Diabetes management',
        description: 'Glycemic control, CGM, hypoglycemia, and complications.',
        sections: [
          {
            title: 'Glycemic control',
            accent: 'warning',
            fields: [
              field('a1c', 'HbA1c', 'text', { placeholder: '7.4%' }),
              field('cgmTir', 'CGM time-in-range', 'text', { placeholder: '68%' }),
              field('hypo', 'Hypoglycemia episodes', 'textarea'),
              field('insulin', 'Insulin / regimen', 'textarea'),
              field('complications', 'Complication screen', 'textarea'),
            ],
          },
        ],
      }),
      workspaceTab({
        id: 'endo-thyroid',
        label: 'Thyroid',
        icon: 'Thermometer',
        title: 'Thyroid assessment',
        description: 'Symptoms, TSH/FT4, and nodule/therapy plan.',
        sections: [
          {
            title: 'Thyroid',
            fields: [
              field('thyroidSx', 'Symptoms', 'textarea'),
              field('tsh', 'TSH', 'text'),
              field('ft4', 'Free T4', 'text'),
              field('nodule', 'Nodule / US', 'textarea'),
              field('thyroidRx', 'Thyroid therapy', 'textarea'),
            ],
          },
        ],
      }),
      workspaceTab({
        id: 'endo-hormone',
        label: 'Hormones / Labs',
        icon: 'FlaskConical',
        title: 'Hormonal workup & plan',
        description: 'Adrenal, pituitary, bone, and other endocrine labs.',
        sections: [
          {
            title: 'Workup & plan',
            accent: 'primary',
            fields: [
              field('adrenal', 'Adrenal / cortisol notes', 'textarea'),
              field('bone', 'Bone / calcium / Vit D', 'textarea'),
              field('otherLabs', 'Other endocrine labs', 'textarea'),
              field('endoPlan', 'Endocrine plan', 'textarea'),
            ],
          },
        ],
      }),
    ],
  },

  pulmonology: {
    accentLabel: 'Pulmonology',
    defaultTab: 'specialty-overview',
    specialtyTabs: [
      overviewTab(
        'Pulmonology overview',
        'Asthma, COPD, dyspnea, spirometry, and smoking-related respiratory visits.',
      ),
      {
        id: 'pulmonology',
        label: 'Pulmonology',
        kind: 'custom',
        component: 'pulmonology',
        icon: 'Wind',
        title: 'Pulmonology',
        description:
          'Asthma / COPD assessment, spirometry / O₂ status, inhaler adherence, and smoking / vaping screen.',
      },
    ],
  },

  'oncology-hematology': {
    accentLabel: 'Oncology / Hematology',
    defaultTab: 'specialty-overview',
    specialtyTabs: [
      overviewTab(
        'Oncology / Hematology overview',
        'Cancer treatment, survivorship, and hematologic disorder visit workspace.',
      ),
      {
        id: 'oncology-hematology',
        label: 'Oncology / Hematology',
        kind: 'custom',
        component: 'oncology-hematology',
        icon: 'Microscope',
        title: 'Oncology / Hematology',
        description:
          'Staging / cycle day, neutropenia / fever screen, and chemo supportive / advance care notes.',
      },
    ],
  },

  nephrology: {
    accentLabel: 'Nephrology',
    defaultTab: 'specialty-overview',
    specialtyTabs: [
      overviewTab(
        'Nephrology overview',
        'CKD, eGFR / proteinuria, volume status, dialysis / transplant, and nephrotoxic medication visits.',
      ),
      {
        id: 'nephrology',
        label: 'Nephrology',
        kind: 'custom',
        component: 'nephrology',
        icon: 'HeartPulse',
        title: 'Nephrology',
        description:
          'CKD / eGFR / proteinuria tracker, volume & dialysis-transplant status, and nephrotoxic med review.',
      },
    ],
  },

  psychiatry: {
    accentLabel: 'Psychiatry',
    defaultTab: 'specialty-overview',
    specialtyTabs: [
      overviewTab(
        'Psychiatry / Behavioral Health overview',
        'Safety / SI-HI assessment and psychopharmacology / therapy coordination visits.',
      ),
      {
        id: 'psychiatry',
        label: 'Psychiatry / Behavioral Health',
        kind: 'custom',
        component: 'psychiatry',
        icon: 'Brain',
        title: 'Psychiatry / Behavioral Health',
        description:
          'Safety / SI-HI specialty workspace and psychopharmacology / therapy coordination form.',
      },
    ],
  },

  rheumatology: {
    accentLabel: 'Rheumatology',
    defaultTab: 'specialty-overview',
    specialtyTabs: [
      overviewTab(
        'Rheumatology overview',
        'Joint pain, autoimmune disease, flare, and biologic therapy visits.',
      ),
      {
        id: 'rheumatology',
        label: 'Rheumatology',
        kind: 'custom',
        component: 'rheumatology',
        icon: 'Hand',
        title: 'Rheumatology',
        description:
          'Joint count / morning stiffness, flare assessment, and biologic infection-risk screen.',
      },
    ],
  },

  'pmr-pt': {
    accentLabel: 'PM&R / PT',
    defaultTab: 'pmr-pt',
    specialtyTabs: [
      overviewTab(
        'PM&R / PT overview',
        'Rehab goals, functional status, pain / ROM / strength, and therapy plan visits.',
      ),
    ],
  },
};

export function getSpecialtyEncounterConfig(slug) {
  return SPECIALTY_ENCOUNTER_CONFIG[slug] || null;
}

export function buildDepartmentTabDefs(
  slug,
  { includeGrowthChart = false, patient = null } = {},
) {
  const config = getSpecialtyEncounterConfig(slug);
  let specialtyTabs = config?.specialtyTabs || [
    overviewTab('Specialty overview', 'Department specialty encounter workspace.'),
  ];

  // OB/GYN specialty exam/prenatal tabs: female patients only.
  if (slug === 'ob-gyn' && !showObGynSpecialtyTabs(patient)) {
    specialtyTabs = specialtyTabs.filter((t) => !OB_GYN_GENDER_GATED_TAB_IDS.has(t.id));
  }

  const tabs = [...specialtyTabs];

  const showGrowth =
    includeGrowthChart ||
    showGrowthChartForEncounter(patient, slug) ||
    Boolean(config?.showGrowthChart);

  if (showGrowth) {
    const afterOverview = Math.max(
      1,
      tabs.findIndex((t) => t.id === 'specialty-overview') + 1,
    );
    tabs.splice(afterOverview, 0, {
      id: 'growth-chart',
      label: 'Growth Chart',
      kind: 'core',
      icon: 'LineChart',
    });
  }

  const coreTabs =
    slug === 'pmr-pt'
      ? [PMR_PT_TAB, ...SHARED_CORE_TABS]
      : SHARED_CORE_TABS;

  return [...tabs, ...coreTabs];
}

export function getSpecialtyTabDef(slug, tabId) {
  const config = getSpecialtyEncounterConfig(slug);
  return config?.specialtyTabs?.find((t) => t.id === tabId) || null;
}
