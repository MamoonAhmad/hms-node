const Joi = require('joi');

/**
 * Schema for creating a location
 */
const createLocationSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required()
    .messages({
      'string.empty': 'Location name is required',
      'any.required': 'Location name is required',
    }),
  address: Joi.string().trim().max(500).allow('', null),
  city: Joi.string().trim().max(100).allow('', null),
  state: Joi.string().trim().max(100).allow('', null),
  country: Joi.string().trim().max(100).allow('', null),
  phone: Joi.string().trim().max(20).allow('', null),
  isActive: Joi.boolean().default(true),
  hasOnsiteLab: Joi.boolean().default(true),
  hasOnsitePharmacy: Joi.boolean().default(true),
  hasOnsiteRadiology: Joi.boolean().default(true),
  tenantId: Joi.string().uuid().required()
    .messages({
      'string.guid': 'Invalid tenant ID format',
      'any.required': 'Tenant ID is required',
    }),
});

/**
 * Schema for updating a location
 */
const updateLocationSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200)
    .messages({
      'string.empty': 'Location name cannot be empty',
    }),
  address: Joi.string().trim().max(500).allow('', null),
  city: Joi.string().trim().max(100).allow('', null),
  state: Joi.string().trim().max(100).allow('', null),
  country: Joi.string().trim().max(100).allow('', null),
  phone: Joi.string().trim().max(20).allow('', null),
  isActive: Joi.boolean(),
  hasOnsiteLab: Joi.boolean(),
  hasOnsitePharmacy: Joi.boolean(),
  hasOnsiteRadiology: Joi.boolean(),
  tenantId: Joi.string().uuid()
    .messages({
      'string.guid': 'Invalid tenant ID format',
    }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Schema for query parameters (pagination & search)
 */
const queryLocationSchema = Joi.object({
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
  isActive: Joi.boolean().allow('', null),
  tenantId: Joi.string().uuid()
    .messages({
      'string.guid': 'Invalid tenant ID format',
    }),
});

/**
 * Schema for location ID parameter
 */
const locationIdSchema = Joi.object({
  id: Joi.string().uuid().required()
    .messages({
      'string.guid': 'Invalid location ID format',
      'any.required': 'Location ID is required',
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
  createLocationSchema,
  updateLocationSchema,
  queryLocationSchema,
  locationIdSchema,
  validate,
};

