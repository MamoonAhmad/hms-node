const Joi = require('joi');

const PROBLEM_STATUSES = ['Active', 'Inactive', 'Resolved'];
const CLINICAL_STATUSES = ['None', 'Active', 'Recurrence', 'Relapse', 'Remission', 'Resolved'];
const VERIFICATION_STATUSES = [
  'None',
  'Unconfirmed',
  'Provisional',
  'Differential',
  'Confirmed',
  'Refuted',
  'Entered in Error',
];

const dateField = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .allow('', null)
  .messages({ 'string.pattern.base': 'Date must be YYYY-MM-DD' });

const createPatientProblemSchema = Joi.object({
  diagnosisId: Joi.string().uuid().required(),
  icd10Code: Joi.string().trim().max(20).allow('', null),
  diagnosisDescription: Joi.string().trim().min(1).max(500).required(),
  status: Joi.string()
    .valid(...PROBLEM_STATUSES)
    .default('Active'),
  clinicalStatus: Joi.string()
    .valid(...CLINICAL_STATUSES)
    .default('None'),
  verificationStatus: Joi.string()
    .valid(...VERIFICATION_STATUSES)
    .default('None'),
  onsetDate: dateField,
  resolvedDate: dateField,
  notes: Joi.string().trim().max(2000).allow('', null),
});

const updatePatientProblemSchema = Joi.object({
  diagnosisId: Joi.string().uuid(),
  icd10Code: Joi.string().trim().max(20).allow('', null),
  diagnosisDescription: Joi.string().trim().min(1).max(500),
  status: Joi.string().valid(...PROBLEM_STATUSES),
  clinicalStatus: Joi.string().valid(...CLINICAL_STATUSES),
  verificationStatus: Joi.string().valid(...VERIFICATION_STATUSES),
  onsetDate: dateField,
  resolvedDate: dateField,
  notes: Joi.string().trim().max(2000).allow('', null),
});

const queryPatientProblemsSchema = Joi.object({
  status: Joi.string().valid('All', ...PROBLEM_STATUSES).default('All'),
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
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    req[property] = value;
    next();
  };
};

module.exports = {
  createPatientProblemSchema,
  updatePatientProblemSchema,
  queryPatientProblemsSchema,
  patientProblemParamsSchema,
  PROBLEM_STATUSES,
  CLINICAL_STATUSES,
  VERIFICATION_STATUSES,
  validate,
};
