const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');
const {
  createPatientSchema,
  updatePatientSchema,
  queryPatientSchema,
  checkDuplicatesSchema,
  patientIdSchema,
  patientMrnSchema,
  patientSummaryQuerySchema,
  chartStatusSchema,
  ledgerPaymentSchema,
  ledgerReverseSchema,
  statementCreateSchema,
  statementActionSchema,
  eligibilityVerifySchema,
  claimCreateSchema,
  claimUpdateSchema,
  claimIdSchema,
  statementIdSchema,
  ledgerTxnIdSchema,
  insuranceBodySchema,
  insuranceUpdateSchema,
  insuranceIdParamsSchema,
  guarantorBodySchema,
  chargeBodySchema,
  allocateBodySchema,
  eraBodySchema,
  mergeBodySchema,
  collectionStatusSchema,
  worklistQuerySchema,
  validate,
} = require('../validation/patient.validation');

router.post('/', validate(createPatientSchema, 'body'), patientController.create);
router.post('/check-duplicates', validate(checkDuplicatesSchema, 'body'), patientController.checkDuplicates);
router.get('/consent-forms', patientController.listConsentForms);
router.get('/worklists', validate(worklistQuerySchema, 'query'), patientController.getWorklists);
router.get('/', validate(queryPatientSchema, 'query'), patientController.findAll);
router.get('/mrn/:mrn', validate(patientMrnSchema, 'params'), patientController.findByMrn);
router.post('/:id/assign-me', validate(patientIdSchema, 'params'), patientController.assignToMe);
router.get(
  '/:id/summary',
  validate(patientIdSchema, 'params'),
  validate(patientSummaryQuerySchema, 'query'),
  patientController.getSummary,
);
router.get(
  '/:id/appointment-history',
  validate(patientIdSchema, 'params'),
  patientController.getAppointmentHistory,
);
router.get('/:id/ledger', validate(patientIdSchema, 'params'), patientController.getLedger);
router.get('/:id/aging', validate(patientIdSchema, 'params'), patientController.getAging);
router.get('/:id/chart', validate(patientIdSchema, 'params'), patientController.getChart);
router.patch(
  '/:id/chart-status',
  validate(patientIdSchema, 'params'),
  validate(chartStatusSchema, 'body'),
  patientController.updateChartStatus,
);
router.patch(
  '/:id/collection-status',
  validate(patientIdSchema, 'params'),
  validate(collectionStatusSchema, 'body'),
  patientController.updateCollectionStatus,
);
router.post(
  '/:id/eligibility',
  validate(patientIdSchema, 'params'),
  validate(eligibilityVerifySchema, 'body'),
  patientController.verifyEligibility,
);
router.post(
  '/:id/ledger/payments',
  validate(patientIdSchema, 'params'),
  validate(ledgerPaymentSchema, 'body'),
  patientController.postLedgerPayment,
);
router.post(
  '/:id/ledger/charges',
  validate(patientIdSchema, 'params'),
  validate(chargeBodySchema, 'body'),
  patientController.postCharge,
);
router.post(
  '/:id/ledger/allocate',
  validate(patientIdSchema, 'params'),
  validate(allocateBodySchema, 'body'),
  patientController.allocatePayment,
);
router.post(
  '/:id/ledger/era',
  validate(patientIdSchema, 'params'),
  validate(eraBodySchema, 'body'),
  patientController.postEra,
);
router.post(
  '/:id/ledger/:txnId/reverse',
  validate(ledgerTxnIdSchema, 'params'),
  validate(ledgerReverseSchema, 'body'),
  patientController.reverseLedgerPayment,
);
router.post(
  '/:id/statements',
  validate(patientIdSchema, 'params'),
  validate(statementCreateSchema, 'body'),
  patientController.createStatement,
);
router.patch(
  '/:id/statements/:statementId',
  validate(statementIdSchema, 'params'),
  validate(statementActionSchema, 'body'),
  patientController.markStatement,
);
router.post(
  '/:id/claims',
  validate(patientIdSchema, 'params'),
  validate(claimCreateSchema, 'body'),
  patientController.createClaim,
);
router.patch(
  '/:id/claims/:claimId',
  validate(claimIdSchema, 'params'),
  validate(claimUpdateSchema, 'body'),
  patientController.updateClaim,
);

router.get('/:id/insurances', validate(patientIdSchema, 'params'), patientController.listInsurances);
router.post(
  '/:id/insurances',
  validate(patientIdSchema, 'params'),
  validate(insuranceBodySchema, 'body'),
  patientController.createInsurance,
);
router.put(
  '/:id/insurances/:insuranceId',
  validate(insuranceIdParamsSchema, 'params'),
  validate(insuranceUpdateSchema, 'body'),
  patientController.updateInsurance,
);
router.delete(
  '/:id/insurances/:insuranceId',
  validate(insuranceIdParamsSchema, 'params'),
  patientController.deactivateInsurance,
);

router.get('/:id/guarantor', validate(patientIdSchema, 'params'), patientController.getGuarantor);
router.put(
  '/:id/guarantor',
  validate(patientIdSchema, 'params'),
  validate(guarantorBodySchema, 'body'),
  patientController.upsertGuarantor,
);

router.post(
  '/:id/merge',
  validate(patientIdSchema, 'params'),
  validate(mergeBodySchema, 'body'),
  patientController.mergePatient,
);

router.get('/:id', validate(patientIdSchema, 'params'), patientController.findById);
router.put(
  '/:id',
  validate(patientIdSchema, 'params'),
  validate(updatePatientSchema, 'body'),
  patientController.update,
);
router.delete('/:id', validate(patientIdSchema, 'params'), patientController.delete);

module.exports = router;
