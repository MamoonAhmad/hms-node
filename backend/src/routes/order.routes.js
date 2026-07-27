const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const {
  createOrdersSchema,
  queryOrdersSchema,
  orderIdParamSchema,
  updateOrderStatusSchema,
  updateOrderSpecimenSchema,
  validate,
} = require('../validation/order.validation');

router.post('/', validate(createOrdersSchema, 'body'), orderController.create);
router.get('/', validate(queryOrdersSchema, 'query'), orderController.findAll);
router.get('/:id', validate(orderIdParamSchema, 'params'), orderController.findById);
router.patch(
  '/:id/status',
  validate(orderIdParamSchema, 'params'),
  validate(updateOrderStatusSchema, 'body'),
  orderController.updateStatus,
);
router.patch(
  '/:id/specimen',
  validate(orderIdParamSchema, 'params'),
  validate(updateOrderSpecimenSchema, 'body'),
  orderController.updateSpecimen,
);

module.exports = router;
