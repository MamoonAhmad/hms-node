const express = require('express');
const router = express.Router();
const procedureController = require('../controllers/procedure.controller');
const {
  createProcedureSchema,
  updateProcedureSchema,
  queryProcedureSchema,
  procedureIdSchema,
  validate,
} = require('../validation/procedure.validation');

router.post('/', validate(createProcedureSchema, 'body'), procedureController.create);
router.get('/', validate(queryProcedureSchema, 'query'), procedureController.findAll);
router.get('/:id', validate(procedureIdSchema, 'params'), procedureController.findById);
router.put(
  '/:id',
  validate(procedureIdSchema, 'params'),
  validate(updateProcedureSchema, 'body'),
  procedureController.update,
);
router.delete('/:id', validate(procedureIdSchema, 'params'), procedureController.delete);

module.exports = router;
