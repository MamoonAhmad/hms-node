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
  ssn: Joi.string()
    .trim()
    .pattern(/^\d{3}-?\d{2}-?\d{4}$|^$/)
    .allow('', null)
    .messages({
      'string.pattern.base': 'SSN must be 9 digits (XXX-XX-XXXX)',
    }),
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
  cellPhone: Joi.string().trim().min(1).max(30).required()
    .messages({
      'string.empty': 'Cell phone is required',
      'any.required': 'Cell phone is required',
    }),
  governmentIdType: Joi.string()
    .valid('drivers-license', 'state-id', 'passport', 'other')
    .allow('', null),
  governmentIdNumber: optionalString(50),
  birthPlace: optionalString(200),
  veteranStatus: Joi.string().valid('yes', 'no', 'unknown').allow('', null),
  militaryBranch: optionalString(50),
  disabilityStatus: Joi.string()
    .valid('yes', 'no', 'unknown', 'prefer-not-to-say')
    .allow('', null),
  disabilities: optionalText(),
  tribalAffiliation: optionalString(200),
  generalNotes: optionalText(),
  ethnicity: optionalString(50),
  sexualOrientation: optionalString(50),
  race: optionalString(50),
  language: optionalString(50),
  interpreterRequired: Joi.boolean().default(false),
  interpreterLanguageRequired: optionalString(50),
  interpreterLanguages: optionalText(),
  noEmail: Joi.boolean().default(false),
  visitModality: optionalString(50),
  accessibilityRequirements: optionalText(),
  accessibilityRequirementsNotes: optionalText(),
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

const insuranceListItemSchema = Joi.object({
  id: Joi.string().trim().allow('', null),
  insuranceTypeKey: Joi.string().trim().allow('', null),
  insuranceType: Joi.string().trim().allow('', null),
  insuranceProviderId: Joi.string().uuid().allow('', null),
  insuranceCompany: Joi.string().uuid().allow('', null),
  payerId: Joi.string().uuid().allow('', null),
  payerName: optionalString(200),
  memberId: optionalString(100),
  policyNumber: optionalString(100),
  policyType: optionalString(100),
  planName: optionalString(200),
  groupNumber: optionalString(100),
  subscriberFirstName: optionalString(100),
  subscriberLastName: optionalString(100),
  subscriberName: optionalString(200),
  subscriberRelationship: optionalString(50),
  relationshipToPatient: optionalString(50),
  subscriberGender: optionalString(20),
  subscriberDateOfBirth: Joi.alternatives().try(Joi.date(), Joi.string()).allow('', null),
  subscriberPhone: optionalString(30),
  subscriberEmail: Joi.string().trim().email().allow('', null),
  subscriberSsnLast4: optionalString(10),
  subscriberEmployer: optionalString(200),
  subscriberStreetAddress: optionalString(500),
  subscriberAddress: optionalString(500),
  subscriberCity: optionalString(100),
  subscriberState: optionalString(50),
  subscriberZip: optionalString(20),
  coverageStartDate: Joi.alternatives().try(Joi.date(), Joi.string()).allow('', null),
  coverageEndDate: Joi.alternatives().try(Joi.date(), Joi.string()).allow('', null),
  effectiveDate: Joi.alternatives().try(Joi.date(), Joi.string()).allow('', null),
  coverageDate: Joi.alternatives().try(Joi.date(), Joi.string()).allow('', null),
  coinsurancePercentage: Joi.alternatives()
    .try(Joi.number().min(0).max(100), Joi.string().allow(''))
    .allow(null),
  copay: Joi.alternatives()
    .try(Joi.number().min(0), Joi.string().allow(''))
    .allow(null),
  deductible: Joi.alternatives()
    .try(Joi.number().min(0), Joi.string().allow(''))
    .allow(null),
  authorizationNumber: optionalString(100),
});

const consentSignatureSchema = Joi.object({
  consentFormId: Joi.string().uuid().required(),
  signatureType: Joi.string().valid('typed', 'drawn').allow('', null),
  signatureData: Joi.string().max(4_000_000).allow('', null),
  scrolledToEnd: Joi.boolean().allow(null),
  nameMatched: Joi.boolean().allow(null),
});

const patientDocumentSubmitSchema = Joi.object({
  id: Joi.string().trim().allow('', null),
  documentName: optionalString(200),
  documentCategory: optionalString(100),
  fileName: optionalString(255),
  fileRef: optionalString(255),
  requiredDocumentType: optionalString(100),
  governmentIdType: optionalString(50),
  documentExpirationDate: Joi.alternatives().try(Joi.date(), Joi.string()).allow('', null),
  insuranceCardSide: optionalString(20),
  documentNotes: optionalText(),
});

