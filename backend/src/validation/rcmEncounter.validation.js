const Joi = require('joi');

const BILLING_STATUSES = [
  'Unbilled',
  'Coding',
  'Ready to submit',
  'Submitted',
  'Denied',
  'Paid',
  'Follow-up',
];

const validate = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  if (property === 'query') {
    req.validatedQuery = value;
  } else if (property === 'params') {
    req.validatedParams = value;
  } else {
    req.validatedBody = value;
    req.body = value;
  }
  next();
};

const encounterIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid encounter ID format',
    'any.required': 'Encounter ID is required',
  }),
});

const updateBillingStatusSchema = Joi.object({
  billingStatus: Joi.string()
    .valid(...BILLING_STATUSES)
    .required(),
});

const diagnosisItemSchema = Joi.object({
  id: Joi.string().allow('', null),
  code: Joi.string().trim().min(1).required(),
  description: Joi.string().trim().min(1).required(),
  pointer: Joi.string().trim().allow('', null),
  isPrimary: Joi.boolean(),
  catalogId: Joi.string().uuid().allow('', null),
});

const updateDiagnosesSchema = Joi.object({
  diagnoses: Joi.array().items(diagnosisItemSchema).required(),
});

const chargeItemSchema = Joi.object({
  id: Joi.string().allow('', null),
  cptCode: Joi.string().trim().allow('', null),
  hcpcsCode: Joi.string().trim().allow('', null),
  description: Joi.string().trim().min(1).required(),
  modifiers: Joi.string().trim().allow('', null),
  units: Joi.number().min(1).default(1),
  unitCharge: Joi.number().min(0).required(),
  diagnosisPointers: Joi.string().trim().allow('', null),
  placeOfService: Joi.string().trim().allow('', null),
  revenueCode: Joi.string().trim().allow('', null),
  catalogId: Joi.string().uuid().allow('', null),
}).or('cptCode', 'hcpcsCode');

const updateChargesSchema = Joi.object({
  charges: Joi.array().items(chargeItemSchema).required(),
});

const createPaymentSchema = Joi.object({
  type: Joi.string()
    .valid('Insurance payment', 'Patient payment', 'Adjustment', 'Write-off')
    .required(),
  amount: Joi.number().required(),
  payer: Joi.string().trim().allow('', null),
  reference: Joi.string().trim().allow('', null),
  notes: Joi.string().trim().allow('', null),
  postedDate: Joi.string().trim().allow('', null),
});

const createFollowUpNoteSchema = Joi.object({
  note: Joi.string().trim().min(1).required(),
  nextAction: Joi.string().trim().allow('', null),
  dueDate: Joi.string().trim().allow('', null),
  assignee: Joi.string().trim().allow('', null),
});

module.exports = {
  BILLING_STATUSES,
  validate,
  encounterIdSchema,
  updateBillingStatusSchema,
  updateDiagnosesSchema,
  updateChargesSchema,
  createPaymentSchema,
  createFollowUpNoteSchema,
};
