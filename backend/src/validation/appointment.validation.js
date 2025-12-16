const Joi = require('joi');

// Valid appointment types
const appointmentTypes = ['New', 'Follow-up', 'Televisit'];

// Valid statuses
const appointmentStatuses = [
  'Scheduled',
  'Checked-In',
  'In Progress',
  'Completed',
  'Cancelled',
  'No-Show',
  'Rescheduled',
];

/**
 * Schema for creating an appointment
 */
const createAppointmentSchema = Joi.object({
  patientId: Joi.string().uuid().required()
    .messages({
      'string.guid': 'Invalid patient ID format',
      'any.required': 'Patient ID is required',
    }),
  appointmentDate: Joi.date().iso().min('now').required()
    .messages({
      'date.min': 'Appointment date must be today or in the future',
      'any.required': 'Appointment date is required',
    }),
  appointmentTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({
      'string.pattern.base': 'Appointment time must be in HH:MM format',
      'any.required': 'Appointment time is required',
    }),
  duration: Joi.number().integer().min(15).max(480).default(30)
    .messages({
      'number.min': 'Duration must be at least 15 minutes',
      'number.max': 'Duration cannot exceed 8 hours (480 minutes)',
    }),
  appointmentType: Joi.string().valid(...appointmentTypes).required()
    .messages({
      'any.only': `Appointment type must be one of: ${appointmentTypes.join(', ')}`,
      'any.required': 'Appointment type is required',
    }),
  visitReason: Joi.string().trim().max(500).allow('', null),
  department: Joi.string().trim().max(100).allow('', null),
  provider: Joi.string().trim().max(200).allow('', null),
  status: Joi.string().valid(...appointmentStatuses).default('Scheduled')
    .messages({
      'any.only': `Status must be one of: ${appointmentStatuses.join(', ')}`,
    }),
  notes: Joi.string().trim().max(1000).allow('', null),
});

/**
 * Schema for updating an appointment
 */
const updateAppointmentSchema = Joi.object({
  patientId: Joi.string().uuid()
    .messages({
      'string.guid': 'Invalid patient ID format',
    }),
  appointmentDate: Joi.date().iso()
    .messages({
      'date.base': 'Invalid appointment date format',
    }),
  appointmentTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .messages({
      'string.pattern.base': 'Appointment time must be in HH:MM format',
    }),
  duration: Joi.number().integer().min(15).max(480)
    .messages({
      'number.min': 'Duration must be at least 15 minutes',
      'number.max': 'Duration cannot exceed 8 hours (480 minutes)',
    }),
  appointmentType: Joi.string().valid(...appointmentTypes)
    .messages({
      'any.only': `Appointment type must be one of: ${appointmentTypes.join(', ')}`,
    }),
  visitReason: Joi.string().trim().max(500).allow('', null),
  department: Joi.string().trim().max(100).allow('', null),
  provider: Joi.string().trim().max(200).allow('', null),
  status: Joi.string().valid(...appointmentStatuses)
    .messages({
      'any.only': `Status must be one of: ${appointmentStatuses.join(', ')}`,
    }),
  notes: Joi.string().trim().max(1000).allow('', null),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Schema for query parameters
 */
const queryAppointmentSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().max(100).allow(''),
  status: Joi.string().valid(...appointmentStatuses),
  appointmentType: Joi.string().valid(...appointmentTypes),
  department: Joi.string().trim().max(100),
  date: Joi.date().iso(),
  patientId: Joi.string().uuid(),
});

/**
 * Schema for appointment ID parameter
 */
const appointmentIdSchema = Joi.object({
  id: Joi.string().uuid().required()
    .messages({
      'string.guid': 'Invalid appointment ID format',
      'any.required': 'Appointment ID is required',
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
  createAppointmentSchema,
  updateAppointmentSchema,
  queryAppointmentSchema,
  appointmentIdSchema,
  appointmentTypes,
  appointmentStatuses,
  validate,
};

