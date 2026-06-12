import { DEFAULT_COUNTRY } from '@/components/patients/patientDemographicsConstants';
import {
  APPOINTMENT_VISIT_TYPE_LABELS,
  isGeneralAppointmentVisitType,
} from '@/components/patients/patientRegistrationAppointmentConstants';
import { formatRegistrationChannel } from '@/components/patients/patientRegistrationQueue';

const ETHNICITY_LABELS = {
  hispanic: 'Hispanic or Latino',
  'not-hispanic': 'Not Hispanic or Latino',
  unknown: 'Unknown',
};

const SEXUAL_ORIENTATION_LABELS = {
  straight: 'Straight',
  gay: 'Gay',
  lesbian: 'Lesbian',
  bisexual: 'Bisexual',
  other: 'Other',
  'prefer-not-to-say': 'Prefer not to say',
};

const RACE_LABELS = {
  'american-indian': 'American Indian or Alaska Native',
  asian: 'Asian',
  black: 'Black or African American',
  'native-hawaiian': 'Native Hawaiian or Other Pacific Islander',
  white: 'White',
  other: 'Other',
};

const LANGUAGE_LABELS = {
  english: 'English',
  spanish: 'Spanish',
  french: 'French',
  other: 'Other',
};

const INTERPRETER_LANGUAGE_LABELS = {
  spanish: 'Spanish',
  french: 'French',
  chinese: 'Chinese',
  arabic: 'Arabic',
  other: 'Other',
};

const MARITAL_STATUS_LABELS = {
  single: 'Single',
  married: 'Married',
  divorced: 'Divorced',
  widowed: 'Widowed',
  separated: 'Separated',
  'domestic-partner': 'Domestic partner',
  unknown: 'Unknown',
};

const EMPLOYMENT_STATUS_LABELS = {
  employed: 'Employed',
  'self-employed': 'Self-Employed',
  unemployed: 'Unemployed',
  retired: 'Retired',
  student: 'Student',
  disabled: 'Disabled',
  other: 'Other',
};

const BILLING_TYPE_LABELS = {
  insurance: 'Insurance',
  'self-pay': 'Self Pay',
};

const PAYMENT_METHOD_LABELS = {
  cash: 'Cash',
  card: 'Card',
  check: 'Check',
  other: 'Other',
};

const INSURANCE_TYPE_LABELS = {
  primary: 'Primary',
  secondary: 'Secondary',
  tertiary: 'Tertiary',
};

const POLICY_TYPE_LABELS = {
  12: 'Medicare',
  13: 'Medicare Secondary',
  14: 'Medicaid',
  15: 'Tricare',
  16: 'ChampVA',
  BL: 'Blue Cross / Blue Shield',
  CI: 'Commercial Insurance',
  HM: 'HMO',
  MC: 'Managed Care',
  WC: "Workers' Compensation",
  VA: 'Veterans Affairs',
  OF: 'Other Federal Program',
  LI: 'Liability Insurance',
  AU: 'Auto Insurance',
  OT: 'Other',
  SP: 'Self Pay',
};

const SUBSCRIBER_RELATIONSHIP_LABELS = {
  self: 'Self',
  spouse: 'Spouse',
  parent: 'Parent',
  child: 'Child',
  other: 'Other',
};

const SUBSCRIBER_GENDER_LABELS = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
};

function mapLabel(map, value) {
  if (value == null || value === '') return value;
  return map[value] ?? value;
}

export function formatReviewBoolean(value) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return '';
}

export function formatAppointmentVisitType(value) {
  return mapLabel(APPOINTMENT_VISIT_TYPE_LABELS, value);
}

export function formatInsuranceBillingType(value) {
  return mapLabel(BILLING_TYPE_LABELS, value);
}

export function formatSelfPayPaymentMethod(value) {
  return mapLabel(PAYMENT_METHOD_LABELS, value);
}

export function formatInsuranceRankType(value) {
  return mapLabel(INSURANCE_TYPE_LABELS, value);
}

export function formatPolicyType(value) {
  return mapLabel(POLICY_TYPE_LABELS, value);
}

function insuranceActive(formData) {
  return formData.insuranceBillingType === 'insurance';
}

function whenInsurance(formData, value) {
  return insuranceActive(formData) ? value : 'N/A';
}

function selfPayActive(formData) {
  return formData.insuranceBillingType === 'self-pay';
}

function whenSelfPay(formData, value) {
  return selfPayActive(formData) ? value : 'N/A';
}

/**
 * @param {Record<string, unknown>} formData
 * @param {object} helpers
 */
