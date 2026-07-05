const Joi = require('joi');

const queryTrackingBoardSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(25),
  search: Joi.string().trim().max(100).allow(''),
  status: Joi.string().trim().max(100).allow(''),
  providerId: Joi.string().uuid().allow(''),
  date: Joi.date().iso(),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso(),
  arrivalTimeFilter: Joi.string().valid('all', 'morning', 'afternoon', 'not_arrived').default('all'),
  indicator: Joi.string().valid(
    'scheduled',
    'arrived',
    'registrationIncomplete',
    'roomed',
    'withProvider',
    'providerOut',
    'checkout',
  ),
});

const assignRoomSchema = Joi.object({
  roomId: Joi.string().uuid().required(),
});

const appointmentIdSchema = Joi.object({
  appointmentId: Joi.string().uuid().required(),
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
  queryTrackingBoardSchema,
  assignRoomSchema,
  appointmentIdSchema,
  validate,
};
