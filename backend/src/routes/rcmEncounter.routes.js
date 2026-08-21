const express = require('express');
const router = express.Router();
const rcmEncounterController = require('../controllers/rcmEncounter.controller');
const {
  validate,
  encounterIdSchema,
  updateBillingStatusSchema,
  updateDiagnosesSchema,
  updateChargesSchema,
  createPaymentSchema,
  createFollowUpNoteSchema,
} = require('../validation/rcmEncounter.validation');

router.get(
  '/:id',
  validate(encounterIdSchema, 'params'),
  rcmEncounterController.getById,
);

router.patch(
  '/:id/billing-status',
  validate(encounterIdSchema, 'params'),
  validate(updateBillingStatusSchema, 'body'),
  rcmEncounterController.updateBillingStatus,
);

router.put(
  '/:id/diagnoses',
  validate(encounterIdSchema, 'params'),
  validate(updateDiagnosesSchema, 'body'),
  rcmEncounterController.updateDiagnoses,
);

router.put(
  '/:id/charges',
  validate(encounterIdSchema, 'params'),
  validate(updateChargesSchema, 'body'),
  rcmEncounterController.updateCharges,
);

router.post(
  '/:id/payments',
  validate(encounterIdSchema, 'params'),
  validate(createPaymentSchema, 'body'),
  rcmEncounterController.addPayment,
);

router.post(
  '/:id/follow-up-notes',
  validate(encounterIdSchema, 'params'),
  validate(createFollowUpNoteSchema, 'body'),
  rcmEncounterController.addFollowUpNote,
);

router.post(
  '/:id/eligibility/verify',
  validate(encounterIdSchema, 'params'),
  rcmEncounterController.verifyEligibility,
);

module.exports = router;