export function buildDemographicsReviewItems(formData, helpers) {
  const {
    formatValue,
    formatDateValue,
    formatDemographicsLabel,
    maskGovernmentIdNumber,
    resolvedPronouns,
  } = helpers;

  const items = [];
  if (formData.registrationChannel) {
    items.push({
      label: 'Arrival Mode',
      value: formatRegistrationChannel(formData.registrationChannel),
    });
  }
  return [
    ...items,
    { label: 'First Name', value: formData.firstName },
    { label: 'Middle Name', value: formData.middleName },
    { label: 'Last Name', value: formData.lastName },
    { label: 'Suffix', value: formData.suffix },
    { label: 'Preferred Name', value: formData.preferredName },
    { label: 'Previous / Maiden Name', value: formData.previousName },
    { label: 'Gender', value: formData.gender },
    {
      label: 'Gender Identity',
      value: formatDemographicsLabel('genderIdentity', formData.genderIdentity),
    },
    { label: 'Pronouns', value: resolvedPronouns() },
    { label: 'Date of Birth', value: formatDateValue(formData.dateOfBirth) },
    { label: 'Email', value: formData.email },
    {
      label: 'Preferred Contact Method',
      value: formatDemographicsLabel('preferredContactMethod', formData.preferredContactMethod),
    },
    { label: 'Home Phone', value: formData.homePhone },
    { label: 'Work Phone', value: formData.workPhone },
    { label: 'Cell Phone', value: formData.cellPhone },
    { label: 'Address', value: formData.address },
    { label: 'Address Line 2', value: formData.addressLine2 },
    { label: 'City', value: formData.city },
    { label: 'State', value: formData.state },
    { label: 'Zip', value: formData.zip },
    {
      label: 'Country',
      value: formatDemographicsLabel('country', formData.country || DEFAULT_COUNTRY),
    },
    {
      label: 'Government ID Type',
      value: formatDemographicsLabel('governmentIdType', formData.governmentIdType),
    },
    {
      label: 'Government ID Number',
      value: formData.governmentIdNumber
        ? maskGovernmentIdNumber(formData.governmentIdNumber)
        : '',
    },
    { label: 'Primary Care Physician', value: formData.primaryCarePhysician },
    { label: 'Place of Birth', value: formData.birthPlace },
    {
      label: 'Veteran Status',
      value: formatDemographicsLabel('veteranStatus', formData.veteranStatus),
    },
    {
      label: 'Disability Status',
      value: formatDemographicsLabel('disabilityStatus', formData.disabilityStatus),
    },
    { label: 'Tribal Affiliation', value: formData.tribalAffiliation },
    { label: 'General Notes', value: formData.generalNotes },
    { label: 'Ethnicity', value: mapLabel(ETHNICITY_LABELS, formData.ethnicity) },
    {
      label: 'Sexual Orientation',
      value: mapLabel(SEXUAL_ORIENTATION_LABELS, formData.sexualOrientation),
    },
    { label: 'Race', value: mapLabel(RACE_LABELS, formData.race) },
    { label: 'Language', value: mapLabel(LANGUAGE_LABELS, formData.language) },
    { label: 'Interpreter Required', value: formatReviewBoolean(formData.interpreterRequired) },
    {
      label: 'Interpreter Language Required',
      value: formData.interpreterRequired
        ? mapLabel(INTERPRETER_LANGUAGE_LABELS, formData.interpreterLanguageRequired)
        : 'N/A',
    },
    { label: 'Marital Status', value: mapLabel(MARITAL_STATUS_LABELS, formData.maritalStatus) },
    {
      label: 'Employment Status',
      value: mapLabel(EMPLOYMENT_STATUS_LABELS, formData.employmentStatus),
    },
    { label: 'Employer Name', value: formData.employerName },
    { label: 'Occupation', value: formData.occupation },
    { label: 'Employer Phone Number', value: formData.employerPhoneNumber },
    { label: 'Employer Address', value: formData.employerStreetAddress },
    { label: 'Employer City', value: formData.employerCity },
    { label: 'Employer State', value: formData.employerState },
    { label: 'Employer Zip', value: formData.employerZip },
    { label: 'Other Info', value: formData.otherInfo },
    {
      label: 'Profile Photo File',
      value: formData.profilePhotoFileName || (formData.profilePhoto ? 'Uploaded' : ''),
    },
  ].map(({ label, value }) => ({ label, value: formatValue(value) }));
}

