const Joi = require('joi');

const roomStatusSchema = Joi.string()
  .trim()
  .lowercase()
  .valid('active', 'maintenance', 'offline')
  .messages({
    'any.only': 'Status must be active, maintenance, or offline',
  });

const createRoomSchema = Joi.object({
  roomNumber: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Room number is required',
    'any.required': 'Room number is required',
  }),
  displayName: Joi.string().trim().max(200).allow('', null),
  floor: Joi.string().trim().max(100).allow('', null),
  unit: Joi.string().trim().max(200).allow('', null),
  roomTypeIds: Joi.array().items(Joi.string().uuid()).min(1).required().messages({
    'array.min': 'At least one room type is required',
    'any.required': 'At least one room type is required',
  }),
  status: roomStatusSchema.default('active'),
  licensedBeds: Joi.number().integer().min(0).default(1),
  notes: Joi.string().trim().max(2000).allow('', null),
});

const updateRoomSchema = Joi.object({
  roomNumber: Joi.string().trim().min(1).max(100).messages({
    'string.empty': 'Room number cannot be empty',
  }),
  displayName: Joi.string().trim().max(200).allow('', null),
  floor: Joi.string().trim().max(100).allow('', null),
  unit: Joi.string().trim().max(200).allow('', null),
  roomTypeIds: Joi.array().items(Joi.string().uuid()).min(1).messages({
    'array.min': 'At least one room type is required',
  }),
  status: roomStatusSchema,
  licensedBeds: Joi.number().integer().min(0),
  notes: Joi.string().trim().max(2000).allow('', null),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

const queryRoomSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(10),
  search: Joi.string().trim().max(100).allow(''),
  status: roomStatusSchema.allow(''),
});

const roomIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid room ID format',
    'any.required': 'Room ID is required',
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
  createRoomSchema,
  updateRoomSchema,
  queryRoomSchema,
  roomIdSchema,
  validate,
};
