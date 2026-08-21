const Joi = require('joi');
const { isValidCpt, isValidHcpcs, isValidRevenueCode, isValidModifier } = require('../lib/codeCatalog');

const procedureCode = Joi.string()
  .trim()
  .allow('', null)
  .custom((value, helpers) => {
    if (!value) return null;
    const upper = value.toUpperCase();
    if (isValidCpt(upper) || isValidHcpcs(upper) || /^[A-Z0-9-]{3,12}$/i.test(upper)) return upper;
    return helpers.error('any.invalid');
  })
  .messages({
    'any.invalid': 'CPT/HCPCS code format is invalid',
  });

const optionalRevenue = Joi.string()
  .trim()
  .allow('', null)
  .custom((value, helpers) => {
    if (value && !isValidRevenueCode(value)) return helpers.error('any.invalid');
    return value || null;
  })
  .messages({ 'any.invalid': 'Revenue code must be 3 or 4 digits' });

const optionalModifier = Joi.string()
  .trim()
  .uppercase()
  .allow('', null)
  .custom((value, helpers) => {
    if (value && !isValidModifier(value)) return helpers.error('any.invalid');
    return value || null;
  })
  .messages({ 'any.invalid': 'Modifier must be 2 alphanumeric characters' });

const chargeMasterFields = {
  cptCode: procedureCode,
  description: Joi.string().trim().min(1).max(500),
  procedureDescription: Joi.string().trim().min(1).max(500),
  genericDescription: Joi.string().trim().max(500).allow('', null),
  revenueCode: optionalRevenue,
  standardAmount: Joi.number().min(0).allow(null),
  unitPrice: Joi.number().min(0).allow(null),
  cashPrice: Joi.number().min(0).allow(null),
  cost: Joi.number().min(0).allow(null),
  discountPercent: Joi.number().min(0).max(100).allow(null),
  priceEffectiveDate: Joi.date().iso().allow('', null),
  priceExpiryDate: Joi.date().iso().allow('', null),
  cptEffectiveDate: Joi.date().iso().allow('', null),
  effectiveDate: Joi.date().iso().allow('', null),
  expiryDate: Joi.date().iso().allow('', null),
  location: Joi.string().trim().max(120).allow('', null),
  departmentId: Joi.string().uuid().allow('', null),
  category: Joi.string().trim().max(200).allow('', null),
  genericDepartment: Joi.string().trim().max(200).allow('', null),
  payer: Joi.string().trim().max(200).allow('', null),
  payerName: Joi.string().trim().max(200).allow('', null),
  placeOfService: Joi.string().trim().max(10).allow('', null),
  isBillable: Joi.boolean(),
  isActive: Joi.boolean(),
  chargeCode: Joi.string().trim().max(40).allow('', null),
  defaultUnits: Joi.number().min(0).allow(null),
  ndcCode: Joi.string().trim().max(20).allow('', null),
  taxable: Joi.boolean(),
  codeType: Joi.string().valid('CPT', 'HCPCS', 'CUSTOM'),
  mod1: optionalModifier,
  mod2: optionalModifier,
  mod3: optionalModifier,
  mod4: optionalModifier,
  totalRevenue: Joi.number().min(0).allow(null),
  totalVolume: Joi.number().min(0).allow(null),
  percentageIncreased: Joi.number().allow(null),
};

const createChargeMasterSchema = Joi.object({
  ...chargeMasterFields,
  description: chargeMasterFields.description.required().messages({
    'string.empty': 'Description is required',
    'any.required': 'Description is required',
  }),
  cptCode: procedureCode.required().messages({
    'any.required': 'CPT or HCPCS code is required',
    'string.empty': 'CPT or HCPCS code is required',
  }),
  standardAmount: Joi.number().greater(0).required().messages({
    'number.greater': 'Standard amount must be greater than 0',
    'any.required': 'Standard amount is required',
  }),
});

const updateChargeMasterSchema = Joi.object(chargeMasterFields)
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

const queryChargeMasterSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(25),
  search: Joi.string().trim().max(200).allow(''),
  q: Joi.string().trim().max(200).allow(''),
  location: Joi.string().trim().max(120).allow(''),
  departmentId: Joi.string().uuid(),
  status: Joi.string().valid('active', 'inactive', 'all').default('all'),
  isActive: Joi.boolean(),
  isBillable: Joi.boolean(),
  includeNonBillable: Joi.string().valid('true', 'false'),
  category: Joi.string().trim().max(200).allow(''),
  payer: Joi.string().trim().max(200).allow(''),
  codeType: Joi.string().valid('CPT', 'HCPCS', 'CUSTOM', ''),
});

const chargeMasterIdSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const searchChargeMasterSchema = Joi.object({
  q: Joi.string().trim().max(200).allow(''),
  search: Joi.string().trim().max(200).allow(''),
  limit: Joi.number().integer().min(1).max(100).default(25),
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
  createChargeMasterSchema,
  updateChargeMasterSchema,
  queryChargeMasterSchema,
  chargeMasterIdSchema,
  searchChargeMasterSchema,
  validate,
};
