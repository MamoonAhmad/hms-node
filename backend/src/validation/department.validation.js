const Joi = require('joi');

const operatingDaysSchema = Joi.object({
  monday: Joi.boolean(),
  tuesday: Joi.boolean(),
  wednesday: Joi.boolean(),
  thursday: Joi.boolean(),
  friday: Joi.boolean(),
  saturday: Joi.boolean(),
  sunday: Joi.boolean(),
}).optional();

const createDepartmentSchema = Joi.object({
  departmentName: Joi.string().trim().min(1).max(200).required(),
  departmentCode: Joi.string().trim().min(1).max(50).required(),
  departmentType: Joi.string().trim().max(100).allow('', null),
  status: Joi.string().valid('active', 'inactive').default('active'),
  description: Joi.string().trim().max(5000).allow('', null),
  facilityName: Joi.string().trim().max(200).allow('', null),
  building: Joi.string().trim().max(100).allow('', null),
  floor: Joi.string().trim().max(50).allow('', null),
  roomNumber: Joi.string().trim().max(50).allow('', null),
  address: Joi.string().trim().max(500).allow('', null),
  city: Joi.string().trim().max(100).allow('', null),
  state: Joi.string().trim().max(100).allow('', null),
  zip: Joi.string().trim().max(20).allow('', null),
  supportsAppointments: Joi.boolean().default(false),
  supportsWalkIns: Joi.boolean().default(false),
  defaultAppointmentDuration: Joi.number().integer().min(1).max(24 * 60).allow(null),
  operatingDays: operatingDaysSchema,
  startTime: Joi.string().trim().max(20).allow('', null),
  endTime: Joi.string().trim().max(20).allow('', null),
  departmentHead: Joi.string().trim().max(200).allow('', null),
  assignedProviders: Joi.array().items(Joi.alternatives(Joi.string(), Joi.number())).default([]),
  assignedNurses: Joi.array().items(Joi.alternatives(Joi.string(), Joi.number())).default([]),
  defaultBillingProvider: Joi.string().trim().max(200).allow('', null),
  costCenter: Joi.string().trim().max(50).allow('', null),
  revenueCode: Joi.string().trim().max(50).allow('', null),
  acceptsInsurance: Joi.boolean().default(false),
  locationId: Joi.string().uuid().allow(null),
}).unknown(false);

const updateDepartmentSchema = Joi.object({
  departmentName: Joi.string().trim().min(1).max(200),
  departmentCode: Joi.string().trim().min(1).max(50),
  departmentType: Joi.string().trim().max(100).allow('', null),
  status: Joi.string().valid('active', 'inactive'),
  description: Joi.string().trim().max(5000).allow('', null),
  facilityName: Joi.string().trim().max(200).allow('', null),
  building: Joi.string().trim().max(100).allow('', null),
  floor: Joi.string().trim().max(50).allow('', null),
  roomNumber: Joi.string().trim().max(50).allow('', null),
  address: Joi.string().trim().max(500).allow('', null),
  city: Joi.string().trim().max(100).allow('', null),
  state: Joi.string().trim().max(100).allow('', null),
  zip: Joi.string().trim().max(20).allow('', null),
  supportsAppointments: Joi.boolean(),
  supportsWalkIns: Joi.boolean(),
  defaultAppointmentDuration: Joi.number().integer().min(1).max(24 * 60).allow(null),
  operatingDays: operatingDaysSchema,
  startTime: Joi.string().trim().max(20).allow('', null),
  endTime: Joi.string().trim().max(20).allow('', null),
  departmentHead: Joi.string().trim().max(200).allow('', null),
  assignedProviders: Joi.array().items(Joi.alternatives(Joi.string(), Joi.number())),
  assignedNurses: Joi.array().items(Joi.alternatives(Joi.string(), Joi.number())),
  defaultBillingProvider: Joi.string().trim().max(200).allow('', null),
  costCenter: Joi.string().trim().max(50).allow('', null),
  revenueCode: Joi.string().trim().max(50).allow('', null),
  acceptsInsurance: Joi.boolean(),
  locationId: Joi.string().uuid().allow(null),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

const queryDepartmentSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().max(100).allow(''),
  status: Joi.string().valid('active', 'inactive').allow('', null),
});

const departmentIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid department ID format',
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
  createDepartmentSchema,
  updateDepartmentSchema,
  queryDepartmentSchema,
  departmentIdSchema,
  validate,
};
