const Joi = require('joi');

const hexColorSchema = Joi.string()
  .trim()
  .pattern(/^#?[0-9A-Fa-f]{6}$/)
  .required()
  .messages({
    'string.pattern.base': 'Color must be a valid hex code (e.g. #3b82f6)',
    'any.required': 'Color is required',
  });

const createAppointmentStatusSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Appointment status name is required',
    'any.required': 'Appointment status name is required',
  }),
  color: hexColorSchema,
  isActive: Joi.boolean().default(true),
  sortOrder: Joi.number().integer().min(0).max(9999).default(0),
});

const updateAppointmentStatusSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).messages({
    'string.empty': 'Appointment status name cannot be empty',
  }),
  color: Joi.string()
    .trim()
    .pattern(/^#?[0-9A-Fa-f]{6}$/)
    .messages({
      'string.pattern.base': 'Color must be a valid hex code (e.g. #3b82f6)',
    }),
  isActive: Joi.boolean(),
  sortOrder: Joi.number().integer().min(0).max(9999),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

const queryAppointmentStatusSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(10),
  search: Joi.string().trim().max(100).allow(''),
  isActive: Joi.boolean(),
});

const appointmentStatusIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid appointment status ID format',
    'any.required': 'Appointment status ID is required',
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
  createAppointmentStatusSchema,
  updateAppointmentStatusSchema,
  queryAppointmentStatusSchema,
  appointmentStatusIdSchema,
  validate,
};
