const express = require('express');
const clinicalNoteController = require('../controllers/clinicalNote.controller');
const {
  createClinicalNoteSchema,
  updateClinicalNoteSchema,
  addAddendumSchema,
  queryClinicalNotesSchema,
  queryChartContextSchema,
  clinicalNoteParamsSchema,
  validate,
} = require('../validation/clinicalNote.validation');

const router = express.Router({ mergeParams: true });

router.get(
  '/chart-context',
  validate(queryChartContextSchema, 'query'),
  clinicalNoteController.getChartContext,
);
router.get('/', validate(queryClinicalNotesSchema, 'query'), clinicalNoteController.findAll);
router.get(
  '/:noteId',
  validate(clinicalNoteParamsSchema, 'params'),
  clinicalNoteController.findById,
);
router.post('/', validate(createClinicalNoteSchema, 'body'), clinicalNoteController.create);
router.put(
  '/:noteId',
  validate(clinicalNoteParamsSchema, 'params'),
  validate(updateClinicalNoteSchema, 'body'),
  clinicalNoteController.update,
);
router.post(
  '/:noteId/sign',
  validate(clinicalNoteParamsSchema, 'params'),
  clinicalNoteController.sign,
);
router.post(
  '/:noteId/addendum',
  validate(clinicalNoteParamsSchema, 'params'),
  validate(addAddendumSchema, 'body'),
  clinicalNoteController.addAddendum,
);
router.delete(
  '/:noteId',
  validate(clinicalNoteParamsSchema, 'params'),
  clinicalNoteController.remove,
);

module.exports = router;
