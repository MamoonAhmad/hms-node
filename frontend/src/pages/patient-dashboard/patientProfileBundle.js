import {
  calcAge,
  formatPatientName,
  patientContact,
  formatAppointmentLabel,
} from './patientChartUtils';

/**
 * Build aggregated patient record for profile export / print.
 */
export function buildPatientProfileBundle({ patient, appointments = [], orders = [] } = {}) {
  const generatedAt = new Date().toISOString();
  if (!patient) {
    return {
      meta: { generatedAt, patientId: null, recordType: 'Outpatient clinical record (summary)' },
      demographics: { name: '—', age: '—', gender: '—', mrn: '—', contact: '—' },
      allergies: [],
      medications: [],
      conditions: [],
      insurance: { primary: '—', memberId: '—', group: '—' },
      orders: [],
      clinicalNotes: [],
      appointments: [],
      documents: [],
      results: [],
      billing: { openBalance: '—', lastStatementDate: '—', recentCharges: [] },
      alerts: [],
    };
  }

  const address = [patient.address, patient.city, patient.state, patient.zip]
    .filter(Boolean)
    .join(', ');

  return {
    meta: {
      generatedAt,
      patientId: patient.id,
      recordType: 'Outpatient clinical record (summary)',
    },
    demographics: {
      name: formatPatientName(patient),
      age: calcAge(patient.dateOfBirth),
      gender: patient.genderIdentity || patient.gender,
      mrn: patient.mrn,
      contact: patientContact(patient),
      address: address || '—',
      preferredLanguage: patient.language || '—',
    },
    allergies: [],
    medications: [],
    conditions: [],
    insurance: {
      primary: patient.insuranceProvider?.name || '—',
      memberId: patient.policyNumber || '—',
      group: '—',
    },
    orders: orders.map((o) => ({
      id: o.id,
      type: o.category,
      name: o.procedureName,
      status: o.status,
      orderedOn: o.orderDateTime?.slice?.(0, 10) || '—',
      resultSummary: o.status === 'Completed' ? 'Result on file' : '—',
    })),
    clinicalNotes: [],
    appointments: appointments.map((a) => ({
      id: a.id,
      date: typeof a.appointmentDate === 'string' ? a.appointmentDate.slice(0, 10) : new Date(a.appointmentDate).toISOString().slice(0, 10),
      time: a.appointmentTime,
      type: a.appointmentType,
      provider: a.provider || '—',
      location: a.department || '—',
      status: a.status,
      reason: a.visitReason || '—',
      label: formatAppointmentLabel(a),
    })),
    documents: [],
    results: orders
      .filter((o) => o.category === 'Lab')
      .map((o) => ({
        name: o.procedureName,
        date: o.orderDateTime?.slice?.(0, 10) || '—',
        flag: o.status === 'Scheduled' ? 'Pending' : '',
        value: o.status,
      })),
    billing: {
      openBalance: patient.copay != null ? `Copay $${Number(patient.copay).toFixed(2)}` : '—',
      lastStatementDate: '—',
      recentCharges: [],
    },
    alerts: patient.generalNotes
      ? [{ type: 'Clinical', message: patient.generalNotes }]
      : [],
  };
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
