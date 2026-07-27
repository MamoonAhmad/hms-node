export const NEXT_OF_KIN_RELATIONSHIP_OPTIONS = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'other', label: 'Other' },
];

export const GUARANTOR_RELATIONSHIP_OPTIONS = [
  { value: 'self', label: 'Self' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'other', label: 'Other' },
];

const RELATIONSHIP_LABELS = Object.fromEntries(
  [...NEXT_OF_KIN_RELATIONSHIP_OPTIONS, ...GUARANTOR_RELATIONSHIP_OPTIONS].map((o) => [
    o.value,
    o.label,
  ]),
);

export function formatContactRelationship(value) {
  if (!value) return value;
  return RELATIONSHIP_LABELS[value] ?? value;
}

export function isPatientMinor(dateOfBirth) {
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

export function shouldShowLegalGuardianSection(dateOfBirth, patientIsMinor) {
  return isPatientMinor(dateOfBirth) || Boolean(patientIsMinor);
}

export const PHONE_REGEX = /^[\d\s\-()]+$/;

export const GUARANTOR_REQUIRED_MAX_AGE = 18;

export function emptyEmergencyContactEntry() {
  return {
    name: '',
    relationship: '',
    number: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  };
}

export function emptyGuarantorEntry() {
  return {
    name: '',
    relationship: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  };
}

export function emergencyContactFromFormData(formData, index = 0) {
  if (index === 0) {
    return {
      name: formData.emergencyContactName || '',
      relationship: formData.emergencyContactRelationship || '',
      number: formData.emergencyContactNumber || '',
      email: formData.emergencyContactEmail || '',
      address: formData.emergencyContactAddress || '',
      city: formData.emergencyContactCity || '',
      state: formData.emergencyContactState || '',
      zip: formData.emergencyContactZip || '',
    };
  }
  const extras = Array.isArray(formData.additionalEmergencyContacts)
    ? formData.additionalEmergencyContacts
    : [];
  if (index === 1 && !extras.length) {
    return {
      name: formData.secondaryEmergencyContactName || '',
      relationship: formData.secondaryEmergencyContactRelationship || '',
      number: formData.secondaryEmergencyContactNumber || '',
      email: formData.secondaryEmergencyContactEmail || '',
      address: '',
      city: '',
      state: '',
      zip: '',
    };
  }
  return extras[index - 1] || emptyEmergencyContactEntry();
}

export function guarantorFromFormData(formData, index = 0) {
  if (index === 0) {
    return {
      name: formData.guarantorName || '',
      relationship: formData.guarantorRelationship || '',
      phone: formData.guarantorPhone || '',
      email: formData.guarantorEmail || '',
      address: formData.guarantorAddress || '',
      city: formData.guarantorCity || '',
      state: formData.guarantorState || '',
      zip: formData.guarantorZip || '',
    };
  }
  const extras = Array.isArray(formData.additionalGuarantors) ? formData.additionalGuarantors : [];
  if (index === 1 && !extras.length && (formData.guarantorContactName || formData.guarantorContactNumber)) {
    return {
      name: formData.guarantorContactName || '',
      relationship: '',
      phone: formData.guarantorContactNumber || '',
      email: '',
      address: '',
      city: '',
      state: '',
      zip: '',
    };
  }
  return extras[index - 1] || emptyGuarantorEntry();
}

export function buildEmergencyContactsList(formData) {
  const primary = emergencyContactFromFormData(formData, 0);
  const extras = Array.isArray(formData.additionalEmergencyContacts)
    ? formData.additionalEmergencyContacts
    : [];
  if (extras.length) return [primary, ...extras];
  const secondary = emergencyContactFromFormData(formData, 1);
  if (secondary.name || secondary.number || secondary.email) {
    return [primary, secondary];
  }
  return [primary];
}

export function buildGuarantorsList(formData) {
  const primary = guarantorFromFormData(formData, 0);
  const extras = Array.isArray(formData.additionalGuarantors) ? formData.additionalGuarantors : [];
  if (extras.length) return [primary, ...extras];
  const secondary = guarantorFromFormData(formData, 1);
  if (secondary.name || secondary.phone || secondary.email) {
    return [primary, secondary];
  }
  return [primary];
}

export function syncEmergencyContactsToFormData(contacts) {
  const [primary = emptyEmergencyContactEntry(), ...rest] = contacts;
  return {
    emergencyContactName: primary.name,
    emergencyContactRelationship: primary.relationship,
    emergencyContactNumber: primary.number,
    emergencyContactEmail: primary.email,
    emergencyContactAddress: primary.address,
    emergencyContactCity: primary.city,
    emergencyContactState: primary.state,
    emergencyContactZip: primary.zip,
    // Keep secondary* fields in sync for API/persistence compatibility.
    secondaryEmergencyContactName: rest[0]?.name || '',
    secondaryEmergencyContactRelationship: rest[0]?.relationship || '',
    secondaryEmergencyContactNumber: rest[0]?.number || '',
    secondaryEmergencyContactEmail: rest[0]?.email || '',
    // Store every non-primary entry (including empty "Add more" rows) so the UI
    // can render them. rest.slice(1) previously dropped the first additional row.
    additionalEmergencyContacts: rest,
  };
}

export function syncGuarantorsToFormData(guarantors) {
  const [primary = emptyGuarantorEntry(), ...rest] = guarantors;
  return {
    guarantorName: primary.name,
    guarantorRelationship: primary.relationship,
    guarantorPhone: primary.phone,
    guarantorEmail: primary.email,
    guarantorAddress: primary.address,
    guarantorCity: primary.city,
    guarantorState: primary.state,
    guarantorZip: primary.zip,
    guarantorContactName: rest[0]?.name || '',
    guarantorContactNumber: rest[0]?.phone || '',
    // Same as emergency: keep empty additional rows so "Add more" forms appear.
    additionalGuarantors: rest,
  };
}
