/** Tab labels shown in registration validation banners */
export const REGISTRATION_TAB_LABELS = {
  patient: 'Demographics',
  contacts: 'Contacts',
  appointment: 'Appointment',
  insurance: 'Insurance Info',
  documents: 'Documents',
  consentForms: 'Consent Forms',
  review: 'Review',
};

/** Friendly field labels for registration validation */
const FIELD_LABELS = {
  firstName: 'First Name',
  middleName: 'Middle Name',
  lastName: 'Last Name',
  suffix: 'Suffix',
  preferredName: 'Preferred Name',
  previousName: 'Previous Name',
  dateOfBirth: 'Date of Birth',
  gender: 'Gender',
  genderIdentity: 'Gender Identity',
  pronouns: 'Pronouns',
  ssn: 'SSN (PHI)',
  preferredContactMethod: 'Preferred Contact Method',
  cellPhone: 'Cell Phone',
  homePhone: 'Home Phone',
  workPhone: 'Work Phone',
  email: 'Email',
  address: 'Address',
  addressLine2: 'Address Line 2',
  city: 'City',
  state: 'State',
  zip: 'Zip',
  country: 'Country',
  ethnicity: 'Ethnicity',
  race: 'Race',
  language: 'Language',
  interpreterRequired: 'Interpreter Required',
  interpreterLanguages: 'Interpreter Languages',
  militaryBranch: 'Military Branch',
  disabilities: 'Disabilities',
  disabilityStatus: 'Disability Status',
  veteranStatus: 'Veteran Status',
  contactNumber: 'Contact Number',
  profilePhoto: 'Patient Photo',
  governmentIdType: 'Government ID Type',
  governmentIdNumber: 'Government ID Number',
  emergencyContactName: 'Emergency Contact Name',
  emergencyContactNumber: 'Emergency Contact Phone',
  emergencyContactRelationship: 'Emergency Contact Relationship',
  emergencyContactEmail: 'Emergency Contact Email',
  guarantorName: 'Guarantor Name',
  guarantorPhone: 'Guarantor Phone',
  guarantorEmail: 'Guarantor Email',
  guarantorRelationship: 'Guarantor Relationship',
  appointmentDate: 'Appointment Date',
  appointmentTime: 'Appointment Time',
  appointmentVisitType: 'Visit Type',
  appointmentStartTime: 'Start Time',
  appointmentEndTime: 'End Time',
  visitModality: 'Visit Modality',
  appointmentProvider: 'Provider',
  appointmentDepartment: 'Department',
  referringPhysicianPhone: 'Referring Physician Phone',
  referringPhysicianFax: 'Referring Physician Fax',
  insuranceBillingType: 'Billing Type',
  billingType: 'Billing Type',
  paymentMethod: 'Payment Method',
  insuranceProviderId: 'Insurance Provider',
  policyNumber: 'Policy Number',
  subscriberPhone: 'Subscriber Phone',
  subscriberEmail: 'Subscriber Email',
  subscriberSsnLast4: 'Subscriber SSN (last 4)',
  documentsPhotoId: 'Photo ID Document',
  documentsInsuranceFront: 'Insurance Card (Front)',
  consentForms: 'Consent Forms',
  documents: 'Documents',
  patientDocuments: 'Documents',
  insurancePolicies: 'Insurance Policies',
  consentSignatures: 'Consent Signatures',
};

const FIELD_TO_TAB = {
  firstName: 'patient',
  middleName: 'patient',
  lastName: 'patient',
  suffix: 'patient',
  preferredName: 'patient',
  previousName: 'patient',
  dateOfBirth: 'patient',
  gender: 'patient',
  genderIdentity: 'patient',
  pronouns: 'patient',
  ssn: 'patient',
  preferredContactMethod: 'patient',
  cellPhone: 'patient',
  homePhone: 'patient',
  workPhone: 'patient',
  email: 'patient',
  address: 'patient',
  addressLine2: 'patient',
  city: 'patient',
  state: 'patient',
  zip: 'patient',
  country: 'patient',
  ethnicity: 'patient',
  race: 'patient',
  language: 'patient',
  interpreterRequired: 'patient',
  interpreterLanguages: 'patient',
  militaryBranch: 'patient',
  disabilities: 'patient',
  disabilityStatus: 'patient',
  veteranStatus: 'patient',
  contactNumber: 'patient',
  profilePhoto: 'patient',
  governmentIdType: 'patient',
  governmentIdNumber: 'patient',
  birthPlace: 'patient',
  maritalStatus: 'patient',
  employmentStatus: 'patient',
  employerName: 'patient',
  occupation: 'patient',
  employerPhoneNumber: 'patient',
  accessibilityRequirements: 'patient',
  accessibilityRequirementsNotes: 'patient',
  emergencyContactName: 'contacts',
  emergencyContactNumber: 'contacts',
  emergencyContactRelationship: 'contacts',
  emergencyContactEmail: 'contacts',
  emergencyContactAddress: 'contacts',
  secondaryEmergencyContactName: 'contacts',
  secondaryEmergencyContactNumber: 'contacts',
  secondaryEmergencyContactEmail: 'contacts',
  guarantorName: 'contacts',
  guarantorPhone: 'contacts',
  guarantorEmail: 'contacts',
  guarantorRelationship: 'contacts',
  guarantorAddress: 'contacts',
  guarantorDateOfBirth: 'contacts',
  authorizedRepresentativeName: 'contacts',
  authorizedRepresentativePhone: 'contacts',
  authorizedRepresentativeEmail: 'contacts',
  legalGuardianName: 'contacts',
  legalGuardianPhone: 'contacts',
  legalGuardianEmail: 'contacts',
  appointmentDate: 'appointment',
  appointmentTime: 'appointment',
  appointmentVisitType: 'appointment',
  appointmentStartTime: 'appointment',
  appointmentEndTime: 'appointment',
  visitModality: 'appointment',
  appointmentProvider: 'appointment',
  appointmentDepartment: 'appointment',
  referringPhysicianPhone: 'appointment',
  referringPhysicianFax: 'appointment',
  referringPhysicianFirstName: 'appointment',
  referringPhysicianLastName: 'appointment',
  referringPhysicianNpi: 'appointment',
  insuranceBillingType: 'insurance',
  billingType: 'insurance',
  paymentMethod: 'insurance',
  insuranceProviderId: 'insurance',
  policyNumber: 'insurance',
  copay: 'insurance',
  deductible: 'insurance',
  subscriberPhone: 'insurance',
  subscriberEmail: 'insurance',
  subscriberSsnLast4: 'insurance',
  insurancePolicies: 'insurance',
  documentsPhotoId: 'documents',
  documentsInsuranceFront: 'documents',
  documents: 'documents',
  patientDocuments: 'documents',
  consentForms: 'consentForms',
  consentSignatures: 'consentForms',
};

