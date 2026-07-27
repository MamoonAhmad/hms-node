const Joi = require('joi');

const PLACE_OF_SERVICE = ['11', '12', '21', '22', '23', '31', '32', '81', '99'];
const CLAIM_STATUSES = ['Draft', 'Ready', 'Submitted'];
const CODE_TYPES = ['CPT', 'HCPCS'];

const encounterIdQuerySchema = Joi.object({
  encounterId: Joi.string().uuid().required(),
});

const diagnosisSchema = Joi.object({
  sequence: Joi.number().integer().min(1).max(12).required(),
  icd10Code: Joi.string().trim().max(20).required(),
  description: Joi.string().trim().max(500).allow('', null),
  diagnosisCodeId: Joi.string().uuid().allow(null),
  isPrimary: Joi.boolean().default(false),
});

const serviceLineSchema = Joi.object({
  lineNumber: Joi.number().integer().min(1).max(50).required(),
  serviceDate: Joi.date().iso().required(),
  procedureCode: Joi.string().trim().max(20).required(),
  codeType: Joi.string().valid(...CODE_TYPES).default('CPT'),
  description: Joi.string().trim().max(500).allow('', null),
  modifier1: Joi.string().trim().max(2).allow('', null),
  modifier2: Joi.string().trim().max(2).allow('', null),
  modifier3: Joi.string().trim().max(2).allow('', null),
  modifier4: Joi.string().trim().max(2).allow('', null),
  units: Joi.number().positive().max(9999).default(1),
  chargeAmount: Joi.number().min(0).max(999999.99).required(),
  diagnosisPointers: Joi.string().trim().max(20).default('1'),
  placeOfService: Joi.string().valid(...PLACE_OF_SERVICE).allow('', null),
});

const upsertChargeCaptureSchema = Joi.object({
  encounterId: Joi.string().uuid().required(),
  placeOfService: Joi.string().valid(...PLACE_OF_SERVICE),
  dateOfService: Joi.date().iso(),
  renderingProviderId: Joi.string().uuid().allow(null),
  renderingProviderNpi: Joi.string().trim().max(20).allow('', null),
  renderingProviderName: Joi.string().trim().max(200).allow('', null),
  billingProviderName: Joi.string().trim().max(200).allow('', null),
  billingProviderNpi: Joi.string().trim().max(20).allow('', null),
  billingProviderTaxId: Joi.string().trim().max(20).allow('', null),
  authorizationNumber: Joi.string().trim().max(100).allow('', null),
  referralNumber: Joi.string().trim().max(100).allow('', null),
  notes: Joi.string().trim().max(5000).allow('', null),
  diagnoses: Joi.array().items(diagnosisSchema).max(12),
  serviceLines: Joi.array().items(serviceLineSchema).max(50),
});

const lockChargeCaptureSchema = Joi.object({
  encounterId: Joi.string().uuid().required(),
});

const generateClaimSchema = Joi.object({
  encounterId: Joi.string().uuid().required(),
});

const updateClaimStatusSchema = Joi.object({
  status: Joi.string().valid(...CLAIM_STATUSES).required(),
  notes: Joi.string().trim().max(5000).allow('', null),
});

const listClaimsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(25),
  status: Joi.string().valid(...CLAIM_STATUSES, 'all').allow('', null),
  search: Joi.string().trim().max(200).allow('', null),
  patientId: Joi.string().uuid().allow('', null),
  appointmentId: Joi.string().uuid().allow('', null),
  dateFrom: Joi.date().iso().allow('', null),
  dateTo: Joi.date().iso().allow('', null),
});

const WORKLIST_DOC_STATUSES = [
  'pending',
  'signed',
  'not_signed',
  'non_billable',
  'no_medical_record',
  'unbilled',
  'not_completed',
];

const listWorklistQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(25),
  search: Joi.string().trim().max(200).allow('', null),
  dateFrom: Joi.date().iso().allow('', null),
  dateTo: Joi.date().iso().allow('', null),
  docStatus: Joi.string().valid(...WORKLIST_DOC_STATUSES, 'all').allow('', null),
  patientType: Joi.string().trim().max(50).allow('', null),
  providerId: Joi.string().uuid().allow('', null),
  assignedToId: Joi.string().uuid().allow('', null),
  unassigned: Joi.boolean().truthy('true').falsy('false').allow('', null),
}).prefs({ convert: true });

const updateWorklistItemSchema = Joi.object({
  assignedUserId: Joi.string().uuid().allow('', null),
  assignedUserName: Joi.string().trim().max(200).allow('', null),
  docStatus: Joi.string().valid(...WORKLIST_DOC_STATUSES).allow('', null),
}).min(1);

const checkoutIdParamSchema = Joi.object({
  checkoutId: Joi.string().uuid().required(),
});

/** Accepts claim UUID or claim number (e.g. CLM-MRUQU3M1-E7A83C). */
const claimIdParamSchema = Joi.object({
  claimId: Joi.string()
    .trim()
    .min(1)
    .max(64)
    .required()
    .pattern(/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|CLM-[A-Za-z0-9]+-[A-Za-z0-9]+)$/i)
    .messages({
      'string.pattern.base': 'claimId must be a UUID or claim number (CLM-…)',
    }),
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
  PLACE_OF_SERVICE,
  CLAIM_STATUSES,
  WORKLIST_DOC_STATUSES,
  encounterIdQuerySchema,
  upsertChargeCaptureSchema,
  lockChargeCaptureSchema,
  generateClaimSchema,
  updateClaimStatusSchema,
  listClaimsQuerySchema,
  listWorklistQuerySchema,
  updateWorklistItemSchema,
  checkoutIdParamSchema,
  claimIdParamSchema,
  validate,
};
