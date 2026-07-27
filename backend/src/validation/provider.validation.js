const Joi = require('joi');

const optionalFkUuid = (label) =>
  Joi.any()
    .custom((value, helpers) => {
      if (value === undefined || value === null || value === '') return null;
      if (typeof value !== 'string') return helpers.error('any.invalid');
      const parsed = Joi.string().uuid().validate(value);
      if (parsed.error) {
        return helpers.error('any.invalid', { message: `${label} must be a valid UUID` });
      }
      return parsed.value;
    })
    .optional();

const npiSchema = Joi.string()
  .trim()
  .pattern(/^\d{10}$/)
  .messages({
    'string.pattern.base': 'NPI must be a 10-digit number',
  });

/**
 * Schema for creating a provider
 */
const createProviderSchema = Joi.object({
  npi: npiSchema.required().messages({
    'any.required': 'NPI is required',
    'string.empty': 'NPI is required',
  }),
  initials: Joi.string().trim().max(20).allow('', null),
  firstName: Joi.string().trim().min(1).max(100).required().messages({
    'any.required': 'First name is required',
    'string.empty': 'First name is required',
  }),
  middleName: Joi.string().trim().max(100).allow('', null),
  lastName: Joi.string().trim().min(1).max(100).required().messages({
    'any.required': 'Last name is required',
    'string.empty': 'Last name is required',
  }),
  gender: Joi.string().trim().max(50).required().messages({
    'any.required': 'Gender is required',
    'string.empty': 'Gender is required',
  }),
  dateOfBirth: Joi.date().iso().allow(null, ''),
  specialtyId: optionalFkUuid('Specialty id'),
  subSpecialtyId: optionalFkUuid('Sub-specialty id'),
  departmentId: optionalFkUuid('Department id'),
  departmentIds: Joi.array().items(Joi.string().uuid()).default([]),
  taxonomy: Joi.string().trim().max(200).allow('', null),
  email: Joi.string().trim().email().allow('', null).messages({
    'string.email': 'Invalid email format',
  }),
  taxId: Joi.string().trim().max(50).required().messages({
    'any.required': 'Tax ID is required',
    'string.empty': 'Tax ID is required',
  }),
  group: Joi.string().trim().max(200).allow('', null),
  deaNumber: Joi.string().trim().max(100).allow('', null),
  deaEffectiveDate: Joi.date().iso().allow(null, ''),
  deaExpiryDate: Joi.date().iso().allow(null, ''),
  stateLicenseNumber: Joi.string().trim().max(100).allow('', null),
  stateLicenseEffectiveDate: Joi.date().iso().allow(null, ''),
  stateLicenseExpiryDate: Joi.date().iso().allow(null, ''),
  csrLicenseNumber: Joi.string().trim().max(100).allow('', null),
  csrExpiryDate: Joi.date().iso().allow(null, ''),
  mobileNumber: Joi.string().trim().max(30).allow('', null),
  degree: Joi.string().trim().max(100).allow('', null),
  experience: Joi.string().trim().max(100).allow('', null),
  address: Joi.string().trim().max(500).allow('', null),
  city: Joi.string().trim().max(100).allow('', null),
  state: Joi.string().trim().max(100).allow('', null),
  zip: Joi.string().trim().max(20).allow('', null),
  treatment: Joi.string().trim().max(50).allow('', null),
  cprsTabEffectiveDate: Joi.date().iso().allow(null, ''),
  isActive: Joi.boolean().default(true),
});

/**
 * Schema for updating a provider
 */
const updateProviderSchema = Joi.object({
  npi: npiSchema,
  initials: Joi.string().trim().max(20).allow('', null),
  firstName: Joi.string().trim().min(1).max(100),
  middleName: Joi.string().trim().max(100).allow('', null),
  lastName: Joi.string().trim().min(1).max(100),
  gender: Joi.string().trim().max(50),
  dateOfBirth: Joi.date().iso().allow(null, ''),
  specialtyId: optionalFkUuid('Specialty id'),
  subSpecialtyId: optionalFkUuid('Sub-specialty id'),
  departmentId: optionalFkUuid('Department id'),
  departmentIds: Joi.array().items(Joi.string().uuid()).default([]),
  taxonomy: Joi.string().trim().max(200).allow('', null),
  email: Joi.string().trim().email().allow('', null).messages({
    'string.email': 'Invalid email format',
  }),
  taxId: Joi.string().trim().max(50),
  group: Joi.string().trim().max(200).allow('', null),
  deaNumber: Joi.string().trim().max(100).allow('', null),
  deaEffectiveDate: Joi.date().iso().allow(null, ''),
  deaExpiryDate: Joi.date().iso().allow(null, ''),
  stateLicenseNumber: Joi.string().trim().max(100).allow('', null),
  stateLicenseEffectiveDate: Joi.date().iso().allow(null, ''),
  stateLicenseExpiryDate: Joi.date().iso().allow(null, ''),
  csrLicenseNumber: Joi.string().trim().max(100).allow('', null),
  csrExpiryDate: Joi.date().iso().allow(null, ''),
  mobileNumber: Joi.string().trim().max(30).allow('', null),
  degree: Joi.string().trim().max(100).allow('', null),
  experience: Joi.string().trim().max(100).allow('', null),
  address: Joi.string().trim().max(500).allow('', null),
  city: Joi.string().trim().max(100).allow('', null),
  state: Joi.string().trim().max(100).allow('', null),
  zip: Joi.string().trim().max(20).allow('', null),
  treatment: Joi.string().trim().max(50).allow('', null),
  cprsTabEffectiveDate: Joi.date().iso().allow(null, ''),
  isActive: Joi.boolean(),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

/**
 * Schema for query parameters
 */
const queryProviderSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(10),
  search: Joi.string().trim().max(100).allow(''),
  isActive: Joi.boolean(),
  departmentId: Joi.string().uuid().allow('', null),
});

/**
 * Schema for ID parameter
 */
const providerIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid provider ID format',
    'any.required': 'Provider ID is required',
  }),
});

/**
 * Schema for NPI param
 */
const providerNpiSchema = Joi.object({
  npi: npiSchema.required().messages({
    'any.required': 'NPI is required',
    'string.empty': 'NPI is required',
  }),
});

/**
 * Validation middleware factory
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
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
  createProviderSchema,
  updateProviderSchema,
  queryProviderSchema,
  providerIdSchema,
  providerNpiSchema,
  validate,
};

