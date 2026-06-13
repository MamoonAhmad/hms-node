/** Stored on `referredBy`; labels shown in UI and review. */
export const REFERRAL_SOURCES = [
  { value: 'physician-referral', label: 'Physician referral' },
  { value: 'self-referral', label: 'Self-referral' },
  { value: 'hospital-transfer', label: 'Hospital / facility transfer' },
  { value: 'emergency-department', label: 'Emergency department' },
  { value: 'insurance-payer', label: 'Insurance / payer' },
  { value: 'employer', label: 'Employer' },
  { value: 'family-friend', label: 'Family or friend' },
  { value: 'marketing-community', label: 'Marketing / community outreach' },
  { value: 'other-provider', label: 'Other health care provider' },
  { value: 'not-applicable', label: 'Not applicable / unknown' },
];

export const DEPARTMENT_OPTIONS = [
  { value: 'Cardiology', label: 'Cardiology' },
  { value: 'General Medicine', label: 'General Medicine' },
  { value: 'Emergency Medicine', label: 'Emergency Medicine' },
  { value: 'Orthopedics', label: 'Orthopedics' },
  { value: 'Pediatrics', label: 'Pediatrics' },
  { value: 'Radiology', label: 'Radiology' },
  { value: 'Surgery', label: 'Surgery' },
  { value: 'Urology', label: 'Urology' },
];

export const OUTPATIENT_PROVIDERS = [
  { id: 'prov-1', name: 'Dr. John Smith' },
  { id: 'prov-2', name: 'Dr. Sarah Johnson' },
  { id: 'prov-3', name: 'Dr. Emily Brown' },
  { id: 'prov-4', name: 'Dr. Michael Lee' },
  { id: 'prov-5', name: 'Dr. Aisha Khan' },
];

export const REFERRAL_PAYLOAD_KEYS = [
  'referredBy',
  'referringPhysicianFirstName',
  'referringPhysicianLastName',
  'referringPhysicianNpi',
  'referringPhysicianPhone',
  'referringPhysicianFax',
  'referringPhysicianAddress',
  'referringPhysicianCity',
  'referringPhysicianState',
  'referringPhysicianZip',
];

export function emptyReferralPayload() {
  return REFERRAL_PAYLOAD_KEYS.reduce((acc, k) => {
    acc[k] = '';
    return acc;
  }, {});
}

export function formatReferredByForReview(value) {
  if (value == null || value === '') return '';
  const match = REFERRAL_SOURCES.find((o) => o.value === value);
  return match ? match.label : String(value);
}

export function formatDepartmentForReview(value) {
  if (value == null || value === '') return '';
  const match = DEPARTMENT_OPTIONS.find((o) => o.value === value);
  return match ? match.label : String(value);
}

export const GENERAL_APPOINTMENT_VISIT_TYPE = 'general';

export const APPOINTMENT_VISIT_TYPE_OPTIONS = [
  { value: 'new-patient', label: 'New Patient' },
  { value: 'follow-up', label: 'Follow-up' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'telehealth', label: 'Telehealth' },
  { value: 'procedure', label: 'Procedure' },
  { value: GENERAL_APPOINTMENT_VISIT_TYPE, label: 'General' },
];

export const APPOINTMENT_VISIT_TYPE_LABELS = Object.fromEntries(
  APPOINTMENT_VISIT_TYPE_OPTIONS.map((o) => [o.value, o.label]),
);

/** Map patient-registration visit type values to API appointmentType enum. */
export const VISIT_TYPE_TO_API_TYPE = {
  'new-patient': 'New',
  'follow-up': 'Follow-up',
  urgent: 'New',
  telehealth: 'Televisit',
  procedure: 'New',
  [GENERAL_APPOINTMENT_VISIT_TYPE]: 'New',
};

export const API_TYPE_TO_VISIT_TYPE = {
  New: 'new-patient',
  'Follow-up': 'follow-up',
  Televisit: 'telehealth',
};

const REFERRAL_TAG = '\n\n__HMS_REFERRAL__:';

export function buildNotesWithReferral(appointmentNotes, referral) {
  const ref = referral || {};
  const hasRef = REFERRAL_PAYLOAD_KEYS.some((k) => {
    const v = ref[k];
    return v != null && String(v).trim() !== '';
  });
  const base = (appointmentNotes || '').trimEnd();
  if (!hasRef) return base || null;
  const payload = {};
  REFERRAL_PAYLOAD_KEYS.forEach((k) => {
    const v = ref[k];
    if (v != null && String(v).trim() !== '') payload[k] = String(v).trim();
  });
  return `${base}${REFERRAL_TAG}${JSON.stringify(payload)}`;
}

export function parseNotesWithReferral(notes) {
  if (!notes || typeof notes !== 'string') {
    return { appointmentNotes: '', referral: emptyReferralPayload() };
  }
  const idx = notes.indexOf(REFERRAL_TAG);
  if (idx === -1) {
    return { appointmentNotes: notes, referral: emptyReferralPayload() };
  }
  const appointmentNotes = notes.slice(0, idx).trimEnd();
  let payload = {};
  try {
    payload = JSON.parse(notes.slice(idx + REFERRAL_TAG.length)) || {};
  } catch {
    payload = {};
  }
  const referral = emptyReferralPayload();
  REFERRAL_PAYLOAD_KEYS.forEach((k) => {
    if (payload[k] != null) referral[k] = String(payload[k]);
  });
  return { appointmentNotes, referral };
}

