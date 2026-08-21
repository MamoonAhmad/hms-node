const Joi = require('joi');
const {
  CPT_CODE_TYPES,
  GENDER_RESTRICTIONS,
  GLOBAL_PERIODS,
  isValidCpt,
  isValidHcpcs,
  isValidRevenueCode,
  isValidModifier,
} = require('../lib/codeCatalog');

const optionalCptOrHcpcs = Joi.string()
  .trim()
  .allow('', null)
  .custom((value, helpers) => {
    if (!value) return null;
    const upper = value.toUpperCase();
    if (isValidCpt(upper) || isValidHcpcs(upper)) return upper;
    if (/^[A-Z0-9]{3,10}$/i.test(upper)) return upper;
    return helpers.error('any.invalid');
  })
  .messages({
    'any.invalid': 'Procedure code must be a 5-digit CPT or HCPCS Level II code (e.g. 99213 or J1885)',
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

const createProcedureCategorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(200),
  categoryName: Joi.string().trim().min(1).max(200),
})
  .or('name', 'categoryName')
  .messages({
    'object.missing': 'Category name is required',
    'string.empty': 'Category name is required',
  });

const updateProcedureCategorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(200),
  categoryName: Joi.string().trim().min(1).max(200),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

const queryProcedureCategorySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(10),
  search: Joi.string().trim().max(100).allow(''),
});

const procedureCategoryIdSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const procedureFields = {
  procedureDescription: Joi.string().trim().min(1).max(500),
  genericDescription: Joi.string().trim().max(500).allow('', null),
  procedureCategoryIds: Joi.array().items(Joi.string().uuid()).min(1),
  departmentId: Joi.string().uuid().allow('', null),
  cptCode: optionalCptOrHcpcs,
  revenueCode: optionalRevenue,
  mod1: optionalModifier,
  mod2: optionalModifier,
  mod3: optionalModifier,
  mod4: optionalModifier,
  unitPrice: Joi.number().min(0).allow(null),
  placeOfService: Joi.string().trim().max(10).allow('', null),
  isBillable: Joi.boolean(),
  isActive: Joi.boolean(),
  codeType: Joi.string().valid(...CPT_CODE_TYPES),
  globalPeriod: Joi.string()
    .valid(...GLOBAL_PERIODS)
    .allow('', null),
  workRvu: Joi.number().min(0).allow(null),
  facilityRvu: Joi.number().min(0).allow(null),
  nonFacilityRvu: Joi.number().min(0).allow(null),
  isAddOn: Joi.boolean(),
  bilateralIndicator: Joi.boolean(),
  genderRestriction: Joi.string()
    .valid(...GENDER_RESTRICTIONS)
    .allow('', null),
  ageMin: Joi.number().integer().min(0).max(150).allow(null),
  ageMax: Joi.number().integer().min(0).max(150).allow(null),
  effectiveDate: Joi.date().iso().allow('', null),
  expiryDate: Joi.date().iso().allow('', null),
  codingNotes: Joi.string().trim().max(2000).allow('', null),
  chargeCode: Joi.string().trim().max(40).allow('', null),
  cashPrice: Joi.number().min(0).allow(null),
  cost: Joi.number().min(0).allow(null),
  discountPercent: Joi.number().min(0).max(100).allow(null),
  priceEffectiveDate: Joi.date().iso().allow('', null),
  priceExpiryDate: Joi.date().iso().allow('', null),
  defaultUnits: Joi.number().min(0).allow(null),
  ndcCode: Joi.string().trim().max(20).allow('', null),
  taxable: Joi.boolean(),
  location: Joi.string().trim().max(120).allow('', null),
  payerName: Joi.string().trim().max(200).allow('', null),
};

const createProcedureSchema = Joi.object({
  ...procedureFields,
  procedureDescription: procedureFields.procedureDescription.required().messages({
    'string.empty': 'Procedure description is required',
    'any.required': 'Procedure description is required',
  }),
  procedureCategoryIds: procedureFields.procedureCategoryIds.required().messages({
    'array.min': 'At least one procedure category is required',
    'any.required': 'At least one procedure category is required',
  }),
});

const updateProcedureSchema = Joi.object(procedureFields)
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

const queryProcedureSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(10),
  search: Joi.string().trim().max(200).allow(''),
  categoryId: Joi.string().uuid(),
  departmentId: Joi.string().uuid(),
  status: Joi.string().valid('active', 'inactive', 'all').default('all'),
  isActive: Joi.boolean(),
  isBillable: Joi.boolean(),
  codeType: Joi.string().valid(...CPT_CODE_TYPES, ''),
  lookup: Joi.boolean(),
  validOn: Joi.date().iso().allow('', null),
});

const procedureIdSchema = Joi.object({
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
  createProcedureCategorySchema,
  updateProcedureCategorySchema,
  queryProcedureCategorySchema,
  procedureCategoryIdSchema,
  createProcedureSchema,
  updateProcedureSchema,
  queryProcedureSchema,
  procedureIdSchema,
  validate,
};
