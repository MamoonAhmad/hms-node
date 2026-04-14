const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const {
  createOrdersSchema,
  queryOrdersSchema,
  validate,
} = require('../validation/order.validation');

router.post('/', validate(createOrdersSchema, 'body'), orderController.create);
router.get('/', validate(queryOrdersSchema, 'query'), orderController.findAll);

module.exports = router;
