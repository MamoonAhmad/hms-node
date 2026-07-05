const express = require('express');
const router = express.Router();
const trackingBoardController = require('../controllers/trackingBoard.controller');
const {
  queryTrackingBoardSchema,
  assignRoomSchema,
  appointmentIdSchema,
  validate,
} = require('../validation/trackingBoard.validation');

router.get('/', validate(queryTrackingBoardSchema, 'query'), trackingBoardController.findAll);
router.patch(
  '/:appointmentId/assign-room',
  validate(appointmentIdSchema, 'params'),
  validate(assignRoomSchema, 'body'),
  trackingBoardController.assignRoom,
);

module.exports = router;
