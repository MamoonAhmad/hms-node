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

export function patientPhotoSrc(patient) {
  if (!patient?.profilePhoto) return null;
  const p = patient.profilePhoto;
  if (p.startsWith('data:') || p.startsWith('http')) return p;
  return `data:image/jpeg;base64,${p}`;
}

export function mapAppointmentToEncounter(appointment) {
  if (!appointment) return null;
  const openStatuses = ['Scheduled', 'Checked-In', 'In Progress', 'Rescheduled'];
  const status = openStatuses.includes(appointment.status) ? 'Open' : 'Closed';
  const visitStatusMap = {
    Scheduled: 'Arrived',
    'Checked-In': 'Arrived',
    'In Progress': 'With Provider',
    Completed: 'Checkout',
    Cancelled: 'Checkout',
    'No-Show': 'Checkout',
    Rescheduled: 'Arrived',
  };
  const date =
    typeof appointment.appointmentDate === 'string'
      ? appointment.appointmentDate.slice(0, 10)
      : new Date(appointment.appointmentDate).toISOString().slice(0, 10);

  return {
    id: appointment.id,
    status,
    type: appointment.appointmentType || 'Visit',
    reason: appointment.visitReason || '—',
    visitStatus: visitStatusMap[appointment.status] || 'Arrived',
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
  const open = appointments.filter((a) =>
    ['Scheduled', 'Checked-In', 'In Progress'].includes(a.status),
  );
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
    site: order.site || '',
    orderedBy: order.orderedBy,
    _persisted: true,
  };
}
