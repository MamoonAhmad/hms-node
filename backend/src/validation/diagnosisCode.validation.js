const Joi = require('joi');
const {
  LATERALITY_VALUES,
  GENDER_RESTRICTIONS,
  isValidIcd10,
  normalizeIcd10,
} = require('../lib/codeCatalog');

const icdCodeField = Joi.string()
  .trim()
  .custom((value, helpers) => {
    const normalized = normalizeIcd10(value);
    if (!isValidIcd10(normalized)) {
      return helpers.error('any.invalid');
    }
    return normalized;
  })
  .messages({
    'any.invalid': 'ICD-10-CM code is invalid (e.g. E11.9 or J06.9)',
    'string.empty': 'ICD code is required',
    'any.required': 'ICD code is required',
  });

const createDiagnosisCodeSchema = Joi.object({
  code: icdCodeField.required(),
  description: Joi.string().trim().min(1).max(1000).required().messages({
    'string.empty': 'Description is required',
    'any.required': 'Description is required',
  }),
  shortDescription: Joi.string().trim().max(200).allow('', null),
  chapter: Joi.string().trim().max(20).allow('', null),
  isBillable: Joi.boolean().default(true),
  laterality: Joi.string()
    .valid(...LATERALITY_VALUES)
    .allow('', null),
  genderRestriction: Joi.string()
    .valid(...GENDER_RESTRICTIONS)
    .allow('', null),
  ageMin: Joi.number().integer().min(0).max(150).allow(null),
  ageMax: Joi.number().integer().min(0).max(150).allow(null),
  hccCategory: Joi.string().trim().max(20).allow('', null),
  isUnspecified: Joi.boolean().default(false),
  effectiveDate: Joi.date().iso().allow('', null),
  expiryDate: Joi.date().iso().allow('', null),
  isActive: Joi.boolean().default(true),
  codingNotes: Joi.string().trim().max(2000).allow('', null),
});

const updateDiagnosisCodeSchema = Joi.object({
  code: icdCodeField,
  description: Joi.string().trim().min(1).max(1000),
  shortDescription: Joi.string().trim().max(200).allow('', null),
  chapter: Joi.string().trim().max(20).allow('', null),
  isBillable: Joi.boolean(),
  laterality: Joi.string()
    .valid(...LATERALITY_VALUES)
    .allow('', null),
  genderRestriction: Joi.string()
    .valid(...GENDER_RESTRICTIONS)
    .allow('', null),
  ageMin: Joi.number().integer().min(0).max(150).allow(null),
  ageMax: Joi.number().integer().min(0).max(150).allow(null),
  hccCategory: Joi.string().trim().max(20).allow('', null),
  isUnspecified: Joi.boolean(),
  effectiveDate: Joi.date().iso().allow('', null),
  expiryDate: Joi.date().iso().allow('', null),
  isActive: Joi.boolean(),
  codingNotes: Joi.string().trim().max(2000).allow('', null),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

const queryDiagnosisCodeSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(10),
  search: Joi.string().trim().max(200).allow(''),
  status: Joi.string().valid('active', 'inactive', 'all').default('all'),
  isActive: Joi.boolean(),
  isBillable: Joi.boolean(),
  chapter: Joi.string().trim().max(20).allow(''),
  laterality: Joi.string().valid(...LATERALITY_VALUES, ''),
  lookup: Joi.boolean(),
  validOn: Joi.date().iso().allow('', null),
});

const diagnosisCodeIdSchema = Joi.object({
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
  createDiagnosisCodeSchema,
  updateDiagnosisCodeSchema,
  queryDiagnosisCodeSchema,
  diagnosisCodeIdSchema,
  validate,
};
