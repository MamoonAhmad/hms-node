export const STRENGTH_UNITS = ['mg', 'mcg', 'g', 'mL', 'units', 'percentage', 'Other'];

export const DOSAGE_FORMS = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Suspension',
  'Injection',
  'Cream',
  'Ointment',
  'Drops',
  'Inhaler',
  'Powder',
  'Patch',
  'Suppository',
  'Solution',
  'Other',
];

export const ROUTES = [
  'Oral',
  'Intravenous',
  'Intramuscular',
  'Subcutaneous',
  'Topical',
  'Inhalation',
  'Ophthalmic',
  'Otic',
  'Nasal',
  'Rectal',
  'Vaginal',
  'Transdermal',
  'Sublingual',
  'Other',
];

export const CONTROLLED_SCHEDULES = ['Schedule II', 'Schedule III', 'Schedule IV', 'Schedule V'];

export const FREQUENCIES = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every 4 hours',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
  'As needed',
  'Other',
];

export const DURATION_UNITS = ['Days', 'Weeks', 'Months'];

export const THERAPEUTIC_CATEGORIES = [
  'Antibiotic',
  'Analgesic',
  'Antihypertensive',
  'Antidiabetic',
  'Antihistamine',
  'Antidepressant',
  'Anticoagulant',
  'Bronchodilator',
  'Corticosteroid',
  'Other',
];

export const MEDICATION_TYPES = ['Brand', 'Generic', 'Biosimilar', 'Compound', 'OTC', 'Other'];

export const FORMULARY_STATUSES = [
  'On Formulary',
  'Non-Formulary',
  'Restricted',
  'Pending Review',
];

export const PREGNANCY_OPTIONS = ['A', 'B', 'C', 'D', 'X', 'Not Classified'];

export const LACTATION_OPTIONS = ['Compatible', 'Caution', 'Avoid', 'Unknown'];

export const emptyFormularyForm = () => ({
  name: '',
  genericName: '',
  brandName: '',
  medicationType: '',
  therapeuticCategory: '',
  medicationClass: '',
  isActive: true,
  strength: '',
  strengthUnit: '',
  dosageForm: '',
  route: [],
  concentration: '',
  defaultDose: '',
  defaultDoseUnit: '',
  defaultFrequency: '',
  defaultDuration: '',
  durationUnit: '',
  instructions: '',
  indications: '',
  contraindications: '',
  warnings: '',
  pregnancy: '',
  lactation: '',
  renalHepaticAdjustments: '',
  isControlledSubstance: false,
  controlledSubstanceSchedule: '',
  priorAuthorization: false,
  ageRestrictions: '',
  diagnosisRequired: false,
  weightBasedDosing: false,
  rxNorm: '',
  ndc: '',
  atc: '',
  snomedCt: '',
  hcpcs: '',
  formularyStatus: '',
  preferredDrug: false,
  alternativeMedication: '',
  manufacturer: '',
  drugMonograph: '',
  patientLeaflet: '',
});
