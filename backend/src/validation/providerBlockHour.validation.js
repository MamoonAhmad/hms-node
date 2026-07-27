const Joi = require('joi');

const DAY_VALUES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function parseDayList(value) {
  if (!value || value === '') return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

const blockBodyFields = {
  providerId: Joi.string().uuid().required(),
  days: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string().valid(...DAY_VALUES)).min(1),
      Joi.string().trim().min(1),
    )
    .required(),
  startTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .required(),
  endTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .required(),
  effectiveStartDate: Joi.date().iso().required(),
  effectiveEndDate: Joi.date().iso().allow(null, ''),
  reason: Joi.string().trim().max(2000).allow('', null),
  status: Joi.string().valid('Active', 'Inactive').default('Active'),
};

const createProviderBlockHourSchema = Joi.object(blockBodyFields);

const updateProviderBlockHourSchema = Joi.object({
  providerId: Joi.string().uuid(),
  days: Joi.alternatives().try(
    Joi.array().items(Joi.string().valid(...DAY_VALUES)).min(1),
    Joi.string().trim().min(1),
  ),
  startTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/),
  effectiveStartDate: Joi.date().iso(),
  effectiveEndDate: Joi.date().iso().allow(null, ''),
  reason: Joi.string().trim().max(2000).allow('', null),
  status: Joi.string().valid('Active', 'Inactive'),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

const queryProviderBlockHourSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(10),
  search: Joi.string().trim().max(200).allow(''),
  providerId: Joi.string().uuid().allow('', null),
  departmentId: Joi.string().uuid().allow('', null),
  days: Joi.alternatives().try(
    Joi.string().trim().allow(''),
    Joi.array().items(Joi.string().valid(...DAY_VALUES)),
  ),
  status: Joi.string().valid('Active', 'Inactive').allow('', null),
});

const blockValidationQuerySchema = Joi.object({
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
  status: Joi.string().valid('Active', 'Inactive').default('Active'),
  excludeBlockId: Joi.string().uuid().allow(null, ''),
});

const providerBlockHourIdSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

function normalizeQueryValue(value) {
  if (value.effectiveEndDate === '') value.effectiveEndDate = null;
  if (value.excludeBlockId === '') value.excludeBlockId = null;
  if (value.providerId === '') value.providerId = undefined;
  if (value.status === '') value.status = undefined;
  if (value.days !== undefined) {
    value.days = parseDayList(value.days);
  }
  if (value.days && typeof value.days === 'string') {
    value.days = parseDayList(value.days);
  }
  return value;
}

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

    normalizeQueryValue(value);

    if (value.days !== undefined && typeof value.days === 'string') {
      value.days = parseDayList(value.days);
    }

    if (property === 'query') {
      req.validatedQuery = value;
    } else {
      req[property] = value;
    }
    next();
  };
};

module.exports = {
  createProviderBlockHourSchema,
  updateProviderBlockHourSchema,
  queryProviderBlockHourSchema,
  blockValidationQuerySchema,
  providerBlockHourIdSchema,
  validate,
};
