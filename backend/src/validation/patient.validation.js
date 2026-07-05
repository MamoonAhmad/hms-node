const Joi = require('joi');

const GOVERNMENT_ID_MIN_LENGTH = {
  'drivers-license': 5,
  'state-id': 5,
  passport: 6,
  other: 3,
};

const optionalString = (max = 200) => Joi.string().trim().max(max).allow('', null);
const optionalText = () => Joi.string().trim().max(5000).allow('', null);

const demographicsFields = {
  suffix: optionalString(20),
  preferredName: optionalString(100),
  previousName: optionalString(100),
  genderIdentity: Joi.string()
    .valid('male', 'female', 'non-binary', 'transgender-male', 'transgender-female', 'other', 'prefer-not-to-say')
    .allow('', null),
  pronouns: optionalString(50),
  preferredContactMethod: Joi.string().valid('cell', 'home', 'work', 'email')
    .messages({
      'any.only': 'Preferred contact method must be cell, home, work, or email',
    }),
  addressLine2: optionalString(200),
  city: optionalString(100),
  state: optionalString(50),
  zip: optionalString(20),
  country: Joi.string().trim().max(50).default('US'),
  homePhone: optionalString(30),
  workPhone: optionalString(30),
  cellPhone: optionalString(30),
  governmentIdType: Joi.string()
    .valid('drivers-license', 'state-id', 'passport', 'other')
    .allow('', null),
  governmentIdNumber: optionalString(50),
  birthPlace: optionalString(200),
  veteranStatus: Joi.string().valid('yes', 'no', 'unknown').allow('', null),
  disabilityStatus: Joi.string()
    .valid('yes', 'no', 'unknown', 'prefer-not-to-say')
    .allow('', null),
  tribalAffiliation: optionalString(200),
  generalNotes: optionalText(),
  ethnicity: optionalString(50),
  sexualOrientation: optionalString(50),
  race: optionalString(50),
  language: optionalString(50),
  interpreterRequired: Joi.boolean().default(false),
  interpreterLanguageRequired: optionalString(50),
  maritalStatus: optionalString(50),
  employmentStatus: optionalString(50),
  employerName: optionalString(200),
  occupation: optionalString(100),
  employerPhoneNumber: optionalString(30),
  employerStreetAddress: optionalString(500),
  employerCity: optionalString(100),
  employerState: optionalString(50),
  employerZip: optionalString(20),
  otherInfo: optionalText(),
};

const contactFields = {
  emergencyContactName: optionalString(200),
  emergencyContactNumber: optionalString(30),
  emergencyContactRelationship: Joi.string()
    .valid('spouse', 'parent', 'child', 'sibling', 'other')
    .allow('', null),
  emergencyContactEmail: Joi.string().trim().email().allow('', null)
    .messages({ 'string.email': 'Invalid emergency contact email format' }),
  emergencyContactAddress: optionalString(500),
  emergencyContactCity: optionalString(100),
  emergencyContactState: optionalString(50),
  emergencyContactZip: optionalString(20),
  secondaryEmergencyContactName: optionalString(200),
  secondaryEmergencyContactRelationship: Joi.string()
    .valid('spouse', 'parent', 'child', 'sibling', 'other')
    .allow('', null),
  secondaryEmergencyContactNumber: optionalString(30),
  secondaryEmergencyContactEmail: Joi.string().trim().email().allow('', null)
    .messages({ 'string.email': 'Invalid secondary emergency contact email format' }),
  guarantorName: optionalString(200),
  guarantorPhone: optionalString(30),
  guarantorRelationship: Joi.string().valid('self', 'spouse', 'parent', 'child', 'other').allow('', null),
  guarantorEmail: Joi.string().trim().email().allow('', null)
    .messages({ 'string.email': 'Invalid guarantor email format' }),
  guarantorAddress: optionalString(500),
  guarantorCity: optionalString(100),
  guarantorState: optionalString(50),
  guarantorZip: optionalString(20),
  guarantorDateOfBirth: Joi.date().iso().max('now').allow('', null)
    .messages({ 'date.max': 'Guarantor date of birth cannot be in the future' }),
  authorizedRepresentativeName: optionalString(200),
  authorizedRepresentativeRelationship: Joi.string()
    .valid('spouse', 'parent', 'child', 'sibling', 'other')
    .allow('', null),
  authorizedRepresentativePhone: optionalString(30),
  authorizedRepresentativeEmail: Joi.string().trim().email().allow('', null)
    .messages({ 'string.email': 'Invalid authorized representative email format' }),
  legalGuardianName: optionalString(200),
  legalGuardianRelationship: Joi.string()
    .valid('spouse', 'parent', 'child', 'sibling', 'other')
    .allow('', null),
  legalGuardianPhone: optionalString(30),
  legalGuardianEmail: Joi.string().trim().email().allow('', null)
    .messages({ 'string.email': 'Invalid legal guardian email format' }),
  patientIsMinor: Joi.boolean().default(false),
  primaryNextOfKinName: optionalString(200),
  primaryNextOfKinRelationship: Joi.string()
    .valid('spouse', 'parent', 'child', 'sibling', 'other')
    .allow('', null),
  primaryNextOfKinPhone: optionalString(30),
  secondaryNextOfKinName: optionalString(200),
  secondaryNextOfKinRelationship: Joi.string()
    .valid('spouse', 'parent', 'child', 'sibling', 'other')
    .allow('', null),
  secondaryNextOfKinPhone: optionalString(30),
};

