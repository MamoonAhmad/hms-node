const Joi = require('joi');

/**
 * Schema for creating a permission
 */
const createPermissionSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required()
    .messages({
      'string.empty': 'Permission name is required',
      'any.required': 'Permission name is required',
    }),
  description: Joi.string().trim().max(500).allow('', null),
  resource: Joi.string().trim().min(1).max(50).required()
    .messages({
      'string.empty': 'Resource is required',
      'any.required': 'Resource is required',
    }),
  action: Joi.string().trim().min(1).max(50).required()
    .messages({
      'string.empty': 'Action is required',
      'any.required': 'Action is required',
    }),
});

/**
 * Schema for updating a permission
 */
const updatePermissionSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100)
    .messages({
      'string.empty': 'Permission name cannot be empty',
    }),
  description: Joi.string().trim().max(500).allow('', null),
  resource: Joi.string().trim().min(1).max(50)
    .messages({
      'string.empty': 'Resource cannot be empty',
    }),
  action: Joi.string().trim().min(1).max(50)
    .messages({
      'string.empty': 'Action cannot be empty',
    }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Schema for query parameters (pagination & search)
 */
const queryPermissionSchema = Joi.object({
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
  resource: Joi.string().trim().max(50).allow(''),
});

/**
 * Schema for permission ID parameter
 */
const permissionIdSchema = Joi.object({
  id: Joi.string().uuid().required()
    .messages({
      'string.guid': 'Invalid permission ID format',
      'any.required': 'Permission ID is required',
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
  createPermissionSchema,
  updatePermissionSchema,
  queryPermissionSchema,
  permissionIdSchema,
  validate,
};

