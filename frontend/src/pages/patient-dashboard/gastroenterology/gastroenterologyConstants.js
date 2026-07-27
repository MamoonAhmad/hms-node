export const GASTROENTEROLOGY_SECTIONS = [
  { id: 'gi-symptoms', label: 'GI Symptoms & Alarm Features' },
  { id: 'endoscopy', label: 'Endoscopy Tracker' },
  { id: 'ibd-liver', label: 'IBD & Liver Disease' },
  { id: 'assessment-plan', label: 'Assessment & Plan' },
];

/** Specialties that may see the Gastroenterology encounter tab. */
export const GI_ALLOWED_SPECIALTY_NAMES = [
  'Gastroenterology',
  'Hepatology',
];

export const GI_ALLOWED_SPECIALTY_CODES = ['GI', 'GASTRO', 'HEP'];

export const GI_DEPARTMENT_ALIASES = [
  'gastroenterology',
  'gi',
  'digestive',
  'hepatology',
];

export const YES_NO_OPTIONS = ['Yes', 'No'];

export const VISIT_TYPE_OPTIONS = [
  'New Patient',
  'Follow-up',
  'Annual Visit',
  'Post-procedure',
  'Urgent Visit',
];

export const SYMPTOM_DURATION_OPTIONS = [
  'Less than 24 Hours',
  '1-7 Days',
  '1-4 Weeks',
  '1-3 Months',
  'More than 3 Months',
];

export const SYMPTOM_ONSET_OPTIONS = ['Sudden', 'Gradual'];

export const AFFECTED_REGION_OPTIONS = [
  'Esophagus',
  'Stomach',
  'Small Intestine',
  'Colon',
  'Rectum',
  'Liver',
  'Gallbladder',
  'Pancreas',
  'Generalized',
];

export const GI_SYMPTOM_OPTIONS = [
  'Abdominal Pain',
  'Heartburn (GERD)',
  'Acid Reflux',
  'Dysphagia',
  'Odynophagia',
  'Nausea',
  'Vomiting',
  'Hematemesis',
  'Bloating',
  'Early Satiety',
  'Diarrhea',
  'Constipation',
  'Alternating Bowel Habits',
  'Rectal Bleeding',
  'Melena',
  'Hematochezia',
  'Fecal Incontinence',
  'Tenesmus',
  'Excessive Gas',
  'Jaundice',
  'Dark Urine',
  'Pale Stool',
  'Pruritus',
];

export const PAIN_LOCATION_OPTIONS = [
  'Epigastric',
  'RUQ',
  'LUQ',
  'RLQ',
  'LLQ',
  'Periumbilical',
  'Diffuse',
  'Suprapubic',
  'Flank',
];

export const PAIN_CHARACTER_OPTIONS = [
  'Sharp',
  'Dull',
  'Cramping',
  'Burning',
  'Colicky',
  'Aching',
  'Stabbing',
];

export const PAIN_FREQUENCY_OPTIONS = [
  'Constant',
  'Intermittent',
  'Postprandial',
  'Nocturnal',
  'Episodic',
];

export const PAIN_AGGRAVATING_OPTIONS = [
  'Food',
  'Hunger',
  'Movement',
  'Lying Flat',
  'Stress',
  'NSAIDs',
  'Alcohol',
];

export const PAIN_RELIEVING_OPTIONS = [
  'Antacids',
  'Food',
  'Bowel Movement',
  'Rest',
  'Heat',
  'Position Change',
  'Medications',
];

export const STOOL_CONSISTENCY_OPTIONS = [
  'Bristol Type 1 — Separate hard lumps',
  'Bristol Type 2 — Lumpy sausage',
  'Bristol Type 3 — Cracked sausage',
  'Bristol Type 4 — Smooth sausage',
  'Bristol Type 5 — Soft blobs',
  'Bristol Type 6 — Mushy',
  'Bristol Type 7 — Watery',
];

export const ALARM_FEATURE_OPTIONS = [
  'Unintentional Weight Loss',
  'Persistent Vomiting',
  'GI Bleeding',
  'Iron Deficiency Anemia',
  'Progressive Dysphagia',
  'Palpable Abdominal Mass',
  'Persistent Fever',
  'Family History of GI Cancer',
  'Age >50 with New Symptoms',
  'Night Symptoms',
  'Persistent Severe Pain',
  'Jaundice',
  'Persistent Change in Bowel Habits',
];

/** Suggested investigations when alarm features are present. */
export const ALARM_INVESTIGATION_RECOMMENDATIONS = [
  'CBC / iron studies',
  'CMP / LFTs',
  'Fecal occult blood / FIT',
  'Urgent endoscopy (EGD / colonoscopy) as indicated',
  'Cross-sectional imaging if mass or severe pain',
  'Consider GI / surgery referral',
];

export const FAMILY_HISTORY_OPTIONS = [
  'Colon Cancer',
  'Gastric Cancer',
  'Pancreatic Cancer',
  'Liver Disease',
  'Crohn Disease',
  'Ulcerative Colitis',
  'Celiac Disease',
];