const subscriberFields = {
  subscriberPhone: optionalString(30),
  subscriberSsnLast4: Joi.string().trim().length(4).pattern(/^\d{4}$/).allow('', null)
    .messages({ 'string.length': 'Subscriber SSN last 4 must be exactly 4 digits' }),
  subscriberEmployer: optionalString(200),
  subscriberAddress: optionalString(500),
  subscriberCity: optionalString(100),
  subscriberState: optionalString(50),
  subscriberZip: optionalString(20),
  subscriberEmail: Joi.string().trim().email().allow('', null)
    .messages({ 'string.email': 'Invalid subscriber email format' }),
};

function isPatientMinorFromDob(dateOfBirth) {
  if (!dateOfBirth) return false;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age < 18;
}

function applyContactRules(value, helpers) {
  if (value.registrationChannel === 'appointment') {
    return value;
  }

  const emergencyName = value.emergencyContactName?.trim();
  if (emergencyName) {
    if (!value.emergencyContactNumber?.trim()) {
      return helpers.message('Emergency contact phone is required when emergency contact name is provided');
    }
    if (!value.emergencyContactRelationship) {
      return helpers.message(
        'Emergency contact relationship is required when emergency contact name is provided',
      );
    }
  }

  const requiresGuardian =
    isPatientMinorFromDob(value.dateOfBirth) || value.patientIsMinor === true;
  if (requiresGuardian) {
    if (!value.legalGuardianName?.trim()) {
      return helpers.message('Legal guardian name is required for minor patients');
    }
    if (!value.legalGuardianRelationship) {
      return helpers.message('Legal guardian relationship is required for minor patients');
    }
    if (!value.legalGuardianPhone?.trim()) {
      return helpers.message('Legal guardian phone is required for minor patients');
    }
  }

  return value;
}

function applyPreferredContactRules(value, helpers) {
  const method = value.preferredContactMethod;
  const phone = (v) => (v && String(v).trim() ? String(v).trim() : '');

  if (method === 'cell' && !phone(value.cellPhone) && !phone(value.contactNumber)) {
    return helpers.message('Cell phone is required when cell is the preferred contact method');
  }
  if (method === 'home' && !phone(value.homePhone)) {
    return helpers.message('Home phone is required when home is the preferred contact method');
  }
  if (method === 'work' && !phone(value.workPhone)) {
    return helpers.message('Work phone is required when work is the preferred contact method');
  }
  if (method === 'email' && !value.email?.trim()) {
    return helpers.message('Email is required when email is the preferred contact method');
  }

  return value;
}

function applyGovernmentIdRules(value, helpers) {
  const idNumber = value.governmentIdNumber?.trim();
  if (!idNumber) return value;

  const idType = value.governmentIdType || 'other';
  const minLen = GOVERNMENT_ID_MIN_LENGTH[idType] ?? GOVERNMENT_ID_MIN_LENGTH.other;
  if (idNumber.length < minLen) {
    return helpers.message(
      `Government ID number must be at least ${minLen} characters for the selected ID type`,
    );
  }
  return value;
}

