const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');
const patientProblemController = require('../controllers/patientProblem.controller');
const encounterProblemController = require('../controllers/encounterProblem.controller');
const medicationOrderController = require('../controllers/medicationOrder.controller');
const emarController = require('../controllers/emar.controller');
const referralController = require('../controllers/referral.controller');
const {
  createPatientSchema,
  updatePatientSchema,
  queryPatientSchema,
  checkDuplicatesSchema,
  deletePatientConfirmSchema,
  patientDocumentIdSchema,
  updatePatientDocumentSchema,
  createPatientDocumentSchema,
  queryPatientDocumentSchema,
  replacePatientDocumentSchema,
  updatePatientDocumentStatusSchema,
  documentAuditSchema,
  patientIdSchema,
  patientMrnSchema,
  patientSummaryQuerySchema,
  validate,
} = require('../validation/patient.validation');
const {
  createPatientProblemSchema,
  updatePatientProblemSchema,
  queryPatientProblemSchema,
  updatePatientProblemStatusSchema,
  patientProblemParamsSchema,
  validate: validateProblem,
} = require('../validation/patientProblem.validation');
const {
  upsertEncounterProblemSchema,
  encounterProblemParamsSchema,
  encounterProblemListParamsSchema,
  validate: validateEncounterProblem,
} = require('../validation/encounterProblem.validation');
const {
  validate: validateMedication,
  medicationOrderBodySchema,
  queryMedicationOrderSchema,
  bulkSaveSchema,
  bulkSignSchema,
  updateStatusSchema,
  patientMedicationOrderParamsSchema,
} = require('../validation/medicationOrder.validation');
const {
  validate: validateEmar,
  queryEmarSchema,
  patientEmarParamsSchema,
  recordAdministrationSchema,
  discontinueSchema,
  patientPanelQuerySchema,
} = require('../validation/emar.validation');
const {
  validate: validateReferral,
  createReferralSchema,
  updateReferralSchema,
  queryReferralSchema,
  updateReferralStatusSchema,
  sendReferralSchema,
  addReferralNoteSchema,
  closeReferralSchema,
  patientReferralParamsSchema,
  encounterDefaultsQuerySchema,
} = require('../validation/referral.validation');

/**
 * @swagger
 * tags:
 *   name: Patients
 *   description: Patient management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Patient:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Patient unique identifier
 *         mrn:
 *           type: string
 *           description: Medical Record Number (auto-generated)
 *         firstName:
 *           type: string
 *           description: Patient's first name
 *         middleName:
 *           type: string
 *           description: Patient's middle name
 *         lastName:
 *           type: string
 *           description: Patient's last name
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           description: Patient's date of birth
 *         gender:
 *           type: string
 *           enum: [male, female, other]
 *           description: Patient's gender
 *         contactNumber:
 *           type: string
 *           description: Patient's contact phone number
 *         email:
 *           type: string
 *           format: email
 *           description: Patient's email address
 *         address:
 *           type: string
 *           description: Patient's address
 *         insuranceProvider:
 *           type: string
 *           description: Insurance provider name
 *         policyNumber:
 *           type: string
 *           description: Insurance policy number
 *         copay:
 *           type: number
 *           format: decimal
 *           description: Copay amount
 *         deductible:
 *           type: number
 *           format: decimal
 *           description: Deductible amount
 *         primaryCarePhysician:
 *           type: string
 *           description: Primary care physician name
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Record creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Record last update timestamp
 *
 *     CreatePatient:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - dateOfBirth
 *         - gender
 *         - contactNumber
 *       properties:
 *         firstName:
 *           type: string
 *           example: John
 *         middleName:
 *           type: string
 *           example: Michael
 *         lastName:
 *           type: string
 *           example: Doe
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           example: "1990-05-15"
 *         gender:
 *           type: string
 *           enum: [male, female, other]
 *           example: male
 *         contactNumber:
 *           type: string
 *           example: "+1234567890"
 *         email:
 *           type: string
 *           format: email
 *           example: john.doe@example.com
 *         address:
 *           type: string
 *           example: "123 Main St, City, State 12345"
 *         insuranceProvider:
 *           type: string
 *           example: Blue Cross
 *         policyNumber:
 *           type: string
 *           example: POL123456
 *         copay:
 *           type: number
 *           example: 25.00
 *         deductible:
 *           type: number
 *           example: 500.00
 *         primaryCarePhysician:
 *           type: string
 *           example: Dr. Jane Smith
 *
 *     UpdatePatient:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *         middleName:
 *           type: string
 *         lastName:
 *           type: string
 *         dateOfBirth:
 *           type: string
 *           format: date
 *         gender:
 *           type: string
 *           enum: [male, female, other]
 *         contactNumber:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         address:
 *           type: string
 *         insuranceProvider:
 *           type: string
 *         policyNumber:
 *           type: string
 *         copay:
 *           type: number
 *         deductible:
 *           type: number
 *         primaryCarePhysician:
 *           type: string
 *
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *         limit:
 *           type: integer
 *         total:
 *           type: integer
 *         totalPages:
 *           type: integer
 */

