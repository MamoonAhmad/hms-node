const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');
const {
  createLocationSchema,
  updateLocationSchema,
  queryLocationSchema,
  locationIdSchema,
  validate,
} = require('../validation/location.validation');

/**
 * @swagger
 * tags:
 *   name: Locations
 *   description: Location management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Location:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Location unique identifier
 *         name:
 *           type: string
 *           description: Location name
 *         address:
 *           type: string
 *           description: Street address
 *         city:
 *           type: string
 *           description: City name
 *         state:
 *           type: string
 *           description: State or province
 *         country:
 *           type: string
 *           description: Country name
 *         phone:
 *           type: string
 *           description: Phone number
 *         isActive:
 *           type: boolean
 *           description: Whether location is active
 *         tenantId:
 *           type: string
 *           description: Tenant ID this location belongs to
 *         createdBy:
 *           type: string
 *           description: User ID who created the location
 *         updatedBy:
 *           type: string
 *           description: User ID who last updated the location
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Record creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Record last update timestamp
 *         tenant:
 *           type: object
 *           description: Associated tenant
 *         creator:
 *           type: object
 *           description: User who created the location
 *         updater:
 *           type: object
 *           description: User who last updated the location
 *
 *     CreateLocation:
 *       type: object
 *       required:
 *         - name
 *         - tenantId
 *       properties:
 *         name:
 *           type: string
 *           example: Main Hospital Campus
 *         address:
 *           type: string
 *           example: 123 Medical Center Drive
 *         city:
 *           type: string
 *           example: Boston
 *         state:
 *           type: string
 *           example: Massachusetts
 *         country:
 *           type: string
 *           example: USA
 *         phone:
 *           type: string
 *           example: +1 (555) 123-4567
 *         isActive:
 *           type: boolean
 *           default: true
 *           example: true
 *         tenantId:
 *           type: string
 *           format: uuid
 *           example: 123e4567-e89b-12d3-a456-426614174000
 *
 *     UpdateLocation:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         address:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         country:
 *           type: string
 *         phone:
 *           type: string
 *         isActive:
 *           type: boolean
 *         tenantId:
 *           type: string
 *           format: uuid
 */

// Create a new location
router.post('/', validate(createLocationSchema, 'body'), locationController.create);

// Get all locations with pagination
router.get('/', validate(queryLocationSchema, 'query'), locationController.findAll);

// Active locations for dropdowns (must be registered before '/:id')
router.get('/active', locationController.findAllActive);

// Get location by ID
router.get('/:id', validate(locationIdSchema, 'params'), locationController.findById);

// Update location
router.put('/:id', validate(locationIdSchema, 'params'), validate(updateLocationSchema, 'body'), locationController.update);

// Delete location
router.delete('/:id', validate(locationIdSchema, 'params'), locationController.delete);

module.exports = router;

