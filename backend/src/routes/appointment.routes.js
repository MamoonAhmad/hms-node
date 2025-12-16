const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const {
  createAppointmentSchema,
  updateAppointmentSchema,
  queryAppointmentSchema,
  appointmentIdSchema,
  validate,
} = require('../validation/appointment.validation');

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Appointment management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         appointmentDate:
 *           type: string
 *           format: date
 *         appointmentTime:
 *           type: string
 *           example: "09:30"
 *         appointmentType:
 *           type: string
 *           enum: [New, Follow-up, Televisit]
 *         visitReason:
 *           type: string
 *         department:
 *           type: string
 *         provider:
 *           type: string
 *         status:
 *           type: string
 *           enum: [Scheduled, Checked-In, In Progress, Completed, Cancelled, No-Show, Rescheduled]
 *         notes:
 *           type: string
 *         patientId:
 *           type: string
 *           format: uuid
 *         patient:
 *           $ref: '#/components/schemas/Patient'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreateAppointment:
 *       type: object
 *       required:
 *         - patientId
 *         - appointmentDate
 *         - appointmentTime
 *         - appointmentType
 *       properties:
 *         patientId:
 *           type: string
 *           format: uuid
 *         appointmentDate:
 *           type: string
 *           format: date
 *           example: "2024-12-20"
 *         appointmentTime:
 *           type: string
 *           example: "09:30"
 *         appointmentType:
 *           type: string
 *           enum: [New, Follow-up, Televisit]
 *           example: "New"
 *         visitReason:
 *           type: string
 *           example: "Annual checkup"
 *         department:
 *           type: string
 *           example: "General Medicine"
 *         provider:
 *           type: string
 *           example: "Dr. Jane Smith"
 *         status:
 *           type: string
 *           enum: [Scheduled, Checked-In, In Progress, Completed, Cancelled, No-Show, Rescheduled]
 *           default: Scheduled
 *         notes:
 *           type: string
 *
 *     UpdateAppointment:
 *       type: object
 *       properties:
 *         appointmentDate:
 *           type: string
 *           format: date
 *         appointmentTime:
 *           type: string
 *         appointmentType:
 *           type: string
 *           enum: [New, Follow-up, Televisit]
 *         visitReason:
 *           type: string
 *         department:
 *           type: string
 *         provider:
 *           type: string
 *         status:
 *           type: string
 *           enum: [Scheduled, Checked-In, In Progress, Completed, Cancelled, No-Show, Rescheduled]
 *         notes:
 *           type: string
 */

// Create a new appointment
router.post('/', validate(createAppointmentSchema, 'body'), appointmentController.create);

// Get all appointments with pagination and filters
router.get('/', validate(queryAppointmentSchema, 'query'), appointmentController.findAll);

// Get today's appointments
router.get('/today', appointmentController.getTodayAppointments);

// Get appointment by ID
router.get('/:id', validate(appointmentIdSchema, 'params'), appointmentController.findById);

// Update appointment
router.put('/:id', validate(appointmentIdSchema, 'params'), validate(updateAppointmentSchema, 'body'), appointmentController.update);

// Update appointment status
router.patch('/:id/status', validate(appointmentIdSchema, 'params'), appointmentController.updateStatus);

// Delete appointment
router.delete('/:id', validate(appointmentIdSchema, 'params'), appointmentController.delete);

module.exports = router;

