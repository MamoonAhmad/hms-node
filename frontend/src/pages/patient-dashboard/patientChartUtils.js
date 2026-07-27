import {
  isOpenEncounterStatus,
  mapAppointmentStatusToVisitStep,
  OPEN_ENCOUNTER_STATUSES,
} from '@/lib/encounterVisitStatus';

export function calcAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

export function formatPatientName(patient) {
  if (!patient) return '';
  const parts = [patient.firstName, patient.middleName, patient.lastName, patient.suffix].filter(Boolean);
  return parts.join(' ');
}

export function formatDob(dateOfBirth) {
  if (!dateOfBirth) return '—';
  return new Date(dateOfBirth).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function patientContact(patient) {
  if (!patient) return '—';
  return (
    patient.cellPhone ||
    patient.contactNumber ||
    patient.homePhone ||
    patient.email ||
    '—'
  );
}

export function formatPatientPhone(patient) {
  if (!patient) return null;
  return patient.cellPhone || patient.contactNumber || patient.homePhone || null;
}

export function formatPatientAddress(patient) {
  if (!patient) return null;
  const line1 = [patient.address, patient.addressLine2].filter(Boolean).join(', ');
  const line2 = [patient.city, patient.state, patient.zip].filter(Boolean).join(', ');
  const parts = [line1, line2].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}

export function formatInsuranceLabel(patient) {
  if (!patient) return '—';
  const billing = patient.billingType || patient.insuranceBillingType;
  if (billing === 'self_pay' || billing === 'self-pay') return 'Self Pay';

  const primary =
    patient.insuranceList?.find((ins) => ins.insuranceTypeKey === 'primary' || ins.insuranceType === 'primary') ||
    patient.insuranceList?.[0];

  if (primary?.payerName) {
    const member = primary.memberId || primary.policyNumber;
    return member ? `${primary.payerName} · ${member}` : primary.payerName;
  }

  if (patient.insuranceProvider?.name) return patient.insuranceProvider.name;
  if (typeof patient.insuranceProvider === 'string') return patient.insuranceProvider;

  return billing === 'insurance' ? 'Insurance' : '—';
}

export function isSelfPayPatient(patient) {
  const billing = patient?.billingType || patient?.insuranceBillingType;
  return billing === 'self_pay' || billing === 'self-pay';
}

export function formatEmergencyContactSummary(patient) {
  if (!patient?.emergencyContactName) return null;
  const parts = [patient.emergencyContactName];
  if (patient.emergencyContactRelationship) parts.push(`(${patient.emergencyContactRelationship})`);
  return parts.join(' ');
}

export function patientPhotoSrc(patient) {
  if (!patient?.profilePhoto) return null;
  const p = patient.profilePhoto;
  if (p.startsWith('data:') || p.startsWith('http')) return p;
  return `data:image/jpeg;base64,${p}`;
}

export function mapAppointmentToEncounter(appointment) {
  if (!appointment) return null;
  const status = isOpenEncounterStatus(appointment.status) ? 'Open' : 'Closed';
  const date =
    typeof appointment.appointmentDate === 'string'
      ? appointment.appointmentDate.slice(0, 10)
      : new Date(appointment.appointmentDate).toISOString().slice(0, 10);

  return {
    id: appointment.id,
    status,
    type: appointment.appointmentType || 'Visit',
    reason: appointment.visitReason || '—',
    visitStatus: mapAppointmentStatusToVisitStep(
      appointment.status,
      appointment.eventStatus,
    ),
    room: appointment.department || '—',
    location: appointment.department || 'Clinic',
    visitProvider: appointment.provider || '—',
    appointmentDate: date,
    appointmentTime: appointment.appointmentTime,
    rawStatus: appointment.status,
    timeInRoomMinutes: 0,
  };
}

export function pickActiveAppointment(appointments) {
  if (!appointments?.length) return null;
  const today = new Date().toISOString().slice(0, 10);
  const open = appointments.filter((a) => OPEN_ENCOUNTER_STATUSES.includes(a.status));
  const todayVisit = open.find((a) => {
    const d =
      typeof a.appointmentDate === 'string'
        ? a.appointmentDate.slice(0, 10)
        : new Date(a.appointmentDate).toISOString().slice(0, 10);
    return d === today;
  });
  if (todayVisit) return todayVisit;
  return open[0] || appointments[0];
}

export function formatAppointmentLabel(appointment) {
  if (!appointment) return '—';
  const date =
    typeof appointment.appointmentDate === 'string'
      ? appointment.appointmentDate.slice(0, 10)
      : new Date(appointment.appointmentDate).toLocaleDateString();
  return `${date} ${appointment.appointmentTime || ''} — ${appointment.appointmentType || 'Visit'} (${appointment.provider || 'Provider TBD'})`;
}

export function apiOrderToRow(order) {
  return {
    id: order.id,
    procedure: {
      id: order.procedureCode,
      code: order.procedureCode,
      name: order.procedureName,
      category: order.category,
    },
    dateTime: order.orderDateTime,
    status: order.status,
    orderedBy: order.orderedBy,
    _persisted: true,
  };
}
