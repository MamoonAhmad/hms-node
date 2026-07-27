const Joi = require('joi');

const EMAR_TABS = [
  'active',
  'scheduled',
  'administered',
  'prn',
  'missed',
  'refused',
  'discontinued',
  'samples',
  'history',
];

const ADMINISTRATION_STATUS_VALUES = [
  'Administered',
  'Held',
  'Refused',
  'Missed',
  'Not Available',
  'Delayed',
];

const HOLD_REASONS = [
  'Clinical Decision',
  'Low Blood Pressure',
  'Abnormal Lab Result',
  'Provider Request',
  'Patient Condition',
  'Other',
];

const REFUSAL_REASONS = [
  'Patient Refused',
  'Religious Reasons',
  'Financial Reasons',
  'Side Effects',
  'Other',
];

const MISSED_REASONS = [
  'Patient Not Available',
  'Medication Not Available',
  'Clinical Emergency',
  'Scheduling Conflict',
  'Other',
];

const safetyAlertSchema = Joi.object({
  type: Joi.string().required(),
  severity: Joi.string().valid('Info', 'Warning', 'Critical').required(),
  message: Joi.string().required(),
});

const fiveRightsSchema = Joi.object({
  rightPatient: Joi.boolean().required(),
  rightMedication: Joi.boolean().required(),
  rightDose: Joi.boolean().required(),
  rightRoute: Joi.boolean().required(),
  rightTime: Joi.boolean().required(),
});

const queryEmarSchema = Joi.object({
  appointmentId: Joi.string().uuid(),
  tab: Joi.string().valid(...EMAR_TABS).default('active'),
  search: Joi.string().trim().allow(''),
  marStatus: Joi.string().trim(),
  route: Joi.string().trim(),
  handlingMethod: Joi.string().valid('give_in_clinic', 'sample_given'),
  provider: Joi.string().trim(),
  administrationUser: Joi.string().trim(),
  dateFrom: Joi.string().isoDate(),
  dateTo: Joi.string().isoDate(),
});

const patientEmarParamsSchema = Joi.object({
  id: Joi.string().uuid().required(),
  marEntryId: Joi.string().uuid().required(),
});

const recordAdministrationSchema = Joi.object({
  administrationStatus: Joi.string().valid(...ADMINISTRATION_STATUS_VALUES).required(),
  administrationDate: Joi.string().isoDate().allow(null, ''),
  administrationTime: Joi.string().trim().allow(null, ''),
  doseGiven: Joi.string().trim().allow(null, ''),
  route: Joi.string().trim().allow(null, ''),
  site: Joi.string().trim().allow(null, ''),
  witnessRequired: Joi.boolean().default(false),
  witnessName: Joi.string().trim().allow(null, ''),
  witnessUserId: Joi.string().uuid().allow(null, ''),
  comments: Joi.string().trim().allow(null, ''),
  holdReason: Joi.string().valid(...HOLD_REASONS).allow(null, ''),
  refusalReason: Joi.string().valid(...REFUSAL_REASONS).allow(null, ''),
  missedReason: Joi.string().valid(...MISSED_REASONS).allow(null, ''),
  prnReason: Joi.string().trim().allow(null, ''),
  symptomSeverity: Joi.string().trim().allow(null, ''),
  preAssessment: Joi.string().trim().allow(null, ''),
  postAssessment: Joi.string().trim().allow(null, ''),
  effectivenessEvaluation: Joi.string().trim().allow(null, ''),
  fiveRightsVerified: fiveRightsSchema.allow(null),
  safetyAlerts: Joi.array().items(safetyAlertSchema).allow(null),
  safetyAcknowledged: Joi.boolean().default(false),
  signatureUsername: Joi.string().trim().allow(null, ''),
  signatureMeaning: Joi.string().trim().allow(null, ''),
  signatureTimestamp: Joi.string().isoDate().allow(null, ''),
});

const discontinueSchema = Joi.object({
  reason: Joi.string().trim().min(1).required(),
});

const patientPanelQuerySchema = Joi.object({
  appointmentId: Joi.string().uuid(),
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
  queryEmarSchema,
  patientEmarParamsSchema,
  recordAdministrationSchema,
  discontinueSchema,
  patientPanelQuerySchema,
  EMAR_TABS,
  HOLD_REASONS,
  REFUSAL_REASONS,
  MISSED_REASONS,
};
