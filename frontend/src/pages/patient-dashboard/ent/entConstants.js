/** ENT specialty matchers — extend to show the tab for additional specialties. */
export const ENT_SPECIALTY_ALIASES = [
  'ent',
  'otolaryngology',
  'otolaryngologist',
  'ear nose throat',
  'ear, nose and throat',
  'ear, nose & throat',
  'otology',
  'rhinology',
  'laryngology',
];

export const ENT_SECTIONS = [
  { id: 'ear-assessment', label: 'Ear Assessment' },
  { id: 'nose-sinus', label: 'Nose & Sinus' },
  { id: 'throat-airway', label: 'Throat & Airway' },
];

export const YES_NO_OPTIONS = ['Yes', 'No'];
export const PRESENT_ABSENT_OPTIONS = ['Present', 'Absent'];
export const PASS_FAIL_OPTIONS = ['Pass', 'Fail'];

export const EAR_VISIT_TYPE_OPTIONS = [
  'New Patient',
  'Follow-up',
  'Annual Examination',
  'Post-operative',
  'Urgent Visit',
];

export const AFFECTED_EAR_OPTIONS = ['Right', 'Left', 'Bilateral'];

export const EAR_SYMPTOM_OPTIONS = [
  'Ear Pain (Otalgia)',
  'Hearing Loss',
  'Tinnitus',
  'Ear Fullness',
  'Ear Discharge (Otorrhea)',
  'Vertigo',
  'Dizziness',
  'Itching',
  'Bleeding',
  'Foreign Body',
  'Trauma',
  'Noise Exposure',
];

export const PINNA_OPTIONS = ['Normal', 'Swollen', 'Tender', 'Lesion', 'Trauma'];
export const EAR_CANAL_OPTIONS = [
  'Normal',
  'Cerumen',
  'Edema',
  'Erythema',
  'Foreign Body',
  'Drainage',
];
export const MASTOID_OPTIONS = ['Normal', 'Tenderness', 'Swelling'];

export const TYMPANIC_MEMBRANE_OPTIONS = [
  'Normal',
  'Intact',
  'Retracted',
  'Bulging',
  'Perforated',
  'Erythematous',
  'Scarred',
  'Dull',
  'Effusion Present',
  'Tympanostomy Tube Present',
];

export const MIDDLE_EAR_OPTIONS = [
  'Normal',
  'Fluid',
  'Acute Otitis Media',
  'Chronic Otitis Media',
  'Cholesteatoma',
];

export const MOBILITY_OPTIONS = ['Normal', 'Reduced', 'Absent'];

export const WEBER_OPTIONS = ['Midline', 'Lateralizes Right', 'Lateralizes Left'];
export const RINNE_OPTIONS = ['Positive', 'Negative'];

export const HEARING_LOSS_TYPE_OPTIONS = [
  'Normal Hearing',
  'Conductive',
  'Sensorineural',
  'Mixed',
];

export const HEARING_SEVERITY_OPTIONS = [
  'Mild',
  'Moderate',
  'Moderately Severe',
  'Severe',
  'Profound',
];

export const TYMPANOMETRY_OPTIONS = ['Normal', 'Type A', 'Type B', 'Type C'];

export const NOSE_SYMPTOM_OPTIONS = [
  'Nasal Congestion',
  'Rhinorrhea',
  'Sneezing',
  'Epistaxis',
  'Facial Pain',
  'Facial Pressure',
  'Loss of Smell',
  'Loss of Taste',
  'Postnasal Drip',
  'Nasal Obstruction',
  'Snoring',
  'Sleep Apnea Symptoms',
];

export const EXTERNAL_NOSE_OPTIONS = ['Normal', 'Trauma', 'Deformity', 'Swelling'];
export const NASAL_SEPTUM_OPTIONS = [
  'Midline',
  'Deviated Left',
  'Deviated Right',
  'Septal Perforation',
];
export const TURBINATE_OPTIONS = ['Normal', 'Enlarged', 'Inflamed', 'Pale', 'Hypertrophied'];
export const NASAL_MUCOSA_OPTIONS = [
  'Normal',
  'Erythematous',
  'Pale',
  'Edematous',
  'Dry',
  'Ulcerated',
];
export const NASAL_DISCHARGE_OPTIONS = ['None', 'Clear', 'Mucoid', 'Purulent', 'Bloody'];
export const NASAL_POLYP_OPTIONS = ['None', 'Right', 'Left', 'Bilateral'];

