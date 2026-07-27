const Joi = require('joi');

const ROUTE_OPTIONS = [
  'Intramuscular (IM)',
  'Subcutaneous (SC)',
  'Oral',
  'Intranasal',
  'Intradermal',
  'Other',
];

const createVaccineSchema = Joi.object({
  vaccineName: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Vaccine Name is required',
    'any.required': 'Vaccine Name is required',
  }),
  vaccineCode: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Vaccine Code is required',
    'any.required': 'Vaccine Code is required',
  }),
  manufacturer: Joi.string().trim().max(255).allow('', null),
  route: Joi.string().valid(...ROUTE_OPTIONS, '', null),
  status: Joi.string().valid('Active', 'Inactive'),
});

const updateVaccineSchema = Joi.object({
  vaccineName: Joi.string().trim().min(1).max(255),
  vaccineCode: Joi.string().trim().min(1).max(100),
  manufacturer: Joi.string().trim().max(255).allow('', null),
  route: Joi.string().valid(...ROUTE_OPTIONS, '', null),
  status: Joi.string().valid('Active', 'Inactive'),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

const queryVaccineSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(10),
  search: Joi.string().trim().max(200).allow(''),
  vaccineName: Joi.string().trim().max(200).allow(''),
  vaccineCode: Joi.string().trim().max(100).allow(''),
  manufacturer: Joi.string().trim().max(200).allow(''),
  route: Joi.string().valid(...ROUTE_OPTIONS, '').allow(''),
  status: Joi.string().valid('Active', 'Inactive', '').allow(''),
  createdDateFrom: Joi.date().iso().allow('', null),
  createdDateTo: Joi.date().iso().allow('', null),
});

const queryActiveVaccineSchema = Joi.object({
  search: Joi.string().trim().max(200).allow(''),
  limit: Joi.number().integer().min(1).max(100).default(25),
});

const vaccineIdSchema = Joi.object({
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
  createVaccineSchema,
  updateVaccineSchema,
  queryVaccineSchema,
  queryActiveVaccineSchema,
  vaccineIdSchema,
  validate,
  ROUTE_OPTIONS,
};
