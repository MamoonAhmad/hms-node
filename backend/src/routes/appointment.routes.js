const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const {
  createAppointmentSchema,
  updateAppointmentSchema,
  queryAppointmentSchema,
  statusCountsQuerySchema,
  availabilityDatesQuerySchema,
  availabilitySlotsQuerySchema,
  updateStatusSchema,
  appointmentIdSchema,
  validate,
} = require('../validation/appointment.validation');

router.post('/', validate(createAppointmentSchema, 'body'), appointmentController.create);
router.get('/', validate(queryAppointmentSchema, 'query'), appointmentController.findAll);
router.get(
  '/status-counts',
  validate(statusCountsQuerySchema, 'query'),
  appointmentController.getStatusCounts,
);
router.get(
  '/availability/dates',
  validate(availabilityDatesQuerySchema, 'query'),
  appointmentController.getAvailableDates,
);
router.get(
  '/availability/slots',
  validate(availabilitySlotsQuerySchema, 'query'),
  appointmentController.getAvailableSlots,
);
router.get('/today', appointmentController.getTodayAppointments);
router.get('/:id/history', validate(appointmentIdSchema, 'params'), appointmentController.getHistory);
router.get('/:id', validate(appointmentIdSchema, 'params'), appointmentController.findById);
router.put(
  '/:id',
  validate(appointmentIdSchema, 'params'),
  validate(updateAppointmentSchema, 'body'),
  appointmentController.update,
);
router.patch(
  '/:id/status',
  validate(appointmentIdSchema, 'params'),
  validate(updateStatusSchema, 'body'),
  appointmentController.updateStatus,
);
router.delete('/:id', validate(appointmentIdSchema, 'params'), appointmentController.delete);

module.exports = router;
