const Joi = require('joi');
const { POS_CATEGORIES } = require('../lib/placeOfService');
const { isValidPosCode, normalizePosCode } = require('../lib/placeOfService');

const categoryValues = POS_CATEGORIES.map((c) => c.value);

const posCodeField = Joi.string()
  .trim()
  .custom((value, helpers) => {
    const normalized = normalizePosCode(value);
    if (!isValidPosCode(normalized)) {
      return helpers.error('any.invalid');
    }
    return normalized;
  })
  .messages({
    'any.invalid': 'Use a 2-digit CMS place of service code (01–99)',
    'string.empty': 'POS code is required',
    'any.required': 'POS code is required',
  });

const createPlaceOfServiceSchema = Joi.object({
  code: posCodeField.required(),
  name: Joi.string().trim().min(1).max(120).required().messages({
    'string.empty': 'Name is required',
    'any.required': 'Name is required',
  }),
  description: Joi.string().trim().min(1).max(500).required().messages({
    'string.empty': 'Description is required',
    'any.required': 'Description is required',
  }),
  category: Joi.string().valid(...categoryValues).allow('', null),
  cmsStandard: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true),
  isBillable: Joi.boolean().default(true),
  isDefault: Joi.boolean().default(false),
  effectiveDate: Joi.date().iso().allow('', null),
  expiryDate: Joi.date().iso().allow('', null),
  sortOrder: Joi.number().integer().min(0).max(999).allow(null),
  codingNotes: Joi.string().trim().max(2000).allow('', null),
});

const updatePlaceOfServiceSchema = Joi.object({
  code: posCodeField,
  name: Joi.string().trim().min(1).max(120),
  description: Joi.string().trim().min(1).max(500),
  category: Joi.string().valid(...categoryValues).allow('', null),
  cmsStandard: Joi.boolean(),
  isActive: Joi.boolean(),
  isBillable: Joi.boolean(),
  isDefault: Joi.boolean(),
  effectiveDate: Joi.date().iso().allow('', null),
  expiryDate: Joi.date().iso().allow('', null),
  sortOrder: Joi.number().integer().min(0).max(999).allow(null),
  codingNotes: Joi.string().trim().max(2000).allow('', null),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

const queryPlaceOfServiceSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(10),
  search: Joi.string().trim().max(200).allow(''),
  status: Joi.string().valid('active', 'inactive', 'all').default('all'),
  isActive: Joi.boolean(),
  isBillable: Joi.boolean(),
  category: Joi.string().valid(...categoryValues, '').allow(''),
  cmsStandard: Joi.boolean(),
  lookup: Joi.boolean(),
  validOn: Joi.date().iso().allow('', null),
});

const lookupQuerySchema = Joi.object({
  search: Joi.string().trim().max(200).allow(''),
  limit: Joi.number().integer().min(1).max(500).default(200),
  validOn: Joi.date().iso().allow('', null),
});

const placeOfServiceIdSchema = Joi.object({
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
  createPlaceOfServiceSchema,
  updatePlaceOfServiceSchema,
  queryPlaceOfServiceSchema,
  lookupQuerySchema,
  placeOfServiceIdSchema,
  validate,
};
