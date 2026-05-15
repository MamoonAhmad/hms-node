const express = require('express');
const router = express.Router();
const subSpecialtyController = require('../controllers/subSpecialty.controller');
const {
  createSubSpecialtySchema,
  updateSubSpecialtySchema,
  querySubSpecialtySchema,
  subSpecialtyIdSchema,
  validate,
} = require('../validation/subSpecialty.validation');

router.post('/', validate(createSubSpecialtySchema, 'body'), subSpecialtyController.create);
router.get('/', validate(querySubSpecialtySchema, 'query'), subSpecialtyController.findAll);
router.get('/:id', validate(subSpecialtyIdSchema, 'params'), subSpecialtyController.findById);
router.put('/:id', validate(subSpecialtyIdSchema, 'params'), validate(updateSubSpecialtySchema, 'body'), subSpecialtyController.update);
router.delete('/:id', validate(subSpecialtyIdSchema, 'params'), subSpecialtyController.delete);

module.exports = router;

