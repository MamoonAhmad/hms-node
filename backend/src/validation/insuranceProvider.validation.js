const Joi = require('joi');

/**
 * Schema for creating an insurance provider
 */
const createInsuranceProviderSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required()
    .messages({
      'string.empty': 'Name is required',
      'any.required': 'Name is required',
    }),
  code: Joi.string().trim().uppercase().max(20).allow('', null),
  phone: Joi.string().trim().max(20).allow('', null),
  email: Joi.string().trim().email().allow('', null)
    .messages({
      'string.email': 'Invalid email format',
    }),
  address: Joi.string().trim().max(500).allow('', null),
  website: Joi.string().trim().uri().allow('', null)
    .messages({
      'string.uri': 'Invalid website URL',
    }),
  isActive: Joi.boolean().default(true),
});

/**
 * Schema for updating an insurance provider
 */
const updateInsuranceProviderSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200)
    .messages({
      'string.empty': 'Name cannot be empty',
    }),
  code: Joi.string().trim().uppercase().max(20).allow('', null),
  phone: Joi.string().trim().max(20).allow('', null),
  email: Joi.string().trim().email().allow('', null)
    .messages({
      'string.email': 'Invalid email format',
    }),
  address: Joi.string().trim().max(500).allow('', null),
  website: Joi.string().trim().uri().allow('', null)
    .messages({
      'string.uri': 'Invalid website URL',
    }),
  isActive: Joi.boolean(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Schema for query parameters
 */
const queryInsuranceProviderSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().max(100).allow(''),
  isActive: Joi.boolean(),
});

/**
 * Schema for ID parameter
 */
const insuranceProviderIdSchema = Joi.object({
  id: Joi.string().uuid().required()
    .messages({
      'string.guid': 'Invalid insurance provider ID format',
      'any.required': 'Insurance provider ID is required',
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
  createInsuranceProviderSchema,
  updateInsuranceProviderSchema,
  queryInsuranceProviderSchema,
  insuranceProviderIdSchema,
  validate,
};

