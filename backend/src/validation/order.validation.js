const Joi = require('joi');
const { ORDER_STATUSES, ORDER_CATEGORIES } = require('../constants/order.constants');

const orderItemSchema = Joi.object({
  procedureCode: Joi.string().trim().min(1).required(),
  procedureName: Joi.string().trim().min(1).required(),
  category: Joi.string()
    .valid(...ORDER_CATEGORIES)
    .required(),
  orderType: Joi.string().trim().max(100).allow('', null),
  status: Joi.string()
    .valid(...ORDER_STATUSES)
    .default('Scheduled'),
  site: Joi.string().trim().max(200).allow('', null),
  siteId: Joi.string().trim().max(100).allow('', null),
  siteName: Joi.string().trim().max(200).allow('', null),
  orderDateTime: Joi.date().iso().allow(null),
  sourceType: Joi.string().trim().max(50).allow('', null),
  customOrderSetId: Joi.string().uuid().allow(null, ''),
  customOrderSetName: Joi.string().trim().max(200).allow('', null),
});

const createOrdersSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  appointmentId: Joi.string().uuid().allow(null, ''),
  locationId: Joi.string().uuid().allow(null, ''),
  orders: Joi.array().items(orderItemSchema).min(1).required(),
  orderedBy: Joi.string().trim().max(200).allow('', null),
});

const updateOrderSchema = Joi.object({
  status: Joi.string().valid(...ORDER_STATUSES),
  site: Joi.string().trim().max(200).allow('', null),
  siteId: Joi.string().trim().max(100).allow('', null),
  siteName: Joi.string().trim().max(200).allow('', null),
  orderDateTime: Joi.date().iso(),
}).min(1);

const batchUpdateOrdersSchema = Joi.object({
  orders: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().uuid().required(),
        status: Joi.string().valid(...ORDER_STATUSES),
        site: Joi.string().trim().max(200).allow('', null),
        siteId: Joi.string().trim().max(100).allow('', null),
        siteName: Joi.string().trim().max(200).allow('', null),
        orderDateTime: Joi.date().iso(),
      }).min(2),
    )
    .min(1)
    .required(),
});

const queryOrdersSchema = Joi.object({
  patientId: Joi.string().uuid(),
  appointmentId: Joi.string().uuid(),
  category: Joi.string().valid(...ORDER_CATEGORIES),
  destination: Joi.string().valid('onsite', 'external'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(50),
});

const searchProceduresSchema = Joi.object({
  q: Joi.string().trim().min(2).required(),
  category: Joi.string().valid(...ORDER_CATEGORIES),
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
  updateOrderSchema,
  batchUpdateOrdersSchema,
  queryOrdersSchema,
  searchProceduresSchema,
  orderIdParamSchema,
  validate,
};
