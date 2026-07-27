const Joi = require('joi');

const createAppointmentTypeSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required().messages({
    'string.empty': 'Appointment type is required',
    'any.required': 'Appointment type is required',
  }),
  description: Joi.string().trim().max(2000).allow('', null),
  defaultTime: Joi.number().allow(null).optional().messages({
    'number.base': 'Time must be a valid number',
  }),
  isActive: Joi.boolean().default(true),
  providerRequired: Joi.boolean().default(false),
  sortOrder: Joi.number().integer().min(0).max(9999).default(0),
});

const updateAppointmentTypeSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).messages({
    'string.empty': 'Appointment type cannot be empty',
  }),
  description: Joi.string().trim().max(2000).allow('', null),
  defaultTime: Joi.number().allow(null).optional().messages({
    'number.base': 'Time must be a valid number',
  }),
  isActive: Joi.boolean(),
  providerRequired: Joi.boolean(),
  sortOrder: Joi.number().integer().min(0).max(9999),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

const queryAppointmentTypeSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(10),
  search: Joi.string().trim().max(100).allow(''),
  isActive: Joi.boolean(),
});

const appointmentTypeIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid appointment type ID format',
    'any.required': 'Appointment type ID is required',
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
  createAppointmentTypeSchema,
  updateAppointmentTypeSchema,
  queryAppointmentTypeSchema,
  appointmentTypeIdSchema,
  validate,
};
