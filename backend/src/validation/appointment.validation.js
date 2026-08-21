const Joi = require('joi');
const { isValidIcd10, normalizeIcd10 } = require('../lib/codeCatalog');

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
  appointmentTypeId: Joi.string().uuid(),
  visitReason: Joi.string().trim().max(500).allow('', null),
  department: Joi.string().trim().max(100).allow('', null),
  departmentId: Joi.string().uuid().allow('', null),
  provider: Joi.string().trim().max(200).allow('', null),
  providerId: Joi.string().uuid().allow('', null).messages({
    'string.guid': 'Invalid provider ID format',
  }),
  status: statusFieldSchema.default('Scheduled'),
  notes: Joi.string().trim().max(5000).allow('', null),
  locationId: Joi.string().uuid().allow('', null),
  placeOfService: Joi.string().trim().max(50).allow('', null),
  primaryInsuranceId: Joi.string().uuid().allow('', null),
  secondaryInsuranceId: Joi.string().uuid().allow('', null),
  roomId: Joi.string().uuid().allow('', null),
})
  .or('appointmentType', 'appointmentTypeId')
  .messages({
    'object.missing': 'Appointment type is required',
  });

const updateAppointmentSchema = Joi.object({
  patientId: Joi.string().uuid(),
  appointmentDate: Joi.date().iso(),
  appointmentTime: timeFieldSchema,
  appointmentEndTime: timeFieldSchema.allow('', null),
  duration: Joi.number().integer().min(5).max(480),
  appointmentType: Joi.string().trim().min(1).max(100),
  appointmentTypeId: Joi.string().uuid(),
  visitReason: Joi.string().trim().max(500).allow('', null),
  department: Joi.string().trim().max(100).allow('', null),
  departmentId: Joi.string().uuid().allow('', null),
  provider: Joi.string().trim().max(200).allow('', null),
  providerId: Joi.string().uuid().allow('', null),
  status: statusFieldSchema,
  notes: Joi.string().trim().max(5000).allow('', null),
  locationId: Joi.string().uuid().allow('', null),
  placeOfService: Joi.string().trim().max(50).allow('', null),
  primaryInsuranceId: Joi.string().uuid().allow('', null),
  secondaryInsuranceId: Joi.string().uuid().allow('', null),
  roomId: Joi.string().uuid().allow('', null),
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
  fromDate: Joi.date().iso(),
  daysAhead: Joi.number().integer().min(1).max(365).default(90),
});

const availabilitySlotsQuerySchema = Joi.object({
  providerId: Joi.string().uuid().required(),
  date: Joi.date().iso().required(),
  appointmentType: Joi.string().trim().max(100).allow(''),
  excludeAppointmentId: Joi.string().uuid(),
});

const LIFECYCLE_ONLY_STATUSES = ['Cancelled', 'No-Show', 'No Show', 'Rescheduled'];

const updateStatusSchema = Joi.object({
  status: statusFieldSchema
    .required()
    .invalid(...LIFECYCLE_ONLY_STATUSES)
    .messages({
      'any.invalid':
        'Use POST /appointments/:id/cancel, /no-show, or /reschedule for Cancelled, No-Show, or Rescheduled',
    }),
});

const appointmentIdSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const reschedulePayloadSchema = Joi.object({
  appointmentDate: Joi.date().iso().required(),
  appointmentTime: timeFieldSchema.required(),
  appointmentEndTime: timeFieldSchema.allow('', null),
  duration: Joi.number().integer().min(5).max(480),
  appointmentType: Joi.string().trim().min(1).max(100).allow('', null),
  appointmentTypeId: Joi.string().uuid().allow('', null),
  visitReason: Joi.string().trim().max(500).allow('', null),
  department: Joi.string().trim().max(100).allow('', null),
  departmentId: Joi.string().uuid().allow('', null),
  provider: Joi.string().trim().max(200).allow('', null),
  providerId: Joi.string().uuid().allow('', null),
  notes: Joi.string().trim().max(5000).allow('', null),
  reasonCode: Joi.string().trim().max(100).allow('', null),
});

const cancelOrNoShowSchema = Joi.object({
  reasonCode: Joi.string().trim().min(1).max(100).required(),
  reasonNotes: Joi.string().trim().max(1000).allow('', null),
  feeAmount: Joi.number().min(0).precision(2).allow(null),
  waiveFee: Joi.boolean().default(false),
  waiveReason: Joi.when('waiveFee', {
    is: true,
    then: Joi.string().trim().min(3).max(500).required(),
    otherwise: Joi.string().trim().max(500).allow('', null),
  }),
  notifyPatient: Joi.boolean().default(true),
  reschedule: Joi.boolean().default(false),
  reschedulePayload: Joi.when('reschedule', {
    is: true,
    then: reschedulePayloadSchema.required(),
    otherwise: Joi.forbidden(),
  }),
});

