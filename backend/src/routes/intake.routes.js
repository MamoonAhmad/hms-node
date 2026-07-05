const express = require('express');
const router = express.Router();
const intakeController = require('../controllers/intake.controller');
const {
  patientIdSchema,
  sectionKeySchema,
  screeningTypeSchema,
  intakeQuerySchema,
  saveSectionSchema,
  saveScreeningSchema,
  completeIntakeSchema,
  validate,
} = require('../validation/intake.validation');

router.get(
  '/:patientId/sections',
  validate(patientIdSchema, 'params'),
  validate(intakeQuerySchema, 'query'),
  intakeController.getAllSections,
);
router.get(
  '/:patientId/sections/:sectionKey',
  validate(sectionKeySchema, 'params'),
  validate(intakeQuerySchema, 'query'),
  intakeController.getSections,
);
router.post(
  '/:patientId/sections/:sectionKey',
  validate(sectionKeySchema, 'params'),
  validate(saveSectionSchema, 'body'),
  intakeController.saveSection,
);

router.get(
  '/:patientId/screenings',
  validate(patientIdSchema, 'params'),
  validate(intakeQuerySchema, 'query'),
  intakeController.getAllScreenings,
);
router.get(
  '/:patientId/screenings/:screeningType',
  validate(screeningTypeSchema, 'params'),
  validate(intakeQuerySchema, 'query'),
  intakeController.getScreenings,
);
router.post(
  '/:patientId/screenings',
  validate(patientIdSchema, 'params'),
  validate(saveScreeningSchema, 'body'),
  intakeController.saveScreening,
);

router.get(
  '/:patientId/completion',
  validate(patientIdSchema, 'params'),
  validate(intakeQuerySchema, 'query'),
  intakeController.getCompletion,
);
router.post(
  '/:patientId/complete',
  validate(patientIdSchema, 'params'),
  validate(completeIntakeSchema, 'body'),
  intakeController.completeIntake,
);

module.exports = router;
