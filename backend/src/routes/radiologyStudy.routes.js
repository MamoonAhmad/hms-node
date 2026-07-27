const express = require('express');
const router = express.Router();
const radiologyStudyController = require('../controllers/radiologyStudy.controller');
const {
  createRadiologyStudySchema,
  updateRadiologyStudySchema,
  queryRadiologyStudySchema,
  radiologyStudyIdSchema,
  validate,
} = require('../validation/radiologyStudy.validation');

router.post('/', validate(createRadiologyStudySchema, 'body'), radiologyStudyController.create);
router.get('/', validate(queryRadiologyStudySchema, 'query'), radiologyStudyController.findAll);
router.get('/active', radiologyStudyController.findAllActive);
router.get('/:id', validate(radiologyStudyIdSchema, 'params'), radiologyStudyController.findById);
router.put(
  '/:id',
  validate(radiologyStudyIdSchema, 'params'),
  validate(updateRadiologyStudySchema, 'body'),
  radiologyStudyController.update,
);
router.delete('/:id', validate(radiologyStudyIdSchema, 'params'), radiologyStudyController.delete);

module.exports = router;
