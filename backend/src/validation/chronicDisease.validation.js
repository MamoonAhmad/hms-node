const Joi = require('joi');

const patientIdSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
});

const recordIdSchema = Joi.object({
  patientId: Joi.string().uuid().optional(),
  recordId: Joi.string().uuid().required(),
});

const listQuerySchema = Joi.object({
  encounterId: Joi.string().uuid().allow('', null),
});

const upsertRecordSchema = Joi.object({
  encounterId: Joi.string().uuid().allow(null),
  conditionCode: Joi.string().trim().min(1).max(100).required(),
  conditionName: Joi.string().trim().min(1).max(200).required(),
  icdCode: Joi.string().trim().max(50).allow('', null),
  status: Joi.string().trim().max(50).default('Active'),
  severity: Joi.string().trim().max(50).allow('', null),
  diagnosisDate: Joi.date().allow(null),
  controlStatus: Joi.string().trim().max(50).allow('', null),
  notes: Joi.string().max(10000).allow('', null),
  fields: Joi.object().pattern(Joi.string(), Joi.alternatives().try(
    Joi.string().allow(''),
    Joi.number(),
    Joi.boolean(),
    Joi.valid(null),
  )).default({}),
});

const updateRecordSchema = upsertRecordSchema.fork(
  ['conditionCode', 'conditionName'],
  (s) => s.optional(),
).min(1);

module.exports = {
  patientIdSchema,
  recordIdSchema,
  listQuerySchema,
  upsertRecordSchema,
  updateRecordSchema,
};
