import { formatPhoneForDisplay } from '@/lib/phoneNumberUtils';

export function formatPatientDisplayName(patient) {
  if (!patient) return '—';
  return formatPatientListName(patient);
}

/** Last Name, First Name Middle Initial — for patient listing. */
export function formatPatientListName(patient) {
  if (!patient) return '—';
  const last = patient.lastName || '';
  const first = patient.firstName || '';
  const middleInitial = patient.middleName
    ? `${String(patient.middleName).charAt(0).toUpperCase()}.`
    : '';
  const name = [last, [first, middleInitial].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  return name || '—';
}

export function formatPatientWristbandName(patient) {
  if (!patient) return '—';
  const last = patient.lastName || '';
  const first = patient.firstName || '';
  const middleInitial = patient.middleName ? `${patient.middleName.charAt(0).toUpperCase()}.` : '';
  return [last, [first, middleInitial].filter(Boolean).join(' ')].filter(Boolean).join(', ');
}

export function calculatePatientAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

export function calculatePatientAgeMonths(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let months = (today.getFullYear() - dob.getFullYear()) * 12 + (today.getMonth() - dob.getMonth());
  if (today.getDate() < dob.getDate()) months -= 1;
  return Math.max(0, months);
}

export function calculatePatientAgeMonthsDecimal(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  const diffMs = today.getTime() - dob.getTime();
  if (diffMs < 0) return null;
  const days = diffMs / (1000 * 60 * 60 * 24);
  return days / 30.4375;
}

export function formatPatientListAgeLabel(dateOfBirth) {
  const months = calculatePatientAgeMonthsDecimal(dateOfBirth);
  if (months == null) return null;
  if (months < 12) {
    const rounded = Math.round(months * 10) / 10;
    if (rounded <= 0) return '< 0.1 months';
    if (rounded === 1) return '1 month';
    return `${rounded} months`;
  }
  const years = Math.floor(months / 12);
  return years === 1 ? '1 yr' : `${years} yr`;
}

export function formatPatientAge(dateOfBirth) {
  const label = formatPatientListAgeLabel(dateOfBirth);
  return label;
}

export function formatGenderAbbrev(gender) {
  if (!gender) return 'Unknown';
  const normalized = String(gender).toLowerCase();
  const map = {
    male: 'M',
    female: 'F',
    other: 'O',
    m: 'M',
    f: 'F',
    o: 'O',
  };
  return map[normalized] || 'Unknown';
}

export function formatGenderLabel(gender) {
  if (!gender) return '—';
  const map = { male: 'Male', female: 'Female', other: 'Other' };
  return map[String(gender).toLowerCase()] || gender;
}

export function formatPatientDobWithAge(dateOfBirth) {
  if (!dateOfBirth) return '—';
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return '—';
  const dobLabel = dob.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const ageLabel = formatPatientAge(dateOfBirth);
  return ageLabel ? `${dobLabel} (${ageLabel})` : dobLabel;
}

export function formatPatientGenderDob(patient) {
  if (!patient) return '—';
  const gender = formatGenderAbbrev(patient.gender);
  const dobAge = formatPatientDobWithAge(patient.dateOfBirth);
  return dobAge === '—' ? gender : `${gender} · ${dobAge}`;
}

export function formatPatientListPhone(patient) {
  if (!patient) return '—';
  const raw =
    patient.cellPhone ||
    patient.contactNumber ||
    patient.homePhone ||
    patient.workPhone ||
    '';
  if (!raw) return '—';
  return formatPhoneForDisplay(raw) || raw;
}

export function formatPatientListContacts(patient) {
  if (!patient) return '—';
  const email = patient.email?.trim();
  const phone = formatPatientListPhone(patient);
  if (email && phone !== '—') return `${email}\n${phone}`;
  if (email) return email;
  if (phone !== '—') return phone;
  return '—';
}

export function patientHasBillingChoice(patient) {
  if (!patient) return false;
  const billing = String(patient.billingType || patient.insuranceBillingType || '').toLowerCase();
  if (billing === 'self-pay' || billing === 'self_pay') return true;
  if (billing === 'insurance') return true;

  const insurances = Array.isArray(patient.insuranceList) ? patient.insuranceList : patient.insurances;
  if (insurances?.length) {
    return insurances.some(
      (item) =>
        item?.insuranceProviderId ||
        item?.memberId ||
        item?.policyNumber ||
        item?.payerName ||
        item?.insuranceProvider?.name,
    );
  }

  return !!(patient.insuranceProviderId || patient.policyNumber);
}

export function patientHasSignedConsent(patient) {
  if (!patient) return false;
  return !!(
    patient.consentFormSigned ||
    patient.consentSigned ||
    (Array.isArray(patient.consentSignatures) && patient.consentSignatures.length > 0)
  );
}

export function isPatientDraft(patient) {
  if (!patient) return false;
  return patient._isQueueDraft || String(patient.registrationStatus || '').toLowerCase() === 'draft';
}

export function isRegistrationQueuePatient(patient) {
  if (!patient) return false;
  return String(patient.registrationStatus || '').toLowerCase() === 'pending';
}

function hasPatientInsuranceDetails(patient) {
  const insurances = Array.isArray(patient?.insuranceList) ? patient.insuranceList : patient?.insurances;
  if (insurances?.length) {
    return insurances.some(
      (item) => item?.insuranceProviderId && (item?.memberId || item?.policyNumber),
    );
  }
  return !!(patient?.insuranceProviderId && (patient?.policyNumber || patient?.memberId));
}

/**
 * Outstanding items that keep registration in Pending.
 * Used for the Registration Status hover tooltip.
 */
export function getPendingRegistrationItems(patient) {
  if (!patient || String(patient.registrationStatus || '').toLowerCase() !== 'pending') {
    return [];
  }

  const items = [];
  const missingDemographics = [];

  if (!String(patient.firstName || '').trim()) missingDemographics.push('first name');
  if (!String(patient.lastName || '').trim()) missingDemographics.push('last name');
  if (!patient.dateOfBirth) missingDemographics.push('date of birth');
  if (!String(patient.gender || '').trim()) missingDemographics.push('gender');
  if (!String(patient.cellPhone || patient.contactNumber || '').trim()) {
    missingDemographics.push('phone');
  }
  if (!String(patient.address || '').trim()) missingDemographics.push('address');
  if (!String(patient.city || '').trim()) missingDemographics.push('city');
  if (!String(patient.state || '').trim()) missingDemographics.push('state');
  if (!String(patient.zip || '').trim()) missingDemographics.push('zip');

  if (missingDemographics.length) {
    items.push(`Required demographics (${missingDemographics.join(', ')})`);
  }

  const billing = String(patient.billingType || patient.insuranceBillingType || '').toLowerCase();
  if (!billing) {
    items.push('Payer information or Self Pay selection');
  } else if (billing === 'insurance' && !hasPatientInsuranceDetails(patient)) {
    items.push('Insurance verification (payer and member ID)');
  } else if (!patientHasBillingChoice(patient)) {
    items.push('Payer information or Self Pay selection');
  }

  if (!patientHasSignedConsent(patient)) {
    items.push('Mandatory consent forms / signatures');
  }

  if (!items.length) {
    items.push('Complete registration to finalize');
  }

  return items;
}

/**
 * Registration Status (stored: draft | pending | completed):
 * - Draft: started but not completed; required info missing or saved for later
 * - Pending: mostly complete, but outstanding required items (consents, insurance, demographics)
 * - Completed: all required demographics, payer/self-pay, consents, and validations done
 */
export function getRegistrationStatusMeta(patient) {
  if (isPatientDraft(patient)) {
    return { label: 'Draft', tone: 'muted', variant: 'muted' };
  }

  const status = String(patient?.registrationStatus || '').toLowerCase();
  if (status === 'completed') {
    return { label: 'Completed', tone: 'success', variant: 'success' };
  }

  // pending (default) and any unrecognized non-draft status
  return { label: 'Pending', tone: 'warning', variant: 'warning' };
}

export function getConsentStatusMeta(patient) {
  if (patientHasSignedConsent(patient)) {
    return { label: 'Completed', tone: 'success', variant: 'success' };
  }
  return { label: 'Pending', tone: 'warning', variant: 'warning' };
}

export function formatPatientInsuranceSummary(patient) {
  if (!patient) return '—';
  const billing = String(patient.billingType || patient.insuranceBillingType || '').toLowerCase();
  if (billing === 'self-pay' || billing === 'self_pay') return 'Self Pay';

  const insurances = Array.isArray(patient.insuranceList) ? patient.insuranceList : patient.insurances;
  const primary =
    insurances?.find(
      (item) =>
        item.insuranceTypeKey === 'primary' ||
        item.insuranceType === 'primary' ||
        item.insuranceType === 'Primary',
    ) || insurances?.[0];

  if (primary) {
    const name =
      primary.payerName ||
      primary.insuranceProvider?.name ||
      primary.name ||
      '';
    const payerId =
      primary.payerId ||
      primary.insuranceProvider?.code ||
      primary.code ||
      '';
    if (name && payerId) return `${name} · ${payerId}`;
    if (name) return name;
  }

  const provider = patient.insuranceProvider;
  if (provider?.name) {
    return provider.code ? `${provider.name} · ${provider.code}` : provider.name;
  }

  return billing === 'insurance' ? 'Insurance' : 'Self Pay';
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Simple Code 39-style barcode bars from text (visual placeholder). */
export function renderBarcodeSvg(value, { width = 180, height = 40 } = {}) {
  const text = String(value || '000000');
  const pattern = text
    .split('')
    .map((ch) => ch.charCodeAt(0).toString(2).padStart(8, '0'))
    .join('');
  const barWidth = width / pattern.length;
  const bars = pattern
    .split('')
    .map((bit, i) =>
      bit === '1'
        ? `<rect x="${i * barWidth}" y="0" width="${Math.max(barWidth, 1)}" height="${height}" fill="#111" />`
        : '',
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Barcode">${bars}</svg>`;
}
