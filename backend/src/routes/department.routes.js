const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/department.controller');
const {
  createDepartmentSchema,
  updateDepartmentSchema,
  queryDepartmentSchema,
  departmentIdSchema,
  validate,
} = require('../validation/department.validation');

router.post('/', validate(createDepartmentSchema, 'body'), departmentController.create);
router.get('/', validate(queryDepartmentSchema, 'query'), departmentController.findAll);
router.get('/active', departmentController.findAllActive);
router.get('/:id', validate(departmentIdSchema, 'params'), departmentController.findById);
router.put('/:id', validate(departmentIdSchema, 'params'), validate(updateDepartmentSchema, 'body'), departmentController.update);
router.delete('/:id', validate(departmentIdSchema, 'params'), departmentController.delete);

module.exports = router;
