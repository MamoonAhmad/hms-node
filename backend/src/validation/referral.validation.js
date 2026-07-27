const Joi = require('joi');
const referralService = require('../services/referral.service');

const diagnosisSchema = Joi.object({
  icd10Code: Joi.string().trim().max(20).allow('', null),
  description: Joi.string().trim().max(500).allow('', null),
  isPrimary: Joi.boolean().default(false),
  isSecondary: Joi.boolean().default(false),
});

const attachmentSchema = Joi.object({
  attachmentType: Joi.string().trim().max(100).allow('', null),
  fileName: Joi.string().trim().max(255).allow('', null),
  fileUrl: Joi.string().trim().max(2000).allow('', null),
  /** Base64 data URL for uploaded files (stored in JSON attachments). */
  fileData: Joi.string().allow('', null),
  mimeType: Joi.string().trim().max(100).allow('', null),
  fileSize: Joi.number().integer().min(0).allow(null),
  uploadedAt: Joi.string().allow('', null),
});

const createReferralSchema = Joi.object({
  appointmentId: Joi.string().uuid().required().messages({
    'any.required': 'Related encounter (appointmentId) is required',
    'string.guid': 'Related encounter must be a valid appointment id',
  }),
  referralType: Joi.string().trim().min(1).max(120).required(),
  specialty: Joi.string().trim().min(1).max(120).required(),
  priority: Joi.string().valid(...referralService.PRIORITY_OPTIONS).default('Routine'),
  referralDate: Joi.date().iso().required(),
  expirationDate: Joi.date().iso().allow(null, ''),
  referralReason: Joi.string().trim().min(1).max(5000).required(),
  destinationType: Joi.string().valid('internal', 'external', 'facility').default('external'),
  status: Joi.string().valid(...referralService.STATUS_OPTIONS).default('Draft'),
  autoPopulateFromEncounter: Joi.boolean().default(true),
  referringProvider: Joi.object({
    providerId: Joi.string().uuid().allow(null, ''),
    providerName: Joi.string().trim().max(200).allow('', null),
    npi: Joi.string().trim().max(20).allow('', null),
    department: Joi.string().trim().max(200).allow('', null),
    clinicLocation: Joi.string().trim().max(200).allow('', null),
    contactInformation: Joi.string().trim().max(200).allow('', null),
  }).allow(null),
  referredTo: Joi.object({
    providerId: Joi.string().uuid().allow(null, ''),
    providerName: Joi.string().trim().max(200).allow('', null),
    specialty: Joi.string().trim().max(120).allow('', null),
    organization: Joi.string().trim().max(200).allow('', null),
    npi: Joi.string().trim().max(20).allow('', null),
    phone: Joi.string().trim().max(30).allow('', null),
    fax: Joi.string().trim().max(30).allow('', null),
    email: Joi.string().trim().email({ tlds: false }).allow('', null),
    address: Joi.string().trim().max(500).allow('', null),
    facilityName: Joi.string().trim().max(200).allow('', null),
    facilityType: Joi.string().trim().max(120).allow('', null),
    contactPerson: Joi.string().trim().max(200).allow('', null),
  }).allow(null),
  diagnoses: Joi.array().items(diagnosisSchema).default([]),
  clinicalInformation: Joi.object({
    chiefComplaint: Joi.string().trim().max(2000).allow('', null),
    historyOfPresentIllness: Joi.string().trim().max(5000).allow('', null),
    assessment: Joi.string().trim().max(5000).allow('', null),
    treatmentHistory: Joi.string().trim().max(5000).allow('', null),
    currentMedications: Joi.string().trim().max(5000).allow('', null),
    allergies: Joi.string().trim().max(2000).allow('', null),
    activeProblems: Joi.string().trim().max(5000).allow('', null),
    notes: Joi.string().trim().max(5000).allow('', null),
  }).allow(null),
  attachments: Joi.array().items(attachmentSchema).default([]),
  insurance: Joi.object({
    primaryInsurance: Joi.string().trim().max(200).allow('', null),
    secondaryInsurance: Joi.string().trim().max(200).allow('', null),
    payer: Joi.string().trim().max(200).allow('', null),
    memberId: Joi.string().trim().max(100).allow('', null),
    groupNumber: Joi.string().trim().max(100).allow('', null),
    authorizationRequired: Joi.boolean().default(false),
    authorizationNumber: Joi.string().trim().max(100).allow('', null),
    authorizationStatus: Joi.string().valid(...referralService.AUTH_STATUS_OPTIONS).allow('', null),
    submissionDate: Joi.date().iso().allow(null, ''),
    approvalDate: Joi.date().iso().allow(null, ''),
    authorizationExpirationDate: Joi.date().iso().allow(null, ''),
  }).allow(null),
  referralLetter: Joi.object({
    body: Joi.string().trim().max(20000).allow('', null),
    isEdited: Joi.boolean(),
  }).allow(null),
  tracking: Joi.object().unknown(true).allow(null),
  referralAppointment: Joi.object().unknown(true).allow(null),
  consultationReport: Joi.object().unknown(true).allow(null),
  completion: Joi.object().unknown(true).allow(null),
});

const updateReferralSchema = createReferralSchema
  .fork(
    ['referralType', 'specialty', 'referralDate', 'referralReason', 'appointmentId'],
    (schema) => schema.optional(),
  )
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

const queryReferralSchema = Joi.object({
  status: Joi.string().valid(...referralService.STATUS_OPTIONS, '').allow(''),
  priority: Joi.string().valid(...referralService.PRIORITY_OPTIONS, '').allow(''),
  appointmentId: Joi.string().uuid().allow('', null),
});

const updateReferralStatusSchema = Joi.object({
  status: Joi.string().valid(...referralService.STATUS_OPTIONS).required(),
  notes: Joi.string().trim().max(2000).allow('', null),
  authorizationStatus: Joi.string().valid(...referralService.AUTH_STATUS_OPTIONS).allow('', null),
  tracking: Joi.object().unknown(true).allow(null),
  referralAppointment: Joi.object().unknown(true).allow(null),
  consultationReport: Joi.object().unknown(true).allow(null),
  completion: Joi.object().unknown(true).allow(null),
});

const sendReferralSchema = Joi.object({
  deliveryMethod: Joi.string()
    .valid(...referralService.DELIVERY_METHODS)
    .default('Internal Routing'),
  tracking: Joi.object().unknown(true).allow(null),
});

const addReferralNoteSchema = Joi.object({
  noteType: Joi.string().trim().max(80).default('General'),
  content: Joi.string().trim().min(1).max(5000).required(),
});

const closeReferralSchema = Joi.object({
  outcome: Joi.string().trim().max(2000).allow('', null),
  recommendations: Joi.string().trim().max(5000).allow('', null),
  followUpPlan: Joi.string().trim().max(5000).allow('', null),
  notes: Joi.string().trim().max(2000).allow('', null),
  completion: Joi.object().unknown(true).allow(null),
});

const patientReferralParamsSchema = Joi.object({
  id: Joi.string().uuid().required(),
  referralId: Joi.string().uuid().required(),
});

const encounterDefaultsQuerySchema = Joi.object({
  appointmentId: Joi.string().uuid().required(),
});

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      const errors = error.details.map((d) => d.message);
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    req[property] = value;
    next();
  };
};

module.exports = {
  validate,
  createReferralSchema,
  updateReferralSchema,
  queryReferralSchema,
  updateReferralStatusSchema,
  sendReferralSchema,
  addReferralNoteSchema,
  closeReferralSchema,
  patientReferralParamsSchema,
  encounterDefaultsQuerySchema,
};
