const Joi = require('joi');

const createBillingProviderSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required().messages({
    'string.empty': 'Name is required',
    'any.required': 'Name is required',
  }),
  code: Joi.string().trim().max(50).allow('', null),
  npi: Joi.string().trim().max(20).allow('', null),
  taxId: Joi.string().trim().max(20).allow('', null),
  address: Joi.string().trim().max(500).allow('', null),
  isActive: Joi.boolean().default(true),
});

const updateBillingProviderSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200),
  code: Joi.string().trim().max(50).allow('', null),
  npi: Joi.string().trim().max(20).allow('', null),
  taxId: Joi.string().trim().max(20).allow('', null),
  address: Joi.string().trim().max(500).allow('', null),
  isActive: Joi.boolean(),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

const queryBillingProviderSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(10),
  search: Joi.string().trim().max(200).allow(''),
  status: Joi.string().valid('active', 'inactive', 'all').default('all'),
  isActive: Joi.boolean(),
  lookup: Joi.boolean(),
});

const billingProviderIdSchema = Joi.object({
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
  createBillingProviderSchema,
  updateBillingProviderSchema,
  queryBillingProviderSchema,
  billingProviderIdSchema,
  validate,
};
