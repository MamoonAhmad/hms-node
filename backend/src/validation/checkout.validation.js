const Joi = require('joi');

const CHECKOUT_STATUSES = [
  'not_started',
  'in_progress',
  'pending_clinical_sign_off',
  'pending_payment',
  'pending_follow_up',
  'completed',
  'cancelled',
];

const CHECKLIST_STATES = ['completed', 'pending', 'not_required', 'needs_attention'];

const INSTRUCTION_TYPES = [
  'Visit Summary',
  'Medication Instructions',
  'Lab Instructions',
  'Imaging Instructions',
  'Referral Instructions',
  'Diet Instructions',
  'Activity Instructions',
  'Follow-Up Instructions',
  'Warning Signs / Return Precautions',
  'Other Instructions',
];

const NOTE_TYPES = [
  'patient_concern',
  'payment_note',
  'follow_up_note',
  'scheduling_note',
  'referral_note',
  'general',
];

const PAYMENT_METHODS = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Check',
  'Online Payment',
  'Insurance',
  'Waived',
  'Other',
];

const TASK_PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];

const INSURANCE_STATUSES = ['Verified', 'Pending', 'Not Verified', 'Inactive', 'Self-Pay'];

const FOLLOW_UP_TIMEFRAMES = [
  '1 week',
  '2 weeks',
  '1 month',
  '3 months',
  '6 months',
  '1 year',
  'As needed',
  'Custom',
];

const checkoutQuerySchema = Joi.object({
  encounterId: Joi.string().uuid().required(),
});

const updateCheckoutSchema = Joi.object({
  encounterId: Joi.string().uuid().required(),
  checklistOverrides: Joi.object().pattern(Joi.string(), Joi.string().valid(...CHECKLIST_STATES)),
  followUpRequired: Joi.boolean().allow(null),
  followUpTimeframe: Joi.string().valid(...FOLLOW_UP_TIMEFRAMES).allow('', null),
  followUpReason: Joi.string().max(5000).allow('', null),
  followUpData: Joi.object({
    appointmentType: Joi.string().allow('', null),
    provider: Joi.string().allow('', null),
    location: Joi.string().allow('', null),
    appointmentDate: Joi.string().allow('', null),
    appointmentTime: Joi.string().allow('', null),
    reason: Joi.string().allow('', null),
  }).allow(null),
  billingData: Joi.object({
    balanceDue: Joi.number().min(0).allow(null),
    charges: Joi.array().items(Joi.object()),
    cptCodes: Joi.array().items(Joi.string()),
    icd10Codes: Joi.array().items(Joi.string()),
    billingProvider: Joi.string().allow('', null),
    codesReviewed: Joi.boolean(),
  }).allow(null),
  insuranceStatus: Joi.string().valid(...INSURANCE_STATUSES).allow('', null),
  documentsMeta: Joi.object({
    printedOrShared: Joi.boolean(),
    documents: Joi.array().items(Joi.string()),
  }).allow(null),
}).min(2);

const instructionSchema = Joi.object({
  encounterId: Joi.string().uuid().required(),
  instructionType: Joi.string().valid(...INSTRUCTION_TYPES).required(),
  content: Joi.string().min(1).max(10000).required(),
});

const instructionIdSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  instructionId: Joi.string().uuid().required(),
});

const noteSchema = Joi.object({
  encounterId: Joi.string().uuid().required(),
  noteType: Joi.string().valid(...NOTE_TYPES).default('general'),
  content: Joi.string().min(1).max(5000).required(),
});

const taskSchema = Joi.object({
  encounterId: Joi.string().uuid().required(),
  title: Joi.string().trim().min(1).max(200).required(),
  assignedTo: Joi.string().uuid().allow(null),
  assignedToName: Joi.string().max(200).allow('', null),
  dueDate: Joi.date().allow(null),
  priority: Joi.string().valid(...TASK_PRIORITIES).default('Normal'),
  notes: Joi.string().max(5000).allow('', null),
});

const paymentSchema = Joi.object({
  encounterId: Joi.string().uuid().required(),
  amountDue: Joi.number().min(0).allow(null),
  paymentAmount: Joi.number().min(0).required(),
  paymentMethod: Joi.string().valid(...PAYMENT_METHODS).required(),
  transactionRef: Joi.string().max(100).allow('', null),
  notes: Joi.string().max(5000).allow('', null),
  balanceRemaining: Joi.number().min(0).allow(null),
});

const completeCheckoutSchema = Joi.object({
  encounterId: Joi.string().uuid().required(),
});

const reopenCheckoutSchema = Joi.object({
  encounterId: Joi.string().uuid().required(),
  reason: Joi.string().trim().min(1).max(2000).required(),
});

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
  } else {
    req[property] = value;
  }
  next();
};

module.exports = {
  validate,
  checkoutQuerySchema,
  updateCheckoutSchema,
  instructionSchema,
  instructionIdSchema,
  noteSchema,
  taskSchema,
  paymentSchema,
  completeCheckoutSchema,
  reopenCheckoutSchema,
  CHECKOUT_STATUSES,
  INSTRUCTION_TYPES,
  NOTE_TYPES,
  PAYMENT_METHODS,
  TASK_PRIORITIES,
  INSURANCE_STATUSES,
  FOLLOW_UP_TIMEFRAMES,
};