/** Placeholder slots for schedule appointment time picker (until provider availability API). */
export const APPOINTMENT_TIME_SLOT_OPTIONS = [
  { value: '09:00', label: '9:00 am - 9:30 am' },
  { value: '10:00', label: '10:00 am - 10:30 am' },
  { value: '11:00', label: '11:00 am - 11:30 am' },
];

export function formatAppointmentTimeSlot(value, slots = APPOINTMENT_TIME_SLOT_OPTIONS) {
  if (!value) return '';
  const match = slots.find((s) => s.value === value);
  return match?.label || value;
}

const TIME_HH_MM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isGeneralAppointmentVisitType(value) {
  if (value === GENERAL_APPOINTMENT_VISIT_TYPE) return true;
  if (typeof value === 'string' && value.trim().toLowerCase() === 'general') return true;
  return false;
}

export function parseTimeToMinutes(timeStr) {
  if (!timeStr || !TIME_HH_MM_REGEX.test(timeStr)) return null;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function computeAppointmentDurationMinutes(startTime, endTime) {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start == null || end == null || end <= start) return 30;
  return Math.max(15, Math.min(480, end - start));
}

export function pickReferralPayloadFromFormData(formData) {
  const referral = {};
  REFERRAL_PAYLOAD_KEYS.forEach((k) => {
    referral[k] = formData[k];
  });
  return referral;
}

function validateAppointmentTimeValue(formData, newErrors, slots) {
  if (!formData.appointmentTime) {
    newErrors.appointmentTime = 'Time is required';
    return;
  }
  const slotList = slots || APPOINTMENT_TIME_SLOT_OPTIONS;
  const isKnownSlot = slotList.some((s) => s.value === formData.appointmentTime);
  if (!isKnownSlot && !TIME_HH_MM_REGEX.test(formData.appointmentTime)) {
    newErrors.appointmentTime = 'Select a valid time slot';
  }
}

function validateGeneralAppointmentTimes(formData, newErrors) {
  if (!formData.appointmentStartTime) {
    newErrors.appointmentStartTime = 'Appointment start time is required';
  } else if (!TIME_HH_MM_REGEX.test(formData.appointmentStartTime)) {
    newErrors.appointmentStartTime = 'Enter a valid start time (HH:MM)';
  }

  if (!formData.appointmentEndTime) {
    newErrors.appointmentEndTime = 'Appointment end time is required';
  } else if (!TIME_HH_MM_REGEX.test(formData.appointmentEndTime)) {
    newErrors.appointmentEndTime = 'Enter a valid end time (HH:MM)';
  }

  const start = parseTimeToMinutes(formData.appointmentStartTime);
  const end = parseTimeToMinutes(formData.appointmentEndTime);
  if (start != null && end != null && end <= start) {
    newErrors.appointmentEndTime = 'End time must be after start time';
  }
}

/** Validates appointment fields on patient registration forms; mutates `newErrors`. */
export function validateRegistrationAppointmentFields(formData, newErrors, options = {}) {
  const { requireProvider = false, timeSlotOptions } = options;

  if (!formData.appointmentDate) newErrors.appointmentDate = 'Date is required';
  if (!formData.appointmentVisitType) {
    newErrors.appointmentVisitType = 'Appointment type is required';
  }

  if (requireProvider && !formData.appointmentProviderId && !formData.appointmentProvider) {
    newErrors.appointmentProvider = 'Provider is required';
  }

  const isGeneral = isGeneralAppointmentVisitType(formData.appointmentVisitType);

  if (isGeneral) {
    validateGeneralAppointmentTimes(formData, newErrors);
  } else {
    validateAppointmentTimeValue(formData, newErrors, timeSlotOptions);
  }
}

/** Build API appointment create payload from patient registration form data. */
export function buildAppointmentSubmitPayloadFromRegistration(formData, patientId, { defaultStatus } = {}) {
  const apiAppointmentType =
    formData.appointmentTypeName ||
    VISIT_TYPE_TO_API_TYPE[formData.appointmentVisitType] ||
    formData.appointmentVisitType ||
    'New';
  const referral = pickReferralPayloadFromFormData(formData);
  const isGeneral = isGeneralAppointmentVisitType(formData.appointmentVisitType);

  let appointmentTime = formData.appointmentTime;
  let appointmentEndTime = null;
  let duration = 30;

  if (isGeneral && formData.appointmentStartTime) {
    appointmentTime = formData.appointmentStartTime;
    appointmentEndTime = formData.appointmentEndTime || null;
    duration = computeAppointmentDurationMinutes(
      formData.appointmentStartTime,
      formData.appointmentEndTime,
    );
  }

  let notes = buildNotesWithReferral(formData.appointmentNotes, referral);
  if (isGeneral && formData.appointmentEndTime) {
    const rangeNote = `Scheduled window: ${formData.appointmentStartTime} – ${formData.appointmentEndTime}`;
    notes = notes ? `${notes}\n${rangeNote}` : rangeNote;
  }

  return {
    patientId,
    appointmentDate: formData.appointmentDate,
    appointmentTime,
    appointmentEndTime,
    duration,
    appointmentType: apiAppointmentType,
    visitReason: formData.appointmentReason?.trim() || null,
    department: formData.appointmentDepartment?.trim() || null,
    departmentId: formData.appointmentDepartmentId || null,
    provider: formData.appointmentProvider?.trim() || null,
    providerId: formData.appointmentProviderId || null,
    status: formData.status || defaultStatus || null,
    notes,
  };
}
