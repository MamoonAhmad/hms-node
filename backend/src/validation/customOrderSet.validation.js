const Joi = require('joi');

const orderSetItemSchema = Joi.object({
  procedureId: Joi.string().uuid().allow(null, ''),
  id: Joi.string().allow(null, ''),
  procedureCode: Joi.string().trim().max(100).allow('', null),
  code: Joi.string().trim().max(100).allow('', null),
  procedureName: Joi.string().trim().min(1),
  name: Joi.string().trim().min(1),
  category: Joi.string().trim().max(100).default('Other'),
  isActive: Joi.boolean(),
}).or('procedureName', 'name');

const createCustomOrderSetSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  code: Joi.string().trim().max(100).allow('', null),
  description: Joi.string().trim().max(2000).allow('', null),
  category: Joi.string().trim().max(100).allow('', null),
  departmentId: Joi.string().uuid().allow(null, ''),
  visibility: Joi.string().valid('global', 'department', 'provider').default('global'),
  status: Joi.string().valid('active', 'inactive').default('active'),
  ownerUserId: Joi.string().uuid().allow(null, ''),
  items: Joi.array().items(orderSetItemSchema).default([]),
  orders: Joi.array().items(orderSetItemSchema),
});

const updateCustomOrderSetSchema = createCustomOrderSetSchema.fork(['name'], (s) => s.optional());

const searchCustomOrderSetSchema = Joi.object({
  q: Joi.string().trim().min(2).required(),
  departmentId: Joi.string().uuid(),
  locationId: Joi.string().uuid(),
});

const queryCustomOrderSetSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  status: Joi.string().valid('active', 'inactive', 'all').default('active'),
});

const customOrderSetIdSchema = Joi.object({
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
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    req[property] = value;
    next();
  };
};

module.exports = {
  createCustomOrderSetSchema,
  updateCustomOrderSetSchema,
  searchCustomOrderSetSchema,
  queryCustomOrderSetSchema,
  customOrderSetIdSchema,
  validate,
};
