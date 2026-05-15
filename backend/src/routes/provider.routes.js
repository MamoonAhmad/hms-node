const express = require('express');
const router = express.Router();
const providerController = require('../controllers/provider.controller');
const {
  createProviderSchema,
  updateProviderSchema,
  queryProviderSchema,
  providerIdSchema,
  providerNpiSchema,
  validate,
} = require('../validation/provider.validation');

// NPI lookup (must be before /:id)
router.get('/npi/:npi', validate(providerNpiSchema, 'params'), providerController.lookupByNpi);

// Create provider
router.post('/', validate(createProviderSchema, 'body'), providerController.create);

// List providers with pagination
router.get('/', validate(queryProviderSchema, 'query'), providerController.findAll);

// Get provider by id
router.get('/:id', validate(providerIdSchema, 'params'), providerController.findById);

// Update provider
router.put('/:id', validate(providerIdSchema, 'params'), validate(updateProviderSchema, 'body'), providerController.update);

// Delete provider
router.delete('/:id', validate(providerIdSchema, 'params'), providerController.delete);

module.exports = router;

