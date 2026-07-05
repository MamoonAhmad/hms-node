const Joi = require('joi');

const queryEncountersWorkListSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(25),
  search: Joi.string().trim().max(100).allow(''),
  gender: Joi.string().valid('all', 'male', 'female', 'other').default('all'),
  departmentId: Joi.string().uuid().allow('all'),
  status: Joi.string().trim().max(100).allow('all'),
  providerId: Joi.string().uuid().allow('all'),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso(),
  appointmentTimeFilter: Joi.string().valid('all', 'morning', 'afternoon').default('all'),
  tab: Joi.string()
    .valid(
      'all',
      'my_patients',
      'ready_for_intake',
      'ready_for_providers',
      'ready_for_checkout',
      'ready_for_coding',
    )
    .default('all'),
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
  queryEncountersWorkListSchema,
  validate,
};