const rescheduleSchema = reschedulePayloadSchema;

const policyPreviewQuerySchema = Joi.object({
  action: Joi.string().valid('cancel', 'no_show', 'reschedule').required(),
});

const reasonCodesQuerySchema = Joi.object({
  category: Joi.string().valid('cancel', 'no_show').allow('', null),
});

const eligibilityBodySchema = Joi.object({
  patientInsuranceId: Joi.string().uuid().allow('', null),
  source: Joi.string().trim().max(100).allow('', null),
  notes: Joi.string().trim().max(2000).allow('', null),
}).default({});

const checkInBodySchema = Joi.object({
  verifyEligibility: Joi.boolean().default(true),
  patientInsuranceId: Joi.string().uuid().allow('', null),
  collectPayment: Joi.boolean().default(false),
  copayAmount: Joi.number().min(0).precision(2).allow(null),
  collectedAmount: Joi.number().min(0).precision(2).allow(null),
  paymentMethod: Joi.string().trim().max(50).allow('', null),
  externalRef: Joi.string().trim().max(100).allow('', null),
  notes: Joi.string().trim().max(1000).allow('', null),
}).default({});

const paymentBodySchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  paymentMethod: Joi.string().trim().max(50).default('cash'),
  purpose: Joi.string().trim().max(50).default('copay'),
  createCharge: Joi.boolean().default(false),
  chargeType: Joi.string().trim().max(50).allow('', null),
  description: Joi.string().trim().max(500).allow('', null),
  externalRef: Joi.string().trim().max(100).allow('', null),
  notes: Joi.string().trim().max(1000).allow('', null),
});

const coverageBodySchema = Joi.object({
  primaryInsuranceId: Joi.string().uuid().allow('', null),
  secondaryInsuranceId: Joi.string().uuid().allow('', null),
  locationId: Joi.string().uuid().allow('', null),
  placeOfService: Joi.string().trim().max(50).allow('', null),
}).min(1);

const authorizationBodySchema = Joi.object({
  authorizationNumber: Joi.string().trim().max(100).allow('', null),
  status: Joi.string()
    .valid('Required', 'Not Required', 'Pending', 'Approved', 'Denied', 'Expired', 'Exhausted')
    .default('Pending'),
  payerName: Joi.string().trim().max(200).allow('', null),
  insuranceProviderId: Joi.string().uuid().allow('', null),
  providerId: Joi.string().uuid().allow('', null),
  serviceCode: Joi.string().trim().max(50).allow('', null),
  serviceDescription: Joi.string().trim().max(500).allow('', null),
  approvedUnits: Joi.number().integer().min(0).allow(null),
  usedUnits: Joi.number().integer().min(0).allow(null),
  remainingUnits: Joi.number().integer().min(0).allow(null),
  effectiveDate: Joi.date().iso().allow(null),
  expirationDate: Joi.date().iso().allow(null),
  notes: Joi.string().trim().max(2000).allow('', null),
});

const authorizationUpdateSchema = authorizationBodySchema.min(1);

const authorizationIdParamsSchema = Joi.object({
  id: Joi.string().uuid().required(),
  authId: Joi.string().uuid().required(),
});

const notificationBodySchema = Joi.object({
  eventKey: Joi.string().trim().max(100).default('appointment.reminder'),
  variables: Joi.object().unknown(true).default({}),
});

const roomAssignmentBodySchema = Joi.object({
  roomId: Joi.string().uuid().required(),
  notes: Joi.string().trim().max(1000).allow('', null),
});

const telehealthBodySchema = Joi.object({
  platform: Joi.string().trim().max(100).allow('', null),
  telehealthPlatform: Joi.string().trim().max(100).allow('', null),
  joinUrl: Joi.string().trim().max(2000).allow('', null),
  telehealthJoinUrl: Joi.string().trim().max(2000).allow('', null),
  meetingId: Joi.string().trim().max(100).allow('', null),
  telehealthMeetingId: Joi.string().trim().max(100).allow('', null),
  joinStatus: Joi.string().trim().max(50).allow('', null),
  telehealthJoinStatus: Joi.string().trim().max(50).allow('', null),
}).min(1);