export const LIFESTYLE_RISK_OPTIONS = [
  'Smoking',
  'Alcohol Use',
  'NSAID Use',
  'Steroid Use',
  'High Fat Diet',
  'Travel History',
  'Recent Antibiotics',
  'Food Intolerance',
  'Previous GI Surgery',
];

export const PROCEDURE_TYPE_OPTIONS = [
  'Colonoscopy',
  'Upper Endoscopy (EGD)',
  'Flexible Sigmoidoscopy',
  'Capsule Endoscopy',
  'ERCP',
  'Endoscopic Ultrasound (EUS)',
];

export const PROCEDURE_STATUS_OPTIONS = [
  'Ordered',
  'Scheduled',
  'Completed',
  'Cancelled',
  'Rescheduled',
];

export const INDICATION_OPTIONS = [
  'Screening',
  'Surveillance',
  'GI Bleeding',
  'Abdominal Pain',
  'GERD',
  'Dysphagia',
  'IBD Follow-up',
  'Anemia',
  'Positive FIT',
  'Positive Cologuard',
  'Family History',
  'Other',
];

export const PREP_PRESCRIBED_OPTIONS = [
  'PEG (Golytely / NuLYTELY)',
  'Split-dose PEG',
  'Sodium sulfate (Suprep)',
  'MiraLAX / Gatorade',
  'Fleet Phospho-Soda',
  'Other',
  'N/A',
];

export const PREP_QUALITY_OPTIONS = [
  'Excellent',
  'Good',
  'Fair',
  'Poor',
  'Inadequate',
];

export const FINDING_OPTIONS = [
  'Normal',
  'Polyps',
  'Diverticulosis',
  'Colitis',
  'Gastritis',
  'Esophagitis',
  'Barrett Esophagus',
  'Ulcer',
  'Hemorrhoids',
  'Stricture',
  'Mass',
  'Varices',
];

export const POLYP_LOCATION_OPTIONS = [
  'Cecum',
  'Ascending Colon',
  'Transverse Colon',
  'Descending Colon',
  'Sigmoid',
  'Rectum',
  'Multiple Sites',
];

export const PATHOLOGY_STATUS_OPTIONS = [
  'Pending',
  'In Progress',
  'Resulted',
  'Amended',
  'Cancelled',
];

export const DYSPLASIA_OPTIONS = ['None', 'Low Grade', 'High Grade'];

export const SURVEILLANCE_INTERVAL_OPTIONS = [
  '6 Months',
  '1 Year',
  '3 Years',
  '5 Years',
  '10 Years',
  'As Clinically Indicated',
];

export const IBD_LIVER_DIAGNOSIS_OPTIONS = [
  'Crohn Disease',
  'Ulcerative Colitis',
  'Indeterminate Colitis',
  'Irritable Bowel Syndrome',
  'Non-Alcoholic Fatty Liver Disease (NAFLD)',
  'Metabolic Dysfunction-Associated Steatotic Liver Disease (MASLD)',
  'Alcohol-Associated Liver Disease',
  'Autoimmune Hepatitis',
  'Chronic Hepatitis B',
  'Chronic Hepatitis C',
  'Primary Biliary Cholangitis',
  'Primary Sclerosing Cholangitis',
  'Cirrhosis',
];

export const DISEASE_STATUS_OPTIONS = [
  'Remission',
  'Mild',
  'Moderate',
  'Severe',
  'Active Flare',
];

export const SYMPTOM_SEVERITY_OPTIONS = ['None', 'Mild', 'Moderate', 'Severe'];

export const IBD_ASSESSMENT_OPTIONS = [
  'Abdominal Pain',
  'Diarrhea',
  'Bloody Stool',
  'Weight Loss',
  'Fever',
  'Perianal Disease',
  'Fistula',
  'Abscess',
];

export const LIVER_ASSESSMENT_OPTIONS = [
  'Jaundice',
  'Ascites',
  'Hepatic Encephalopathy',
  'Edema',
  'Variceal Bleeding',
  'Hepatomegaly',
  'Splenomegaly',
];

export const IMAGING_PROCEDURE_OPTIONS = [
  'Colonoscopy Reviewed',
  'MRI Enterography',
  'CT Abdomen',
  'Liver Ultrasound',
  'FibroScan',
  'Liver Biopsy',
];

export const GI_COMMON_MEDICATIONS = [
  'Mesalamine',
  'Sulfasalazine',
  'Budesonide',
  'Prednisone',
  'Azathioprine',
  '6-Mercaptopurine',
  'Methotrexate',
  'Infliximab',
  'Adalimumab',
  'Vedolizumab',
  'Ustekinumab',
  'Tenofovir',
  'Entecavir',
  'Lactulose',
  'Rifaximin',
];

export const VACCINATION_OPTIONS = [
  'Influenza',
  'COVID-19',
  'Pneumococcal',
  'Hepatitis A',
  'Hepatitis B',
  'Shingles',
];

export const FOLLOW_UP_INTERVAL_OPTIONS = [
  '1 Week',
  '2 Weeks',
  '1 Month',
  '3 Months',
  '6 Months',
  '12 Months',
  'As Needed',
];

export const GI_REFERRAL_OPTIONS = [
  'Gastroenterology Surgery',
  'Hepatology',
  'Nutrition',
  'Other',
];
