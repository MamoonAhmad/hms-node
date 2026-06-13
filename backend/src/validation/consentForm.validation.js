const Joi = require('joi');
const {
  CONSENT_TYPE_VALUES,
  CONSENT_STATUS_VALUES,
  SIGNATURE_PLACEMENT_VALUES,
  CONSENT_LIST_TABS,
} = require('../constants/consentForm.constants');

const optionalPlacement = Joi.string()
  .valid(...SIGNATURE_PLACEMENT_VALUES, '', null)
  .allow('', null);

const consentFormFields = {
  consentTitle: Joi.string().trim().min(1).max(300).messages({
    'string.empty': 'Consent title is required',
  }),
  consentType: Joi.string()
    .valid(...CONSENT_TYPE_VALUES)
    .messages({ 'any.only': 'Invalid consent type' }),
  description: Joi.string().trim().max(2000).allow('', null),
  consentContent: Joi.string().trim().min(1).messages({
    'string.empty': 'Consent content is required',
  }),
  isMandatory: Joi.boolean(),
  isSignatureRequired: Joi.boolean(),
  patientSignaturePlacement: optionalPlacement,
  requiresWitnessSignature: Joi.boolean(),
  witnessSignaturePlacement: optionalPlacement,
  requiresProviderSignature: Joi.boolean(),
  providerSignaturePlacement: optionalPlacement,
  effectiveDate: Joi.date().iso().allow('', null),
  expiryDate: Joi.date().iso().allow('', null),
  status: Joi.string().valid(...CONSENT_STATUS_VALUES),
  department: Joi.string().trim().max(200).allow('', null),
  language: Joi.string().trim().max(100).allow('', null),
  versionNumber: Joi.string().trim().max(50).allow('', null),
  tags: Joi.string().trim().max(500).allow('', null),
  attachmentName: Joi.string().trim().max(255).allow('', null),
  attachmentDataUrl: Joi.string().allow('', null),
};

const createConsentFormSchema = Joi.object({
  ...consentFormFields,
  consentTitle: consentFormFields.consentTitle.required(),
  consentType: consentFormFields.consentType.required(),
  consentContent: consentFormFields.consentContent.required(),
  isMandatory: Joi.boolean().default(false),
  isSignatureRequired: Joi.boolean().default(true),
  requiresWitnessSignature: Joi.boolean().default(false),
  requiresProviderSignature: Joi.boolean().default(false),
  status: Joi.string().valid(...CONSENT_STATUS_VALUES).default('draft'),
})
  .custom((value, helpers) => validateSignatureRules(value, helpers))
  .messages({
    'any.custom': '{{#message}}',
  });

const updateConsentFormSchema = Joi.object(consentFormFields)
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

function validateSignatureRules(value, helpers) {
  const isSignatureRequired = value.isSignatureRequired !== false;
  if (value.isSignatureRequired === true && !value.patientSignaturePlacement) {
    return helpers.error('any.custom', {
      message: 'Select where the patient signature should appear',
    });
  }
  if (value.isSignatureRequired === false) {
    value.patientSignaturePlacement = value.patientSignaturePlacement || null;
  }
  if (value.requiresWitnessSignature && !value.witnessSignaturePlacement) {
    return helpers.error('any.custom', {
      message: 'Select where the witness signature should appear',
    });
  }
  if (value.requiresProviderSignature && !value.providerSignaturePlacement) {
    return helpers.error('any.custom', {
      message: 'Select where the provider signature should appear',
    });
  }
  if (value.isSignatureRequired === undefined && isSignatureRequired === false) {
    // no-op
  }
  return value;
}

const queryConsentFormSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(10),
  search: Joi.string().trim().max(200).allow(''),
  tab: Joi.string().valid(...CONSENT_LIST_TABS).default('all'),
});

const consentFormIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid consent form ID format',
    'any.required': 'Consent form ID is required',
  }),
});

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((d) => d.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    req[property] = value;
    next();
  };
};

module.exports = {
  createConsentFormSchema,
  updateConsentFormSchema,
  queryConsentFormSchema,
  consentFormIdSchema,
  validate,
};
