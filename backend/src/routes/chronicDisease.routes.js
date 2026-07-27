const express = require('express');
const router = express.Router({ mergeParams: true });
const { validate } = require('../validation/patient.validation');
const chronicDiseaseController = require('../controllers/chronicDisease.controller');
const {
  listQuerySchema,
  upsertRecordSchema,
  updateRecordSchema,
  recordIdSchema,
} = require('../validation/chronicDisease.validation');

router.get('/templates', chronicDiseaseController.listTemplates);

router.get('/', validate(listQuerySchema, 'query'), chronicDiseaseController.listRecords);

router.post('/', validate(upsertRecordSchema, 'body'), chronicDiseaseController.createRecord);

router.put(
  '/:recordId',
  validate(recordIdSchema, 'params'),
  validate(updateRecordSchema, 'body'),
  chronicDiseaseController.updateRecord,
);

router.delete(
  '/:recordId',
  validate(recordIdSchema, 'params'),
  chronicDiseaseController.deleteRecord,
);

module.exports = router;
