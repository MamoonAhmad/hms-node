/**
 * Seed source for chronic disease templates + fields.
 * fieldType: text | number | date | select | yes_no | checkbox | textarea | auto_vitals_bp | auto_vitals_weight | auto_vitals_height | auto_vitals_bmi
 */

function field(fieldKey, fieldName, fieldType = 'text', extras = {}) {
  return { fieldKey, fieldName, fieldType, required: false, ...extras };
}

function group(groupKey, groupName, fields) {
  return { groupKey, groupName, fields };
}

const YES_NO = { options: ['Yes', 'No'] };
const CLASSIFICATION_OBESITY = {
  options: ['Overweight', 'Class I', 'Class II', 'Class III'],
};

const TEMPLATES = [
  {
    diseaseCode: 'hypertension',
    name: 'Hypertension',
    defaultIcd: 'I10',
    displayOrder: 1,
    groups: [
      group('blood_pressure', 'Blood Pressure', [
        field('latest_bp', 'Latest BP (Auto from vitals)', 'auto_vitals_bp'),
        field('average_home_bp', 'Average Home BP'),
        field('goal_bp', 'Goal BP'),
        field('orthostatic_symptoms', 'Orthostatic Symptoms', 'yes_no', YES_NO),
      ]),
      group('medication', 'Medication', [
        field('current_antihypertensive', 'Current Antihypertensive'),
        field('medication_changes', 'Medication Changes', 'textarea'),
        field('htn_compliance', 'Compliance', 'yes_no', YES_NO),
      ]),
      group('risk_factors', 'Risk Factors', [
        field('smoking', 'Smoking', 'yes_no', YES_NO),
        field('alcohol', 'Alcohol', 'yes_no', YES_NO),
        field('high_salt_diet', 'High Salt Diet', 'yes_no', YES_NO),
        field('physical_activity', 'Physical Activity'),
      ]),
      group('complications', 'Complications', [
        field('ckd', 'CKD', 'checkbox'),
        field('stroke', 'Stroke', 'checkbox'),
        field('cad', 'CAD', 'checkbox'),
        field('lvh', 'LVH', 'checkbox'),
      ]),
      group('management', 'Management', [
        field('dash_diet_discussed', 'DASH Diet Discussed', 'checkbox'),
        field('weight_reduction', 'Weight Reduction', 'checkbox'),
        field('exercise_plan', 'Exercise Plan', 'checkbox'),
        field('follow_up', 'Follow-up'),
      ]),
    ],
  },
  {
    diseaseCode: 'diabetes_mellitus',
    name: 'Diabetes Mellitus',
    defaultIcd: 'E11.9',
    displayOrder: 2,
    groups: [
      group('diabetes_information', 'Diabetes Information', [
        field('dm_type', 'Type', 'select', { options: ['Type 1', 'Type 2', 'Gestational', 'Other'] }),
        field('diagnosis_date', 'Diagnosis Date', 'date'),
        field('duration', 'Duration'),
      ]),
      group('glycaemic_control', 'Glycaemic Control', [
        field('latest_hba1c', 'Latest HbA1c', 'number'),
        field('hba1c_date', 'HbA1c Date', 'date'),
        field('goal_hba1c', 'Goal HbA1c', 'number'),
        field('fasting_blood_sugar', 'Fasting Blood Sugar', 'number'),
        field('post_prandial_blood_sugar', 'Post-prandial Blood Sugar', 'number'),
      ]),
      group('home_monitoring', 'Home Monitoring', [
        field('home_glucose_monitoring', 'Home Glucose Monitoring', 'yes_no', YES_NO),
        field('hypoglycaemic_episodes', 'Hypoglycaemic Episodes'),
        field('hyperglycaemic_episodes', 'Hyperglycaemic Episodes'),
      ]),
      group('medication', 'Medication', [
        field('oral_medication', 'Oral Medication'),
        field('insulin', 'Insulin', 'yes_no', YES_NO),
        field('glp1', 'GLP-1', 'yes_no', YES_NO),
        field('sglt2', 'SGLT2', 'yes_no', YES_NO),
        field('dm_compliance', 'Compliance', 'yes_no', YES_NO),
      ]),
      group('complications', 'Complications', [
        field('neuropathy', 'Neuropathy', 'checkbox'),
        field('retinopathy', 'Retinopathy', 'checkbox'),
        field('nephropathy', 'Nephropathy', 'checkbox'),
        field('foot_ulcer', 'Foot Ulcer', 'checkbox'),
      ]),
      group('annual_care', 'Annual Care', [
        field('eye_exam', 'Eye Exam', 'yes_no', YES_NO),
        field('foot_exam', 'Foot Exam', 'yes_no', YES_NO),
        field('microalbumin', 'Microalbumin', 'yes_no', YES_NO),
        field('egfr', 'eGFR', 'number'),
        field('vaccinations', 'Vaccinations'),
      ]),
      group('lifestyle', 'Lifestyle', [
        field('diet_education', 'Diet Education', 'checkbox'),
        field('exercise', 'Exercise', 'checkbox'),
        field('weight_loss_goal', 'Weight Loss Goal'),
      ]),
    ],
  },
  {
    diseaseCode: 'hyperlipidaemia',
    name: 'Hyperlipidaemia',
    defaultIcd: 'E78.5',
    displayOrder: 3,
    groups: [
      group('lipid_results', 'Lipid Results', [
        field('total_cholesterol', 'Total Cholesterol', 'number'),
        field('ldl', 'LDL', 'number'),
        field('hdl', 'HDL', 'number'),
        field('triglycerides', 'Triglycerides', 'number'),
      ]),
      group('treatment', 'Treatment', [
        field('statin', 'Statin'),
        field('high_intensity', 'High Intensity', 'yes_no', YES_NO),
        field('side_effects', 'Side Effects', 'textarea'),
      ]),
      group('risk', 'Risk', [
        field('ascvd_risk', 'ASCVD Risk %', 'number'),
        field('family_history', 'Family History', 'yes_no', YES_NO),
      ]),
      group('lifestyle', 'Lifestyle', [
        field('low_fat_diet', 'Low Fat Diet', 'checkbox'),
        field('exercise', 'Exercise', 'checkbox'),
      ]),
    ],
  },
  {
    diseaseCode: 'obesity',
    name: 'Obesity',
    defaultIcd: 'E66.9',
    displayOrder: 4,
    groups: [
      group('measurements', 'Measurements', [
        field('height', 'Height', 'auto_vitals_height'),
        field('weight', 'Weight', 'auto_vitals_weight'),
        field('bmi', 'BMI', 'auto_vitals_bmi'),
        field('waist_circumference', 'Waist Circumference', 'number'),
      ]),
      group('classification', 'Classification', [
        field('obesity_class', 'Classification', 'select', CLASSIFICATION_OBESITY),
      ]),
      group('lifestyle', 'Lifestyle', [
        field('calorie_goal', 'Calorie Goal'),
        field('exercise_goal', 'Exercise Goal'),
        field('nutrition_referral', 'Nutrition Referral', 'yes_no', YES_NO),
      ]),
      group('treatment', 'Treatment', [
        field('weight_loss_medication', 'Weight Loss Medication'),
        field('bariatric_referral', 'Bariatric Referral', 'yes_no', YES_NO),
      ]),
    ],
  },
  {
    diseaseCode: 'coronary_artery_disease',
    name: 'Coronary Artery Disease',
    defaultIcd: 'I25.10',
    displayOrder: 5,
    groups: [
      group('symptoms', 'Symptoms', [
        field('chest_pain', 'Chest Pain', 'yes_no', YES_NO),
        field('dyspnoea', 'Dyspnoea', 'yes_no', YES_NO),
        field('exercise_tolerance', 'Exercise Tolerance'),
      ]),
      group('history', 'History', [
        field('previous_mi', 'Previous MI', 'checkbox'),
        field('pci', 'PCI', 'checkbox'),
        field('cabg', 'CABG', 'checkbox'),
      ]),
      group('medication', 'Medication', [
        field('aspirin', 'Aspirin', 'yes_no', YES_NO),
        field('statin', 'Statin', 'yes_no', YES_NO),
        field('beta_blocker', 'Beta Blocker', 'yes_no', YES_NO),
        field('ace_arb', 'ACE/ARB', 'yes_no', YES_NO),
      ]),
      group('monitoring', 'Monitoring', [
        field('ecg', 'ECG', 'yes_no', YES_NO),
        field('stress_test', 'Stress Test', 'yes_no', YES_NO),
        field('echo', 'Echo', 'yes_no', YES_NO),
      ]),
    ],
  },
  {
    diseaseCode: 'heart_failure',
    name: 'Heart Failure',
    defaultIcd: 'I50.9',
    displayOrder: 6,
    groups: [
      group('classification', 'Classification', [
        field('hfpef', 'HFpEF', 'checkbox'),
        field('hfref', 'HFrEF', 'checkbox'),
        field('nyha_class', 'NYHA Class', 'select', { options: ['I', 'II', 'III', 'IV'] }),
      ]),
      group('symptoms', 'Symptoms', [
        field('dyspnoea', 'Dyspnoea', 'yes_no', YES_NO),
        field('orthopnoea', 'Orthopnoea', 'yes_no', YES_NO),
        field('pnd', 'PND', 'yes_no', YES_NO),
        field('oedema', 'Oedema', 'yes_no', YES_NO),
      ]),
      group('monitoring', 'Monitoring', [
        field('daily_weight', 'Daily Weight', 'yes_no', YES_NO),
        field('bnp', 'BNP', 'number'),
        field('ef_percent', 'EF %', 'number'),
      ]),
      group('medication', 'Medication', [
        field('diuretic', 'Diuretic', 'yes_no', YES_NO),
        field('ace_arb', 'ACE/ARB', 'yes_no', YES_NO),
        field('beta_blocker', 'Beta Blocker', 'yes_no', YES_NO),
        field('sglt2', 'SGLT2', 'yes_no', YES_NO),
      ]),
    ],
  },
  {
    diseaseCode: 'copd',
    name: 'COPD',
    defaultIcd: 'J44.9',
    displayOrder: 7,
    groups: [
      group('assessment', 'Assessment', [
        field('gold_stage', 'GOLD Stage', 'select', { options: ['1', '2', '3', '4'] }),
        field('smoking_status', 'Smoking Status', 'select', { options: ['Never', 'Former', 'Current'] }),
        field('pack_years', 'Pack Years', 'number'),
      ]),
      group('symptoms', 'Symptoms', [
        field('cough', 'Cough', 'yes_no', YES_NO),
        field('sputum', 'Sputum', 'yes_no', YES_NO),
        field('dyspnoea', 'Dyspnoea', 'yes_no', YES_NO),
        field('wheezing', 'Wheezing', 'yes_no', YES_NO),
      ]),
      group('monitoring', 'Monitoring', [
        field('spirometry', 'Spirometry'),
        field('oxygen_saturation', 'Oxygen Saturation', 'number'),
        field('cat_score', 'CAT Score', 'number'),
        field('mmrc_score', 'mMRC Score', 'number'),
      ]),
      group('medication', 'Medication', [
        field('saba', 'SABA', 'yes_no', YES_NO),
        field('laba', 'LABA', 'yes_no', YES_NO),
        field('lama', 'LAMA', 'yes_no', YES_NO),
        field('ics', 'ICS', 'yes_no', YES_NO),
      ]),
      group('exacerbations', 'Exacerbations', [
        field('number_last_year', 'Number Last Year', 'number'),
        field('hospitalisations', 'Hospitalisations', 'number'),
      ]),
    ],
  },
  {
    diseaseCode: 'asthma',
    name: 'Asthma',
    defaultIcd: 'J45.909',
    displayOrder: 8,
    groups: [
      group('classification', 'Classification', [
        field('asthma_class', 'Classification', 'select', {
          options: ['Intermittent', 'Mild Persistent', 'Moderate Persistent', 'Severe Persistent'],
        }),
      ]),
      group('symptoms', 'Symptoms', [
        field('daytime_symptoms', 'Daytime Symptoms', 'yes_no', YES_NO),
        field('night_symptoms', 'Night Symptoms', 'yes_no', YES_NO),
        field('rescue_inhaler_use', 'Rescue Inhaler Use'),
      ]),
      group('monitoring', 'Monitoring', [
        field('peak_flow', 'Peak Flow', 'number'),
        field('act_score', 'ACT Score', 'number'),
        field('spirometry', 'Spirometry'),
      ]),
      group('medication', 'Medication', [
        field('ics', 'ICS', 'yes_no', YES_NO),
        field('laba', 'LABA', 'yes_no', YES_NO),
        field('rescue_inhaler', 'Rescue Inhaler', 'yes_no', YES_NO),
      ]),
    ],
  },
  {
    diseaseCode: 'chronic_kidney_disease',
    name: 'Chronic Kidney Disease',
    defaultIcd: 'N18.9',
    displayOrder: 9,
    groups: [
      group('kidney_function', 'Kidney Function', [
        field('ckd_stage', 'Stage', 'select', { options: ['1', '2', '3a', '3b', '4', '5'] }),
        field('egfr', 'eGFR', 'number'),
        field('creatinine', 'Creatinine', 'number'),
        field('bun', 'BUN', 'number'),
      ]),
      group('urine', 'Urine', [
        field('proteinuria', 'Proteinuria', 'yes_no', YES_NO),
        field('albumin_creatinine_ratio', 'Albumin/Creatinine Ratio', 'number'),
      ]),
      group('electrolytes', 'Electrolytes', [
        field('potassium', 'Potassium', 'number'),
        field('sodium', 'Sodium', 'number'),
      ]),
      group('blood_pressure', 'Blood Pressure', [
        field('latest_bp', 'Latest BP', 'auto_vitals_bp'),
      ]),
      group('referral', 'Referral', [
        field('nephrology', 'Nephrology', 'yes_no', YES_NO),
      ]),
    ],
  },
  {
    diseaseCode: 'depression',
    name: 'Depression',
    defaultIcd: 'F32.9',
    displayOrder: 10,
    groups: [
      group('screening', 'Screening', [
        field('phq9_score', 'PHQ-9 Score', 'number'),
        field('severity', 'Severity', 'select', {
          options: ['None', 'Mild', 'Moderate', 'Moderately Severe', 'Severe'],
        }),
      ]),
      group('symptoms', 'Symptoms', [
        field('mood', 'Mood'),
        field('sleep', 'Sleep'),
        field('appetite', 'Appetite'),
        field('energy', 'Energy'),
        field('concentration', 'Concentration'),
      ]),
      group('safety', 'Safety', [
        field('suicidal_ideation', 'Suicidal Ideation', 'yes_no', YES_NO),
        field('safety_plan', 'Safety Plan', 'textarea'),
      ]),
      group('treatment', 'Treatment', [
        field('ssri', 'SSRI'),
        field('counselling', 'Counselling', 'yes_no', YES_NO),
        field('psychiatry_referral', 'Psychiatry Referral', 'yes_no', YES_NO),
      ]),
    ],
  },
  {
    diseaseCode: 'anxiety',
    name: 'Anxiety',
    defaultIcd: 'F41.9',
    displayOrder: 11,
    groups: [
      group('screening', 'Screening', [
        field('gad7_score', 'GAD-7 Score', 'number'),
        field('severity', 'Severity', 'select', {
          options: ['None', 'Mild', 'Moderate', 'Severe'],
        }),
      ]),
      group('symptoms', 'Symptoms', [
        field('worry', 'Worry', 'yes_no', YES_NO),
        field('panic', 'Panic', 'yes_no', YES_NO),
        field('restlessness', 'Restlessness', 'yes_no', YES_NO),
        field('sleep', 'Sleep'),
      ]),
      group('treatment', 'Treatment', [
        field('cbt', 'CBT', 'yes_no', YES_NO),
        field('medication', 'Medication'),
        field('psychiatry_referral', 'Psychiatry Referral', 'yes_no', YES_NO),
      ]),
    ],
  },
  {
    diseaseCode: 'hypothyroidism',
    name: 'Hypothyroidism',
    defaultIcd: 'E03.9',
    displayOrder: 12,
    groups: [
      group('laboratory', 'Laboratory', [
        field('tsh', 'TSH', 'number'),
        field('free_t4', 'Free T4', 'number'),
        field('t3', 'T3', 'number'),
      ]),
      group('symptoms', 'Symptoms', [
        field('fatigue', 'Fatigue', 'yes_no', YES_NO),
        field('weight_gain', 'Weight Gain', 'yes_no', YES_NO),
        field('cold_intolerance', 'Cold Intolerance', 'yes_no', YES_NO),
        field('constipation', 'Constipation', 'yes_no', YES_NO),
      ]),
      group('medication', 'Medication', [
        field('levothyroxine_dose', 'Levothyroxine Dose'),
        field('compliance', 'Compliance', 'yes_no', YES_NO),
      ]),
    ],
  },
  {
    diseaseCode: 'osteoporosis',
    name: 'Osteoporosis',
    defaultIcd: 'M81.0',
    displayOrder: 13,
    groups: [
      group('assessment', 'Assessment', [
        field('dexa_date', 'DEXA Date', 'date'),
        field('t_score', 'T Score', 'number'),
      ]),
      group('risk', 'Risk', [
        field('previous_fracture', 'Previous Fracture', 'yes_no', YES_NO),
        field('fall_risk', 'Fall Risk', 'yes_no', YES_NO),
        field('steroid_use', 'Steroid Use', 'yes_no', YES_NO),
      ]),
      group('treatment', 'Treatment', [
        field('calcium', 'Calcium', 'yes_no', YES_NO),
        field('vitamin_d', 'Vitamin D', 'yes_no', YES_NO),
        field('bisphosphonate', 'Bisphosphonate', 'yes_no', YES_NO),
      ]),
      group('lifestyle', 'Lifestyle', [
        field('weight_bearing_exercise', 'Weight Bearing Exercise', 'checkbox'),
        field('fall_prevention_education', 'Fall Prevention Education', 'checkbox'),
      ]),
    ],
  },
  {
    diseaseCode: 'other',
    name: 'Other',
    defaultIcd: null,
    displayOrder: 14,
    groups: [
      group('condition', 'Condition', [
        field('custom_condition_name', 'Condition Name', 'text', { required: true }),
        field('custom_icd', 'ICD-10'),
        field('disease_specific_metrics', 'Disease-Specific Metrics', 'textarea'),
        field('medication', 'Medication', 'textarea'),
        field('monitoring', 'Monitoring', 'textarea'),
        field('education', 'Education Discussed', 'checkbox'),
        field('other_notes', 'Notes', 'textarea'),
      ]),
    ],
  },
];

module.exports = { TEMPLATES };