export const SINUS_TENDERNESS_OPTIONS = ['None', 'Mild', 'Moderate', 'Severe'];

export const ALLERGY_ASSESSMENT_OPTIONS = [
  'Seasonal Allergies',
  'Perennial Allergies',
  'Allergic Rhinitis',
  'Environmental Allergies',
  'Food Allergies',
];

export const NOSE_DIAGNOSTIC_OPTIONS = [
  'Nasal Endoscopy Ordered',
  'CT Sinus Ordered',
  'Allergy Testing Ordered',
  'Culture Collected',
];

export const NOSE_DIAGNOSIS_OPTIONS = [
  'Acute Sinusitis',
  'Chronic Sinusitis',
  'Allergic Rhinitis',
  'Nasal Polyp',
  'Deviated Septum',
  'Epistaxis',
  'Other Diagnosis',
];

export const THROAT_SYMPTOM_OPTIONS = [
  'Sore Throat',
  'Difficulty Swallowing (Dysphagia)',
  'Painful Swallowing (Odynophagia)',
  'Hoarseness',
  'Voice Change',
  'Chronic Cough',
  'Neck Mass',
  'Foreign Body Sensation',
  'Drooling',
  'Fever',
];

export const LIPS_OPTIONS = ['Normal', 'Lesion', 'Ulcer', 'Swelling'];
export const ORAL_MUCOSA_OPTIONS = ['Normal', 'Ulcer', 'Thrush', 'Leukoplakia', 'Erythema'];
export const TONGUE_OPTIONS = ['Normal', 'Coated', 'Lesion', 'Ulcer', 'Deviation'];
export const TEETH_GUMS_OPTIONS = ['Normal', 'Caries', 'Gingivitis', 'Poor Dentition'];

export const PHARYNX_OPTIONS = [
  'Normal',
  'Erythema',
  'Exudate',
  'Tonsillar Enlargement',
  'Tonsillar Exudate',
  'Peritonsillar Swelling',
  'Uvula Midline',
  'Uvula Deviated',
];

export const TONSIL_GRADE_OPTIONS = [
  'Grade 0',
  'Grade 1+',
  'Grade 2+',
  'Grade 3+',
  'Grade 4+',
];

export const NECK_EXAM_OPTIONS = [
  'Cervical Lymphadenopathy',
  'Neck Tenderness',
  'Thyroid Enlargement',
  'Neck Mass',
];

export const RESPIRATORY_DISTRESS_OPTIONS = ['None', 'Mild', 'Moderate', 'Severe'];
export const VOICE_QUALITY_OPTIONS = ['Normal', 'Hoarse', 'Muffled'];

export const AIRWAY_RED_FLAG_OPTIONS = [
  'Stridor',
  'Respiratory Distress',
  'Drooling',
  'Rapidly Progressive Neck Swelling',
  'Trismus',
  'Muffled ("Hot Potato") Voice',
  'Inability to Swallow Secretions',
  'Cyanosis',
  'Suspected Epiglottitis',
  'Suspected Airway Foreign Body',
  'Anaphylaxis',
  'Severe Peritonsillar Abscess',
  'Retropharyngeal Abscess',
];

export const THROAT_DIAGNOSTIC_OPTIONS = [
  'Rapid Strep Test',
  'Throat Culture',
  'COVID-19 Test',
  'Influenza Test',
  'Mononucleosis Test',
  'Neck Ultrasound',
  'CT Neck',
  'Flexible Laryngoscopy',
  'Swallow Study',
];

export const THROAT_TREATMENT_OPTIONS = [
  'Antibiotics Prescribed',
  'Steroids Prescribed',
  'Analgesics Recommended',
  'Hydration Advised',
  'ENT Referral',
  'Emergency Department Referral',
  'Hospital Admission Recommended',
  'Airway Intervention Required',
  'Follow-up Visit Scheduled',
];

export const FOLLOW_UP_INTERVAL_OPTIONS = [
  '1 Week',
  '2 Weeks',
  '1 Month',
  '3 Months',
  '6 Months',
  'As Needed',
  'PRN / Return if worse',
];
