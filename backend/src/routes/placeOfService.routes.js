const express = require('express');
const router = express.Router();
const placeOfServiceController = require('../controllers/placeOfService.controller');
const {
  createPlaceOfServiceSchema,
  updatePlaceOfServiceSchema,
  queryPlaceOfServiceSchema,
  lookupQuerySchema,
  placeOfServiceIdSchema,
  validate,
} = require('../validation/placeOfService.validation');

router.get('/lookup', validate(lookupQuerySchema, 'query'), placeOfServiceController.lookup);
router.post('/', validate(createPlaceOfServiceSchema, 'body'), placeOfServiceController.create);
router.get('/', validate(queryPlaceOfServiceSchema, 'query'), placeOfServiceController.findAll);
router.get('/:id', validate(placeOfServiceIdSchema, 'params'), placeOfServiceController.findById);
router.put(
  '/:id',
  validate(placeOfServiceIdSchema, 'params'),
  validate(updatePlaceOfServiceSchema, 'body'),
  placeOfServiceController.update,
);
router.delete('/:id', validate(placeOfServiceIdSchema, 'params'), placeOfServiceController.delete);

module.exports = router;
