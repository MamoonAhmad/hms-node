const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');
const {
  createPatientSchema,
  updatePatientSchema,
  queryPatientSchema,
  patientIdSchema,
  patientMrnSchema,
  validate,
} = require('../validation/patient.validation');

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

// Get all patients with pagination
router.get('/', validate(queryPatientSchema, 'query'), patientController.findAll);

// Get patient by MRN
router.get('/mrn/:mrn', validate(patientMrnSchema, 'params'), patientController.findByMrn);

// Get patient by ID
router.get('/:id', validate(patientIdSchema, 'params'), patientController.findById);

// Update patient
router.put('/:id', validate(patientIdSchema, 'params'), validate(updatePatientSchema, 'body'), patientController.update);

// Delete patient
router.delete('/:id', validate(patientIdSchema, 'params'), patientController.delete);

module.exports = router;
