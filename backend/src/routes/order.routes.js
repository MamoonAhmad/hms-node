const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const {
  createOrdersSchema,
  updateOrderSchema,
  batchUpdateOrdersSchema,
  queryOrdersSchema,
  searchProceduresSchema,
  orderIdParamSchema,
  validate,
} = require('../validation/order.validation');

router.get('/sites', orderController.getSites);
router.get('/search-procedures', validate(searchProceduresSchema, 'query'), orderController.searchProcedures);
router.post('/', validate(createOrdersSchema, 'body'), orderController.create);
router.get('/', validate(queryOrdersSchema, 'query'), orderController.findAll);
router.put('/batch', validate(batchUpdateOrdersSchema, 'body'), orderController.batchUpdate);
router.put(
  '/:id',
  validate(orderIdParamSchema, 'params'),
  validate(updateOrderSchema, 'body'),
  orderController.update,
);
router.delete('/:id', validate(orderIdParamSchema, 'params'), orderController.delete);

module.exports = router;
