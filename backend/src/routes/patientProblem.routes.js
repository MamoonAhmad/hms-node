const express = require('express');
const patientProblemController = require('../controllers/patientProblem.controller');
const {
  createPatientProblemSchema,
  updatePatientProblemSchema,
  queryPatientProblemsSchema,
  patientProblemParamsSchema,
  validate,
} = require('../validation/patientProblem.validation');

const router = express.Router({ mergeParams: true });

router.get('/', validate(queryPatientProblemsSchema, 'query'), patientProblemController.findAll);
router.get(
  '/:problemId',
  validate(patientProblemParamsSchema, 'params'),
  patientProblemController.findById,
);
router.post('/', validate(createPatientProblemSchema, 'body'), patientProblemController.create);
router.put(
  '/:problemId',
  validate(patientProblemParamsSchema, 'params'),
  validate(updatePatientProblemSchema, 'body'),
  patientProblemController.update,
);
router.delete(
  '/:problemId',
  validate(patientProblemParamsSchema, 'params'),
  patientProblemController.remove,
);

module.exports = router;
