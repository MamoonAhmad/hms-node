const Joi = require('joi');

const timeFieldSchema = Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/);
const prioritySchema = Joi.string().valid('low', 'normal', 'high', 'urgent');
const timeWindowSchema = Joi.string().valid('any', 'morning', 'afternoon', 'evening');
const statusSchema = Joi.string().valid(
  'Waiting',
  'Offered',
  'Booked',
  'Declined',
  'Expired',
  'Cancelled',
  'Removed',
);

const preferredDaysSchema = Joi.array()
  .items(Joi.string().valid('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'))
  .max(7)
  .allow(null);

const preferredTimesSchema = Joi.array().items(timeFieldSchema).max(48).allow(null);

const createWaitlistSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  preferredProviderId: Joi.string().uuid().allow('', null),
  preferredDepartmentId: Joi.string().uuid().allow('', null),
  appointmentTypeId: Joi.string().uuid().allow('', null),
  preferredDateFrom: Joi.date().iso().allow('', null),
  preferredDateTo: Joi.date().iso().allow('', null),
  preferredDays: preferredDaysSchema,
  preferredTimes: preferredTimesSchema,
  preferredTimeWindow: timeWindowSchema.default('any'),
  priority: prioritySchema.default('normal'),
  reason: Joi.string().trim().max(500).allow('', null),
  notes: Joi.string().trim().max(5000).allow('', null),
  contactPhone: Joi.string().trim().max(40).allow('', null),
  contactEmail: Joi.string().email().allow('', null),
  sourceAppointmentId: Joi.string().uuid().allow('', null),
  position: Joi.number().integer().min(0).allow(null),
});

const updateWaitlistSchema = Joi.object({
  preferredProviderId: Joi.string().uuid().allow('', null),
  preferredDepartmentId: Joi.string().uuid().allow('', null),
  appointmentTypeId: Joi.string().uuid().allow('', null),
  preferredDateFrom: Joi.date().iso().allow('', null),
  preferredDateTo: Joi.date().iso().allow('', null),
  preferredDays: preferredDaysSchema,
  preferredTimes: preferredTimesSchema,
  preferredTimeWindow: timeWindowSchema,
  priority: prioritySchema,
  reason: Joi.string().trim().max(500).allow('', null),
  notes: Joi.string().trim().max(5000).allow('', null),
  contactPhone: Joi.string().trim().max(40).allow('', null),
  contactEmail: Joi.string().email().allow('', null),
  position: Joi.number().integer().min(0).allow(null),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided' });

const queryWaitlistSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(20),
  search: Joi.string().trim().max(100).allow(''),
  status: statusSchema,
  priority: prioritySchema,
  patientId: Joi.string().uuid(),
  preferredProviderId: Joi.string().uuid(),
  preferredDepartmentId: Joi.string().uuid(),
  appointmentTypeId: Joi.string().uuid(),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso(),
  activeOnly: Joi.boolean().truthy('true').falsy('false'),
});

const statusCountsQuerySchema = queryWaitlistSchema.keys({
  status: Joi.forbidden(),
  page: Joi.forbidden(),
  limit: Joi.forbidden(),
});

const matchesQuerySchema = Joi.object({
  providerId: Joi.string().uuid().required(),
  date: Joi.date().iso().required(),
  startTime: timeFieldSchema,
  endTime: timeFieldSchema.allow('', null),
  appointmentTypeId: Joi.string().uuid().allow('', null),
  departmentId: Joi.string().uuid().allow('', null),
  limit: Joi.number().integer().min(1).max(50).default(20),
});

const offerSchema = Joi.object({
  providerId: Joi.string().uuid().required(),
  slotDate: Joi.date().iso().required(),
  slotStart: timeFieldSchema.required(),
  slotEnd: timeFieldSchema.allow('', null),
  offerExpiresAt: Joi.date().iso().allow('', null),
  notifyPatient: Joi.boolean().default(true),
  notes: Joi.string().trim().max(1000).allow('', null),
});

const bookSchema = Joi.object({
  providerId: Joi.string().uuid().required(),
  appointmentDate: Joi.date().iso().required(),
  appointmentTime: timeFieldSchema.required(),
  appointmentEndTime: timeFieldSchema.allow('', null),
  duration: Joi.number().integer().min(5).max(480),
  appointmentTypeId: Joi.string().uuid().allow('', null),
  departmentId: Joi.string().uuid().allow('', null),
  visitReason: Joi.string().trim().max(500).allow('', null),
  notes: Joi.string().trim().max(5000).allow('', null),
  clearOffer: Joi.boolean().default(true),
});

const declineOfferSchema = Joi.object({
  reason: Joi.string().trim().max(500).allow('', null),
  returnToWaiting: Joi.boolean().default(true),
});

const closeSchema = Joi.object({
  reason: Joi.string().trim().max(500).allow('', null),
});

const waitlistIdSchema = Joi.object({
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

module.exports = {
  createWaitlistSchema,
  updateWaitlistSchema,
  queryWaitlistSchema,
  statusCountsQuerySchema,
  matchesQuerySchema,
  offerSchema,
  bookSchema,
  declineOfferSchema,
  closeSchema,
  waitlistIdSchema,
  validate,
};
