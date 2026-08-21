const Joi = require('joi');
const {
  CLAIM_STATUSES,
  CHARGE_ROUTING_VALUES,
  INSURANCE_TIERS,
  ICD_POINTERS,
} = require('../lib/claimConstants');

const optionalId = Joi.string().trim().uuid().allow(null, '');
const optionalString = (max = 200) => Joi.string().trim().max(max).allow('', null);
const optionalDate = Joi.date().iso().allow('', null);

const insuranceSchema = Joi.object({
  tier: Joi.string().valid(...INSURANCE_TIERS).required(),
  payerId: optionalId,
  memberId: optionalString(80),
  groupNumber: optionalString(80),
  policyType: optionalString(80),
  subscriberFirstName: optionalString(100),
  subscriberLastName: optionalString(100),
  subscriberName: optionalString(200),
  subscriberDob: optionalDate,
  subscriberRelationship: optionalString(80),
  copayDue: Joi.number().min(0).allow(null),
  authorizationNumber: optionalString(80),
  referralType: optionalString(80),
  claimControlRef: optionalString(80),
});

const diagnosisSchema = Joi.object({
  pointer: Joi.string().valid(...ICD_POINTERS).required(),
  diagnosisCodeId: optionalId,
  code: optionalString(20),
  description: optionalString(500),
});

const chargeSchema = Joi.object({
  id: optionalId,
  serviceFromDate: optionalDate,
  serviceToDate: optionalDate,
  serviceDate: optionalDate,
  placeOfService: optionalString(10),
  typeOfService: optionalString(10),
  procedureCode: optionalString(20),
  cptCode: optionalString(20),
  hcpcsCode: optionalString(20),
  modifier1: optionalString(4),
  modifier2: optionalString(4),
  modifier3: optionalString(4),
  modifier4: optionalString(4),
  modifiers: optionalString(20),
  diagnosisPointer: optionalString(20),
  diagnosisPointers: optionalString(20),
  units: Joi.number().min(0).allow(null),
  unitCharge: Joi.number().min(0).allow(null),
  chargeAmount: Joi.number().min(0).allow(null),
  lineTotal: Joi.number().min(0).allow(null),
  chargeStatus: Joi.string().valid(...CHARGE_ROUTING_VALUES).allow('', null),
  inventoryCode: optionalString(40),
  chiropractic: Joi.boolean(),
  description: optionalString(500),
  delete: Joi.boolean(),
});

const additionalInfoSchema = Joi.object({
  employmentRelated: Joi.boolean(),
  autoAccident: Joi.boolean(),
  accidentState: optionalString(2),
  otherAccident: Joi.boolean(),
  onsetDate: optionalDate,
  lastMenstrualPeriod: optionalDate,
  initialTreatmentDate: optionalDate,
  similarIllnessDate: optionalDate,
  dateLastSeen: optionalDate,
  unableToWorkFrom: optionalDate,
  unableToWorkTo: optionalDate,
  hospitalizationFrom: optionalDate,
  hospitalizationTo: optionalDate,
  patientHomebound: optionalString(10),
  outsideLab: Joi.boolean(),
  labCharge: Joi.number().min(0).allow(null),
  priorAuthorizationNumber: optionalString(80),
  originalReferenceNumber: optionalString(80),
  resubmissionCode: optionalString(20),
  claimCodes: optionalString(80),
  otherClaimId: optionalString(80),
  additionalClaimInfo: optionalString(500),
  notes: optionalString(5000),
  delayReasonCode: optionalString(200),
  specialProgramCode: optionalString(200),
  patientSignatureOnFile: optionalString(80),
  insuredSignatureOnFile: optionalString(80),
  providerAcceptAssignment: optionalString(40),
  documentationMethod: optionalString(80),
  documentationType: optionalString(200),
  documentationTypeOther: optionalString(200),
  patientHeight: optionalString(20),
  patientWeight: optionalString(20),
  serviceAuthException: optionalString(200),
  demonstrationProject: optionalString(80),
  mammographyCert: optionalString(80),
  investigationalDevice: optionalString(80),
  ambulatoryPatientGroup: optionalString(80),
  showBoxNumbers: optionalString(40),
}).unknown(true);

