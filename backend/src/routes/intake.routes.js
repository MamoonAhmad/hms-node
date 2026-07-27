const express = require('express');
const router = express.Router({ mergeParams: true });
const intakeController = require('../controllers/intake.controller');
const { validate } = require('../validation/patient.validation');
const {
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
} = require('../validation/intake.validation');

router.get('/', validate(intakeQuerySchema, 'query'), intakeController.getBundle);

router.post('/records', validate(createIntakeRecordSchema, 'body'), intakeController.createRecord);
router.put(
  '/records/:recordId',
  validate(intakeRecordIdSchema, 'params'),
  validate(updateIntakeRecordSchema, 'body'),
  intakeController.updateRecord,
);
router.post(
  '/records/:recordId/addendum',
  validate(intakeRecordIdSchema, 'params'),
  validate(addendumSchema, 'body'),
  intakeController.addAddendum,
);
router.delete(
  '/records/:recordId',
  validate(intakeRecordIdSchema, 'params'),
  intakeController.deleteRecord,
);

router.post('/certify', validate(certifyIntakeSchema, 'body'), intakeController.certify);
router.post('/complete', validate(completeIntakeSchema, 'body'), intakeController.complete);

router.get('/allergies', intakeController.listAllergies);
router.put('/allergies/nkda', validate(nkdaSchema, 'body'), intakeController.setNkda);
router.post('/allergies', validate(createAllergySchema, 'body'), intakeController.createAllergy);
router.put(
  '/allergies/:allergyId',
  validate(allergyIdSchema, 'params'),
  validate(updateAllergySchema, 'body'),
  intakeController.updateAllergy,
);
router.delete(
  '/allergies/:allergyId',
  validate(allergyIdSchema, 'params'),
  intakeController.deleteAllergy,
);

module.exports = router;
