const Joi = require('joi');

const ORDER_CATEGORY_VALUES = ['Lab', 'Radiology', 'Pharmacy', 'Immunization', 'Procedures'];

const orderItemSchema = Joi.object({
  procedureCode: Joi.string().trim().min(1).required(),
  procedureName: Joi.string().trim().min(1).required(),
  category: Joi.string().valid(...ORDER_CATEGORY_VALUES).required(),
  status: Joi.string().trim().max(50).default('Scheduled'),
  site: Joi.string().trim().max(100).allow('', null),
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
  category: Joi.string().valid(...ORDER_CATEGORY_VALUES),
  destination: Joi.string().valid('onsite', 'external'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(50),
});

const orderIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const ORDER_STATUS_VALUES = [
  'Scheduled',
  'Pending',
  'In Progress',
  'Collected',
  'On Hold',
  'Cancelled',
  'Completed',
  'Resulted',
];

const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid(...ORDER_STATUS_VALUES).required(),
});

const updateOrderSpecimenSchema = Joi.object({
  status: Joi.string().valid(...ORDER_STATUS_VALUES).required(),
  collectionSite: Joi.string().trim().max(100).allow('', null),
  specimenType: Joi.string().trim().max(100).allow('', null),
  collectedBy: Joi.string().trim().max(200).allow('', null),
  collectionDateTime: Joi.date().iso().allow(null),
  collectionNotes: Joi.string().trim().max(5000).allow('', null),
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
  updateOrderStatusSchema,
  updateOrderSpecimenSchema,
  ORDER_STATUS_VALUES,
  ORDER_CATEGORY_VALUES,
  validate,
};
