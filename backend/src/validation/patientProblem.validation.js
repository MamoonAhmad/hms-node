const Joi = require('joi');

const STATUS_OPTIONS = ['Active', 'Inactive', 'Resolved'];
const CLINICAL_STATUS_OPTIONS = ['None', 'Active', 'Recurrence', 'Relapse', 'Remission', 'Resolved'];
const VERIFICATION_OPTIONS = [
  'None',
  'Unconfirmed',
  'Provisional',
  'Differential',
  'Confirmed',
  'Refuted',
  'Entered in Error',
];
const PROBLEM_TYPE_OPTIONS = ['Acute', 'Chronic', 'Both'];
const ACUITY_OPTIONS = ['Mild', 'Moderate', 'Severe'];

const createPatientProblemSchema = Joi.object({
  diagnosisId: Joi.string().uuid().required().messages({
    'any.required': 'Diagnosis selection is required',
    'string.empty': 'Diagnosis selection is required',
  }),
  icd10Code: Joi.string().trim().max(20).allow('', null),
  diagnosisDescription: Joi.string().trim().max(500).allow('', null),
  status: Joi.string().valid(...STATUS_OPTIONS).default('Active'),
  clinicalStatus: Joi.string().valid(...CLINICAL_STATUS_OPTIONS).allow('', null),
  verificationStatus: Joi.string().valid(...VERIFICATION_OPTIONS).allow('', null),
  problemType: Joi.string().valid(...PROBLEM_TYPE_OPTIONS).allow('', null),
  acuity: Joi.string().valid(...ACUITY_OPTIONS).allow('', null),
  onsetDate: Joi.date().iso().allow('', null),
  resolvedDate: Joi.date().iso().allow('', null),
  notes: Joi.string().trim().max(2000).allow('', null),
});

const updatePatientProblemSchema = Joi.object({
  diagnosisId: Joi.string().uuid().allow(null),
  icd10Code: Joi.string().trim().max(20).allow('', null),
  diagnosisDescription: Joi.string().trim().min(1).max(500),
  status: Joi.string().valid(...STATUS_OPTIONS),
  clinicalStatus: Joi.string().valid(...CLINICAL_STATUS_OPTIONS).allow('', null),
  verificationStatus: Joi.string().valid(...VERIFICATION_OPTIONS).allow('', null),
  problemType: Joi.string().valid(...PROBLEM_TYPE_OPTIONS).allow('', null),
  acuity: Joi.string().valid(...ACUITY_OPTIONS).allow('', null),
  onsetDate: Joi.date().iso().allow('', null),
  resolvedDate: Joi.date().iso().allow('', null),
  notes: Joi.string().trim().max(2000).allow('', null),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

const queryPatientProblemSchema = Joi.object({
  status: Joi.string().valid(...STATUS_OPTIONS, '').allow(''),
});

const updatePatientProblemStatusSchema = Joi.object({
  status: Joi.string()
    .valid('Active', 'Inactive', 'Resolved')
    .required()
    .messages({ 'any.required': 'Status is required' }),
  resolvedDate: Joi.when('status', {
    is: 'Resolved',
    then: Joi.date().iso().required().messages({
      'any.required': 'Resolved Date is required when status is Resolved',
    }),
    otherwise: Joi.date().iso().allow('', null),
  }),
});

const patientProblemParamsSchema = Joi.object({
  id: Joi.string().uuid().required(),
  problemId: Joi.string().uuid().required(),
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
  createPatientProblemSchema,
  updatePatientProblemSchema,
  queryPatientProblemSchema,
  updatePatientProblemStatusSchema,
  patientProblemParamsSchema,
  validate,
  STATUS_OPTIONS,
  CLINICAL_STATUS_OPTIONS,
  VERIFICATION_OPTIONS,
  PROBLEM_TYPE_OPTIONS,
  ACUITY_OPTIONS,
};
