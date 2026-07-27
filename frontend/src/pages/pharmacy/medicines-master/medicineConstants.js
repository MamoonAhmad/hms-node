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

export const MEDICATION_CATEGORIES = [
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

export const emptyMedicineForm = () => ({
  name: '',
  genericName: '',
  brandName: '',
  code: '',
  ndc: '',
  strength: '',
  strengthUnit: '',
  dosageForm: '',
  route: [],
  medicationClass: '',
  manufacturer: '',
  isControlledSubstance: false,
  controlledSubstanceSchedule: '',
  prescriptionRequired: true,
  defaultFrequency: '',
  defaultDose: '',
  defaultDoseUnit: '',
  defaultDuration: '',
  durationUnit: '',
  defaultQuantity: '',
  refillAllowed: true,
  maximumRefills: '',
  description: '',
  instructions: '',
  effectiveDate: '',
  expiryDate: '',
  isActive: true,
});
