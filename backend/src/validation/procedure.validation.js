const Joi = require('joi');

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

const createProcedureSchema = Joi.object({
  procedureDescription: Joi.string().trim().min(1).max(500).required().messages({
    'string.empty': 'Procedure description is required',
    'any.required': 'Procedure description is required',
  }),
  genericDescription: Joi.string().trim().max(500).allow('', null),
  procedureCategoryIds: Joi.array().items(Joi.string().uuid()).min(1).required().messages({
    'array.min': 'At least one procedure category is required',
    'any.required': 'At least one procedure category is required',
  }),
  departmentId: Joi.string().uuid().allow('', null),
  cptCode: Joi.string().trim().max(50).allow('', null),
  revenueCode: Joi.string().trim().max(50).allow('', null),
  mod1: Joi.string().trim().max(20).allow('', null),
  mod2: Joi.string().trim().max(20).allow('', null),
  mod3: Joi.string().trim().max(20).allow('', null),
  mod4: Joi.string().trim().max(20).allow('', null),
});

const updateProcedureSchema = Joi.object({
  procedureDescription: Joi.string().trim().min(1).max(500),
  genericDescription: Joi.string().trim().max(500).allow('', null),
  procedureCategoryIds: Joi.array().items(Joi.string().uuid()).min(1),
  departmentId: Joi.string().uuid().allow('', null),
  cptCode: Joi.string().trim().max(50).allow('', null),
  revenueCode: Joi.string().trim().max(50).allow('', null),
  mod1: Joi.string().trim().max(20).allow('', null),
  mod2: Joi.string().trim().max(20).allow('', null),
  mod3: Joi.string().trim().max(20).allow('', null),
  mod4: Joi.string().trim().max(20).allow('', null),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

const queryProcedureSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(10),
  search: Joi.string().trim().max(200).allow(''),
  categoryId: Joi.string().uuid(),
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