const registrationPayloadFields = {
  registrationChannel: Joi.string().trim().max(50).allow('', null),
  registrationStatus: Joi.string().valid('draft', 'pending', 'completed').allow('', null),
  consentFormSigned: Joi.boolean().allow(null),
  insuranceList: Joi.array().items(insuranceListItemSchema).max(10).optional(),
  consentSignatures: Joi.array().items(consentSignatureSchema).max(20).optional(),
  documents: Joi.array().items(patientDocumentSubmitSchema).max(50).optional(),
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
  if (value.registrationChannel === 'appointment' || value.registrationChannel === 'registration_only') {
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
  // Home and work phones are optional even when selected as preferred contact method.
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
  const cell = phone(value.cellPhone) || phone(value.contactNumber);

  if (method === 'home') return phone(value.homePhone) || cell;
  if (method === 'work') return phone(value.workPhone) || cell;
  if (method === 'email') return value.email?.trim() || cell;
  return cell;
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
      'string.email': 'Please enter a valid email address.',
    }),
  address: optionalString(500),
  insuranceProviderId: Joi.string().uuid().allow('', null)
    .messages({
      'string.guid': 'Invalid insurance provider ID format',
    }),
  policyNumber: optionalString(100),
  copay: Joi.alternatives()
    .try(Joi.number().min(0).precision(2), Joi.string().allow(''))
    .allow(null)
    .messages({
      'number.min': 'Copay must be a positive number',
    }),
  deductible: Joi.alternatives()
    .try(Joi.number().min(0).precision(2), Joi.string().allow(''))
    .allow(null)
    .messages({
      'number.min': 'Deductible must be a positive number',
    }),
  coinsurancePercentage: Joi.alternatives()
    .try(Joi.number().min(0).max(100), Joi.string().allow(''))
    .allow(null),
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
  billingType: Joi.string().valid('insurance', 'self_pay', 'self-pay').required()
    .messages({
      'any.required': 'Billing type is required',
      'any.only': 'Billing type must be Self Pay or Insurance',
    }),
  ...registrationPayloadFields,
  ...demographicsFields,
  preferredContactMethod: demographicsFields.preferredContactMethod.required()
    .messages({
      'any.required': 'Preferred contact method is required',
    }),
  ...contactFields,
  ...subscriberFields,
})
  .custom((value, helpers) => {
    // Quick add-from-appointment registration does not collect race/ethnicity.
    const isAppointmentQuickReg = value.registrationChannel === 'appointment';
    if (!isAppointmentQuickReg) {
      if (!value.ethnicity?.trim()) {
        return helpers.message('Ethnicity is required');
      }
      if (!value.race?.trim()) {
        return helpers.message('Race is required');
      }
    }
    return value;
  })
  .custom((value, helpers) => {
    if (value.noEmail) return value;
    if (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim())) {
      return helpers.message('Please enter a valid email address.');
    }
    return value;
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
      'string.email': 'Please enter a valid email address.',
    }),
  address: optionalString(500),
  insuranceProviderId: Joi.string().uuid().allow('', null)
    .messages({
      'string.guid': 'Invalid insurance provider ID format',
    }),
  policyNumber: optionalString(100),
  copay: Joi.alternatives()
    .try(Joi.number().min(0).precision(2), Joi.string().allow(''))
    .allow(null)
    .messages({
      'number.min': 'Copay must be a positive number',
    }),
  deductible: Joi.alternatives()
    .try(Joi.number().min(0).precision(2), Joi.string().allow(''))
    .allow(null)
    .messages({
      'number.min': 'Deductible must be a positive number',
    }),
  coinsurancePercentage: Joi.alternatives()
    .try(Joi.number().min(0).max(100), Joi.string().allow(''))
    .allow(null),
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
  billingType: Joi.string().valid('insurance', 'self_pay', 'self-pay'),
  ...registrationPayloadFields,
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
  departmentId: Joi.string().uuid().allow('', null),
  listTab: Joi.string().valid('all', 'my_list', 'registration_queue').allow(''),
  assignedToId: Joi.string().uuid(),
});

const checkDuplicatesSchema = Joi.object({
  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().required(),
  dateOfBirth: Joi.alternatives().try(Joi.date(), Joi.string()).required(),
  contactNumber: Joi.string().trim().required(),
  excludeId: Joi.string().uuid().allow(null),
});

const deletePatientConfirmSchema = Joi.object({
  firstName: Joi.string().trim().required(),
  middleName: Joi.string().trim().allow('', null),
  lastName: Joi.string().trim().required(),
});

