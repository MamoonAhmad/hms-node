const Joi = require('joi');

const createChiefComplaintSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required().messages({
    'string.empty': 'Chief complaint name is required',
    'any.required': 'Chief complaint name is required',
  }),
  code: Joi.string().trim().max(50).allow('', null),
  isFavourite: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true),
  sortOrder: Joi.number().integer().min(0).max(9999).default(0),
});

const updateChiefComplaintSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).messages({
    'string.empty': 'Chief complaint name cannot be empty',
  }),
  code: Joi.string().trim().max(50).allow('', null),
  isFavourite: Joi.boolean(),
  isActive: Joi.boolean(),
  sortOrder: Joi.number().integer().min(0).max(9999),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

const queryChiefComplaintSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(10),
  search: Joi.string().trim().max(100).allow(''),
});

const chiefComplaintIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid chief complaint ID format',
    'any.required': 'Chief complaint ID is required',
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
  createChiefComplaintSchema,
  updateChiefComplaintSchema,
  queryChiefComplaintSchema,
  chiefComplaintIdSchema,
  validate,
};
