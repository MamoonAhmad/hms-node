const Joi = require('joi');

/**
 * Schema for creating a tenant
 */
const createTenantSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required()
    .messages({
      'string.empty': 'Tenant name is required',
      'any.required': 'Tenant name is required',
    }),
  isActive: Joi.boolean().default(true),
});

/**
 * Schema for updating a tenant
 */
const updateTenantSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200)
    .messages({
      'string.empty': 'Tenant name cannot be empty',
    }),
  isActive: Joi.boolean(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Schema for query parameters (pagination & search)
 */
const queryTenantSchema = Joi.object({
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
});

/**
 * Schema for tenant ID parameter
 */
const tenantIdSchema = Joi.object({
  id: Joi.string().uuid().required()
    .messages({
      'string.guid': 'Invalid tenant ID format',
      'any.required': 'Tenant ID is required',
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
  createTenantSchema,
  updateTenantSchema,
  queryTenantSchema,
  tenantIdSchema,
  validate,
};

