const express = require('express');
const router = express.Router();
const diagnosisCodeController = require('../controllers/diagnosisCode.controller');
const {
  createDiagnosisCodeSchema,
  updateDiagnosisCodeSchema,
  queryDiagnosisCodeSchema,
  diagnosisCodeIdSchema,
  validate,
} = require('../validation/diagnosisCode.validation');

router.post('/', validate(createDiagnosisCodeSchema, 'body'), diagnosisCodeController.create);
router.get('/', validate(queryDiagnosisCodeSchema, 'query'), diagnosisCodeController.findAll);
router.get('/:id', validate(diagnosisCodeIdSchema, 'params'), diagnosisCodeController.findById);
router.put(
  '/:id',
  validate(diagnosisCodeIdSchema, 'params'),
  validate(updateDiagnosisCodeSchema, 'body'),
  diagnosisCodeController.update,
);
router.delete('/:id', validate(diagnosisCodeIdSchema, 'params'), diagnosisCodeController.delete);

module.exports = router;
