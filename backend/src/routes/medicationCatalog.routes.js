const express = require('express');
const router = express.Router();
const medicationCatalogController = require('../controllers/medicationCatalog.controller');
const {
  createMedicationCatalogSchema,
  updateMedicationCatalogSchema,
  queryMedicationCatalogSchema,
  queryActiveMedicationCatalogSchema,
  medicationCatalogIdSchema,
  validate,
} = require('../validation/medicationCatalog.validation');

router.get(
  '/active',
  validate(queryActiveMedicationCatalogSchema, 'query'),
  medicationCatalogController.search,
);
router.get(
  '/',
  validate(queryMedicationCatalogSchema, 'query'),
  medicationCatalogController.findAll,
);
router.post(
  '/',
  validate(createMedicationCatalogSchema, 'body'),
  medicationCatalogController.create,
);
router.get(
  '/:id/history',
  validate(medicationCatalogIdSchema, 'params'),
  medicationCatalogController.getHistory,
);
router.get(
  '/:id',
  validate(medicationCatalogIdSchema, 'params'),
  medicationCatalogController.findById,
);
router.put(
  '/:id',
  validate(medicationCatalogIdSchema, 'params'),
  validate(updateMedicationCatalogSchema, 'body'),
  medicationCatalogController.update,
);
router.patch(
  '/:id/activate',
  validate(medicationCatalogIdSchema, 'params'),
  medicationCatalogController.activate,
);
router.patch(
  '/:id/deactivate',
  validate(medicationCatalogIdSchema, 'params'),
  medicationCatalogController.deactivate,
);
router.delete(
  '/:id',
  validate(medicationCatalogIdSchema, 'params'),
  medicationCatalogController.delete,
);

module.exports = router;
