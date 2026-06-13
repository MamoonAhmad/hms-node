const express = require('express');
const router = express.Router();
const providerBlockHourController = require('../controllers/providerBlockHour.controller');
const {
  createProviderBlockHourSchema,
  updateProviderBlockHourSchema,
  queryProviderBlockHourSchema,
  blockValidationQuerySchema,
  providerBlockHourIdSchema,
  validate,
} = require('../validation/providerBlockHour.validation');

/**
 * @swagger
 * tags:
 *   name: Provider Block Hours
 *   description: Block specific provider hours within existing schedules
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ProviderBlockHour:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         providerId:
 *           type: string
 *           format: uuid
 *         providerName:
 *           type: string
 *         providerNpi:
 *           type: string
 *         days:
 *           type: array
 *           items:
 *             type: string
 *         startTime:
 *           type: string
 *           example: "12:00"
 *         endTime:
 *           type: string
 *           example: "13:00"
 *         effectiveStartDate:
 *           type: string
 *           format: date
 *         effectiveEndDate:
 *           type: string
 *           format: date
 *           nullable: true
 *         reason:
 *           type: string
 *         status:
 *           type: string
 *           enum: [Active, Inactive]
 *
 *     CreateProviderBlockHour:
 *       type: object
 *       required:
 *         - providerId
 *         - days
 *         - startTime
 *         - endTime
 *         - effectiveStartDate
 *       properties:
 *         providerId:
 *           type: string
 *           format: uuid
 *         days:
 *           type: array
 *           items:
 *             type: string
 *             enum: [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
 *         startTime:
 *           type: string
 *         endTime:
 *           type: string
 *         effectiveStartDate:
 *           type: string
 *           format: date
 *         effectiveEndDate:
 *           type: string
 *           format: date
 *           nullable: true
 *         reason:
 *           type: string
 *         status:
 *           type: string
 *           enum: [Active, Inactive]
 *           default: Active
 *
 *     UpdateProviderBlockHour:
 *       type: object
 *       minProperties: 1
 *       properties:
 *         providerId:
 *           type: string
 *           format: uuid
 *         days:
 *           type: array
 *           items:
 *             type: string
 *         startTime:
 *           type: string
 *         endTime:
 *           type: string
 *         effectiveStartDate:
 *           type: string
 *           format: date
 *         effectiveEndDate:
 *           type: string
 *           format: date
 *           nullable: true
 *         reason:
 *           type: string
 *         status:
 *           type: string
 *           enum: [Active, Inactive]
 */

router.post('/', validate(createProviderBlockHourSchema, 'body'), providerBlockHourController.create);
router.get('/', validate(queryProviderBlockHourSchema, 'query'), providerBlockHourController.findAll);
router.get(
  '/check-overlap',
  validate(blockValidationQuerySchema, 'query'),
  providerBlockHourController.checkOverlap,
);
router.get(
  '/validate-within-schedule',
  validate(blockValidationQuerySchema, 'query'),
  providerBlockHourController.validateWithinSchedule,
);
router.get('/:id', validate(providerBlockHourIdSchema, 'params'), providerBlockHourController.findById);
router.put(
  '/:id',
  validate(providerBlockHourIdSchema, 'params'),
  validate(updateProviderBlockHourSchema, 'body'),
  providerBlockHourController.update,
);
router.patch(
  '/:id/toggle-status',
  validate(providerBlockHourIdSchema, 'params'),
  providerBlockHourController.toggleStatus,
);
router.delete('/:id', validate(providerBlockHourIdSchema, 'params'), providerBlockHourController.delete);

module.exports = router;
