const Joi = require('joi');

const createHcpcsCodeSchema = Joi.object({
  code: Joi.string().trim().min(1).max(50).required().messages({
    'string.empty': 'Code is required',
    'any.required': 'Code is required',
  }),
  description: Joi.string().trim().min(1).max(1000).required().messages({
    'string.empty': 'Description is required',
    'any.required': 'Description is required',
  }),
  effectiveDate: Joi.date().iso().allow('', null),
  expiryDate: Joi.date().iso().allow('', null),
});

const updateHcpcsCodeSchema = Joi.object({
  code: Joi.string().trim().min(1).max(50),
  description: Joi.string().trim().min(1).max(1000),
  effectiveDate: Joi.date().iso().allow('', null),
  expiryDate: Joi.date().iso().allow('', null),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

const queryHcpcsCodeSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(10),
  search: Joi.string().trim().max(200).allow(''),
});

const hcpcsCodeIdSchema = Joi.object({
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
  createHcpcsCodeSchema,
  updateHcpcsCodeSchema,
  queryHcpcsCodeSchema,
  hcpcsCodeIdSchema,
  validate,
};
