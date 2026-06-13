const Joi = require('joi');

const createRoomTypeSchema = Joi.object({
  code: Joi.string().trim().min(1).max(50).required().messages({
    'string.empty': 'Room type code is required',
    'any.required': 'Room type code is required',
  }),
  label: Joi.string().trim().min(1).max(200).required().messages({
    'string.empty': 'Display name is required',
    'any.required': 'Display name is required',
  }),
  isActive: Joi.boolean().default(true),
  sortOrder: Joi.number().integer().min(0).max(9999).default(0),
});

const updateRoomTypeSchema = Joi.object({
  code: Joi.string().trim().min(1).max(50).messages({
    'string.empty': 'Room type code cannot be empty',
  }),
  label: Joi.string().trim().min(1).max(200).messages({
    'string.empty': 'Display name cannot be empty',
  }),
  isActive: Joi.boolean(),
  sortOrder: Joi.number().integer().min(0).max(9999),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

const queryRoomTypeSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(10),
  search: Joi.string().trim().max(100).allow(''),
  isActive: Joi.boolean(),
});

const roomTypeIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid room type ID format',
    'any.required': 'Room type ID is required',
  }),
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
  createRoomTypeSchema,
  updateRoomTypeSchema,
  queryRoomTypeSchema,
  roomTypeIdSchema,
  validate,
};