export function buildContactsReviewItems(formData, helpers) {
  const { formatValue, formatDateValue, formatContactRelationship } = helpers;

  return [
    { label: 'Patient Is a Minor', value: formatReviewBoolean(formData.patientIsMinor) },
    { label: 'Emergency Contact Name', value: formData.emergencyContactName },
    {
      label: 'Emergency Contact Relationship',
      value: formatContactRelationship(formData.emergencyContactRelationship),
    },
    { label: 'Emergency Contact Number', value: formData.emergencyContactNumber },
    { label: 'Emergency Contact Email', value: formData.emergencyContactEmail },
    { label: 'Emergency Contact Address', value: formData.emergencyContactAddress },
    { label: 'Emergency Contact City', value: formData.emergencyContactCity },
    { label: 'Emergency Contact State', value: formData.emergencyContactState },
    { label: 'Emergency Contact ZIP', value: formData.emergencyContactZip },
    {
      label: 'Secondary Emergency Contact Name',
      value: formData.secondaryEmergencyContactName,
    },
    {
      label: 'Secondary Emergency Contact Relationship',
      value: formatContactRelationship(formData.secondaryEmergencyContactRelationship),
    },
    {
      label: 'Secondary Emergency Contact Phone',
      value: formData.secondaryEmergencyContactNumber,
    },
    {
      label: 'Secondary Emergency Contact Email',
      value: formData.secondaryEmergencyContactEmail,
    },
    { label: 'Guarantor Contact Name', value: formData.guarantorName },
    { label: 'Guarantor Contact Number', value: formData.guarantorPhone },
    {
      label: 'Guarantor Relationship',
      value: formatContactRelationship(formData.guarantorRelationship),
    },
    { label: 'Guarantor Email', value: formData.guarantorEmail },
    { label: 'Guarantor Address', value: formData.guarantorAddress },
    { label: 'Guarantor City', value: formData.guarantorCity },
    { label: 'Guarantor State', value: formData.guarantorState },
    { label: 'Guarantor ZIP', value: formData.guarantorZip },
    { label: 'Guarantor Date of Birth', value: formatDateValue(formData.guarantorDateOfBirth) },
    {
      label: 'Guarantor Contact Name (additional)',
      value: formData.guarantorContactName,
    },
    {
      label: 'Guarantor Contact Number (additional)',
      value: formData.guarantorContactNumber,
    },
    {
      label: 'Authorized Representative Name',
      value: formData.authorizedRepresentativeName,
    },
    {
      label: 'Authorized Representative Relationship',
      value: formatContactRelationship(formData.authorizedRepresentativeRelationship),
    },
    {
      label: 'Authorized Representative Phone',
      value: formData.authorizedRepresentativePhone,
    },
    {
      label: 'Authorized Representative Email',
      value: formData.authorizedRepresentativeEmail,
    },
    { label: 'Legal Guardian Name', value: formData.legalGuardianName },
    {
      label: 'Legal Guardian Relationship',
      value: formatContactRelationship(formData.legalGuardianRelationship),
    },
    { label: 'Legal Guardian Phone', value: formData.legalGuardianPhone },
    { label: 'Legal Guardian Email', value: formData.legalGuardianEmail },
    { label: 'Primary Next of Kin Name', value: formData.primaryNextOfKinName },
    {
      label: 'Primary Next of Kin Relationship',
      value: formatContactRelationship(formData.primaryNextOfKinRelationship),
    },
    { label: 'Primary Next of Kin Phone', value: formData.primaryNextOfKinPhone },
    { label: 'Secondary Next of Kin Name', value: formData.secondaryNextOfKinName },
    {
      label: 'Secondary Next of Kin Relationship',
      value: formatContactRelationship(formData.secondaryNextOfKinRelationship),
    },
    { label: 'Secondary Next of Kin Phone', value: formData.secondaryNextOfKinPhone },
  ].map(({ label, value }) => ({ label, value: formatValue(value) }));
}

export function buildAppointmentReviewItems(formData, helpers) {
  const {
    formatValue,
    formatDateValue,
    formatDepartmentForReview: fmtDept,
    formatReferredByForReview: fmtRef,
    formatAppointmentVisitType: fmtVisit,
  } = helpers;

  const formatTime =
    helpers.formatAppointmentTimeSlot ||
    ((v) => v);

  return [
    { label: 'Appointment Date', value: formatDateValue(formData.appointmentDate) },
    ...(isGeneralAppointmentVisitType(formData.appointmentVisitType)
      ? [
          { label: 'Appointment Start Time', value: formatTime(formData.appointmentStartTime) },
          { label: 'Appointment End Time', value: formatTime(formData.appointmentEndTime) },
        ]
      : [{ label: 'Appointment Time', value: formatTime(formData.appointmentTime) }]),
    { label: 'Appointment Type', value: fmtVisit(formData.appointmentVisitType) },
    { label: 'Department', value: fmtDept(formData.appointmentDepartment) },
    { label: 'Provider', value: formData.appointmentProvider },
    { label: 'Appointment Status', value: formData.status },
    { label: 'Reason for Visit', value: formData.appointmentReason },
    { label: 'Appointment Notes', value: formData.appointmentNotes },
    { label: 'Referred By', value: fmtRef(formData.referredBy) },
    { label: 'Referring Physician First Name', value: formData.referringPhysicianFirstName },
    { label: 'Referring Physician Last Name', value: formData.referringPhysicianLastName },
    { label: 'Referring Physician NPI', value: formData.referringPhysicianNpi },
    { label: 'Referring Physician Phone', value: formData.referringPhysicianPhone },
    { label: 'Referring Physician Fax', value: formData.referringPhysicianFax },
    { label: 'Referring Physician Address', value: formData.referringPhysicianAddress },
    { label: 'Referring Physician City', value: formData.referringPhysicianCity },
    { label: 'Referring Physician State', value: formData.referringPhysicianState },
    { label: 'Referring Physician ZIP', value: formData.referringPhysicianZip },
  ].map(({ label, value }) => ({ label, value: formatValue(value) }));
}

