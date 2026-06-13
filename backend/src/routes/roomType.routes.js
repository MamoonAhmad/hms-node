const express = require('express');
const router = express.Router();
const roomTypeController = require('../controllers/roomType.controller');
const {
  createRoomTypeSchema,
  updateRoomTypeSchema,
  queryRoomTypeSchema,
  roomTypeIdSchema,
  validate,
} = require('../validation/roomType.validation');

router.post('/', validate(createRoomTypeSchema, 'body'), roomTypeController.create);
router.get('/', validate(queryRoomTypeSchema, 'query'), roomTypeController.findAll);
router.get('/active', roomTypeController.findAllActive);
router.get('/:id', validate(roomTypeIdSchema, 'params'), roomTypeController.findById);
router.put(
  '/:id',
  validate(roomTypeIdSchema, 'params'),
  validate(updateRoomTypeSchema, 'body'),
  roomTypeController.update,
);
router.delete('/:id', validate(roomTypeIdSchema, 'params'), roomTypeController.delete);

module.exports = router;
