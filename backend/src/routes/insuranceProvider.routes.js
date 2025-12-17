const express = require('express');
const router = express.Router();
const insuranceProviderController = require('../controllers/insuranceProvider.controller');
const {
  createInsuranceProviderSchema,
  updateInsuranceProviderSchema,
  queryInsuranceProviderSchema,
  insuranceProviderIdSchema,
  validate,
} = require('../validation/insuranceProvider.validation');

/**
 * @swagger
 * tags:
 *   name: Insurance Providers
 *   description: Insurance provider management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     InsuranceProvider:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         code:
 *           type: string
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *         address:
 *           type: string
 *         website:
 *           type: string
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreateInsuranceProvider:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: Blue Cross Blue Shield
 *         code:
 *           type: string
 *           example: BCBS
 *         phone:
 *           type: string
 *           example: "+1234567890"
 *         email:
 *           type: string
 *           example: contact@bcbs.com
 *         address:
 *           type: string
 *         website:
 *           type: string
 *           example: https://www.bcbs.com
 *         isActive:
 *           type: boolean
 *           default: true
 *
 *     UpdateInsuranceProvider:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         code:
 *           type: string
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *         address:
 *           type: string
 *         website:
 *           type: string
 *         isActive:
 *           type: boolean
 */

// Create a new insurance provider
router.post('/', validate(createInsuranceProviderSchema, 'body'), insuranceProviderController.create);

// Get all insurance providers with pagination
router.get('/', validate(queryInsuranceProviderSchema, 'query'), insuranceProviderController.findAll);

// Get all active insurance providers (for dropdowns)
router.get('/active', insuranceProviderController.findAllActive);

// Get insurance provider by ID
router.get('/:id', validate(insuranceProviderIdSchema, 'params'), insuranceProviderController.findById);

// Update insurance provider
router.put('/:id', validate(insuranceProviderIdSchema, 'params'), validate(updateInsuranceProviderSchema, 'body'), insuranceProviderController.update);

// Delete insurance provider
router.delete('/:id', validate(insuranceProviderIdSchema, 'params'), insuranceProviderController.delete);

module.exports = router;

