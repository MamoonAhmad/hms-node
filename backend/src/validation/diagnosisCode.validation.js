const Joi = require('joi');

const createDiagnosisCodeSchema = Joi.object({
  code: Joi.string().trim().min(1).max(20).required().messages({
    'string.empty': 'ICD code is required',
    'any.required': 'ICD code is required',
  }),
  description: Joi.string().trim().min(1).max(1000).required().messages({
    'string.empty': 'Description is required',
    'any.required': 'Description is required',
  }),
  effectiveDate: Joi.date().iso().allow('', null),
  expiryDate: Joi.date().iso().allow('', null),
  isActive: Joi.boolean().default(true),
  codingNotes: Joi.string().trim().max(2000).allow('', null),
});

const updateDiagnosisCodeSchema = Joi.object({
  code: Joi.string().trim().min(1).max(20),
  description: Joi.string().trim().min(1).max(1000),
  effectiveDate: Joi.date().iso().allow('', null),
  expiryDate: Joi.date().iso().allow('', null),
  isActive: Joi.boolean(),
  codingNotes: Joi.string().trim().max(2000).allow('', null),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

const queryDiagnosisCodeSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(10),
  search: Joi.string().trim().max(200).allow(''),
});

const diagnosisCodeIdSchema = Joi.object({
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

    req[property] = value;
    next();
  };
};

module.exports = {
  createDiagnosisCodeSchema,
  updateDiagnosisCodeSchema,
  queryDiagnosisCodeSchema,
  diagnosisCodeIdSchema,
  validate,
};
