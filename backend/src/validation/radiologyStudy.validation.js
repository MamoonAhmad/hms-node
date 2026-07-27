const Joi = require('joi');

const MODALITY_OPTIONS = [
  'X-Ray',
  'Ultrasound',
  'CT Scan',
  'MRI',
  'Mammography',
  'PET Scan',
  'Nuclear Medicine',
  'Fluoroscopy',
  'DEXA Scan',
  'Other',
];

const createRadiologyStudySchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required().messages({
    'string.empty': 'Radiology name is required',
    'any.required': 'Radiology name is required',
  }),
  code: Joi.string().trim().min(1).max(50).required().messages({
    'string.empty': 'Radiology code is required',
    'any.required': 'Radiology code is required',
  }),
  modality: Joi.string()
    .valid(...MODALITY_OPTIONS)
    .required()
    .messages({
      'any.only': 'Invalid modality',
      'any.required': 'Modality is required',
    }),
  bodyPart: Joi.string().trim().max(100).allow('', null),
  isActive: Joi.boolean().default(true),
});

const updateRadiologyStudySchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).messages({
    'string.empty': 'Radiology name cannot be empty',
  }),
  code: Joi.string().trim().min(1).max(50).messages({
    'string.empty': 'Radiology code cannot be empty',
  }),
  modality: Joi.string()
    .valid(...MODALITY_OPTIONS)
    .messages({ 'any.only': 'Invalid modality' }),
  bodyPart: Joi.string().trim().max(100).allow('', null),
  isActive: Joi.boolean(),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

const queryRadiologyStudySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(10),
  name: Joi.string().trim().max(100).allow(''),
  code: Joi.string().trim().max(50).allow(''),
  modality: Joi.string()
    .valid(...MODALITY_OPTIONS)
    .allow(''),
  bodyPart: Joi.string().trim().max(100).allow(''),
  isActive: Joi.boolean(),
  createdFrom: Joi.date().iso().allow(''),
  createdTo: Joi.date().iso().allow(''),
});

const radiologyStudyIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid radiology study ID format',
    'any.required': 'Radiology study ID is required',
  }),
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
  MODALITY_OPTIONS,
  createRadiologyStudySchema,
  updateRadiologyStudySchema,
  queryRadiologyStudySchema,
  radiologyStudyIdSchema,
  validate,
};
