const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');
const {
  createRoomSchema,
  updateRoomSchema,
  queryRoomSchema,
  roomIdSchema,
  validate,
} = require('../validation/room.validation');

router.post('/', validate(createRoomSchema, 'body'), roomController.create);
router.get('/', validate(queryRoomSchema, 'query'), roomController.findAll);
router.get('/active', roomController.findAllActive);
router.get('/summary', roomController.getSummary);
router.get('/:id', validate(roomIdSchema, 'params'), roomController.findById);
router.put(
  '/:id',
  validate(roomIdSchema, 'params'),
  validate(updateRoomSchema, 'body'),
  roomController.update,
);
router.delete('/:id', validate(roomIdSchema, 'params'), roomController.delete);

module.exports = router;
