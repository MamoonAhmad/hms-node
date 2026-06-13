const express = require('express');
const router = express.Router();
const consentFormController = require('../controllers/consentForm.controller');
const {
  createConsentFormSchema,
  updateConsentFormSchema,
  queryConsentFormSchema,
  consentFormIdSchema,
  validate,
} = require('../validation/consentForm.validation');

router.post('/', validate(createConsentFormSchema, 'body'), consentFormController.create);
router.get('/', validate(queryConsentFormSchema, 'query'), consentFormController.findAll);
router.get('/:id', validate(consentFormIdSchema, 'params'), consentFormController.findById);
router.put(
  '/:id',
  validate(consentFormIdSchema, 'params'),
  validate(updateConsentFormSchema, 'body'),
  consentFormController.update,
);
router.delete('/:id', validate(consentFormIdSchema, 'params'), consentFormController.delete);

module.exports = router;
