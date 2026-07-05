const Joi = require('joi');

const NOTE_TYPES = ['soap', 'progress', 'telephonic', 'blank', 'nurse'];

const createClinicalNoteSchema = Joi.object({
  noteType: Joi.string()
    .valid(...NOTE_TYPES)
    .required(),
  appointmentId: Joi.string().uuid().allow(null, ''),
  title: Joi.string().trim().max(200).allow('', null),
  content: Joi.object().unknown(true),
  diagnoses: Joi.array().items(Joi.object().unknown(true)).default([]),
  attachments: Joi.array().items(Joi.object().unknown(true)).default([]),
  providerId: Joi.string().uuid().allow(null, ''),
  providerName: Joi.string().trim().max(200).allow('', null),
  location: Joi.string().trim().max(200).allow('', null),
});

const updateClinicalNoteSchema = Joi.object({
  title: Joi.string().trim().max(200).allow('', null),
  content: Joi.object().unknown(true),
  diagnoses: Joi.array().items(Joi.object().unknown(true)),
  attachments: Joi.array().items(Joi.object().unknown(true)),
});

const addAddendumSchema = Joi.object({
  sections: Joi.array().items(Joi.string()).min(1).required(),
  content: Joi.object().unknown(true).required(),
  diagnoses: Joi.array().items(Joi.object().unknown(true)).default([]),
  attachments: Joi.array().items(Joi.object().unknown(true)).default([]),
});

const queryClinicalNotesSchema = Joi.object({
  appointmentId: Joi.string().uuid().allow('', null),
  allEncounters: Joi.boolean().truthy('true').falsy('false').default(false),
});

const queryChartContextSchema = Joi.object({
  appointmentId: Joi.string().uuid().allow('', null),
});

const clinicalNoteParamsSchema = Joi.object({
  id: Joi.string().uuid().required(),
  noteId: Joi.string().uuid().required(),
});

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      const errors = error.details.map((d) => d.message);
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    req[property] = value;
    next();
  };
};

module.exports = {
  createClinicalNoteSchema,
  updateClinicalNoteSchema,
  addAddendumSchema,
  queryClinicalNotesSchema,
  queryChartContextSchema,
  clinicalNoteParamsSchema,
  validate,
};
