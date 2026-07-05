const prisma = require('../lib/prisma');
const patientSummaryService = require('./patientSummary.service');

const appointmentInclude = {
  appointmentTypeRef: { select: { name: true } },
  departmentRef: { select: { departmentName: true, facilityName: true } },
  providerRef: {
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      specialty: { select: { name: true } },
    },
  },
};

function formatProviderName(provider, fallback) {
  if (provider) {
    return [provider.firstName, provider.middleName, provider.lastName].filter(Boolean).join(' ');
  }
  return fallback || null;
}

function calcAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

function formatDisplayDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatEncounterDateTime(date, time) {
  if (!date) return null;
  const d = formatDisplayDate(date);
  if (!time) return d;
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${d} ${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function latestSectionsByKey(rows) {
  const map = {};
  for (const row of rows) {
    if (!map[row.sectionKey] || new Date(row.createdAt) > new Date(map[row.sectionKey].createdAt)) {
      map[row.sectionKey] = row;
    }
  }
  return map;
}

function allSectionEntries(rows, sectionKey) {
  return rows.filter((r) => r.sectionKey === sectionKey);
}

function vitalsSummary(data) {
  if (!data) return null;
  const bp = data.bpSys || data.bpDia ? `${data.bpSys || '—'}/${data.bpDia || '—'}` : null;
  return {
    date: data.recordedAt || null,
    bloodPressure: bp,
    pulse: data.pulse || null,
    temperature: data.temperature ? `${data.temperature}°F` : null,
    respiratoryRate: data.respiratoryRate || null,
    oxygenSaturation: data.o2 || null,
    notes: data.vitalNotes || null,
  };
}

function textOrNone(value) {
  if (value == null || value === '') return 'No data available.';
  if (typeof value === 'string' && !value.trim()) return 'No data available.';
  return value;
}

function buildIntakeAutoPopulate(sections, screenings) {
  const byKey = latestSectionsByKey(sections);
  const cc = byKey.chief_complaint_hpi?.data;
  const vitalsRows = allSectionEntries(sections, 'vitals');
  const latestVitals = vitalsRows.length
    ? vitalsRows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]?.data
    : null;

  const allergyRows = allSectionEntries(sections, 'allergies').filter((r) => !r.data?.noKnownAllergies);
  const nkda = allSectionEntries(sections, 'allergies').some((r) => r.data?.noKnownAllergies);

  const rosData = byKey.ros?.data;
  const socialData = byKey.social_history?.data;
  const familyRows = allSectionEntries(sections, 'family_history');
  const hospitalRows = allSectionEntries(sections, 'hospital_ed_visit');
  const medReconRows = allSectionEntries(sections, 'medication_reconciliation');
  const medHistoryRows = allSectionEntries(sections, 'medication_history');
  const surgicalRows = allSectionEntries(sections, 'surgical_history');

  const hpiParts = cc
    ? [
        cc.reasonForVisit,
        cc.chiefComplaintName,
        cc.hpiGeneratedText,
        cc.hpiLocation && `Location: ${cc.hpiLocation}`,
        cc.hpiQuality && `Quality: ${cc.hpiQuality}`,
        cc.hpiSeverity && `Severity: ${cc.hpiSeverity}`,
        cc.hpiDuration && `Duration: ${cc.hpiDuration}`,
      ].filter(Boolean)
    : [];

  return {
    chiefComplaint: cc
      ? textOrNone([cc.chiefComplaintName, cc.reasonForVisit].filter(Boolean).join(' — '))
      : 'No data available.',
    hpi: hpiParts.length ? hpiParts.join('\n') : 'No data available.',
    ros: rosData ? textOrNone(JSON.stringify(rosData, null, 2)) : 'No data available.',
    vitals: latestVitals ? vitalsSummary(latestVitals) : null,
    vitalsText: latestVitals
      ? [
          latestVitals.bpSys && `BP: ${latestVitals.bpSys}/${latestVitals.bpDia} mmHg`,
          latestVitals.pulse && `Pulse: ${latestVitals.pulse} bpm`,
          latestVitals.temperature && `Temp: ${latestVitals.temperature}°F`,
          latestVitals.respiratoryRate && `RR: ${latestVitals.respiratoryRate}`,
          latestVitals.o2 && `SpO2: ${latestVitals.o2}%`,
        ]
          .filter(Boolean)
          .join('\n')
      : 'No data available.',
    allergies: nkda
      ? 'NKDA'
      : allergyRows.length
        ? allergyRows
            .map((r) =>
              [r.data.allergen, r.data.severity, r.data.reaction].filter(Boolean).join(' — '),
            )
            .join('\n')
        : 'No data available.',
    medicationReconciliation: medReconRows.length
      ? medReconRows.map((r) => JSON.stringify(r.data)).join('\n')
      : 'No data available.',
    medications: medReconRows.length
      ? medReconRows
          .map((r) => [r.data.medicationName, r.data.dose, r.data.frequency].filter(Boolean).join(' '))
          .join('\n')
      : 'No data available.',
    pastMedicalHistory: medHistoryRows.length
      ? medHistoryRows.map((r) => [r.data.conditionName, r.data.status].filter(Boolean).join(' — ')).join('\n')
      : 'No data available.',
    pastSurgicalHistory: surgicalRows.length
      ? surgicalRows
          .map((r) => [r.data.procedureName, r.data.procedureDate].filter(Boolean).join(' — '))
          .join('\n')
      : 'No data available.',
    socialHistory: socialData ? textOrNone(JSON.stringify(socialData, null, 2)) : 'No data available.',
    familyHistory: familyRows.length
      ? familyRows
          .map((r) => [r.data.relationship, r.data.conditionName].filter(Boolean).join(': '))
          .join('\n')
      : 'No family history documented.',
    hospitalVisits: hospitalRows.length
      ? hospitalRows
          .map((r) =>
            [r.data.visitType, r.data.facilityName, r.data.admissionDate].filter(Boolean).join(' — '),
          )
          .join('\n')
      : 'No recent acute care documented.',
    screenings: screenings.length
      ? screenings.map((s) => `${s.screeningType}: ${s.score ?? '—'}/${s.maxScore ?? '—'}`).join('\n')
      : 'No screenings documented.',
  };
}

const notesChartContextService = {
  async getChartContext(patientId, { appointmentId } = {}) {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, deletedAt: null },
      select: {
        id: true,
        mrn: true,
        firstName: true,
        middleName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
        billingType: true,
        copay: true,
        insuranceProvider: { select: { name: true } },
        insurances: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          select: { insuranceProvider: { select: { name: true } } },
        },
      },
    });

    if (!patient) {
      const err = new Error('Patient not found');
      err.statusCode = 404;
      throw err;
    }

    const summary = await patientSummaryService.getSummary(patientId, { encounterId: appointmentId });

    const appointment = appointmentId
      ? await prisma.appointment.findFirst({
          where: { id: appointmentId, patientId },
          include: appointmentInclude,
        })
      : null;

    const sectionWhere = { patientId };
    if (appointmentId) {
      sectionWhere.OR = [{ appointmentId }, { appointmentId: null }];
    }

    const [intakeSections, screenings, intakeCompletion, clinicalNotes] = await Promise.all([
      prisma.patientIntakeSection.findMany({
        where: sectionWhere,
        orderBy: { createdAt: 'asc' },
      }),
      prisma.patientScreeningScore.findMany({
        where: sectionWhere,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.patientIntakeCompletion.findFirst({
        where: sectionWhere,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.patientClinicalNote.findMany({
        where: { patientId, appointmentId: appointmentId || undefined, isDeleted: false },
        orderBy: { updatedAt: 'desc' },
        include: { addendums: { orderBy: { createdAt: 'asc' } } },
      }),
    ]);

    const autoPopulate = buildIntakeAutoPopulate(intakeSections, screenings);
    const activeProblems = summary.problems.filter((p) => p.status === 'Active');
    const activeAllergies = summary.allergies.items.filter((a) => a.status === 'Active' || !a.status);

    const vitalsEntries = allSectionEntries(intakeSections, 'vitals')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((r) => ({
        ...vitalsSummary(r.data),
        recordedAt: r.createdAt,
      }));

    const latestScreeningsByType = {};
    for (const s of screenings) {
      if (!latestScreeningsByType[s.screeningType]) latestScreeningsByType[s.screeningType] = s;
    }

    const labOrders = (summary.orders || []).filter((o) => o.orderType === 'Lab').slice(0, 5);

    return {
      demographics: {
        name: [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' '),
        mrn: patient.mrn,
        dob: formatDisplayDate(patient.dateOfBirth),
        age: calcAge(patient.dateOfBirth),
        sex: patient.gender,
      },
      encounter: appointment
        ? {
            visitType: appointment.appointmentTypeRef?.name || 'Outpatient',
            status: appointment.status,
            provider: formatProviderName(appointment.providerRef, appointment.provider),
            location:
              appointment.departmentRef?.facilityName ||
              appointment.departmentRef?.departmentName ||
              appointment.department,
            encounterDateTime: formatEncounterDateTime(
              appointment.appointmentDate,
              appointment.appointmentTime,
            ),
            chiefComplaint:
              appointment.chiefComplaint || appointment.visitReason || autoPopulate.chiefComplaint,
            encounterId: appointment.id,
            encounterNumber: appointment.encounterNumber,
          }
        : null,
      coverage: {
        primaryPayer:
          patient.insurances[0]?.insuranceProvider?.name ||
          patient.insuranceProvider?.name ||
          (patient.billingType === 'self_pay' ? 'Self-Pay' : '—'),
        insuranceName:
          patient.insurances[0]?.insuranceProvider?.name || patient.insuranceProvider?.name || null,
        selfPay: patient.billingType === 'self_pay',
        eligibility: summary.insuranceEligibilityStatus,
        referrals: { total: 0, pending: 0, denied: 0 },
        taskBlockers: [],
        copay: {
          amountDue: patient.copay != null ? Number(patient.copay) : null,
          amountCollected: null,
        },
      },
      activeProblems: activeProblems.map((p) => ({
        name: p.description,
        icd10Code: p.problemCode,
        status: p.status,
      })),
      pastMedicalHistory: allSectionEntries(intakeSections, 'medication_history').map((r) => ({
        condition: r.data.conditionName || r.data.condition || '—',
        status: r.data.status || '—',
      })),
      pastSurgicalHistory: allSectionEntries(intakeSections, 'surgical_history').map((r) => ({
        procedureName: r.data.procedureName || '—',
        procedureDate: r.data.procedureDate || '—',
        reviewStatus: r.data.outcome || '—',
      })),
      allergies: activeAllergies.map((a) => ({
        allergen: a.allergenName,
        severity: a.severity,
        reaction: a.reaction,
      })),
      nkda: summary.allergies.nkda,
      currentMedications: allSectionEntries(intakeSections, 'medication_reconciliation').map((r) => ({
        name: r.data.medicationName || r.data.name || '—',
        route: r.data.route || '—',
        frequency: r.data.frequency || '—',
      })),
      recentVitals: vitalsEntries,
      familyHistory: allSectionEntries(intakeSections, 'family_history').map((r) => ({
        relationship: r.data.relationship,
        condition: r.data.conditionName,
      })),
      socialHistory: byKeySafe(intakeSections, 'social_history'),
      recentAcuteCare: allSectionEntries(intakeSections, 'hospital_ed_visit').map((r) => ({
        visitType: r.data.visitType,
        facilityName: r.data.facilityName,
        admissionDate: r.data.admissionDate,
      })),
      screenings: Object.values(latestScreeningsByType).map((s) => ({
        type: s.screeningType,
        score: s.score,
        maxScore: s.maxScore,
        recordedAt: s.createdAt,
      })),
      recentResults: labOrders.map((o) => ({
        name: o.orderName,
        value: o.orderStatus,
        date: o.orderedDate,
      })),
      intakeSignOff: intakeCompletion
        ? {
            status: intakeCompletion.completed ? 'Completed' : 'In Progress',
            signedBy: intakeCompletion.signedByName,
            signedAt: intakeCompletion.signedAt,
            certification:
              'I certify that the intake information entered is accurate, complete to the best of my knowledge, and ready for provider review.',
          }
        : { status: 'Not completed', signedBy: null, signedAt: null, certification: null },
      autoPopulate,
      priorNotes: clinicalNotes.map(serializeNoteListItem),
    };
  },
};

function byKeySafe(sections, key) {
  const row = latestSectionsByKey(sections)[key];
  return row?.data || null;
}

function serializeNoteListItem(note) {
  return {
    id: note.id,
    noteType: note.noteType,
    title: note.title || noteTypeLabel(note.noteType),
    author: note.createdByName || note.providerName || '—',
    createdDate: note.createdAt,
    updatedDate: note.updatedAt,
    signatureStatus: note.status,
    signedByName: note.signedByName,
    signedAt: note.signedAt,
  };
}

function noteTypeLabel(type) {
  const labels = {
    soap: 'SOAP Note',
    progress: 'Progress Note',
    telephonic: 'Telephonic Note',
    blank: 'Blank Note',
    nurse: 'Nurse Note',
  };
  return labels[type] || type;
}

module.exports = notesChartContextService;