// Create a new patient
router.post('/', validate(createPatientSchema, 'body'), patientController.create);
router.post('/check-duplicates', validate(checkDuplicatesSchema, 'body'), patientController.checkDuplicates);
router.get('/', validate(queryPatientSchema, 'query'), patientController.findAll);
router.get('/mrn/:mrn', validate(patientMrnSchema, 'params'), patientController.findByMrn);
router.post('/:id/assign-me', validate(patientIdSchema, 'params'), patientController.assignToMe);
router.get('/:id/encounters', validate(patientIdSchema, 'params'), patientController.getEncounters);
router.get(
  '/:id/documents',
  validate(patientIdSchema, 'params'),
  validate(queryPatientDocumentSchema, 'query'),
  patientController.listDocuments,
);
router.post(
  '/:id/documents',
  validate(patientIdSchema, 'params'),
  validate(createPatientDocumentSchema, 'body'),
  patientController.createDocument,
);
router.get('/:id/timeline', validate(patientIdSchema, 'params'), patientController.getTimeline);
router.get(
  '/:id/summary',
  validate(patientIdSchema, 'params'),
  validate(patientSummaryQuerySchema, 'query'),
  patientController.getSummary,
);
router.get(
  '/:id/problems',
  validate(patientIdSchema, 'params'),
  validateProblem(queryPatientProblemSchema, 'query'),
  patientProblemController.findAll,
);
router.get(
  '/:id/problems/:problemId',
  validate(patientProblemParamsSchema, 'params'),
  patientProblemController.findById,
);
router.post(
  '/:id/problems',
  validate(patientIdSchema, 'params'),
  validateProblem(createPatientProblemSchema, 'body'),
  patientProblemController.create,
);
router.put(
  '/:id/problems/:problemId',
  validate(patientProblemParamsSchema, 'params'),
  validateProblem(updatePatientProblemSchema, 'body'),
  patientProblemController.update,
);
router.patch(
  '/:id/problems/:problemId/status',
  validate(patientProblemParamsSchema, 'params'),
  validateProblem(updatePatientProblemStatusSchema, 'body'),
  patientProblemController.updateStatus,
);
router.delete(
  '/:id/problems/:problemId',
  validate(patientProblemParamsSchema, 'params'),
  patientProblemController.delete,
);
router.get(
  '/:id/appointments/:appointmentId/encounter-problems',
  validateEncounterProblem(encounterProblemListParamsSchema, 'params'),
  encounterProblemController.list,
);
router.post(
  '/:id/appointments/:appointmentId/encounter-problems/sync-coding',
  validateEncounterProblem(encounterProblemListParamsSchema, 'params'),
  encounterProblemController.syncCoding,
);
router.put(
  '/:id/appointments/:appointmentId/encounter-problems/:problemId',
  validateEncounterProblem(encounterProblemParamsSchema, 'params'),
  validateEncounterProblem(upsertEncounterProblemSchema, 'body'),
  encounterProblemController.upsert,
);
router.post(
  '/:id/appointments/:appointmentId/encounter-problems/:problemId/primary',
  validateEncounterProblem(encounterProblemParamsSchema, 'params'),
  encounterProblemController.setPrimary,
);
router.get(
  '/:id/medication-orders/counts',
  validate(patientIdSchema, 'params'),
  validateMedication(queryMedicationOrderSchema, 'query'),
  medicationOrderController.getStatusCounts,
);
router.get(
  '/:id/medication-orders',
  validate(patientIdSchema, 'params'),
  validateMedication(queryMedicationOrderSchema, 'query'),
  medicationOrderController.findAll,
);
router.get(
  '/:id/medication-orders/:orderId',
  validate(patientMedicationOrderParamsSchema, 'params'),
  medicationOrderController.findById,
);
router.get(
  '/:id/medication-orders/:orderId/audit',
  validate(patientMedicationOrderParamsSchema, 'params'),
  medicationOrderController.getAuditLogs,
);
router.post(
  '/:id/medication-orders',
  validate(patientIdSchema, 'params'),
  validateMedication(medicationOrderBodySchema, 'body'),
  medicationOrderController.create,
);
router.post(
  '/:id/medication-orders/bulk-save',
  validate(patientIdSchema, 'params'),
  validateMedication(bulkSaveSchema, 'body'),
  medicationOrderController.bulkSave,
);
router.post(
  '/:id/medication-orders/bulk-sign',
  validate(patientIdSchema, 'params'),
  validateMedication(bulkSignSchema, 'body'),
  medicationOrderController.bulkSign,
);
router.patch(
  '/:id/medication-orders/:orderId/status',
  validate(patientMedicationOrderParamsSchema, 'params'),
  validateMedication(updateStatusSchema, 'body'),
  medicationOrderController.updateStatus,
);
router.post(
  '/:id/medication-orders/:orderId/acknowledge-safety',
  validate(patientMedicationOrderParamsSchema, 'params'),
  medicationOrderController.acknowledgeSafety,
);
router.get(
  '/:id/emar/counts',
  validate(patientIdSchema, 'params'),
  validateEmar(patientPanelQuerySchema, 'query'),
  emarController.getTabCounts,
);
router.get(
  '/:id/emar/panel',
  validate(patientIdSchema, 'params'),
  validateEmar(patientPanelQuerySchema, 'query'),
  emarController.getPatientPanel,
);
router.get(
  '/:id/emar/timeline',
  validate(patientIdSchema, 'params'),
  validateEmar(patientPanelQuerySchema, 'query'),
  emarController.getTimeline,
);
router.get(
  '/:id/emar',
  validate(patientIdSchema, 'params'),
  validateEmar(queryEmarSchema, 'query'),
  emarController.findAll,
);
router.get(
  '/:id/emar/:marEntryId',
  validate(patientEmarParamsSchema, 'params'),
  emarController.findById,
);
router.get(
  '/:id/emar/:marEntryId/history',
  validate(patientEmarParamsSchema, 'params'),
  emarController.getAdministrationHistory,
);
router.post(
  '/:id/emar/:marEntryId/administer',
  validate(patientEmarParamsSchema, 'params'),
  validateEmar(recordAdministrationSchema, 'body'),
  emarController.recordAdministration,
);
router.post(
  '/:id/emar/:marEntryId/discontinue',
  validate(patientEmarParamsSchema, 'params'),
  validateEmar(discontinueSchema, 'body'),
  emarController.discontinue,
);
router.get(
  '/:id/referrals/types',
  validate(patientIdSchema, 'params'),
  referralController.getReferralTypes,
);
router.get(
  '/:id/referrals/summary',
  validate(patientIdSchema, 'params'),
  validateReferral(queryReferralSchema, 'query'),
  referralController.getSummaryCounts,
);
router.get(
  '/:id/referrals/panel',
  validate(patientIdSchema, 'params'),
  validateReferral(queryReferralSchema, 'query'),
  referralController.getPatientPanel,
);
router.get(
  '/:id/referrals/encounter-defaults',
  validate(patientIdSchema, 'params'),
  validateReferral(encounterDefaultsQuerySchema, 'query'),
  referralController.getEncounterDefaults,
);
router.get(
  '/:id/referrals',
  validate(patientIdSchema, 'params'),
  validateReferral(queryReferralSchema, 'query'),
  referralController.findAll,
);
router.get(
  '/:id/referrals/:referralId',
  validate(patientReferralParamsSchema, 'params'),
  referralController.findById,
);
router.post(
  '/:id/referrals',
  validate(patientIdSchema, 'params'),
  validateReferral(createReferralSchema, 'body'),
  referralController.create,
);
router.put(
  '/:id/referrals/:referralId',
  validate(patientReferralParamsSchema, 'params'),
  validateReferral(updateReferralSchema, 'body'),
  referralController.update,
);
router.patch(
  '/:id/referrals/:referralId/status',
  validate(patientReferralParamsSchema, 'params'),
  validateReferral(updateReferralStatusSchema, 'body'),
  referralController.updateStatus,
);
router.post(
  '/:id/referrals/:referralId/send',
  validate(patientReferralParamsSchema, 'params'),
  validateReferral(sendReferralSchema, 'body'),
  referralController.send,
);
router.post(
  '/:id/referrals/:referralId/notes',
  validate(patientReferralParamsSchema, 'params'),
  validateReferral(addReferralNoteSchema, 'body'),
  referralController.addNote,
);
router.get(
  '/:id/referrals/:referralId/timeline',
  validate(patientReferralParamsSchema, 'params'),
  referralController.getTimeline,
);
router.get(
  '/:id/referrals/:referralId/audit',
  validate(patientReferralParamsSchema, 'params'),
  referralController.getAuditLogs,
);
router.post(
  '/:id/referrals/:referralId/cancel',
  validate(patientReferralParamsSchema, 'params'),
  referralController.cancel,
);
router.post(
  '/:id/referrals/:referralId/close',
  validate(patientReferralParamsSchema, 'params'),
  validateReferral(closeReferralSchema, 'body'),
  referralController.close,
);
router.delete(
  '/:id/referrals/:referralId',
  validate(patientReferralParamsSchema, 'params'),
  referralController.delete,
);
router.get(
  '/:id/documents/:documentId/versions',
  validate(patientDocumentIdSchema, 'params'),
  patientController.getDocumentVersions,
);
router.post(
  '/:id/documents/:documentId/replace',
  validate(patientDocumentIdSchema, 'params'),
  validate(replacePatientDocumentSchema, 'body'),
  patientController.replaceDocument,
);
router.patch(
  '/:id/documents/:documentId/status',
  validate(patientDocumentIdSchema, 'params'),
  validate(updatePatientDocumentStatusSchema, 'body'),
  patientController.updateDocumentStatus,
);
router.post(
  '/:id/documents/:documentId/audit',
  validate(patientDocumentIdSchema, 'params'),
  validate(documentAuditSchema, 'body'),
  patientController.logDocumentAudit,
);
router.put(
  '/:id/documents/:documentId',
  validate(patientDocumentIdSchema, 'params'),
  validate(updatePatientDocumentSchema, 'body'),
  patientController.updateDocument,
);
router.delete(
  '/:id/documents/:documentId',
  validate(patientDocumentIdSchema, 'params'),
  patientController.deleteDocument,
);
router.post(
  '/:id/delete-confirm',
  validate(patientIdSchema, 'params'),
  validate(deletePatientConfirmSchema, 'body'),
  patientController.deleteWithConfirmation,
);

// Get patient by ID
router.get('/:id', validate(patientIdSchema, 'params'), patientController.findById);

// Update patient
router.put('/:id', validate(patientIdSchema, 'params'), validate(updatePatientSchema, 'body'), patientController.update);

// Delete patient
router.delete('/:id', validate(patientIdSchema, 'params'), patientController.delete);

module.exports = router;
