const Joi = require('joi');

const INTAKE_SECTION_TYPES = [
  'chief_complaint_hpi',
  'vitals',
  'medication_reconciliation',
  'ros',
  'medication_history',
  'immunization',
  'surgical_history',
  'social_history',
  'family_history',
  'menstrual_assessment',
  'hospital_ed_visit',
  'growth_chart',
  'screening_fall_risk',
  'screening_suicide',
  'screening_hunger',
  'screening_phq9',
  'screening_dast10',
  'screening_gad7',
  'screening_nih_stroke',
  'screening_pain',
];

const patientIdSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
});

const intakeQuerySchema = Joi.object({
  encounterId: Joi.string().uuid().allow('', null),
  sectionType: Joi.string().valid(...INTAKE_SECTION_TYPES).allow('', null),
});

const createIntakeRecordSchema = Joi.object({
  sectionType: Joi.string().valid(...INTAKE_SECTION_TYPES).required(),
  appointmentId: Joi.string().uuid().allow(null),
  payload: Joi.object().required(),
  score: Joi.number().integer().min(0).allow(null),
  notes: Joi.string().max(5000).allow('', null),
});

const updateIntakeRecordSchema = Joi.object({
  payload: Joi.object(),
  score: Joi.number().integer().min(0).allow(null),
  notes: Joi.string().max(5000).allow('', null),
}).min(1);

const addendumSchema = Joi.object({
  payload: Joi.object().required(),
  notes: Joi.string().max(5000).allow('', null),
});

const intakeRecordIdSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  recordId: Joi.string().uuid().required(),
});

const certifyIntakeSchema = Joi.object({
  appointmentId: Joi.string().uuid().allow(null),
});

const completeIntakeSchema = Joi.object({
  appointmentId: Joi.string().uuid().allow(null),
  completionNotes: Joi.string().max(5000).allow('', null),
  accepted: Joi.boolean().valid(true).required(),
});

const createAllergySchema = Joi.object({
  allergenName: Joi.string().trim().min(1).max(200).required(),
  reaction: Joi.string().max(500).allow('', null),
  severity: Joi.string().max(50).allow('', null),
  onsetDate: Joi.date().allow(null),
  status: Joi.string().max(50).default('Active'),
  comment: Joi.string().max(5000).allow('', null),
});

const updateAllergySchema = createAllergySchema.fork(
  ['allergenName'],
  (schema) => schema.optional(),
);

const nkdaSchema = Joi.object({
  noKnownDrugAllergies: Joi.boolean().required(),
});

const allergyIdSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  allergyId: Joi.string().uuid().required(),
});

module.exports = {
  INTAKE_SECTION_TYPES,
  patientIdSchema,
  intakeQuerySchema,
  createIntakeRecordSchema,
  updateIntakeRecordSchema,
  addendumSchema,
  intakeRecordIdSchema,
  certifyIntakeSchema,
  completeIntakeSchema,
  createAllergySchema,
  updateAllergySchema,
  nkdaSchema,
  allergyIdSchema,
};
