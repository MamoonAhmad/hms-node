const express = require('express');
const router = express.Router();
const customOrderSetController = require('../controllers/customOrderSet.controller');
const {
  createCustomOrderSetSchema,
  updateCustomOrderSetSchema,
  searchCustomOrderSetSchema,
  queryCustomOrderSetSchema,
  customOrderSetIdSchema,
  validate,
} = require('../validation/customOrderSet.validation');

router.get('/', validate(queryCustomOrderSetSchema, 'query'), customOrderSetController.findAll);
router.get('/search', validate(searchCustomOrderSetSchema, 'query'), customOrderSetController.search);
router.get('/:id', validate(customOrderSetIdSchema, 'params'), customOrderSetController.findById);
router.post('/', validate(createCustomOrderSetSchema, 'body'), customOrderSetController.create);
router.put(
  '/:id',
  validate(customOrderSetIdSchema, 'params'),
  validate(updateCustomOrderSetSchema, 'body'),
  customOrderSetController.update,
);
router.delete('/:id', validate(customOrderSetIdSchema, 'params'), customOrderSetController.delete);

module.exports = router;
