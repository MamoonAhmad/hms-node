const express = require('express');
const router = express.Router();
const providerScheduleController = require('../controllers/providerSchedule.controller');
const {
  createProviderScheduleSchema,
  updateProviderScheduleSchema,
  queryProviderScheduleSchema,
  checkOverlapSchema,
  providerScheduleIdSchema,
  validate,
} = require('../validation/providerSchedule.validation');

/**
 * @swagger
 * tags:
 *   name: Provider Schedules
 *   description: Provider availability schedule management for appointment booking
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ProviderSchedule:
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
 *         specialty:
 *           type: string
 *         subSpecialty:
 *           type: string
 *         days:
 *           type: array
 *           items:
 *             type: string
 *         startTime:
 *           type: string
 *           example: "09:00"
 *         endTime:
 *           type: string
 *           example: "17:00"
 *         slotDuration:
 *           type: integer
 *         appointmentType:
 *           type: array
 *           items:
 *             type: string
 *         appointmentTypeIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *         maxAppointmentsPerSlot:
 *           type: integer
 *         overBooking:
 *           type: integer
 *         locations:
 *           type: array
 *           items:
 *             type: string
 *         locationIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *         effectiveStartDate:
 *           type: string
 *           format: date
 *         effectiveEndDate:
 *           type: string
 *           format: date
 *           nullable: true
 *         endOnEffectiveDate:
 *           type: boolean
 *         status:
 *           type: string
 *           enum: [Active, Inactive]
 *         displayStatus:
 *           type: string
 *           enum: [Active, Inactive]
 *         teleconsultationAllowed:
 *           type: boolean
 *
 *     CreateProviderSchedule:
 *       type: object
 *       required:
 *         - providerId
 *         - days
 *         - startTime
 *         - endTime
 *         - slotDuration
 *         - appointmentTypeIds
 *         - maxAppointmentsPerSlot
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
 *           example: "09:00"
 *         endTime:
 *           type: string
 *           example: "17:00"
 *         slotDuration:
 *           type: integer
 *           example: 30
 *         appointmentTypeIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *         maxAppointmentsPerSlot:
 *           type: integer
 *           example: 1
 *         overBooking:
 *           type: integer
 *           default: 0
 *         locationIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *         effectiveStartDate:
 *           type: string
 *           format: date
 *         effectiveEndDate:
 *           type: string
 *           format: date
 *           nullable: true
 *         endOnEffectiveDate:
 *           type: boolean
 *           default: false
 *         status:
 *           type: string
 *           enum: [Active, Inactive]
 *           default: Active
 *         teleconsultationAllowed:
 *           type: boolean
 *           default: false
 *
 *     UpdateProviderSchedule:
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
 *         slotDuration:
 *           type: integer
 *         appointmentTypeIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *         maxAppointmentsPerSlot:
 *           type: integer
 *         overBooking:
 *           type: integer
 *         locationIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *         effectiveStartDate:
 *           type: string
 *           format: date
 *         effectiveEndDate:
 *           type: string
 *           format: date
 *           nullable: true
 *         endOnEffectiveDate:
 *           type: boolean
 *         status:
 *           type: string
 *           enum: [Active, Inactive]
 *         teleconsultationAllowed:
 *           type: boolean
 */

router.post('/', validate(createProviderScheduleSchema, 'body'), providerScheduleController.create);
router.get('/', validate(queryProviderScheduleSchema, 'query'), providerScheduleController.findAll);
router.get('/check-overlap', validate(checkOverlapSchema, 'query'), providerScheduleController.checkOverlap);
router.get('/:id', validate(providerScheduleIdSchema, 'params'), providerScheduleController.findById);
router.put(
  '/:id',
  validate(providerScheduleIdSchema, 'params'),
  validate(updateProviderScheduleSchema, 'body'),
  providerScheduleController.update,
);
router.patch('/:id/toggle-status', validate(providerScheduleIdSchema, 'params'), providerScheduleController.toggleStatus);
router.delete('/:id', validate(providerScheduleIdSchema, 'params'), providerScheduleController.delete);

module.exports = router;
