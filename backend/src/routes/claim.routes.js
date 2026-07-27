const express = require('express');
const claimController = require('../controllers/claim.controller');
const {
  validate,
  encounterIdQuerySchema,
  upsertChargeCaptureSchema,
  lockChargeCaptureSchema,
  generateClaimSchema,
  updateClaimStatusSchema,
  listClaimsQuerySchema,
  listWorklistQuerySchema,
  updateWorklistItemSchema,
  checkoutIdParamSchema,
  claimIdParamSchema,
} = require('../validation/claim.validation');

const patientClaimRouter = express.Router({ mergeParams: true });

patientClaimRouter.get(
  '/charge-capture',
  validate(encounterIdQuerySchema, 'query'),
  claimController.getChargeCapture,
);
patientClaimRouter.put(
  '/charge-capture',
  validate(upsertChargeCaptureSchema),
  claimController.upsertChargeCapture,
);
patientClaimRouter.post(
  '/charge-capture/lock',
  validate(lockChargeCaptureSchema),
  claimController.lockChargeCapture,
);
patientClaimRouter.post(
  '/charge-capture/unlock',
  validate(lockChargeCaptureSchema),
  claimController.unlockChargeCapture,
);
patientClaimRouter.post(
  '/claims/generate',
  validate(generateClaimSchema),
  claimController.generateClaim,
);

const claimsRouter = express.Router();
claimsRouter.get('/worklist', validate(listWorklistQuerySchema, 'query'), claimController.listWorklist);
claimsRouter.patch(
  '/worklist/:checkoutId',
  validate(checkoutIdParamSchema, 'params'),
  validate(updateWorklistItemSchema),
  claimController.updateWorklistItem,
);
claimsRouter.delete(
  '/worklist/:checkoutId',
  validate(checkoutIdParamSchema, 'params'),
  claimController.removeFromWorklist,
);
claimsRouter.get('/', validate(listClaimsQuerySchema, 'query'), claimController.listClaims);
claimsRouter.get(
  '/:claimId',
  validate(claimIdParamSchema, 'params'),
  claimController.getClaim,
);
claimsRouter.patch(
  '/:claimId/status',
  validate(claimIdParamSchema, 'params'),
  validate(updateClaimStatusSchema),
  claimController.updateClaimStatus,
);

module.exports = { patientClaimRouter, claimsRouter };
