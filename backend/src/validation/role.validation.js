const Joi = require('joi');

/**
 * Schema for creating a role
 */
const createRoleSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required()
    .messages({
      'string.empty': 'Role name is required',
      'any.required': 'Role name is required',
    }),
  description: Joi.string().trim().max(500).allow('', null),
  isActive: Joi.boolean().default(true),
  permissionIds: Joi.array().items(Joi.string().uuid()).default([])
    .messages({
      'string.guid': 'Invalid permission ID format',
    }),
});

/**
 * Schema for updating a role
 */
const updateRoleSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100)
    .messages({
      'string.empty': 'Role name cannot be empty',
    }),
  description: Joi.string().trim().max(500).allow('', null),
  isActive: Joi.boolean(),
  permissionIds: Joi.array().items(Joi.string().uuid())
    .messages({
      'string.guid': 'Invalid permission ID format',
    }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Schema for query parameters (pagination & search)
 */
const queryRoleSchema = Joi.object({
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
 * Schema for role ID parameter
 */
const roleIdSchema = Joi.object({
  id: Joi.string().uuid().required()
    .messages({
      'string.guid': 'Invalid role ID format',
      'any.required': 'Role ID is required',
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
  createRoleSchema,
  updateRoleSchema,
  queryRoleSchema,
  roleIdSchema,
  validate,
};

