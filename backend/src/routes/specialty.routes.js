const express = require('express');
const router = express.Router();
const specialtyController = require('../controllers/specialty.controller');
const {
  createSpecialtySchema,
  updateSpecialtySchema,
  querySpecialtySchema,
  specialtyIdSchema,
  validate,
} = require('../validation/specialty.validation');

router.post('/', validate(createSpecialtySchema, 'body'), specialtyController.create);
router.get('/', validate(querySpecialtySchema, 'query'), specialtyController.findAll);
router.get('/active', specialtyController.findAllActive);
router.get('/:id', validate(specialtyIdSchema, 'params'), specialtyController.findById);
router.put('/:id', validate(specialtyIdSchema, 'params'), validate(updateSpecialtySchema, 'body'), specialtyController.update);
router.delete('/:id', validate(specialtyIdSchema, 'params'), specialtyController.delete);

module.exports = router;

