const express = require('express');
const router = express.Router();
const chiefComplaintController = require('../controllers/chiefComplaint.controller');
const {
  createChiefComplaintSchema,
  updateChiefComplaintSchema,
  queryChiefComplaintSchema,
  chiefComplaintIdSchema,
  validate,
} = require('../validation/chiefComplaint.validation');

router.post('/', validate(createChiefComplaintSchema, 'body'), chiefComplaintController.create);
router.get('/', validate(queryChiefComplaintSchema, 'query'), chiefComplaintController.findAll);
router.get('/active', chiefComplaintController.findAllActive);
router.get('/:id', validate(chiefComplaintIdSchema, 'params'), chiefComplaintController.findById);
router.put(
  '/:id',
  validate(chiefComplaintIdSchema, 'params'),
  validate(updateChiefComplaintSchema, 'body'),
  chiefComplaintController.update,
);
router.post(
  '/:id/favourite/toggle',
  validate(chiefComplaintIdSchema, 'params'),
  chiefComplaintController.toggleFavourite,
);
router.delete('/:id', validate(chiefComplaintIdSchema, 'params'), chiefComplaintController.delete);

module.exports = router;
