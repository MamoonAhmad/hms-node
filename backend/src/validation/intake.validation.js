const Joi = require('joi');

const patientIdSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
});

const sectionKeySchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  sectionKey: Joi.string().trim().min(1).max(100).required(),
});

const screeningTypeSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  screeningType: Joi.string().trim().min(1).max(100).required(),
});

const intakeQuerySchema = Joi.object({
  appointmentId: Joi.string().uuid().allow('', null),
});

const saveSectionSchema = Joi.object({
  appointmentId: Joi.string().uuid().allow('', null),
  data: Joi.object().required(),
  isAddendum: Joi.boolean().default(false),
  parentId: Joi.string().uuid().allow('', null),
});

const saveScreeningSchema = Joi.object({
  appointmentId: Joi.string().uuid().allow('', null),
  screeningType: Joi.string().trim().min(1).max(100).required(),
  score: Joi.number().integer().allow(null),
  maxScore: Joi.number().integer().allow(null),
  answers: Joi.object().required(),
  notes: Joi.string().trim().max(5000).allow('', null),
});

const completeIntakeSchema = Joi.object({
  appointmentId: Joi.string().uuid().allow('', null),
  intakeNotes: Joi.string().trim().max(5000).allow('', null),
  certificationAccepted: Joi.boolean().valid(true).required(),
});

const validate = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const errors = error.details.map((d) => d.message);
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }
  if (property === 'query') req.validatedQuery = value;
  else req[property] = value;
  next();
};

module.exports = {
  patientIdSchema,
  sectionKeySchema,
  screeningTypeSchema,
  intakeQuerySchema,
  saveSectionSchema,
  saveScreeningSchema,
  completeIntakeSchema,
  validate,
};
