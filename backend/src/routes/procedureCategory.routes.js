const express = require('express');
const router = express.Router();
const procedureCategoryController = require('../controllers/procedureCategory.controller');
const {
  createProcedureCategorySchema,
  updateProcedureCategorySchema,
  queryProcedureCategorySchema,
  procedureCategoryIdSchema,
  validate,
} = require('../validation/procedure.validation');

router.post('/', validate(createProcedureCategorySchema, 'body'), procedureCategoryController.create);
router.get('/', validate(queryProcedureCategorySchema, 'query'), procedureCategoryController.findAll);
router.get('/active', procedureCategoryController.findAllActive);
router.get('/:id', validate(procedureCategoryIdSchema, 'params'), procedureCategoryController.findById);
router.put(
  '/:id',
  validate(procedureCategoryIdSchema, 'params'),
  validate(updateProcedureCategorySchema, 'body'),
  procedureCategoryController.update,
);
router.delete('/:id', validate(procedureCategoryIdSchema, 'params'), procedureCategoryController.delete);

module.exports = router;
