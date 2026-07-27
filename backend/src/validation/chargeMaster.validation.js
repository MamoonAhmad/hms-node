const Joi = require('joi');

const createChargeMasterSchema = Joi.object({
  cptCode: Joi.string().trim().min(1).max(50).required(),
  description: Joi.string().trim().min(1).max(1000).required(),
  revenueCode: Joi.string().trim().min(1).max(50).required(),
  priceEffectiveDate: Joi.date().iso().required(),
  cptEffectiveDate: Joi.date().iso().allow('', null),
  standardAmount: Joi.number().positive().max(999999999.99).required(),
  totalRevenue: Joi.number().min(0).max(9999999999.99).allow(null),
  totalVolume: Joi.number().min(0).max(999999999.99).allow(null),
  percentageIncreased: Joi.number().min(0).max(9999.99).allow(null),
  category: Joi.string().trim().max(200).allow('', null),
  genericDepartment: Joi.string().trim().max(200).allow('', null),
  discountPercent: Joi.number().min(0).max(100).allow(null),
  location: Joi.string().trim().min(1).max(200).required(),
  payer: Joi.string().trim().max(200).allow('', null),
  isActive: Joi.boolean().default(true),
});

const updateChargeMasterSchema = Joi.object({
  cptCode: Joi.string().trim().min(1).max(50),
  description: Joi.string().trim().min(1).max(1000),
  revenueCode: Joi.string().trim().min(1).max(50),
  priceEffectiveDate: Joi.date().iso(),
  cptEffectiveDate: Joi.date().iso().allow('', null),
  standardAmount: Joi.number().positive().max(999999999.99),
  totalRevenue: Joi.number().min(0).max(9999999999.99).allow(null),
  totalVolume: Joi.number().min(0).max(999999999.99).allow(null),
  percentageIncreased: Joi.number().min(0).max(9999.99).allow(null),
  category: Joi.string().trim().max(200).allow('', null),
  genericDepartment: Joi.string().trim().max(200).allow('', null),
  discountPercent: Joi.number().min(0).max(100).allow(null),
  location: Joi.string().trim().min(1).max(200),
  payer: Joi.string().trim().max(200).allow('', null),
  isActive: Joi.boolean(),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

const queryChargeMasterSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(10),
  search: Joi.string().trim().max(200).allow('', null),
  location: Joi.string().trim().max(200).allow('', null),
  category: Joi.string().trim().max(200).allow('', null),
  payer: Joi.string().trim().max(200).allow('', null),
  genericDepartment: Joi.string().trim().max(200).allow('', null),
  isActive: Joi.boolean().truthy('true').falsy('false').allow('', null),
}).prefs({ convert: true });

const chargeMasterIdSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const validate = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map((d) => d.message),
    });
  }
  req[property] = value;
  return next();
};

module.exports = {
  createChargeMasterSchema,
  updateChargeMasterSchema,
  queryChargeMasterSchema,
  chargeMasterIdSchema,
  validate,
};
