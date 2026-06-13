const express = require('express');
const router = express.Router();
const bedController = require('../controllers/bed.controller');
const {
  createBedSchema,
  updateBedSchema,
  queryBedSchema,
  bedIdSchema,
  validate,
} = require('../validation/bed.validation');

router.post('/', validate(createBedSchema, 'body'), bedController.create);
router.get('/', validate(queryBedSchema, 'query'), bedController.findAll);
router.get('/summary', bedController.getSummary);
router.get('/:id', validate(bedIdSchema, 'params'), bedController.findById);
router.put(
  '/:id',
  validate(bedIdSchema, 'params'),
  validate(updateBedSchema, 'body'),
  bedController.update,
);
router.delete('/:id', validate(bedIdSchema, 'params'), bedController.delete);

module.exports = router;
