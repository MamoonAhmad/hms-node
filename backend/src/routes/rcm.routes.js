const express = require('express');
const router = express.Router();
const rcmController = require('../controllers/rcm.controller');
const {
  validateClaimBody,
  validateSplitBody,
  validateListQuery,
} = require('../validation/cms1500Claim.validation');

// Claims engine + CMS-1500 form
router.get('/claims', validateListQuery, rcmController.listClaims);
router.post('/claims', validateClaimBody, rcmController.createClaim);
router.post('/claims/build', rcmController.buildClaim);
router.get('/claims/:id', rcmController.getClaim);
router.put('/claims/:id', validateClaimBody, rcmController.updateClaim);
router.patch('/claims/:id', validateClaimBody, rcmController.updateClaim);
router.delete('/claims/:id', rcmController.deleteClaim);
router.post('/claims/:id/copy', rcmController.copyClaim);
router.post('/claims/:id/split', validateSplitBody, rcmController.splitClaim);
router.get('/claims/:id/charge-history', rcmController.claimChargeHistory);
router.get('/claims/:id/electronic-preview', rcmController.electronicPreview);
router.get('/claims/:id/print', rcmController.printClaim);
router.post('/claims/:id/scrub', rcmController.scrubClaim);
router.post('/claims/:id/submit', rcmController.submitClaim);
router.post('/claims/:id/acknowledge', rcmController.ackClaim);
router.post('/claims/:id/void', rcmController.voidClaim);
router.patch('/claims/:id/status', rcmController.updateClaimStatus);
router.post('/claims/:claimId/simulate-era', rcmController.simulateEra);

// Mock eligibility (button-only)
router.post('/eligibility/verify', rcmController.mockEligibility);

// EDI / ERA
router.get('/era', rcmController.listEras);
router.get('/era/:id', rcmController.getEra);
router.post('/era/import', rcmController.importEra);
router.post('/era/:id/post', rcmController.postEra);

// Denials & appeals & follow-up
router.get('/denials', rcmController.listDenials);
router.post('/denials', rcmController.createDenial);
router.patch('/denials/:id', rcmController.updateDenial);
router.post('/denials/:id/appeals', rcmController.createAppeal);
router.post('/appeals/:id/decide', rcmController.decideAppeal);
router.get('/follow-ups', rcmController.listFollowUps);
router.post('/follow-ups', rcmController.createFollowUp);
router.post('/follow-ups/:id/complete', rcmController.completeFollowUp);

// Collections
router.get('/collections', rcmController.listCollections);
router.post('/collections', rcmController.placeCollections);
router.patch('/collections/:id', rcmController.updateCollections);
router.post('/collections/:id/advance-dunning', rcmController.advanceDunning);

// Statement cycles
router.get('/statement-cycles', rcmController.listStatementCycles);
router.post('/statement-cycles', rcmController.runStatementCycle);
router.post('/statement-cycles/:id/mark-sent', rcmController.markStatementCycleSent);

// Reports
router.get('/reports/dashboard', rcmController.dashboard);
router.get('/reports/:slug', rcmController.report);

// Charge capture search (also under /charge-master)
router.get('/charge-capture/search', rcmController.searchCharges);

module.exports = router;
