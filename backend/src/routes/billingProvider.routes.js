const express = require('express');
const router = express.Router();
const billingProviderController = require('../controllers/billingProvider.controller');
const {
  createBillingProviderSchema,
  updateBillingProviderSchema,
  queryBillingProviderSchema,
  billingProviderIdSchema,
  validate,
} = require('../validation/billingProvider.validation');

router.post('/', validate(createBillingProviderSchema, 'body'), billingProviderController.create);
router.get('/', validate(queryBillingProviderSchema, 'query'), billingProviderController.findAll);
router.get('/:id', validate(billingProviderIdSchema, 'params'), billingProviderController.findById);
router.put(
  '/:id',
  validate(billingProviderIdSchema, 'params'),
  validate(updateBillingProviderSchema, 'body'),
  billingProviderController.update,
);
router.delete('/:id', validate(billingProviderIdSchema, 'params'), billingProviderController.delete);

module.exports = router;
