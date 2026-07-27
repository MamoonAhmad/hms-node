const Joi = require('joi');

const HANDLING_METHODS = ['give_in_clinic', 'sample_given', 'send_to_pharmacy', 'print'];
const STATUS_VALUES = ['Draft', 'Signed', 'Verified', 'Sent', 'Completed', 'Cancelled'];

const safetyAlertSchema = Joi.object({
  type: Joi.string().required(),
  severity: Joi.string().valid('Info', 'Warning', 'Critical').required(),
  message: Joi.string().required(),
});

const medicationOrderBodySchema = Joi.object({
  appointmentId: Joi.string().uuid().allow(null, ''),
  medicationCatalogId: Joi.string().uuid().allow(null, ''),
  medicationName: Joi.string().trim().min(1).required(),
  medicationCode: Joi.string().trim().allow(null, ''),
  medicationClass: Joi.string().trim().allow(null, ''),
  strength: Joi.string().trim().allow(null, ''),
  dosageForm: Joi.string().trim().allow(null, ''),
  formularyTier: Joi.string().trim().allow(null, ''),
  ndcSafetyFlag: Joi.string().trim().allow(null, ''),
  handlingMethod: Joi.string().valid(...HANDLING_METHODS).required(),
  dose: Joi.string().trim().required(),
  unit: Joi.string().trim().required(),
  route: Joi.string().trim().required(),
  frequency: Joi.string().trim().required(),
  duration: Joi.string().trim().required(),
  prn: Joi.boolean().default(false),
  sigPreview: Joi.string().trim().allow(null, ''),
  additionalInstructions: Joi.string().trim().allow(null, ''),
  sampleNdc: Joi.when('handlingMethod', {
    is: 'sample_given',
    then: Joi.string().trim().required(),
    otherwise: Joi.string().trim().allow(null, ''),
  }),
  sampleLotNumber: Joi.when('handlingMethod', {
    is: 'sample_given',
    then: Joi.string().trim().required(),
    otherwise: Joi.string().trim().allow(null, ''),
  }),
  pharmacy: Joi.string().trim().allow(null, ''),
  quantity: Joi.number().integer().min(0).allow(null),
  refills: Joi.number().integer().min(0).allow(null),
  daysSupply: Joi.number().integer().min(0).allow(null),
  substitutionAllowed: Joi.boolean().default(true),
  prescriber: Joi.string().trim().allow(null, ''),
  eRxStatus: Joi.string().trim().allow(null, ''),
  safetyAlerts: Joi.array().items(safetyAlertSchema).allow(null),
  safetyAcknowledged: Joi.boolean().default(false),
  status: Joi.string().valid(...STATUS_VALUES).default('Draft'),
});

const queryMedicationOrderSchema = Joi.object({
  appointmentId: Joi.string().uuid(),
  status: Joi.string().valid(...STATUS_VALUES),
});

const bulkSaveSchema = Joi.object({
  appointmentId: Joi.string().uuid().allow(null, ''),
  orders: Joi.array().items(
    medicationOrderBodySchema.keys({
      id: Joi.string().uuid(),
      handlingMethod: Joi.string().valid(...HANDLING_METHODS).required(),
    }),
  ).min(1).required(),
});

const bulkSignSchema = Joi.object({
  orderIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid(...STATUS_VALUES).required(),
  eRxStatus: Joi.string().trim().allow(null, ''),
});

const patientMedicationOrderParamsSchema = Joi.object({
  id: Joi.string().uuid().required(),
  orderId: Joi.string().uuid().required(),
});

const patientIdParamsSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const catalogQuerySchema = Joi.object({
  search: Joi.string().trim().allow(''),
  limit: Joi.number().integer().min(1).max(100),
});

function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details.map((d) => d.message).join('; '),
      });
    }
    req[property] = value;
    next();
  };
}

module.exports = {
  validate,
  medicationOrderBodySchema,
  queryMedicationOrderSchema,
  bulkSaveSchema,
  bulkSignSchema,
  updateStatusSchema,
  patientMedicationOrderParamsSchema,
  patientIdParamsSchema,
  catalogQuerySchema,
};
