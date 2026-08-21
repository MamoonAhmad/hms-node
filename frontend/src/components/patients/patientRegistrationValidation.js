const FIELD_META = {
  prefix: { tab: 'patient', tabLabel: 'Demographics', section: 'Basic Patient Information', fieldLabel: 'Prefix' },
  firstName: { tab: 'patient', tabLabel: 'Demographics', section: 'Basic Patient Information', fieldLabel: 'First Name' },
  lastName: { tab: 'patient', tabLabel: 'Demographics', section: 'Basic Patient Information', fieldLabel: 'Last Name' },
  suffix: { tab: 'patient', tabLabel: 'Demographics', section: 'Basic Patient Information', fieldLabel: 'Suffix' },
  gender: { tab: 'patient', tabLabel: 'Demographics', section: 'Basic Patient Information', fieldLabel: 'Gender' },
  dateOfBirth: { tab: 'patient', tabLabel: 'Demographics', section: 'Basic Patient Information', fieldLabel: 'Date of Birth' },
  email: { tab: 'patient', tabLabel: 'Demographics', section: 'Basic Patient Information', fieldLabel: 'Email' },
  noEmailReason: { tab: 'patient', tabLabel: 'Demographics', section: 'Basic Patient Information', fieldLabel: 'No email reason' },
  address: { tab: 'patient', tabLabel: 'Demographics', section: 'Residential Address', fieldLabel: 'Address' },
  city: { tab: 'patient', tabLabel: 'Demographics', section: 'Residential Address', fieldLabel: 'City' },
  state: { tab: 'patient', tabLabel: 'Demographics', section: 'Residential Address', fieldLabel: 'State' },
  zip: { tab: 'patient', tabLabel: 'Demographics', section: 'Residential Address', fieldLabel: 'ZIP' },
  country: { tab: 'patient', tabLabel: 'Demographics', section: 'Residential Address', fieldLabel: 'Country' },
  mailingCountry: { tab: 'patient', tabLabel: 'Demographics', section: 'Mailing Address', fieldLabel: 'Country' },
  mailingZip: { tab: 'patient', tabLabel: 'Demographics', section: 'Mailing Address', fieldLabel: 'ZIP' },
  mailingState: { tab: 'patient', tabLabel: 'Demographics', section: 'Mailing Address', fieldLabel: 'State' },
  preferredContactMethod: { tab: 'patient', tabLabel: 'Demographics', section: 'Contact Preferences', fieldLabel: 'Preferred contact method' },
  cellPhone: { tab: 'patient', tabLabel: 'Demographics', section: 'Contact Preferences', fieldLabel: 'Cell Phone' },
  homePhone: { tab: 'patient', tabLabel: 'Demographics', section: 'Contact Preferences', fieldLabel: 'Home Phone' },
  workPhone: { tab: 'patient', tabLabel: 'Demographics', section: 'Contact Preferences', fieldLabel: 'Work Phone' },
  governmentIdNumber: { tab: 'patient', tabLabel: 'Demographics', section: 'Identification', fieldLabel: 'Government ID number' },
  ssnLast4: { tab: 'patient', tabLabel: 'Demographics', section: 'Identification', fieldLabel: 'Patient SSN (last 4)' },
  birthPlace: { tab: 'patient', tabLabel: 'Demographics', section: 'Care & Reporting', fieldLabel: 'Place of birth' },
  veteranStatus: { tab: 'patient', tabLabel: 'Demographics', section: 'Care & Reporting', fieldLabel: 'Veteran status' },
  veteranStatusDetail: { tab: 'patient', tabLabel: 'Demographics', section: 'Care & Reporting', fieldLabel: 'Veteran status detail' },
  disabilityStatus: { tab: 'patient', tabLabel: 'Demographics', section: 'Care & Reporting', fieldLabel: 'Disability status' },
  disabilityType: { tab: 'patient', tabLabel: 'Demographics', section: 'Care & Reporting', fieldLabel: 'Disability type' },
  languages: { tab: 'patient', tabLabel: 'Demographics', section: 'Meaningful Use', fieldLabel: 'Languages' },
  language: { tab: 'patient', tabLabel: 'Demographics', section: 'Meaningful Use', fieldLabel: 'Languages' },
  interpreterLanguageRequired: { tab: 'patient', tabLabel: 'Demographics', section: 'Meaningful Use', fieldLabel: 'Interpreter language' },
  interpreterLanguages: { tab: 'patient', tabLabel: 'Demographics', section: 'Meaningful Use', fieldLabel: 'Interpreter language' },
  employerPhoneNumber: { tab: 'patient', tabLabel: 'Demographics', section: 'Employment', fieldLabel: 'Employer phone number' },
  employerState: { tab: 'patient', tabLabel: 'Demographics', section: 'Employment', fieldLabel: 'Employer state' },
  employerZip: { tab: 'patient', tabLabel: 'Demographics', section: 'Employment', fieldLabel: 'Employer ZIP' },
  hipaaRoiEmail: { tab: 'patient', tabLabel: 'Demographics', section: 'HIPAA / Release of Information', fieldLabel: 'HIPAA contact email' },
  hipaaRoiPhone: { tab: 'patient', tabLabel: 'Demographics', section: 'HIPAA / Release of Information', fieldLabel: 'HIPAA contact phone' },
  preferredPharmacyPhone: { tab: 'patient', tabLabel: 'Demographics', section: 'Preferred Pharmacy', fieldLabel: 'Pharmacy phone' },
  profilePhoto: { tab: 'patient', tabLabel: 'Demographics', section: 'Basic Patient Information', fieldLabel: 'Profile photo' },

  emergencyContactName: { tab: 'contacts', tabLabel: 'Contacts', section: 'Emergency Contact', fieldLabel: 'Emergency contact name' },
  emergencyContactNumber: { tab: 'contacts', tabLabel: 'Contacts', section: 'Emergency Contact', fieldLabel: 'Emergency contact number' },
  emergencyContactRelationship: { tab: 'contacts', tabLabel: 'Contacts', section: 'Emergency Contact', fieldLabel: 'Relationship to patient' },
  emergencyContactEmail: { tab: 'contacts', tabLabel: 'Contacts', section: 'Emergency Contact', fieldLabel: 'Email' },
  emergencyContactState: { tab: 'contacts', tabLabel: 'Contacts', section: 'Emergency Contact', fieldLabel: 'State' },
  emergencyContactZip: { tab: 'contacts', tabLabel: 'Contacts', section: 'Emergency Contact', fieldLabel: 'ZIP' },
  secondaryEmergencyContactNumber: { tab: 'contacts', tabLabel: 'Contacts', section: 'Secondary Emergency Contact', fieldLabel: 'Phone' },
  secondaryEmergencyContactEmail: { tab: 'contacts', tabLabel: 'Contacts', section: 'Secondary Emergency Contact', fieldLabel: 'Email' },
  secondaryEmergencyContactState: { tab: 'contacts', tabLabel: 'Contacts', section: 'Secondary Emergency Contact', fieldLabel: 'State' },
  secondaryEmergencyContactZip: { tab: 'contacts', tabLabel: 'Contacts', section: 'Secondary Emergency Contact', fieldLabel: 'ZIP' },
  authorizedRepresentativePhone: { tab: 'contacts', tabLabel: 'Contacts', section: 'Authorized Representative', fieldLabel: 'Phone' },
  authorizedRepresentativeEmail: { tab: 'contacts', tabLabel: 'Contacts', section: 'Authorized Representative', fieldLabel: 'Email' },
  authorizedRepresentativeState: { tab: 'contacts', tabLabel: 'Contacts', section: 'Authorized Representative', fieldLabel: 'State' },
  authorizedRepresentativeZip: { tab: 'contacts', tabLabel: 'Contacts', section: 'Authorized Representative', fieldLabel: 'ZIP' },
  legalGuardianName: { tab: 'contacts', tabLabel: 'Contacts', section: 'Legal Guardian', fieldLabel: 'Legal guardian name' },
  legalGuardianRelationship: { tab: 'contacts', tabLabel: 'Contacts', section: 'Legal Guardian', fieldLabel: 'Relationship' },
  legalGuardianPhone: { tab: 'contacts', tabLabel: 'Contacts', section: 'Legal Guardian', fieldLabel: 'Phone' },
  legalGuardianEmail: { tab: 'contacts', tabLabel: 'Contacts', section: 'Legal Guardian', fieldLabel: 'Email' },
  legalGuardianState: { tab: 'contacts', tabLabel: 'Contacts', section: 'Legal Guardian', fieldLabel: 'State' },
  legalGuardianZip: { tab: 'contacts', tabLabel: 'Contacts', section: 'Legal Guardian', fieldLabel: 'ZIP' },
  primaryNextOfKinPhone: { tab: 'contacts', tabLabel: 'Contacts', section: 'Primary Next of Kin', fieldLabel: 'Phone number' },
  primaryNextOfKinRelationship: { tab: 'contacts', tabLabel: 'Contacts', section: 'Primary Next of Kin', fieldLabel: 'Relationship to patient' },
  primaryNextOfKinState: { tab: 'contacts', tabLabel: 'Contacts', section: 'Primary Next of Kin', fieldLabel: 'State' },
  primaryNextOfKinZip: { tab: 'contacts', tabLabel: 'Contacts', section: 'Primary Next of Kin', fieldLabel: 'ZIP' },
  secondaryNextOfKinPhone: { tab: 'contacts', tabLabel: 'Contacts', section: 'Secondary Next of Kin', fieldLabel: 'Phone' },
  secondaryNextOfKinState: { tab: 'contacts', tabLabel: 'Contacts', section: 'Secondary Next of Kin', fieldLabel: 'State' },
  secondaryNextOfKinZip: { tab: 'contacts', tabLabel: 'Contacts', section: 'Secondary Next of Kin', fieldLabel: 'ZIP' },
  guarantorPhone: { tab: 'contacts', tabLabel: 'Contacts', section: 'Guarantor Information', fieldLabel: 'Guarantor phone' },
  guarantorEmail: { tab: 'contacts', tabLabel: 'Contacts', section: 'Guarantor Information', fieldLabel: 'Guarantor email' },
  guarantorState: { tab: 'contacts', tabLabel: 'Contacts', section: 'Guarantor Information', fieldLabel: 'State' },
  guarantorZip: { tab: 'contacts', tabLabel: 'Contacts', section: 'Guarantor Information', fieldLabel: 'ZIP' },

  appointmentProvider: { tab: 'appointment', tabLabel: 'Appointment', section: 'Outpatient Appointment', fieldLabel: 'Provider' },
  appointmentDepartment: { tab: 'appointment', tabLabel: 'Appointment', section: 'Outpatient Appointment', fieldLabel: 'Department' },
  appointmentVisitType: { tab: 'appointment', tabLabel: 'Appointment', section: 'Outpatient Appointment', fieldLabel: 'Appointment type' },
  appointmentDate: { tab: 'appointment', tabLabel: 'Appointment', section: 'Outpatient Appointment', fieldLabel: 'Appointment date' },
  appointmentTime: { tab: 'appointment', tabLabel: 'Appointment', section: 'Outpatient Appointment', fieldLabel: 'Appointment time' },
  appointmentStartTime: { tab: 'appointment', tabLabel: 'Appointment', section: 'Outpatient Appointment', fieldLabel: 'Appointment start time' },
  appointmentEndTime: { tab: 'appointment', tabLabel: 'Appointment', section: 'Outpatient Appointment', fieldLabel: 'Appointment end time' },
  referringPhysicianPhone: { tab: 'appointment', tabLabel: 'Appointment', section: 'Referring Physician', fieldLabel: 'Phone' },
  referringPhysicianFax: { tab: 'appointment', tabLabel: 'Appointment', section: 'Referring Physician', fieldLabel: 'Fax' },
  referringPhysicianState: { tab: 'appointment', tabLabel: 'Appointment', section: 'Referring Physician', fieldLabel: 'State' },
  referringPhysicianZip: { tab: 'appointment', tabLabel: 'Appointment', section: 'Referring Physician', fieldLabel: 'ZIP' },

  insuranceBillingType: { tab: 'insurance', tabLabel: 'Insurance Info', section: 'Billing', fieldLabel: 'Billing type' },
  paymentMethod: { tab: 'insurance', tabLabel: 'Insurance Info', section: 'Billing', fieldLabel: 'Mode of payment' },
  subscriberPhone: { tab: 'insurance', tabLabel: 'Insurance Info', section: 'Subscriber Information', fieldLabel: 'Subscriber phone' },
  subscriberEmail: { tab: 'insurance', tabLabel: 'Insurance Info', section: 'Subscriber Information', fieldLabel: 'Subscriber email' },
  subscriberSsnLast4: { tab: 'insurance', tabLabel: 'Insurance Info', section: 'Subscriber Information', fieldLabel: 'Subscriber SSN last 4' },
  subscriberState: { tab: 'insurance', tabLabel: 'Insurance Info', section: 'Subscriber Information', fieldLabel: 'Subscriber state' },
  subscriberZip: { tab: 'insurance', tabLabel: 'Insurance Info', section: 'Subscriber Information', fieldLabel: 'Subscriber ZIP' },

  documentsPhotoId: { tab: 'documents', tabLabel: 'Documents', section: 'Required Documents', fieldLabel: 'Photo ID' },
  documentsInsuranceFront: { tab: 'documents', tabLabel: 'Documents', section: 'Required Documents', fieldLabel: 'Insurance card front' },
};

function titleCaseField(field) {
  return String(field)
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

export function getValidationFieldMeta(field) {
  return (
    FIELD_META[field] || {
      tab: 'patient',
      tabLabel: 'Demographics',
      section: 'Form',
      fieldLabel: titleCaseField(field),
    }
  );
}

export function formatValidationBannerItems(errors = {}) {
  return Object.entries(errors)
    .filter(([, message]) => Boolean(message))
    .map(([field, message]) => {
      const meta = getValidationFieldMeta(field);
      return {
        field,
        tab: meta.tab,
        text: `On the ${meta.tabLabel} tab, ${meta.section} section, ${meta.fieldLabel} has this validation issue: ${message}`,
      };
    });
}

export function firstValidationTab(items) {
  return items[0]?.tab || 'patient';
}
