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
  cancelOrNoShowSchema,
  rescheduleSchema,
  policyPreviewQuerySchema,
  reasonCodesQuerySchema,
  eligibilityBodySchema,
  checkInBodySchema,
  paymentBodySchema,
  coverageBodySchema,
  authorizationBodySchema,
  authorizationUpdateSchema,
  authorizationIdParamsSchema,
  notificationBodySchema,
  roomAssignmentBodySchema,
  telehealthBodySchema,
  referralBodySchema,
  recurringBodySchema,
  weekCalendarQuerySchema,
  reportsQuerySchema,
  policyUpdateSchema,
  validate,
} = require('../validation/appointment.validation');

router.post('/', validate(createAppointmentSchema, 'body'), appointmentController.create);
router.post(
  '/self-schedule',
  validate(createAppointmentSchema, 'body'),
  appointmentController.selfSchedule,
);
router.post(
  '/recurring',
  validate(recurringBodySchema, 'body'),
  appointmentController.createRecurring,
);
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
router.get('/policy', appointmentController.getPolicy);
router.put('/policy', validate(policyUpdateSchema, 'body'), appointmentController.updatePolicy);
router.get(
  '/reason-codes',
  validate(reasonCodesQuerySchema, 'query'),
  appointmentController.getReasonCodes,
);
router.get(
  '/calendar/week',
  validate(weekCalendarQuerySchema, 'query'),
  appointmentController.getWeekCalendar,
);
router.get('/reports', validate(reportsQuerySchema, 'query'), appointmentController.getReports);
router.get('/rooms', appointmentController.listRooms);
router.post('/jobs/auto-no-show', appointmentController.runAutoNoShow);

router.get(
  '/:id/policy-preview',
  validate(appointmentIdSchema, 'params'),
  validate(policyPreviewQuerySchema, 'query'),
  appointmentController.getPolicyPreview,
);
router.post(
  '/:id/cancel',
  validate(appointmentIdSchema, 'params'),
  validate(cancelOrNoShowSchema, 'body'),
  appointmentController.cancel,
);
router.post(
  '/:id/no-show',
  validate(appointmentIdSchema, 'params'),
  validate(cancelOrNoShowSchema, 'body'),
  appointmentController.markNoShow,
);
router.post(
  '/:id/reschedule',
  validate(appointmentIdSchema, 'params'),
  validate(rescheduleSchema, 'body'),
  appointmentController.reschedule,
);

router.post(
  '/:id/eligibility',
  validate(appointmentIdSchema, 'params'),
  validate(eligibilityBodySchema, 'body'),
  appointmentController.verifyEligibility,
);
router.get(
  '/:id/eligibility',
  validate(appointmentIdSchema, 'params'),
  appointmentController.getEligibility,
);
router.put(
  '/:id/coverage',
  validate(appointmentIdSchema, 'params'),
  validate(coverageBodySchema, 'body'),
  appointmentController.setCoverage,
);

router.post(
  '/:id/confirm',
  validate(appointmentIdSchema, 'params'),
  appointmentController.confirm,
);
router.post(
  '/:id/arrive',
  validate(appointmentIdSchema, 'params'),
  appointmentController.markArrived,
);
router.post(
  '/:id/check-in',
  validate(appointmentIdSchema, 'params'),
  validate(checkInBodySchema, 'body'),
  appointmentController.checkIn,
);
router.post(
  '/:id/ready',
  validate(appointmentIdSchema, 'params'),
  appointmentController.markReady,
);
router.post(
  '/:id/start',
  validate(appointmentIdSchema, 'params'),
  appointmentController.startVisit,
);
router.post(
  '/:id/complete',
  validate(appointmentIdSchema, 'params'),
  appointmentController.complete,
);
router.post(
  '/:id/check-out',
  validate(appointmentIdSchema, 'params'),
  appointmentController.checkOut,
);

router.get(
  '/:id/ledger',
  validate(appointmentIdSchema, 'params'),
  appointmentController.getLedger,
);
router.post(
  '/:id/payments',
  validate(appointmentIdSchema, 'params'),
  validate(paymentBodySchema, 'body'),
  appointmentController.collectPayment,
);

router.post(
  '/:id/authorization',
  validate(appointmentIdSchema, 'params'),
  validate(authorizationBodySchema, 'body'),
  appointmentController.createAuthorization,
);
router.get(
  '/:id/authorization',
  validate(appointmentIdSchema, 'params'),
  appointmentController.getAuthorizations,
);
router.patch(
  '/:id/authorization/:authId',
  validate(authorizationIdParamsSchema, 'params'),
  validate(authorizationUpdateSchema, 'body'),
  appointmentController.updateAuthorization,
);

router.post(
  '/:id/notifications',
  validate(appointmentIdSchema, 'params'),
  validate(notificationBodySchema, 'body'),
  appointmentController.sendNotification,
);
router.get(
  '/:id/notifications',
  validate(appointmentIdSchema, 'params'),
  appointmentController.getNotifications,
);

router.post(
  '/:id/room-assignment',
  validate(appointmentIdSchema, 'params'),
  validate(roomAssignmentBodySchema, 'body'),
  appointmentController.assignRoom,
);
router.delete(
  '/:id/room-assignment',
  validate(appointmentIdSchema, 'params'),
  appointmentController.releaseRoom,
);

router.put(
  '/:id/telehealth',
  validate(appointmentIdSchema, 'params'),
  validate(telehealthBodySchema, 'body'),
  appointmentController.upsertTelehealth,
);
router.post(
  '/:id/referral',
  validate(appointmentIdSchema, 'params'),
  validate(referralBodySchema, 'body'),
  appointmentController.createReferral,
);

router.get(
  '/:id/transitions',
  validate(appointmentIdSchema, 'params'),
  appointmentController.getAllowedTransitions,
);
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
