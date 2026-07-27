const Joi = require('joi');

const upsertEncounterProblemSchema = Joi.object({
  addressedThisVisit: Joi.boolean(),
  isPrimary: Joi.boolean(),
  priority: Joi.number().integer().min(1).max(99).allow(null),
  assessment: Joi.string().trim().max(5000).allow('', null),
  plan: Joi.string().trim().max(5000).allow('', null),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided' });

const encounterProblemParamsSchema = Joi.object({
  id: Joi.string().uuid().required(),
  appointmentId: Joi.string().uuid().required(),
  problemId: Joi.string().uuid().required(),
});

const encounterProblemListParamsSchema = Joi.object({
  id: Joi.string().uuid().required(),
  appointmentId: Joi.string().uuid().required(),
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
  upsertEncounterProblemSchema,
  encounterProblemParamsSchema,
  encounterProblemListParamsSchema,
  validate,
};
