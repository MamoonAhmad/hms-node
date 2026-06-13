const express = require('express');
const router = express.Router();
const appointmentTypeController = require('../controllers/appointmentType.controller');
const {
  createAppointmentTypeSchema,
  updateAppointmentTypeSchema,
  queryAppointmentTypeSchema,
  appointmentTypeIdSchema,
  validate,
} = require('../validation/appointmentType.validation');

/**
 * @swagger
 * tags:
 *   name: Appointment Types
 *   description: Appointment type catalogue management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AppointmentType:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           description: Display name of the appointment type
 *         description:
 *           type: string
 *           nullable: true
 *         defaultTime:
 *           type: number
 *           format: float
 *           nullable: true
 *           description: Default duration in minutes
 *         isActive:
 *           type: boolean
 *         sortOrder:
 *           type: integer
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdBy:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         updatedBy:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         deletedBy:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         creator:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             email:
 *               type: string
 *         updater:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             email:
 *               type: string
 *         deleter:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             email:
 *               type: string
 *
 *     CreateAppointmentType:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: Follow-up Visit
 *         description:
 *           type: string
 *           example: Standard follow-up consultation
 *         defaultTime:
 *           type: number
 *           format: float
 *           example: 30
 *           description: Default duration in minutes
 *         isActive:
 *           type: boolean
 *           default: true
 *         sortOrder:
 *           type: integer
 *           default: 0
 *
 *     UpdateAppointmentType:
 *       type: object
 *       minProperties: 1
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         defaultTime:
 *           type: number
 *           format: float
 *           nullable: true
 *         isActive:
 *           type: boolean
 *         sortOrder:
 *           type: integer
 */

router.post('/', validate(createAppointmentTypeSchema, 'body'), appointmentTypeController.create);
router.get('/', validate(queryAppointmentTypeSchema, 'query'), appointmentTypeController.findAll);
router.get('/active', appointmentTypeController.findAllActive);
router.get('/:id', validate(appointmentTypeIdSchema, 'params'), appointmentTypeController.findById);
router.put(
  '/:id',
  validate(appointmentTypeIdSchema, 'params'),
  validate(updateAppointmentTypeSchema, 'body'),
  appointmentTypeController.update,
);
router.delete('/:id', validate(appointmentTypeIdSchema, 'params'), appointmentTypeController.delete);

module.exports = router;
