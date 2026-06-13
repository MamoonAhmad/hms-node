const Joi = require('joi');

const bedStatusSchema = Joi.string()
  .trim()
  .lowercase()
  .valid('available', 'occupied', 'reserved', 'cleaning', 'blocked')
  .messages({
    'any.only': 'Status must be available, occupied, reserved, cleaning, or blocked',
  });

const createBedSchema = Joi.object({
  bedLabel: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Bed label is required',
    'any.required': 'Bed label is required',
  }),
  roomId: Joi.string().uuid().required().messages({
    'any.required': 'Room is required',
    'string.guid': 'Invalid room ID format',
  }),
  status: bedStatusSchema.default('available'),
  patientId: Joi.string().uuid().allow(null).optional(),
  service: Joi.string().trim().max(200).allow('', null),
  notes: Joi.string().trim().max(2000).allow('', null),
});

const updateBedSchema = Joi.object({
  bedLabel: Joi.string().trim().min(1).max(100).messages({
    'string.empty': 'Bed label cannot be empty',
  }),
  roomId: Joi.string().uuid().messages({
    'string.guid': 'Invalid room ID format',
  }),
  status: bedStatusSchema,
  patientId: Joi.string().uuid().allow(null),
  service: Joi.string().trim().max(200).allow('', null),
  notes: Joi.string().trim().max(2000).allow('', null),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

const queryBedSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(10),
  search: Joi.string().trim().max(100).allow(''),
  status: bedStatusSchema.allow(''),
  listTab: Joi.string()
    .trim()
    .valid('all', 'available', 'occupied', 'reserved', 'unavailable')
    .allow(''),
});

const bedIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid bed ID format',
    'any.required': 'Bed ID is required',
  }),
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
  createBedSchema,
  updateBedSchema,
  queryBedSchema,
  bedIdSchema,
  validate,
};
