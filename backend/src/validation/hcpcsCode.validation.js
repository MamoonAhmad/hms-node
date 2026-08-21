const Joi = require('joi');
const {
  COVERAGE_STATUSES,
  UNIT_TYPES,
  isValidHcpcs,
  isValidRevenueCode,
  isValidModifier,
} = require('../lib/codeCatalog');

const hcpcsCodeField = Joi.string()
  .trim()
  .uppercase()
  .custom((value, helpers) => {
    if (!isValidHcpcs(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  })
  .messages({
    'any.invalid': 'HCPCS code must be a Level II code (letter A–V followed by 4 digits, e.g. J1885)',
    'string.empty': 'Code is required',
    'any.required': 'Code is required',
  });

const optionalRevenue = Joi.string()
  .trim()
  .allow('', null)
  .custom((value, helpers) => {
    if (value && !isValidRevenueCode(value)) {
      return helpers.error('any.invalid');
    }
    return value || null;
  })
  .messages({ 'any.invalid': 'Revenue code must be 3 or 4 digits' });

const optionalModifier = Joi.string()
  .trim()
  .uppercase()
  .allow('', null)
  .custom((value, helpers) => {
    if (value && !isValidModifier(value)) {
      return helpers.error('any.invalid');
    }
    return value || null;
  })
  .messages({ 'any.invalid': 'Modifier must be 2 alphanumeric characters' });

const createHcpcsCodeSchema = Joi.object({
  code: hcpcsCodeField.required(),
  description: Joi.string().trim().min(1).max(1000).required().messages({
    'string.empty': 'Description is required',
    'any.required': 'Description is required',
  }),
  shortDescription: Joi.string().trim().max(200).allow('', null),
  category: Joi.string().trim().max(8).allow('', null),
  isActive: Joi.boolean().default(true),
  isBillable: Joi.boolean().default(true),
  coverageStatus: Joi.string()
    .valid(...COVERAGE_STATUSES)
    .default('covered'),
  ndcRequired: Joi.boolean().default(false),
  defaultModifier: optionalModifier,
  revenueCode: optionalRevenue,
  unitPrice: Joi.number().min(0).allow(null),
  unitType: Joi.string()
    .valid(...UNIT_TYPES)
    .allow('', null),
  placeOfService: Joi.string().trim().max(10).allow('', null),
  codingNotes: Joi.string().trim().max(2000).allow('', null),
  effectiveDate: Joi.date().iso().allow('', null),
  expiryDate: Joi.date().iso().allow('', null),
});

const updateHcpcsCodeSchema = Joi.object({
  code: hcpcsCodeField,
  description: Joi.string().trim().min(1).max(1000),
  shortDescription: Joi.string().trim().max(200).allow('', null),
  category: Joi.string().trim().max(8).allow('', null),
  isActive: Joi.boolean(),
  isBillable: Joi.boolean(),
  coverageStatus: Joi.string().valid(...COVERAGE_STATUSES),
  ndcRequired: Joi.boolean(),
  defaultModifier: optionalModifier,
  revenueCode: optionalRevenue,
  unitPrice: Joi.number().min(0).allow(null),
  unitType: Joi.string()
    .valid(...UNIT_TYPES)
    .allow('', null),
  placeOfService: Joi.string().trim().max(10).allow('', null),
  codingNotes: Joi.string().trim().max(2000).allow('', null),
  effectiveDate: Joi.date().iso().allow('', null),
  expiryDate: Joi.date().iso().allow('', null),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

const queryHcpcsCodeSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(10),
  search: Joi.string().trim().max(200).allow(''),
  status: Joi.string().valid('active', 'inactive', 'all').default('all'),
  isActive: Joi.boolean(),
  isBillable: Joi.boolean(),
  category: Joi.string().trim().max(8).allow(''),
  coverageStatus: Joi.string().valid(...COVERAGE_STATUSES, ''),
  lookup: Joi.boolean(),
  validOn: Joi.date().iso().allow('', null),
});

const hcpcsCodeIdSchema = Joi.object({
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
  createHcpcsCodeSchema,
  updateHcpcsCodeSchema,
  queryHcpcsCodeSchema,
  hcpcsCodeIdSchema,
  validate,
};
