const Joi = require('joi');

const createLabTestSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required().messages({
    'string.empty': 'Lab name is required',
    'any.required': 'Lab name is required',
  }),
  code: Joi.string().trim().min(1).max(50).required().messages({
    'string.empty': 'Lab code is required',
    'any.required': 'Lab code is required',
  }),
  category: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Category is required',
    'any.required': 'Category is required',
  }),
  specimenType: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Specimen type is required',
    'any.required': 'Specimen type is required',
  }),
  isActive: Joi.boolean().default(true),
  sortOrder: Joi.number().integer().min(0).max(9999).default(0),
});

const updateLabTestSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).messages({
    'string.empty': 'Lab name cannot be empty',
  }),
  code: Joi.string().trim().min(1).max(50).messages({
    'string.empty': 'Lab code cannot be empty',
  }),
  category: Joi.string().trim().min(1).max(100).messages({
    'string.empty': 'Category cannot be empty',
  }),
  specimenType: Joi.string().trim().min(1).max(100).messages({
    'string.empty': 'Specimen type cannot be empty',
  }),
  isActive: Joi.boolean(),
  sortOrder: Joi.number().integer().min(0).max(9999),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

const queryLabTestSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(10),
  name: Joi.string().trim().max(200).allow(''),
  code: Joi.string().trim().max(50).allow(''),
  category: Joi.string().trim().max(100).allow(''),
  specimenType: Joi.string().trim().max(100).allow(''),
  isActive: Joi.boolean().truthy('true').falsy('false'),
  createdFrom: Joi.string().isoDate().allow(''),
  createdTo: Joi.string().isoDate().allow(''),
});

const labTestIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid laboratory test ID format',
    'any.required': 'Laboratory test ID is required',
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
  createLabTestSchema,
  updateLabTestSchema,
  queryLabTestSchema,
  labTestIdSchema,
  validate,
};
