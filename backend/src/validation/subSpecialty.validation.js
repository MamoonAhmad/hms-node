const Joi = require('joi');

const createSubSpecialtySchema = Joi.object({
  specialtyId: Joi.string().uuid().required().messages({
    'any.required': 'Speciality is required',
    'string.guid': 'Invalid speciality ID format',
  }),
  name: Joi.string().trim().min(1).max(200).required().messages({
    'string.empty': 'Sub speciality name is required',
    'any.required': 'Sub speciality name is required',
  }),
  code: Joi.string().trim().max(50).allow('', null),
  isActive: Joi.boolean().default(true),
});

const updateSubSpecialtySchema = Joi.object({
  specialtyId: Joi.string().uuid().messages({
    'string.guid': 'Invalid speciality ID format',
  }),
  name: Joi.string().trim().min(1).max(200).messages({
    'string.empty': 'Sub speciality name cannot be empty',
  }),
  code: Joi.string().trim().max(50).allow('', null),
  isActive: Joi.boolean(),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

const querySubSpecialtySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().max(100).allow(''),
  specialtyId: Joi.string().uuid(),
  isActive: Joi.boolean(),
});

const subSpecialtyIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid sub speciality ID format',
    'any.required': 'Sub speciality ID is required',
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
  createSubSpecialtySchema,
  updateSubSpecialtySchema,
  querySubSpecialtySchema,
  subSpecialtyIdSchema,
  validate,
};

