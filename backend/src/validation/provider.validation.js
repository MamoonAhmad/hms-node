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

const optionalNpiSchema = Joi.string()
  .trim()
  .pattern(/^\d{10}$/)
  .allow('', null)
  .messages({
    'string.pattern.base': 'NPI must be a 10-digit number',
  });

const optionalStateCode = Joi.string()
  .trim()
  .uppercase()
  .pattern(/^[A-Z]{2}$/)
  .allow('', null)
  .messages({
    'string.pattern.base': 'State must be a 2-letter US abbreviation',
  });

const optionalString = (max) => Joi.string().trim().max(max).allow('', null);

const optionalZipPlus4 = Joi.string()
  .trim()
  .pattern(/^\d{4}$/)
  .allow('', null)
  .messages({
    'string.pattern.base': 'ZIP+4 must be 4 digits',
  });

const providerBodyFields = {
  npiType: Joi.string().trim().valid('type_1', 'type_2').allow('', null),
  initials: optionalString(20),
  middleName: optionalString(100),
  suffix: optionalString(20),
  dateOfBirth: Joi.date().iso().allow(null, ''),
  providerType: optionalString(50),
  specialtyId: optionalFkUuid('Specialty id'),
  subSpecialtyId: optionalFkUuid('Sub-specialty id'),
  departmentId: optionalFkUuid('Department id'),
  taxonomy: optionalString(200),
  email: Joi.string().trim().email().allow('', null).messages({
    'string.email': 'Invalid email format',
  }),
  taxIdType: Joi.string().trim().valid('ein', 'ssn').allow('', null),
  group: optionalString(200),
  groupNpi: optionalNpiSchema,
  medicarePtan: optionalString(50),
  medicaidId: optionalString(50),
  caqhId: optionalString(50),
  deaNumber: optionalString(100),
  deaEffectiveDate: Joi.date().iso().allow(null, ''),
  deaExpiryDate: Joi.date().iso().allow(null, ''),
  stateLicenseNumber: optionalString(100),
  licenseState: optionalStateCode,
  stateLicenseEffectiveDate: Joi.date().iso().allow(null, ''),
  stateLicenseExpiryDate: Joi.date().iso().allow(null, ''),
  csrLicenseNumber: optionalString(100),
  csrExpiryDate: Joi.date().iso().allow(null, ''),
  mobileNumber: optionalString(30),
  officePhone: optionalString(30),
  fax: optionalString(30),
  degree: optionalString(100),
  experience: optionalString(100),
  address: optionalString(500),
  addressLine2: optionalString(200),
  city: optionalString(100),
  state: optionalString(100),
  zip: optionalString(20),
  zipPlus4: optionalZipPlus4,
  treatment: optionalString(50),
  cprsTabEffectiveDate: Joi.date().iso().allow(null, ''),
};

/**
 * Schema for creating a provider
 */
const createProviderSchema = Joi.object({
  npi: npiSchema.required().messages({
    'any.required': 'NPI is required',
    'string.empty': 'NPI is required',
  }),
  firstName: Joi.string().trim().min(1).max(100).required().messages({
    'any.required': 'First name is required',
    'string.empty': 'First name is required',
  }),
  lastName: Joi.string().trim().min(1).max(100).required().messages({
    'any.required': 'Last name is required',
    'string.empty': 'Last name is required',
  }),
  gender: Joi.string().trim().max(50).required().messages({
    'any.required': 'Gender is required',
    'string.empty': 'Gender is required',
  }),
  taxId: Joi.string().trim().max(50).required().messages({
    'any.required': 'Tax ID is required',
    'string.empty': 'Tax ID is required',
  }),
  isActive: Joi.boolean().default(true),
  ...providerBodyFields,
});

/**
 * Schema for updating a provider
 */
const updateProviderSchema = Joi.object({
  npi: npiSchema,
  firstName: Joi.string().trim().min(1).max(100),
  lastName: Joi.string().trim().min(1).max(100),
  gender: Joi.string().trim().max(50),
  taxId: Joi.string().trim().max(50),
  isActive: Joi.boolean(),
  ...providerBodyFields,
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

