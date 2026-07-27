const express = require('express');
const router = express.Router();
const vaccineController = require('../controllers/vaccine.controller');
const {
  createVaccineSchema,
  updateVaccineSchema,
  queryVaccineSchema,
  queryActiveVaccineSchema,
  vaccineIdSchema,
  validate,
} = require('../validation/vaccine.validation');

router.post('/', validate(createVaccineSchema, 'body'), vaccineController.create);
router.get('/active', validate(queryActiveVaccineSchema, 'query'), vaccineController.findActiveForOrders);
router.get('/', validate(queryVaccineSchema, 'query'), vaccineController.findAll);
router.get('/:id', validate(vaccineIdSchema, 'params'), vaccineController.findById);
router.put(
  '/:id',
  validate(vaccineIdSchema, 'params'),
  validate(updateVaccineSchema, 'body'),
  vaccineController.update,
);
router.delete('/:id', validate(vaccineIdSchema, 'params'), vaccineController.delete);

module.exports = router;
