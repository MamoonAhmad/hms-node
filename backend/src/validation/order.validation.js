const Joi = require('joi');

const orderItemSchema = Joi.object({
  procedureCode: Joi.string().trim().min(1).required(),
  procedureName: Joi.string().trim().min(1).required(),
  category: Joi.string().valid('Lab', 'Radiology', 'Pharmacy', 'Procedures').required(),
  status: Joi.string().trim().max(50).default('Scheduled'),
});

const createOrdersSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  appointmentId: Joi.string().uuid().allow(null, ''),
  locationId: Joi.string().uuid().allow(null, ''),
  orders: Joi.array().items(orderItemSchema).min(1).required(),
  orderedBy: Joi.string().trim().max(200).allow('', null),
});

const queryOrdersSchema = Joi.object({
  patientId: Joi.string().uuid(),
  appointmentId: Joi.string().uuid(),
  category: Joi.string().valid('Lab', 'Radiology', 'Pharmacy', 'Procedures'),
  destination: Joi.string().valid('onsite', 'external'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

const orderIdParamSchema = Joi.object({
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
  createOrdersSchema,
  queryOrdersSchema,
  orderIdParamSchema,
  validate,
};