const referralBodySchema = Joi.object({
  referralType: Joi.string().trim().max(100).allow('', null),
  referralNumber: Joi.string().trim().max(100).allow('', null),
  referringProviderName: Joi.string().trim().max(200).allow('', null),
  referringProviderNpi: Joi.string().trim().max(20).allow('', null),
  referredProviderId: Joi.string().uuid().allow('', null),
  referringFacility: Joi.string().trim().max(200).allow('', null),
  receivingFacility: Joi.string().trim().max(200).allow('', null),
  referralDate: Joi.date().iso().allow(null),
  referralReason: Joi.string().trim().max(1000).allow('', null),
  diagnosisCode: Joi.string()
    .trim()
    .max(50)
    .allow('', null)
    .custom((value, helpers) => {
      if (!value) return null;
      const normalized = normalizeIcd10(value);
      if (!isValidIcd10(normalized)) {
        return helpers.error('any.invalid');
      }
      return normalized;
    })
    .messages({ 'any.invalid': 'Referral diagnosis must be a valid ICD-10-CM code' }),
  diagnosisDescription: Joi.string().trim().max(500).allow('', null),
  authorizationNumber: Joi.string().trim().max(100).allow('', null),
  effectiveDate: Joi.date().iso().allow(null),
  expirationDate: Joi.date().iso().allow(null),
  status: Joi.string().trim().max(50).allow('', null),
  notes: Joi.string().trim().max(2000).allow('', null),
  legacyPayload: Joi.object().unknown(true).allow(null),
});

const recurringBodySchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  startDate: Joi.date().iso().required(),
  preferredTime: timeFieldSchema.required(),
  appointmentTypeId: Joi.string().uuid().required(),
  providerId: Joi.string().uuid().allow('', null),
  departmentId: Joi.string().uuid().allow('', null),
  frequency: Joi.string().valid('daily', 'weekly', 'monthly', 'custom').default('weekly'),
  interval: Joi.number().integer().min(1).max(12).default(1),
  daysOfWeek: Joi.array().items(Joi.number().integer().min(0).max(6)).allow(null),
  endDate: Joi.date().iso().allow(null),
  occurrenceCount: Joi.number().integer().min(1).max(52).default(12),
  exclusions: Joi.array().items(Joi.string()).default([]),
  duration: Joi.number().integer().min(5).max(480).default(30),
  visitReason: Joi.string().trim().max(500).allow('', null),
  notes: Joi.string().trim().max(5000).allow('', null),
});

const weekCalendarQuerySchema = Joi.object({
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso(),
  providerId: Joi.string().uuid(),
  departmentId: Joi.string().uuid(),
  locationId: Joi.string().uuid(),
  status: statusFieldSchema,
  appointmentTypeId: Joi.string().uuid(),
});

const reportsQuerySchema = Joi.object({
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso(),
});

const policyUpdateSchema = Joi.object({
  lateCancelHours: Joi.number().integer().min(0).max(168),
  lateCancelFee: Joi.number().min(0).precision(2),
  noShowFee: Joi.number().min(0).precision(2),
  allowFeeWaive: Joi.boolean(),
  blockAfterNoShowCount: Joi.number().integer().min(0).allow(null),
  autoNoShowMinutesPast: Joi.number().integer().min(0).max(480),
  notifyPatientOnCancel: Joi.boolean(),
  notifyPatientOnNoShow: Joi.boolean(),
  requireDepositAfterNoShows: Joi.number().integer().min(0).allow(null),
  depositAmount: Joi.number().min(0).precision(2).allow(null),
  maxRescheduleCount: Joi.number().integer().min(0).allow(null),
  reminderHoursBefore: Joi.array().items(Joi.number().integer().min(1)).allow(null),
  waitlistAutoOffer: Joi.boolean(),
  confirmationRequired: Joi.boolean(),
  refundPolicyNotes: Joi.string().trim().max(5000).allow('', null),
}).min(1);

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
  createAppointmentSchema,
  updateAppointmentSchema,
  queryAppointmentSchema,
  statusCountsQuerySchema,
  availabilityDatesQuerySchema,
  availabilitySlotsQuerySchema,
  updateStatusSchema,
  appointmentIdSchema,
  cancelOrNoShowSchema,
  rescheduleSchema,
  policyPreviewQuerySchema,
  reasonCodesQuerySchema,
  eligibilityBodySchema,
  checkInBodySchema,
  paymentBodySchema,
  coverageBodySchema,
  authorizationBodySchema,
  authorizationUpdateSchema,
  authorizationIdParamsSchema,
  notificationBodySchema,
  roomAssignmentBodySchema,
  telehealthBodySchema,
  referralBodySchema,
  recurringBodySchema,
  weekCalendarQuerySchema,
  reportsQuerySchema,
  policyUpdateSchema,
  validate,
};