function rootField(field) {
  if (!field) return null;
  const raw = String(field).replace(/^"+|"+$/g, '');
  // insurancePolicies.0.memberId → insurancePolicies
  return raw.split('.')[0].split('[')[0];
}

function inferFieldFromMessage(message) {
  if (!message) return null;
  const quoted = String(message).match(/"([^"]+)"/);
  if (quoted?.[1]) return rootField(quoted[1]);
  const lower = String(message).toLowerCase();
  for (const [field, label] of Object.entries(FIELD_LABELS)) {
    if (lower.includes(label.toLowerCase()) || lower.includes(field.toLowerCase())) {
      return field;
    }
  }
  return null;
}

export function getFieldLabel(field) {
  const root = rootField(field);
  if (!root) return 'Field';
  if (FIELD_LABELS[root]) return FIELD_LABELS[root];
  // emergencyContactNumber_0 → Emergency Contact Phone
  const indexed = root.match(/^([a-zA-Z]+?)_(\d+)$/);
  if (indexed && FIELD_LABELS[indexed[1]]) {
    return `${FIELD_LABELS[indexed[1]]} #${Number(indexed[2]) + 1}`;
  }
  return root
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export function getTabForField(field) {
  const root = rootField(field);
  if (!root) return 'patient';
  if (FIELD_TO_TAB[root]) return FIELD_TO_TAB[root];
  const indexed = root.match(/^([a-zA-Z]+)/);
  if (indexed && FIELD_TO_TAB[indexed[1]]) return FIELD_TO_TAB[indexed[1]];
  if (/emergency|guarantor|guardian|nextOfKin|authorizedRepresentative/i.test(root)) {
    return 'contacts';
  }
  if (/appointment|referring/i.test(root)) return 'appointment';
  if (/insurance|subscriber|billing|policy|copay|deductible/i.test(root)) return 'insurance';
  if (/document/i.test(root)) return 'documents';
  if (/consent/i.test(root)) return 'consentForms';
  return 'patient';
}

/**
 * Normalize client-side `{ fieldKey: message }` errors into banner items.
 */
export function formatClientValidationIssues(errorMap = {}) {
  return Object.entries(errorMap)
    .filter(([, message]) => Boolean(message))
    .map(([field, message]) => {
      const tab = getTabForField(field);
      return {
        tab,
        tabLabel: REGISTRATION_TAB_LABELS[tab] || tab,
        field,
        fieldLabel: getFieldLabel(field),
        message: String(message),
      };
    });
}

/**
 * Normalize API validation errors (details/errors) into banner items.
 */
export function formatApiValidationIssues(err) {
  const details = Array.isArray(err?.details) ? err.details : [];
  if (details.length) {
    return details.map((d) => {
      const field = rootField(d.field) || inferFieldFromMessage(d.message);
      const tab = getTabForField(field);
      return {
        tab,
        tabLabel: REGISTRATION_TAB_LABELS[tab] || tab,
        field: field || null,
        fieldLabel: field ? getFieldLabel(field) : 'Form',
        message: String(d.message || 'Invalid value'),
      };
    });
  }

  const errors = Array.isArray(err?.errors) ? err.errors : [];
  if (errors.length) {
    return errors.map((message) => {
      const field = inferFieldFromMessage(message);
      const tab = getTabForField(field);
      return {
        tab,
        tabLabel: REGISTRATION_TAB_LABELS[tab] || tab,
        field,
        fieldLabel: field ? getFieldLabel(field) : 'Form',
        message: String(message),
      };
    });
  }

  const fallback = err?.message || 'Validation failed';
  return [
    {
      tab: 'patient',
      tabLabel: REGISTRATION_TAB_LABELS.patient,
      field: null,
      fieldLabel: 'Form',
      message: String(fallback),
    },
  ];
}
