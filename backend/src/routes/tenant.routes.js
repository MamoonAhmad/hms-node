const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenant.controller');
const {
  createTenantSchema,
  updateTenantSchema,
  queryTenantSchema,
  tenantIdSchema,
  validate,
} = require('../validation/tenant.validation');

/**
 * @swagger
 * tags:
 *   name: Tenants
 *   description: Tenant management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Tenant:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Tenant unique identifier
 *         name:
 *           type: string
 *           description: Tenant name
 *         isActive:
 *           type: boolean
 *           description: Whether tenant is active
 *         createdBy:
 *           type: string
 *           description: User ID who created the tenant
 *         updatedBy:
 *           type: string
 *           description: User ID who last updated the tenant
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Record creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Record last update timestamp
 *         creator:
 *           type: object
 *           description: User who created the tenant
 *         updater:
 *           type: object
 *           description: User who last updated the tenant
 *
 *     CreateTenant:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: Acme Corporation
 *         isActive:
 *           type: boolean
 *           default: true
 *           example: true
 *
 *     UpdateTenant:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         isActive:
 *           type: boolean
 */

// Create a new tenant
router.post('/', validate(createTenantSchema, 'body'), tenantController.create);

// Get all tenants with pagination
router.get('/', validate(queryTenantSchema, 'query'), tenantController.findAll);

// Get tenant by ID
router.get('/:id', validate(tenantIdSchema, 'params'), tenantController.findById);

// Update tenant
router.put('/:id', validate(tenantIdSchema, 'params'), validate(updateTenantSchema, 'body'), tenantController.update);

// Delete tenant
router.delete('/:id', validate(tenantIdSchema, 'params'), tenantController.delete);

module.exports = router;