const ambulanceInfoSchema = Joi.object({
  isAmbulanceClaim: Joi.boolean(),
  ambulanceTransportReason: optionalString(200),
  pickupLocation: optionalString(200),
  dropoffLocation: optionalString(200),
  pickupDate: optionalDate,
  pickupTime: optionalString(20),
  mileage: Joi.number().min(0).allow(null),
  ambulanceProvider: optionalString(200),
  origin: optionalString(200),
  destination: optionalString(200),
  transportType: optionalString(80),
  medicalNecessity: optionalString(500),
  notes: optionalString(5000),
  transportMiles: Joi.number().min(0).allow(null),
  patientWeight: Joi.number().min(0).allow(null),
  roundTripReason: optionalString(500),
  stretcherReason: optionalString(500),
  pickupAddress: Joi.object().unknown(true).allow(null),
  dropoffAddress: Joi.object().unknown(true).allow(null),
  certifications: Joi.alternatives().try(Joi.object(), Joi.array()).allow(null),
}).unknown(true);

const claimBodySchema = Joi.object({
  patientId: Joi.string().trim().uuid().required().messages({
    'any.required': 'Patient is required',
    'string.empty': 'Patient is required',
    'string.guid': 'Patient is required',
  }),
  renderingProviderId: Joi.string().trim().uuid().required().messages({
    'any.required': 'Rendering provider is required',
    'string.empty': 'Rendering provider is required',
    'string.guid': 'Rendering provider is required',
  }),
  billingProviderId: Joi.string().trim().uuid().required().messages({
    'any.required': 'Billing provider is required',
    'string.empty': 'Billing provider is required',
    'string.guid': 'Billing provider is required',
  }),
  supervisingProviderId: optionalId,
  orderingProviderId: optionalId,
  referringProviderId: optionalId,
  facilityId: optionalId,
  primaryPayerId: optionalId,
  secondaryPayerId: optionalId,
  tertiaryPayerId: optionalId,
  officeLocation: optionalString(80),
  claimRef: optionalString(80),
  frequencyCode: optionalString(8),
  claimStatus: Joi.string().valid(...CLAIM_STATUSES).allow('', null),
  notes: optionalString(5000),
  appointmentId: optionalId,
  insurances: Joi.array().items(insuranceSchema).default([]),
  diagnoses: Joi.array().items(diagnosisSchema).default([]),
  charges: Joi.array().items(chargeSchema).default([]),
  additionalInfo: additionalInfoSchema.allow(null),
  ambulanceInfo: ambulanceInfoSchema.allow(null),
}).unknown(true);

const splitBodySchema = Joi.object({
  chargeIds: Joi.array().items(Joi.string().trim().uuid()).min(1).required(),
});

const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(200),
  search: optionalString(200),
  claimNumber: optionalString(80),
  patientId: optionalId,
  payerId: optionalId,
  providerId: optionalId,
  status: Joi.string().valid(...CLAIM_STATUSES, 'all').allow('', null),
  submissionStatus: optionalString(40),
  claimType: optionalString(40),
  formType: optionalString(20),
  payer: optionalString(200),
  dosFrom: optionalDate,
  dosTo: optionalDate,
  sort: optionalString(40),
  sortDir: Joi.string().valid('asc', 'desc').allow('', null),
}).unknown(true);

function mapJoiErrors(error) {
  const errors = {};
  for (const detail of error.details || []) {
    const key = detail.path.join('.');
    if (!errors[key]) errors[key] = detail.message.replace(/['"]/g, '');
  }
  return errors;
}

const validate = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Claim validation failed',
      errors: mapJoiErrors(error),
    });
  }
  req[property] = value;
  next();
};

module.exports = {
  claimBodySchema,
  splitBodySchema,
  listQuerySchema,
  validateClaimBody: validate(claimBodySchema, 'body'),
  validateSplitBody: validate(splitBodySchema, 'body'),
  validateListQuery: validate(listQuerySchema, 'query'),
};
