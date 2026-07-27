const Joi = require('joi');

const statusFieldSchema = Joi.string().trim().min(1).max(100);
const timeFieldSchema = Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/);

const createAppointmentSchema = Joi.object({
  patientId: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid patient ID format',
    'any.required': 'Patient ID is required',
  }),
  appointmentDate: Joi.date().iso().required().messages({
    'any.required': 'Appointment date is required',
  }),
  appointmentTime: timeFieldSchema.required().messages({
    'string.pattern.base': 'Appointment time must be in HH:MM format',
    'any.required': 'Appointment time is required',
  }),
  appointmentEndTime: timeFieldSchema.allow('', null),
  duration: Joi.number().integer().min(5).max(480).default(30),
  appointmentType: Joi.string().trim().min(1).max(100),
  appointmentTypeId: Joi.string().uuid().allow('', null),
  visitReason: Joi.string().trim().max(500).allow('', null),
  department: Joi.string().trim().max(100).allow('', null),
  departmentId: Joi.string().uuid().allow('', null),
  provider: Joi.string().trim().max(200).allow('', null),
  providerId: Joi.string().uuid().allow('', null).messages({
    'string.guid': 'Invalid provider ID format',
  }),
  status: statusFieldSchema.default('Scheduled'),
  visitModality: Joi.string().trim().valid('in-house', 'phone', 'telehealth').default('in-house'),
  accessibilityRequirements: Joi.alternatives().try(
    Joi.array().items(Joi.string().trim()),
    Joi.string().trim().allow('', null),
  ),
  accessibilityRequirementsNotes: Joi.string().trim().max(5000).allow('', null),
  evaluateRegistrationStatus: Joi.boolean().default(false),
  notes: Joi.string().trim().max(5000).allow('', null),
}).or('appointmentType', 'appointmentTypeId').messages({
  'object.missing': 'Appointment type is required',
});

const updateAppointmentSchema = Joi.object({
  patientId: Joi.string().uuid(),
  appointmentDate: Joi.date().iso(),
  appointmentTime: timeFieldSchema,
  appointmentEndTime: timeFieldSchema.allow('', null),
  duration: Joi.number().integer().min(5).max(480),
  appointmentType: Joi.string().trim().min(1).max(100),
  appointmentTypeId: Joi.string().uuid().allow('', null),
  visitReason: Joi.string().trim().max(500).allow('', null),
  department: Joi.string().trim().max(100).allow('', null),
  departmentId: Joi.string().uuid().allow('', null),
  provider: Joi.string().trim().max(200).allow('', null),
  providerId: Joi.string().uuid().allow('', null),
  status: statusFieldSchema,
  visitModality: Joi.string().trim().valid('in-house', 'phone', 'telehealth'),
  accessibilityRequirements: Joi.alternatives().try(
    Joi.array().items(Joi.string().trim()),
    Joi.string().trim().allow('', null),
  ),
  accessibilityRequirementsNotes: Joi.string().trim().max(5000).allow('', null),
  notes: Joi.string().trim().max(5000).allow('', null),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

const queryAppointmentSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(10),
  search: Joi.string().trim().max(100).allow(''),
  status: statusFieldSchema,
  appointmentType: Joi.string().trim().max(100),
  department: Joi.string().trim().max(100),
  departmentId: Joi.string().uuid(),
  provider: Joi.string().trim().max(200),
  providerId: Joi.string().uuid(),
  date: Joi.date().iso(),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso(),
  patientId: Joi.string().uuid(),
  excludeHiddenTimeline: Joi.boolean().truthy('true').falsy('false'),
});

const statusCountsQuerySchema = queryAppointmentSchema.keys({ status: Joi.forbidden() });

const availabilityDatesQuerySchema = Joi.object({
  providerId: Joi.string().uuid().required(),
  appointmentType: Joi.string().trim().max(100).allow(''),
  departmentId: Joi.string().uuid().allow('', null),
  fromDate: Joi.date().iso(),
  daysAhead: Joi.number().integer().min(1).max(365).default(90),
});

const availabilitySlotsQuerySchema = Joi.object({
  providerId: Joi.string().uuid().required(),
  date: Joi.date().iso().required(),
  appointmentType: Joi.string().trim().max(100).allow(''),
  departmentId: Joi.string().uuid().allow('', null),
  excludeAppointmentId: Joi.string().uuid(),
});

const updateStatusSchema = Joi.object({
  status: statusFieldSchema.required(),
});

const appointmentIdSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const validate = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  if (property === 'query') {
    req.validatedQuery = value;
  } else {
    req[property] = value;
  }
  next();
};

const assignRoomSchema = Joi.object({
  roomId: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid room ID format',
    'any.required': 'Room ID is required',
  }),
});

module.exports = {
  createAppointmentSchema,
  updateAppointmentSchema,
  queryAppointmentSchema,
  statusCountsQuerySchema,
  availabilityDatesQuerySchema,
  availabilitySlotsQuerySchema,
  updateStatusSchema,
  assignRoomSchema,
  appointmentIdSchema,
  validate,
};
