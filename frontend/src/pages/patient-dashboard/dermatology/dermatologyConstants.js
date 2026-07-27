export const DERMATOLOGY_SECTIONS = [
  { id: 'skin-exam', label: 'Skin Examination' },
  { id: 'biopsy', label: 'Biopsy Procedure' },
  { id: 'treatment-plan', label: 'Treatment Plan' },
];

export const YES_NO_OPTIONS = ['Yes', 'No'];

export const EXAMINATION_TYPE_OPTIONS = [
  'Initial Evaluation',
  'Follow-up',
  'Annual Skin Examination',
  'Lesion Evaluation',
  'Rash Evaluation',
  'Skin Cancer Screening',
];

export const VISIT_TYPE_OPTIONS = [
  'New Patient',
  'Established Patient',
  'Follow-up',
  'Procedure Visit',
];

export const BODY_EXAMINATION_OPTIONS = [
  'Full Body',
  'Upper Body',
  'Lower Body',
  'Localised Examination',
];

/** Grouped body locations for multi-select + body map. */
export const BODY_LOCATION_GROUPS = [
  {
    group: 'Head & Neck',
    locations: ['Scalp', 'Face', 'Forehead', 'Nose', 'Lips', 'Chin', 'Neck', 'Ears'],
  },
  {
    group: 'Upper Extremity',
    locations: ['Shoulder', 'Arm', 'Elbow', 'Forearm', 'Wrist', 'Hand', 'Fingers'],
  },
  {
    group: 'Trunk',
    locations: ['Chest', 'Abdomen', 'Upper Back', 'Lower Back', 'Flank'],
  },
  {
    group: 'Lower Extremity',
    locations: ['Hip', 'Thigh', 'Knee', 'Leg', 'Ankle', 'Foot', 'Toes'],
  },
  {
    group: 'Other',
    locations: ['Nails', 'Hair', 'Mucosa', 'Genital Area'],
  },
];

export const ALL_BODY_LOCATIONS = BODY_LOCATION_GROUPS.flatMap((g) => g.locations);

export const PRIMARY_LESION_OPTIONS = [
  'Macule',
  'Patch',
  'Papule',
  'Plaque',
  'Nodule',
  'Tumour',
  'Vesicle',
  'Bulla',
  'Pustule',
  'Wheal',
  'Cyst',
];

export const SECONDARY_LESION_OPTIONS = [
  'Scale',
  'Crust',
  'Excoriation',
  'Fissure',
  'Ulcer',
  'Scar',
  'Atrophy',
  'Lichenification',
  'Erosion',
];

export const COLOUR_OPTIONS = [
  'Skin Coloured',
  'Pink',
  'Red',
  'Brown',
  'Black',
  'Blue',
  'Purple',
  'White',
  'Yellow',
];

export const BORDER_OPTIONS = ['Regular', 'Irregular', 'Well Defined', 'Poorly Defined'];

export const SURFACE_OPTIONS = [
  'Smooth',
  'Rough',
  'Verrucous',
  'Scaly',
  'Crusted',
  'Ulcerated',
  'Keratotic',
];

export const SHAPE_OPTIONS = ['Round', 'Oval', 'Linear', 'Annular', 'Target', 'Irregular'];

export const DISTRIBUTION_OPTIONS = [
  'Localised',
  'Generalised',
  'Symmetrical',
  'Asymmetrical',
  'Dermatomal',
  'Flexural',
  'Extensor',
  'Sun Exposed',
  'Intertriginous',
];

export const SYMPTOM_OPTIONS = [
  'Itching',
  'Pain',
  'Tenderness',
  'Burning',
  'Bleeding',
  'Oozing',
  'Drainage',
  'Rapid Growth',
];

export const ASSOCIATED_FINDING_OPTIONS = [
  'Hair Loss',
  'Nail Changes',
  'Lymphadenopathy',
  'Infection',
  'Pigmentation Changes',
];

export const ABCDE_FIELDS = [
  { key: 'asymmetry', label: 'Asymmetry' },
  { key: 'borderIrregularity', label: 'Border Irregularity' },
  { key: 'colourVariation', label: 'Colour Variation' },
  { key: 'diameterOver6mm', label: 'Diameter (>6 mm)' },
  { key: 'evolution', label: 'Evolution' },
];

export const PHOTO_CHECK_FIELDS = [
  { key: 'photographTaken', label: 'Photograph Taken' },
  { key: 'imageUploaded', label: 'Image Uploaded' },
  { key: 'consentObtained', label: 'Consent Obtained' },
  { key: 'lesionMarked', label: 'Lesion Marked' },
];

export const BIOPSY_PROCEDURE_TYPE_OPTIONS = [
  'Shave Biopsy',
  'Punch Biopsy',
  'Excisional Biopsy',
  'Incisional Biopsy',
  'Curettage',
  'Saucerisation',
];

export const LATERALITY_OPTIONS = ['Left', 'Right', 'Bilateral'];

export const HAEMOSTASIS_OPTIONS = [
  'Pressure',
  'Aluminium Chloride',
  'Silver Nitrate',
  'Electrocautery',
  'Sutures',
];

export const CLOSURE_OPTIONS = [
  'None',
  'Steri-Strips',
  'Simple Sutures',
  'Running Sutures',
  'Adhesive',
  'Staples',
];

export const DRESSING_CHECK_FIELDS = [
  { key: 'bandageApplied', label: 'Bandage Applied' },
  { key: 'pressureDressing', label: 'Pressure Dressing' },
  { key: 'antibioticOintment', label: 'Antibiotic Ointment' },
  { key: 'woundCareInstructionsGiven', label: 'Wound Care Instructions Given' },
];

export const COMPLICATION_OPTIONS = [
  'None',
  'Bleeding',
  'Infection',
  'Pain',
  'Vasovagal Episode',
  'Other',
];

export const OFFICE_PROCEDURE_OPTIONS = [
  'Cryotherapy',
  'Electrodessication',
  'Curettage',
  'Incision & Drainage',
  'Intralesional Injection',
  'Chemical Peel',
  'Laser Therapy',
  'Phototherapy',
  'Excision',
  'Biopsy',
];

export const SKIN_CARE_OPTIONS = [
  'Moisturiser',
  'Gentle Cleanser',
  'Sunscreen SPF ≥30',
  'Avoid Irritants',
  'Sun Protection',
  'Daily Skin Checks',
];

export const PATIENT_EDUCATION_OPTIONS = [
  'Melanoma Warning Signs',
  'ABCDE Education',
  'Acne Care',
  'Eczema Care',
  'Psoriasis Care',
  'Wound Care',
  'Skin Cancer Prevention',
  'Self Skin Examination',
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

export const REFERRAL_OPTIONS = [
  'Mohs Surgery',
  'Plastic Surgery',
  'Oncology',
  'Rheumatology',
  'Allergy & Immunology',
  'Primary Care',
];

export const OUTCOME_OPTIONS = ['Improved', 'Stable', 'Worsening', 'Resolved'];

export const MEDICATION_CATEGORY_HINTS = [
  'Topical Steroid',
  'Oral Antibiotic',
  'Oral Antifungal',
  'Topical Antifungal',
  'Retinoid',
  'Biologic',
  'Immunosuppressant',
  'Antihistamine',
  'Moisturiser',
  'Sunscreen',
];
