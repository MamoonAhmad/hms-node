const express = require('express');
const router = express.Router();
const labTestController = require('../controllers/labTest.controller');
const {
  createLabTestSchema,
  updateLabTestSchema,
  queryLabTestSchema,
  labTestIdSchema,
  validate,
} = require('../validation/labTest.validation');

router.post('/', validate(createLabTestSchema, 'body'), labTestController.create);
router.get('/', validate(queryLabTestSchema, 'query'), labTestController.findAll);
router.get('/active', labTestController.findAllActive);
router.get('/:id', validate(labTestIdSchema, 'params'), labTestController.findById);
router.put(
  '/:id',
  validate(labTestIdSchema, 'params'),
  validate(updateLabTestSchema, 'body'),
  labTestController.update,
);
router.delete('/:id', validate(labTestIdSchema, 'params'), labTestController.delete);

module.exports = router;
