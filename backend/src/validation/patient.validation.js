const Joi = require('joi');

/**
 * Schema for creating a patient
 */
const createPatientSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100).required()
    .messages({
      'string.empty': 'First name is required',
      'any.required': 'First name is required',
    }),
  middleName: Joi.string().trim().max(100).allow('', null),
  lastName: Joi.string().trim().min(1).max(100).required()
    .messages({
      'string.empty': 'Last name is required',
      'any.required': 'Last name is required',
    }),
  dateOfBirth: Joi.date().iso().max('now').required()
    .messages({
      'date.max': 'Date of birth cannot be in the future',
      'any.required': 'Date of birth is required',
    }),
  gender: Joi.string().lowercase().valid('male', 'female', 'other').required()
    .messages({
      'any.only': 'Gender must be male, female, or other',
      'any.required': 'Gender is required',
    }),
  contactNumber: Joi.string().trim().min(1).max(20).required()
    .messages({
      'string.empty': 'Contact number is required',
      'any.required': 'Contact number is required',
    }),
  email: Joi.string().trim().email().allow('', null)
    .messages({
      'string.email': 'Invalid email format',
    }),
  address: Joi.string().trim().max(500).allow('', null),
  insuranceProvider: Joi.string().trim().max(200).allow('', null),
  policyNumber: Joi.string().trim().max(100).allow('', null),
  copay: Joi.number().min(0).precision(2).allow(null)
    .messages({
      'number.min': 'Copay must be a positive number',
    }),
  deductible: Joi.number().min(0).precision(2).allow(null)
    .messages({
      'number.min': 'Deductible must be a positive number',
    }),
  primaryCarePhysician: Joi.string().trim().max(200).allow('', null),
});

/**
 * Schema for updating a patient
 */
const updatePatientSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100)
    .messages({
      'string.empty': 'First name cannot be empty',
    }),
  middleName: Joi.string().trim().max(100).allow('', null),
  lastName: Joi.string().trim().min(1).max(100)
    .messages({
      'string.empty': 'Last name cannot be empty',
    }),
  dateOfBirth: Joi.date().iso().max('now')
    .messages({
      'date.max': 'Date of birth cannot be in the future',
    }),
  gender: Joi.string().lowercase().valid('male', 'female', 'other')
    .messages({
      'any.only': 'Gender must be male, female, or other',
    }),
  contactNumber: Joi.string().trim().min(1).max(20)
    .messages({
      'string.empty': 'Contact number cannot be empty',
    }),
  email: Joi.string().trim().email().allow('', null)
    .messages({
      'string.email': 'Invalid email format',
    }),
  address: Joi.string().trim().max(500).allow('', null),
  insuranceProvider: Joi.string().trim().max(200).allow('', null),
  policyNumber: Joi.string().trim().max(100).allow('', null),
  copay: Joi.number().min(0).precision(2).allow(null)
    .messages({
      'number.min': 'Copay must be a positive number',
    }),
  deductible: Joi.number().min(0).precision(2).allow(null)
    .messages({
      'number.min': 'Deductible must be a positive number',
    }),
  primaryCarePhysician: Joi.string().trim().max(200).allow('', null),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Schema for query parameters (pagination & search)
 */
const queryPatientSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1)
    .messages({
      'number.min': 'Page must be at least 1',
    }),
  limit: Joi.number().integer().min(1).max(100).default(10)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
    }),
  search: Joi.string().trim().max(100).allow(''),
  gender: Joi.string().lowercase().valid('male', 'female', 'other'),
  insuranceProvider: Joi.string().trim().max(200),
});

/**
 * Schema for patient ID parameter
 */
const patientIdSchema = Joi.object({
  id: Joi.string().uuid().required()
    .messages({
      'string.guid': 'Invalid patient ID format',
      'any.required': 'Patient ID is required',
    }),
});

/**
 * Schema for MRN parameter
 */
const patientMrnSchema = Joi.object({
  mrn: Joi.string().trim().required()
    .messages({
      'string.empty': 'MRN is required',
      'any.required': 'MRN is required',
    }),
});

/**
 * Validation middleware factory
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @param {string} property - Request property to validate ('body', 'query', 'params')
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

    // Replace request property with validated/sanitized value
    req[property] = value;
    next();
  };
};

module.exports = {
  createPatientSchema,
  updatePatientSchema,
  queryPatientSchema,
  patientIdSchema,
  patientMrnSchema,
  validate,
};