const patientDocumentIdSchema = Joi.object({
  id: Joi.string().uuid().required(),
  documentId: Joi.string().uuid().required(),
});

const updatePatientDocumentSchema = Joi.object({
  title: Joi.string().trim().max(200).allow('', null),
  documentName: Joi.string().trim().max(200).allow('', null),
  documentType: Joi.string().trim().max(200).allow('', null),
  category: Joi.string().trim().max(100).allow('', null),
  encounterId: Joi.string().uuid().allow('', null),
  description: Joi.string().trim().max(2000).allow('', null),
  documentDate: Joi.date().iso().allow(null),
  expirationDate: Joi.date().iso().allow(null),
  isConfidential: Joi.boolean().optional(),
  patientVisible: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(20).optional(),
  status: Joi.string()
    .valid('Active', 'Expired', 'Archived', 'Deleted', 'Replaced', 'Pending Review', 'Verified')
    .optional(),
  fileName: Joi.string().trim().max(255).allow('', null),
  fileData: Joi.string().allow('', null),
  mimeType: Joi.string().trim().max(100).allow('', null),
  fileSize: Joi.number().integer().min(0).allow(null),
});

const createPatientDocumentSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required()
    .messages({ 'any.required': 'This field is required.' }),
  documentType: Joi.string().trim().min(1).max(200).required()
    .messages({ 'any.required': 'This field is required.' }),
  category: Joi.string().trim().min(1).max(100).required()
    .messages({ 'any.required': 'This field is required.' }),
  source: Joi.string().trim().max(100).optional(),
  encounterId: Joi.string().uuid().allow('', null),
  description: Joi.string().trim().max(2000).allow('', null),
  documentDate: Joi.date().iso().allow(null),
  expirationDate: Joi.date().iso().allow(null),
  isConfidential: Joi.boolean().optional(),
  patientVisible: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(20).optional(),
  fileName: Joi.string().trim().min(1).max(255).required()
    .messages({ 'any.required': 'Please select a file to upload.' }),
  fileData: Joi.string().required()
    .messages({ 'any.required': 'Please select a file to upload.' }),
  mimeType: Joi.string().trim().max(100).required(),
  fileSize: Joi.number().integer().min(0).optional(),
});

const queryPatientDocumentSchema = Joi.object({
  search: Joi.string().trim().max(200).optional(),
  documentType: Joi.string().trim().max(200).optional(),
  category: Joi.string().trim().max(100).optional(),
  source: Joi.string().trim().max(100).optional(),
  status: Joi.string()
    .valid('Active', 'Expired', 'Archived', 'Deleted', 'Replaced', 'Pending Review', 'Verified')
    .optional(),
  uploadedBy: Joi.string().uuid().optional(),
  encounterId: Joi.string().uuid().optional(),
  includeArchived: Joi.boolean().truthy('true', '1').falsy('false', '0', '').optional(),
  patientVisible: Joi.boolean().truthy('true', '1').falsy('false', '0', '').optional(),
  confidential: Joi.boolean().truthy('true', '1').falsy('false', '0', '').optional(),
});

const replacePatientDocumentSchema = Joi.object({
  fileName: Joi.string().trim().min(1).max(255).required(),
  fileData: Joi.string().required(),
  mimeType: Joi.string().trim().max(100).required(),
  fileSize: Joi.number().integer().min(0).optional(),
  replaceReason: Joi.string().trim().max(500).allow('', null),
});

const updatePatientDocumentStatusSchema = Joi.object({
  status: Joi.string()
    .valid('Active', 'Expired', 'Archived', 'Deleted', 'Replaced', 'Pending Review', 'Verified')
    .required(),
});

const documentAuditSchema = Joi.object({
  action: Joi.string().valid('viewed', 'downloaded', 'printed').required(),
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
  encounterId: Joi.string().uuid().optional()
    .messages({
      'string.guid': 'Invalid encounter ID format',
    }),
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
      const details = error.details.map((detail) => {
        const message =
          detail.type === 'any.custom' && detail.context?.message
            ? detail.context.message
            : detail.message;
        const field = Array.isArray(detail.path) && detail.path.length
          ? detail.path.join('.')
          : null;
        return { field, message: String(message) };
      });
      const errors = details.map((d) => d.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
        details,
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
  deletePatientConfirmSchema,
  patientDocumentIdSchema,
  updatePatientDocumentSchema,
  createPatientDocumentSchema,
  queryPatientDocumentSchema,
  replacePatientDocumentSchema,
  updatePatientDocumentStatusSchema,
  documentAuditSchema,
  patientIdSchema,
  patientMrnSchema,
  patientSummaryQuerySchema,
  validate,
};