export function buildInsuranceReviewItems(formData, helpers) {
  const { formatValue, formatDateValue, getPayerName } = helpers;
  const active = insuranceActive(formData);

  return [
    { label: 'Billing Type', value: formatInsuranceBillingType(formData.insuranceBillingType) },
    {
      label: 'Mode of Payment',
      value: whenSelfPay(formData, formatSelfPayPaymentMethod(formData.paymentMethod)),
    },
    {
      label: 'Insurance Type (current entry)',
      value: whenInsurance(formData, formatInsuranceRankType(formData.insuranceType)),
    },
    {
      label: 'Payer Name (current entry)',
      value: whenInsurance(formData, getPayerName(formData.insuranceCompany)),
    },
    {
      label: 'Policy Type (current entry)',
      value: whenInsurance(formData, formatPolicyType(formData.policyType)),
    },
    { label: 'Plan Name (current entry)', value: whenInsurance(formData, formData.planName) },
    { label: 'Policy Number (current entry)', value: whenInsurance(formData, formData.policyNumber) },
    { label: 'Group Number (current entry)', value: whenInsurance(formData, formData.groupNumber) },
    {
      label: 'Subscriber First Name',
      value: whenInsurance(formData, formData.subscriberFirstName),
    },
    {
      label: 'Subscriber Last Name',
      value: whenInsurance(formData, formData.subscriberLastName),
    },
    { label: 'Subscriber Name', value: whenInsurance(formData, formData.subscriberName) },
    {
      label: 'Subscriber Relationship',
      value: whenInsurance(
        formData,
        mapLabel(SUBSCRIBER_RELATIONSHIP_LABELS, formData.subscriberRelationship),
      ),
    },
    {
      label: 'Subscriber Gender',
      value: whenInsurance(formData, mapLabel(SUBSCRIBER_GENDER_LABELS, formData.subscriberGender)),
    },
    {
      label: 'Subscriber Date of Birth',
      value: whenInsurance(formData, formatDateValue(formData.subscriberDateOfBirth)),
    },
    {
      label: 'Subscriber Street Address',
      value: whenInsurance(formData, formData.subscriberAddress),
    },
    { label: 'Subscriber City', value: whenInsurance(formData, formData.subscriberCity) },
    { label: 'Subscriber State', value: whenInsurance(formData, formData.subscriberState) },
    { label: 'Subscriber ZIP', value: whenInsurance(formData, formData.subscriberZip) },
    { label: 'Subscriber Phone', value: whenInsurance(formData, formData.subscriberPhone) },
    {
      label: 'Subscriber SSN (last 4)',
      value: whenInsurance(
        formData,
        formData.subscriberSsnLast4 ? `••••${formData.subscriberSsnLast4}` : '',
      ),
    },
    {
      label: 'Subscriber Employer',
      value: whenInsurance(formData, formData.subscriberEmployer),
    },
    { label: 'Subscriber Email', value: whenInsurance(formData, formData.subscriberEmail) },
    {
      label: 'Coverage Start Date',
      value: whenInsurance(formData, formatDateValue(formData.coverageStartDate)),
    },
    {
      label: 'Coverage End Date',
      value: whenInsurance(formData, formatDateValue(formData.coverageEndDate)),
    },
    { label: 'Copay', value: whenInsurance(formData, formData.copay) },
    { label: 'Deductible', value: whenInsurance(formData, formData.deductible) },
    {
      label: 'Coinsurance %',
      value: whenInsurance(formData, formData.coinsurancePercentage),
    },
    {
      label: 'Authorization Required',
      value: whenInsurance(formData, formData.authorizationRequired),
    },
    {
      label: 'Authorization Number',
      value: whenInsurance(formData, formData.authorizationNumber),
    },
  ].map(({ label, value }) => ({ label, value: formatValue(value) }));
}