function resolveContactNumber(value) {
  const method = value.preferredContactMethod || 'cell';
  const phone = (v) => (v && String(v).trim() ? String(v).trim() : '');

  if (method === 'home') return phone(value.homePhone) || phone(value.contactNumber);
  if (method === 'work') return phone(value.workPhone) || phone(value.contactNumber);
  if (method === 'email') return value.email?.trim() || phone(value.contactNumber);
  return phone(value.cellPhone) || phone(value.contactNumber);
}

/**
 * Schema for creating a patient
 */
const createPatientSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100).required()
    .messages({
      'string.empty': 'First name is required',
      'any.required': 'First name is required',
    }),
  middleName: optionalString(100),
  lastName: Joi.string().trim().min(1).max(100).required()
    .messages({
      'string.empty': 'Last name is required',
      'any.required': 'Last name is required',
    }),
  dateOfBirth: Joi.date().iso().max('now').required()
    .messages({
      'date.max': 'Date of birth cannot be in the future',
      'any.required': 'Date of birth is required',
    }),
  gender: Joi.string().lowercase().valid('male', 'female', 'other').required()
    .messages({
      'any.only': 'Gender must be male, female, or other',
      'any.required': 'Gender is required',
      'string.empty': 'Gender is required',
    }),
  contactNumber: Joi.string().trim().max(30).allow('', null),
  email: Joi.string().trim().email().allow('', null)
    .messages({
      'string.email': 'Invalid email format',
    }),
  address: optionalString(500),
  insuranceProviderId: Joi.string().uuid().allow('', null)
    .messages({
      'string.guid': 'Invalid insurance provider ID format',
    }),
  policyNumber: optionalString(100),
  copay: Joi.number().min(0).precision(2).allow(null)
    .messages({
      'number.min': 'Copay must be a positive number',
    }),
  deductible: Joi.number().min(0).precision(2).allow(null)
    .messages({
      'number.min': 'Deductible must be a positive number',
    }),
  primaryCarePhysician: optionalString(200),
  referringPhysicianFirstName: optionalString(100),
  referringPhysicianLastName: optionalString(100),
  referringPhysicianNpi: optionalString(20),
  referringPhysicianPhone: optionalString(30),
  referringPhysicianFax: optionalString(30),
  referringPhysicianAddress: optionalString(500),
  referringPhysicianCity: optionalString(100),
  referringPhysicianState: optionalString(50),
  referringPhysicianZip: optionalString(20),
  profilePhoto: Joi.string().trim().max(4_000_000).allow('', null),
  registrationChannel: Joi.string().trim().max(50).allow('', null),
  ...demographicsFields,
  preferredContactMethod: demographicsFields.preferredContactMethod.required()
    .messages({
      'any.required': 'Preferred contact method is required',
    }),
  ...contactFields,
  ...subscriberFields,
})
  .custom(applyPreferredContactRules)
  .custom(applyGovernmentIdRules)
  .custom(applyContactRules)
  .custom((value, helpers) => {
    const contactNumber = resolveContactNumber(value);
    if (!contactNumber) {
      return helpers.message('A contact number or email is required for the preferred contact method');
    }
    return { ...value, contactNumber };
  });

/**
 * Schema for updating a patient
 */
const updatePatientSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100)
    .messages({
      'string.empty': 'First name cannot be empty',
    }),
  middleName: optionalString(100),
  lastName: Joi.string().trim().min(1).max(100)
    .messages({
      'string.empty': 'Last name cannot be empty',
    }),
  dateOfBirth: Joi.date().iso().max('now')
    .messages({
      'date.max': 'Date of birth cannot be in the future',
    }),
  gender: Joi.string().lowercase().valid('male', 'female', 'other')
    .messages({
      'any.only': 'Gender must be male, female, or other',
    }),
  contactNumber: Joi.string().trim().max(30).allow('', null),
  email: Joi.string().trim().email().allow('', null)
    .messages({
      'string.email': 'Invalid email format',
    }),
  address: optionalString(500),
  insuranceProviderId: Joi.string().uuid().allow('', null)
    .messages({
      'string.guid': 'Invalid insurance provider ID format',
    }),
  policyNumber: optionalString(100),
  copay: Joi.number().min(0).precision(2).allow(null)
    .messages({
      'number.min': 'Copay must be a positive number',
    }),
  deductible: Joi.number().min(0).precision(2).allow(null)
    .messages({
      'number.min': 'Deductible must be a positive number',
    }),
  primaryCarePhysician: optionalString(200),
  referringPhysicianFirstName: optionalString(100),
  referringPhysicianLastName: optionalString(100),
  referringPhysicianNpi: optionalString(20),
  referringPhysicianPhone: optionalString(30),
  referringPhysicianFax: optionalString(30),
  referringPhysicianAddress: optionalString(500),
  referringPhysicianCity: optionalString(100),
  referringPhysicianState: optionalString(50),
  referringPhysicianZip: optionalString(20),
  profilePhoto: Joi.string().trim().max(4_000_000).allow('', null),
  ...demographicsFields,
  ...contactFields,
  ...subscriberFields,
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  })
  .custom((value, helpers) => {
    if (value.preferredContactMethod) {
      return applyPreferredContactRules(value, helpers);
    }
    return value;
  })
  .custom((value, helpers) => applyGovernmentIdRules(value, helpers))
  .custom((value, helpers) => applyContactRules(value, helpers))
  .custom((value, helpers) => {
    if (!value.preferredContactMethod && value.contactNumber === undefined) {
      return value;
    }
    const contactNumber = resolveContactNumber({
      preferredContactMethod: value.preferredContactMethod || 'cell',
      cellPhone: value.cellPhone,
      homePhone: value.homePhone,
      workPhone: value.workPhone,
      email: value.email,
      contactNumber: value.contactNumber,
    });
    if (value.preferredContactMethod && !contactNumber) {
      return helpers.message('A contact number or email is required for the preferred contact method');
    }
    if (contactNumber) {
      return { ...value, contactNumber };
    }
    return value;
  });

/**
 * Schema for query parameters (pagination & search)
 */
const queryPatientSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(10),
  search: Joi.string().trim().max(100).allow(''),
  gender: Joi.string().lowercase().valid('male', 'female', 'other', 'm', 'f'),
  insuranceProviderId: Joi.string().uuid(),
  insuranceProviderIds: Joi.string().trim().allow(''),
  insurancePayerIds: Joi.string().trim().allow(''),
  mrn: Joi.string().trim().max(100).allow(''),
  firstName: Joi.string().trim().max(100).allow(''),
  lastName: Joi.string().trim().max(100).allow(''),
  dateFrom: Joi.string().trim().allow(''),
  dateTo: Joi.string().trim().allow(''),
  registrationStatus: Joi.string().valid('draft', 'pending', 'completed').allow(''),
  consentForm: Joi.string().valid('signed', 'not_signed').allow(''),
  insuranceType: Joi.string().valid('primary', 'secondary', 'tertiary').allow(''),
  providerIds: Joi.string().trim().allow(''),
  listTab: Joi.string().valid('all', 'draft', 'my_list').allow(''),
  assignedToId: Joi.string().uuid(),
});

const checkDuplicatesSchema = Joi.object({
  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().required(),
  dateOfBirth: Joi.alternatives().try(Joi.date(), Joi.string()).required(),
  contactNumber: Joi.string().trim().allow('', null),
  address: Joi.string().trim().allow('', null),
  excludeId: Joi.string().uuid().allow(null),
});

/**
 * Schema for patient ID parameter
 */
const patientIdSchema = Joi.object({
  id: Joi.string().uuid().required()
    .messages({
      'string.guid': 'Invalid patient ID format',
      'any.required': 'Patient ID is required',
    }),
});

/**
 * Schema for MRN parameter
 */
const patientMrnSchema = Joi.object({
  mrn: Joi.string().trim().required()
    .messages({
      'string.empty': 'MRN is required',
      'any.required': 'MRN is required',
    }),
});

const patientSummaryQuerySchema = Joi.object({
  encounterId: Joi.string().uuid().allow('', null),
  mrn: Joi.string().trim().max(100).allow('', null),
});

/**
 * Validation middleware factory
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => {
        if (detail.type === 'any.custom' && detail.context?.message) {
          return detail.context.message;
        }
        return detail.message;
      });
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
  createPatientSchema,
  updatePatientSchema,
  queryPatientSchema,
  checkDuplicatesSchema,
  patientIdSchema,
  patientMrnSchema,
  patientSummaryQuerySchema,
  validate,
};
