const Joi = require('joi');

const DAY_VALUES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const uuidListFromQuery = Joi.alternatives().try(
  Joi.string().trim().allow(''),
  Joi.array().items(Joi.string().uuid()),
);

function parseUuidList(value) {
  if (!value || value === '') return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

function parseDayList(value) {
  if (!value || value === '') return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

const scheduleBodyFields = {
  providerId: Joi.string().uuid().required(),
  days: Joi.array().items(Joi.string().valid(...DAY_VALUES)).min(1).required(),
  startTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .required()
    .messages({ 'string.pattern.base': 'Start time must be in HH:mm format' }),
  endTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .required()
    .messages({ 'string.pattern.base': 'End time must be in HH:mm format' }),
  slotDuration: Joi.number().integer().min(1).required(),
  appointmentTypeIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  maxAppointmentsPerSlot: Joi.number().integer().min(1).required(),
  overBooking: Joi.number().integer().min(0).default(0),
  locationIds: Joi.array().items(Joi.string().uuid()).default([]),
  departmentId: Joi.string().uuid().required(),
  breakHoursEnabled: Joi.boolean().default(false),
  breakStartTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).allow(null, ''),
  breakEndTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).allow(null, ''),
  breakAppliesTo: Joi.string().valid('single', 'multiple', 'all').allow(null, ''),
  breakDays: Joi.array().items(Joi.string().valid(...DAY_VALUES)).default([]),
  effectiveStartDate: Joi.date().iso().required(),
  effectiveEndDate: Joi.date().iso().allow(null, ''),
  endOnEffectiveDate: Joi.boolean().default(false),
  status: Joi.string().valid('Active', 'Inactive').default('Active'),
  teleconsultationAllowed: Joi.boolean().default(false),
};

const createProviderScheduleSchema = Joi.object(scheduleBodyFields);

const updateProviderScheduleSchema = Joi.object({
  providerId: Joi.string().uuid(),
  days: Joi.array().items(Joi.string().valid(...DAY_VALUES)).min(1),
  startTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/),
  slotDuration: Joi.number().integer().min(1),
  appointmentTypeIds: Joi.array().items(Joi.string().uuid()).min(1),
  maxAppointmentsPerSlot: Joi.number().integer().min(1),
  overBooking: Joi.number().integer().min(0),
  locationIds: Joi.array().items(Joi.string().uuid()),
  departmentId: Joi.string().uuid(),
  breakHoursEnabled: Joi.boolean(),
  breakStartTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).allow(null, ''),
  breakEndTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).allow(null, ''),
  breakAppliesTo: Joi.string().valid('single', 'multiple', 'all').allow(null, ''),
  breakDays: Joi.array().items(Joi.string().valid(...DAY_VALUES)),
  effectiveStartDate: Joi.date().iso(),
  effectiveEndDate: Joi.date().iso().allow(null, ''),
  endOnEffectiveDate: Joi.boolean(),
  status: Joi.string().valid('Active', 'Inactive'),
  teleconsultationAllowed: Joi.boolean(),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

const queryProviderScheduleSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(10),
  search: Joi.string().trim().max(200).allow(''),
  providerIds: uuidListFromQuery,
  specialtyId: Joi.string().uuid().allow('', null),
  departmentId: Joi.string().uuid().allow('', null),
  days: Joi.alternatives().try(Joi.string().trim().allow(''), Joi.array().items(Joi.string().valid(...DAY_VALUES))),
  dateFrom: Joi.date().iso().allow('', null),
  dateTo: Joi.date().iso().allow('', null),
  status: Joi.string().valid('Active', 'Inactive').allow('', null),
});

const checkOverlapSchema = Joi.object({
  providerId: Joi.string().uuid().required(),
  days: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string().valid(...DAY_VALUES)).min(1),
      Joi.string().trim(),
    )
    .required(),
  startTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).required(),
  endTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).required(),
  effectiveStartDate: Joi.date().iso().required(),
  effectiveEndDate: Joi.date().iso().allow(null, ''),
  departmentId: Joi.string().uuid().allow(null, ''),
  excludeScheduleId: Joi.string().uuid().allow(null, ''),
});

const providerScheduleIdSchema = Joi.object({
  id: Joi.string().uuid().required(),
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

    if (property === 'query') {
      if (value.providerIds !== undefined) {
        value.providerIds = parseUuidList(value.providerIds);
      }
      if (value.days !== undefined) {
        value.days = parseDayList(value.days);
      }
      if (value.specialtyId === '') value.specialtyId = undefined;
      if (value.departmentId === '') value.departmentId = undefined;
      if (value.status === '') value.status = undefined;
      if (value.dateFrom === '') value.dateFrom = undefined;
      if (value.dateTo === '') value.dateTo = undefined;
    }

    if (property === 'body' || property === 'query') {
      if (value.effectiveEndDate === '') value.effectiveEndDate = null;
      if (value.excludeScheduleId === '') value.excludeScheduleId = null;
      if (value.departmentId === '') value.departmentId = null;
      if (value.days && typeof value.days === 'string') {
        value.days = parseDayList(value.days);
      }
    }

    // Express 5 keeps req.query read-only; store parsed query params separately.
    if (property === 'query') {
      req.validatedQuery = value;
    } else {
      req[property] = value;
    }
    next();
  };
};

module.exports = {
  createProviderScheduleSchema,
  updateProviderScheduleSchema,
  queryProviderScheduleSchema,
  checkOverlapSchema,
  providerScheduleIdSchema,
  validate,
};
