const Joi = require('joi');

const STRENGTH_UNITS = ['mg', 'mcg', 'g', 'mL', 'units', 'percentage', 'Other'];
const DOSAGE_FORMS = [
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
const ROUTES = [
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
const CONTROLLED_SCHEDULES = ['Schedule II', 'Schedule III', 'Schedule IV', 'Schedule V'];
const FREQUENCIES = [
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
const DURATION_UNITS = ['Days', 'Weeks', 'Months'];
const CATEGORIES = [
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
const MEDICATION_TYPES = [
  'Brand',
  'Generic',
  'Biosimilar',
  'Compound',
  'OTC',
  'Other',
];
const FORMULARY_STATUSES = [
  'On Formulary',
  'Non-Formulary',
  'Restricted',
  'Pending Review',
];
const PREGNANCY_OPTIONS = ['A', 'B', 'C', 'D', 'X', 'Not Classified'];
const LACTATION_OPTIONS = ['Compatible', 'Caution', 'Avoid', 'Unknown'];
const SORT_FIELDS = [
  'name',
  'genericName',
  'strength',
  'isActive',
  'createdAt',
  'updatedAt',
];

const nonNegativeNumber = Joi.number().min(0).allow(null);
const nonNegativeInt = Joi.number().integer().min(0).allow(null);

const medicationBodyFields = {
  name: Joi.string().trim().min(1).max(255),
  genericName: Joi.string().trim().min(1).max(255),
  brandName: Joi.string().trim().max(255).allow('', null),
  code: Joi.string().trim().max(100).allow('', null),
  ndc: Joi.string().trim().max(50).allow('', null),
  strength: Joi.string().trim().min(1).max(100),
  strengthUnit: Joi.string().valid(...STRENGTH_UNITS),
  dosageForm: Joi.string().valid(...DOSAGE_FORMS),
  route: Joi.array().items(Joi.string().valid(...ROUTES)).min(1),
  medicationClass: Joi.string().trim().max(255).allow('', null),
  medicationType: Joi.string().valid(...MEDICATION_TYPES, '', null).allow(null),
  therapeuticCategory: Joi.string().valid(...CATEGORIES, '', null).allow(null),
  concentration: Joi.string().trim().max(255).allow('', null),
  manufacturer: Joi.string().trim().max(255).allow('', null),
  isControlledSubstance: Joi.boolean(),
  controlledSubstanceSchedule: Joi.string().valid(...CONTROLLED_SCHEDULES, '', null).allow(null),
  prescriptionRequired: Joi.boolean(),
  priorAuthorization: Joi.boolean(),
  ageRestrictions: Joi.string().trim().max(500).allow('', null),
  diagnosisRequired: Joi.boolean(),
  weightBasedDosing: Joi.boolean(),
  defaultFrequency: Joi.string().valid(...FREQUENCIES, '', null).allow(null),
  defaultDose: Joi.string().trim().max(100).allow('', null),
  defaultDoseUnit: Joi.string().valid(...STRENGTH_UNITS, '', null).allow(null),
  defaultDuration: nonNegativeInt,
  durationUnit: Joi.string().valid(...DURATION_UNITS, '', null).allow(null),
  defaultQuantity: nonNegativeNumber,
  refillAllowed: Joi.boolean(),
  maximumRefills: nonNegativeInt,
  description: Joi.string().trim().max(5000).allow('', null),
  instructions: Joi.string().trim().max(5000).allow('', null),
  indications: Joi.string().trim().max(10000).allow('', null),
  contraindications: Joi.string().trim().max(10000).allow('', null),
  warnings: Joi.string().trim().max(10000).allow('', null),
  pregnancy: Joi.string().valid(...PREGNANCY_OPTIONS, '', null).allow(null),
  lactation: Joi.string().valid(...LACTATION_OPTIONS, '', null).allow(null),
  renalHepaticAdjustments: Joi.string().trim().max(10000).allow('', null),
  rxNorm: Joi.string().trim().max(100).allow('', null),
  atc: Joi.string().trim().max(100).allow('', null),
  snomedCt: Joi.string().trim().max(100).allow('', null),
  hcpcs: Joi.string().trim().max(100).allow('', null),
  formularyStatus: Joi.string().valid(...FORMULARY_STATUSES, '', null).allow(null),
  preferredDrug: Joi.boolean(),
  alternativeMedication: Joi.string().trim().max(500).allow('', null),
  drugMonograph: Joi.string().trim().max(10000).allow('', null),
  patientLeaflet: Joi.string().trim().max(10000).allow('', null),
  effectiveDate: Joi.date().iso().allow('', null),
  expiryDate: Joi.date().iso().allow('', null),
  isActive: Joi.boolean(),
  confirmDuplicate: Joi.boolean(),
};

const createMedicationCatalogSchema = Joi.object({
  ...medicationBodyFields,
  name: medicationBodyFields.name.required().messages({
    'string.empty': 'Medication Name is required',
    'any.required': 'Medication Name is required',
  }),
  genericName: medicationBodyFields.genericName.required().messages({
    'string.empty': 'Generic Name is required',
    'any.required': 'Generic Name is required',
  }),
  strength: medicationBodyFields.strength.required().messages({
    'string.empty': 'Strength is required',
    'any.required': 'Strength is required',
  }),
  strengthUnit: medicationBodyFields.strengthUnit.required().messages({
    'any.only': 'Strength Unit is required',
    'any.required': 'Strength Unit is required',
  }),
  dosageForm: medicationBodyFields.dosageForm.required().messages({
    'any.only': 'Dosage Form is required',
    'any.required': 'Dosage Form is required',
  }),
  route: medicationBodyFields.route.required().messages({
    'array.min': 'At least one Route is required',
    'any.required': 'Route is required',
  }),
  isControlledSubstance: medicationBodyFields.isControlledSubstance.default(false),
  prescriptionRequired: medicationBodyFields.prescriptionRequired.default(true),
  priorAuthorization: medicationBodyFields.priorAuthorization.default(false),
  diagnosisRequired: medicationBodyFields.diagnosisRequired.default(false),
  weightBasedDosing: medicationBodyFields.weightBasedDosing.default(false),
  preferredDrug: medicationBodyFields.preferredDrug.default(false),
  refillAllowed: medicationBodyFields.refillAllowed.default(true),
  isActive: medicationBodyFields.isActive.default(true),
})
  .custom((value, helpers) => {
    if (value.isControlledSubstance && !value.controlledSubstanceSchedule) {
      return helpers.error('any.custom', {
        message: 'Controlled Substance Schedule is required when Controlled Substance is Yes',
      });
    }
    if (value.defaultDuration != null && value.defaultDuration !== '' && !value.durationUnit) {
      return helpers.error('any.custom', {
        message: 'Duration Unit is required when Default Duration is entered',
      });
    }
    if (value.effectiveDate && value.expiryDate) {
      const eff = new Date(value.effectiveDate);
      const exp = new Date(value.expiryDate);
      if (exp < eff) {
        return helpers.error('any.custom', {
          message: 'Expiry Date must not be earlier than Effective Date',
        });
      }
    }
    return value;
  })
  .messages({ 'any.custom': '{{#message}}' });

const updateMedicationCatalogSchema = Joi.object({
  ...medicationBodyFields,
})
  .min(1)
  .custom((value, helpers) => {
    if (value.isControlledSubstance === true && !value.controlledSubstanceSchedule) {
      return helpers.error('any.custom', {
        message: 'Controlled Substance Schedule is required when Controlled Substance is Yes',
      });
    }
    if (value.defaultDuration != null && value.defaultDuration !== '' && !value.durationUnit) {
      return helpers.error('any.custom', {
        message: 'Duration Unit is required when Default Duration is entered',
      });
    }
    if (value.effectiveDate && value.expiryDate) {
      const eff = new Date(value.effectiveDate);
      const exp = new Date(value.expiryDate);
      if (exp < eff) {
        return helpers.error('any.custom', {
          message: 'Expiry Date must not be earlier than Effective Date',
        });
      }
    }
    return value;
  })
  .messages({
    'object.min': 'At least one field must be provided for update',
    'any.custom': '{{#message}}',
  });

const queryMedicationCatalogSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(10),
  search: Joi.string().trim().max(200).allow(''),
  status: Joi.string().valid('Active', 'Inactive', '').allow(''),
  dosageForm: Joi.string().valid(...DOSAGE_FORMS, '').allow(''),
  route: Joi.string().valid(...ROUTES, '').allow(''),
  medicationClass: Joi.string().trim().max(200).allow(''),
  therapeuticCategory: Joi.string().valid(...CATEGORIES, '').allow(''),
  formularyStatus: Joi.string().valid(...FORMULARY_STATUSES, '').allow(''),
  isControlledSubstance: Joi.boolean(),
  prescriptionRequired: Joi.boolean(),
  sortBy: Joi.string().valid(...SORT_FIELDS).default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
});

const queryActiveMedicationCatalogSchema = Joi.object({
  search: Joi.string().trim().max(200).allow(''),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

const medicationCatalogIdSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((d) => d.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    req[property] = value;
    next();
  };
};

module.exports = {
  createMedicationCatalogSchema,
  updateMedicationCatalogSchema,
  queryMedicationCatalogSchema,
  queryActiveMedicationCatalogSchema,
  medicationCatalogIdSchema,
  validate,
  STRENGTH_UNITS,
  DOSAGE_FORMS,
  ROUTES,
  CONTROLLED_SCHEDULES,
  FREQUENCIES,
  DURATION_UNITS,
  CATEGORIES,
  MEDICATION_TYPES,
  FORMULARY_STATUSES,
  PREGNANCY_OPTIONS,
  LACTATION_OPTIONS,
};
