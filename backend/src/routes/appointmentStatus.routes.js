const express = require('express');
const router = express.Router();
const appointmentStatusController = require('../controllers/appointmentStatus.controller');
const {
  createAppointmentStatusSchema,
  updateAppointmentStatusSchema,
  queryAppointmentStatusSchema,
  appointmentStatusIdSchema,
  validate,
} = require('../validation/appointmentStatus.validation');

router.post('/', validate(createAppointmentStatusSchema, 'body'), appointmentStatusController.create);
router.get('/', validate(queryAppointmentStatusSchema, 'query'), appointmentStatusController.findAll);
router.get('/active', appointmentStatusController.findAllActive);
router.get('/:id', validate(appointmentStatusIdSchema, 'params'), appointmentStatusController.findById);
router.put(
  '/:id',
  validate(appointmentStatusIdSchema, 'params'),
  validate(updateAppointmentStatusSchema, 'body'),
  appointmentStatusController.update,
);
router.delete('/:id', validate(appointmentStatusIdSchema, 'params'), appointmentStatusController.delete);

module.exports = router;
