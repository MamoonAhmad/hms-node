const prisma = require('../lib/prisma');
const { randomBytes } = require('crypto');

const NOT_DELETED = { deletedAt: null };

const STATUS_OPTIONS = [
  'Draft',
  'Pending',
  'Sent',
  'Received',
  'Authorization Pending',
  'Authorized',
  'Scheduled',
  'In Progress',
  'Completed',
  'Report Received',
  'Cancelled',
  'Expired',
  'Denied',
];

const PRIORITY_OPTIONS = ['Routine', 'Urgent', 'High Priority', 'Stat'];
const AUTH_STATUS_OPTIONS = ['Not Required', 'Pending', 'Submitted', 'Approved', 'Denied', 'Expired'];
const DESTINATION_TYPES = ['internal', 'external', 'facility'];
const DELIVERY_METHODS = [
  'Internal Routing',
  'Fax',
  'Direct Secure Messaging',
  'Email',
  'Print',
  'Portal Delivery',
];

const DEFAULT_REFERRAL_TYPES = [
  'Specialist Consultation',
  'Diagnostic Imaging',
  'Laboratory Services',
  'Physical Therapy',
  'Occupational Therapy',
  'Speech Therapy',
  'Home Health',
  'Behavioral Health',
  'Mental Health',
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Gastroenterology',
  'Pulmonology',
  'Dermatology',
  'Oncology',
  'Endocrinology',
  'Pain Management',
  'Surgical Consultation',
  'Second Opinion',
  'External Provider',
  'Community Services',
  'Other',
];

const auditUserSelect = { id: true, name: true, email: true };

const referralInclude = {
  creator: { select: auditUserSelect },
  updater: { select: auditUserSelect },
  appointment: {
    select: {
      id: true,
      encounterNumber: true,
      appointmentDate: true,
      provider: true,
      department: true,
    },
  },
};

function emptyToNull(value) {
  if (value == null || String(value).trim() === '') return null;
  return String(value).trim();
}

/** Prefer non-empty incoming values; keep defaults when incoming is blank. */
function mergePreferFilled(defaults = {}, incoming = {}) {
  const result = { ...defaults };
  Object.entries(incoming || {}).forEach(([key, value]) => {
    if (value == null) return;
    if (typeof value === 'string' && value.trim() === '') return;
    if (typeof value === 'boolean') {
      result[key] = value;
      return;
    }
    result[key] = value;
  });
  return result;
}

function parseDateInput(value) {
  if (value == null || value === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(date) {
  const d = parseDateInput(date);
  if (!d) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function computeAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

function generateReferralNumber() {
  const suffix = randomBytes(4).toString('hex').toUpperCase();
  return `REF-${Date.now().toString(36).toUpperCase()}-${suffix}`;
}

function buildReferralLetter({ patient, referral, referringProvider, referredTo, diagnoses, clinicalInformation, attachments }) {
  const patientName = [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ');
  const dob = patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '—';
  const diagnosisLines = (diagnoses || [])
    .map((d) => `- ${d.isPrimary ? '[Primary] ' : ''}${d.icd10Code || ''} ${d.description || ''}`.trim())
    .join('\n');
  const attachmentLines = (attachments || [])
    .map((a) => `- ${a.fileName || a.attachmentType || 'Attachment'}`)
    .join('\n');

  const body = [
    'REFERRAL LETTER',
    '',
    `Date: ${new Date(referral.referralDate).toLocaleDateString()}`,
    `Referral #: ${referral.referralNumber}`,
    '',
    'PATIENT INFORMATION',
    `Name: ${patientName}`,
    `MRN: ${patient.mrn}`,
    `DOB: ${dob}`,
    `Gender: ${patient.gender || '—'}`,
    '',
    'REFERRING PROVIDER',
    `Name: ${referringProvider?.providerName || referral.referringProviderName || '—'}`,
    `NPI: ${referringProvider?.npi || referral.referringProviderNpi || '—'}`,
    `Department: ${referringProvider?.department || '—'}`,
    `Location: ${referringProvider?.clinicLocation || '—'}`,
    '',
    'REFERRED TO',
    `Provider: ${referredTo?.providerName || referral.referredToName || '—'}`,
    `Organization: ${referredTo?.organization || referral.referredToOrganization || '—'}`,
    `Specialty: ${referral.specialty || '—'}`,
    '',
    'REASON FOR REFERRAL',
    referral.referralReason || '—',
    '',
    'DIAGNOSES',
    diagnosisLines || '—',
    '',
    'CLINICAL SUMMARY',
    clinicalInformation?.chiefComplaint ? `Chief Complaint: ${clinicalInformation.chiefComplaint}` : '',
    clinicalInformation?.historyOfPresentIllness ? `HPI: ${clinicalInformation.historyOfPresentIllness}` : '',
    clinicalInformation?.assessment ? `Assessment: ${clinicalInformation.assessment}` : '',
    clinicalInformation?.treatmentHistory ? `Treatment History: ${clinicalInformation.treatmentHistory}` : '',
    clinicalInformation?.currentMedications ? `Medications: ${clinicalInformation.currentMedications}` : '',
    clinicalInformation?.allergies ? `Allergies: ${clinicalInformation.allergies}` : '',
    clinicalInformation?.activeProblems ? `Active Problems: ${clinicalInformation.activeProblems}` : '',
    clinicalInformation?.notes ? `Notes: ${clinicalInformation.notes}` : '',
    '',
    'ATTACHMENTS',
    attachmentLines || 'None',
  ]
    .filter((line) => line !== '')
    .join('\n');

  return { body, generatedAt: new Date().toISOString(), isEdited: false };
}

function computeAlerts(referral) {
  const alerts = [];
  const now = new Date();

  if (referral.authorizationStatus === 'Pending' || referral.authorizationStatus === 'Submitted') {
    alerts.push({ type: 'Authorization Pending', severity: 'warning' });
  }

  const insurance = referral.insurance || {};
  if (insurance.authorizationExpirationDate) {
    const exp = new Date(insurance.authorizationExpirationDate);
    const daysLeft = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 7 && daysLeft >= 0) {
      alerts.push({ type: 'Authorization Expiring', severity: 'warning', daysLeft });
    }
  }

  if (referral.expirationDate) {
    const exp = new Date(referral.expirationDate);
    const daysLeft = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 14 && daysLeft >= 0 && !['Completed', 'Cancelled', 'Expired'].includes(referral.status)) {
      alerts.push({ type: 'Referral Expiring', severity: 'warning', daysLeft });
    }
    if (daysLeft < 0 && referral.status !== 'Expired') {
      alerts.push({ type: 'Referral Expired', severity: 'error' });
    }
  }

  const appt = referral.referralAppointment || {};
  if (appt.appointmentDate && appt.status === 'Missed') {
    alerts.push({ type: 'Appointment Missed', severity: 'error' });
  }

  const report = referral.consultationReport || {};
  if (
    ['Scheduled', 'In Progress', 'Sent', 'Received'].includes(referral.status) &&
    appt.appointmentDate &&
    !report.reportReceivedDate
  ) {
    const apptDate = new Date(appt.appointmentDate);
    const daysSince = Math.floor((now - apptDate) / (1000 * 60 * 60 * 24));
    if (daysSince > 14) {
      alerts.push({ type: 'Consultation Report Overdue', severity: 'warning', daysSince });
    }
  }

  if (report.followUpRequired && !referral.completion?.followUpPlan) {
    alerts.push({ type: 'Follow-up Required', severity: 'info' });
  }

  return alerts;
}

function serializeRow(row) {
  if (!row) return null;
  const referredTo = row.referredTo || {};
  const alerts = computeAlerts(row);

  return {
    id: row.id,
    referralNumber: row.referralNumber,
    patientId: row.patientId,
    appointmentId: row.appointmentId,
    referralType: row.referralType,
    specialty: row.specialty,
    priority: row.priority,
    referralDate: row.referralDate ? row.referralDate.toISOString().slice(0, 10) : null,
    expirationDate: row.expirationDate ? row.expirationDate.toISOString().slice(0, 10) : null,
    referralReason: row.referralReason,
    primaryIcd10Code: row.primaryIcd10Code,
    primaryDiagnosis: row.primaryDiagnosis,
    destinationType: row.destinationType,
    referredToName: row.referredToName || referredTo.providerName || referredTo.facilityName,
    referredToOrganization: row.referredToOrganization || referredTo.organization,
    referredToNpi: row.referredToNpi || referredTo.npi,
    referringProviderName: row.referringProviderName,
    referringProviderNpi: row.referringProviderNpi,
    status: row.status,
    authorizationStatus: row.authorizationStatus,
    appointmentScheduledDate: row.appointmentScheduledDate,
    deliveryMethod: row.deliveryMethod,
    sentAt: row.sentAt,
    sentBy: row.sentBy,
    completedAt: row.completedAt,
    completedBy: row.completedBy,
    referringProvider: row.referringProvider,
    referredTo: row.referredTo,
    diagnoses: row.diagnoses,
    clinicalInformation: row.clinicalInformation,
    attachments: row.attachments,
    insurance: row.insurance,
    referralLetter: row.referralLetter,
    tracking: row.tracking,
    referralAppointment: row.referralAppointment,
    consultationReport: row.consultationReport,
    completion: row.completion,
    alerts,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    createdByName: row.creator?.name || row.creator?.email || '—',
    updatedByName: row.updater?.name || row.updater?.email || '—',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    appointment: row.appointment
      ? {
          id: row.appointment.id,
          encounterNumber: row.appointment.encounterNumber,
          appointmentDate: row.appointment.appointmentDate,
          provider: row.appointment.provider,
          department: row.appointment.department,
        }
      : null,
  };
}

async function assertPatientExists(patientId) {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, deletedAt: null },
  });
  if (!patient) {
    const err = new Error('Patient not found');
    err.statusCode = 404;
    throw err;
  }
  return patient;
}

async function getUserName(userId) {
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  return user?.name || user?.email || null;
}

async function recordTimeline(referralId, eventType, userId, notes = null) {
  const userName = await getUserName(userId);
  return prisma.patientReferralTimelineEvent.create({
    data: {
      referralId,
      eventType,
      notes,
      userId,
      userName,
    },
  });
}

async function recordAudit(referralId, action, userId, previousValue = null, newValue = null) {
  const userName = await getUserName(userId);
  return prisma.patientReferralAuditLog.create({
    data: {
      referralId,
      action,
      previousValue,
      newValue,
      userId,
      userName,
    },
  });
}

async function ensureReferralTypesSeeded(userId) {
  const count = await prisma.referralType.count({ where: NOT_DELETED });
  if (count > 0) return;

  await prisma.referralType.createMany({
    data: DEFAULT_REFERRAL_TYPES.map((name, index) => ({
      id: randomBytes(16).toString('hex').slice(0, 32),
      name,
      category: 'Clinical',
      isActive: true,
      sortOrder: index,
      createdBy: userId,
      updatedBy: userId,
    })),
    skipDuplicates: true,
  });
}

function extractListingFields(body) {
  const diagnoses = Array.isArray(body.diagnoses) ? body.diagnoses : [];
  const primary = diagnoses.find((d) => d.isPrimary) || diagnoses[0] || null;
  const referredTo = body.referredTo || {};

  return {
    primaryIcd10Code: primary?.icd10Code || body.primaryIcd10Code || null,
    primaryDiagnosis: primary?.description || body.primaryDiagnosis || null,
    referredToName:
      referredTo.providerName ||
      referredTo.facilityName ||
      body.referredToName ||
      null,
    referredToOrganization: referredTo.organization || body.referredToOrganization || null,
    referredToNpi: referredTo.npi || body.referredToNpi || null,
    referringProviderName: body.referringProvider?.providerName || body.referringProviderName || null,
    referringProviderNpi: body.referringProvider?.npi || body.referringProviderNpi || null,
    appointmentScheduledDate: body.referralAppointment?.appointmentDate
      ? parseDateInput(body.referralAppointment.appointmentDate)
      : body.appointmentScheduledDate
        ? parseDateInput(body.appointmentScheduledDate)
        : null,
    authorizationStatus: body.insurance?.authorizationStatus || body.authorizationStatus || 'Not Required',
  };
}

function buildHpiFromIntakePayload(payload = {}) {
  if (payload.hpiNarrative || payload.historyOfPresentIllness) {
    return payload.hpiNarrative || payload.historyOfPresentIllness;
  }
  const hpi = payload.hpi || {};
  const parts = [];
  if (hpi.onset) parts.push(`Onset: ${hpi.onset}`);
  if (hpi.location) parts.push(`Location: ${hpi.location}`);
  if (hpi.duration) parts.push(`Duration: ${hpi.duration}`);
  if (hpi.character) parts.push(`Character: ${hpi.character}`);
  if (hpi.timing) parts.push(`Timing: ${hpi.timing}`);
  if (hpi.severity) parts.push(`Severity: ${hpi.severity}`);
  if (hpi.aggravating) parts.push(`Aggravating factors: ${hpi.aggravating}`);
  if (hpi.relieving) parts.push(`Relieving factors: ${hpi.relieving}`);
  if (Array.isArray(hpi.associatedSymptoms) && hpi.associatedSymptoms.length) {
    parts.push(`Associated symptoms: ${hpi.associatedSymptoms.join(', ')}`);
  }
  if (hpi.additionalNotes) parts.push(hpi.additionalNotes);
  if (payload.additionalNotes) parts.push(payload.additionalNotes);
  return parts.length ? parts.join('. ') : null;
}

function formatMedicationsFromIntake(intakeRecords) {
  const lines = [];
  for (const record of intakeRecords) {
    if (record.sectionType !== 'medication_reconciliation') continue;
    const payload = record.payload || {};
    if (payload.noMedication) {
      lines.push('No current medications reported.');
      continue;
    }
    for (const med of payload.medications || []) {
      const parts = [med.medicationName || med.name, med.dose, med.route, med.frequency]
        .filter(Boolean);
      if (parts.length) lines.push(parts.join(' — '));
    }
  }
  return lines.length ? [...new Set(lines)].join('\n') : null;
}

function formatInsuranceForReferral(insurances = []) {
  const primary = insurances.find((i) => i.insuranceType === 'Primary') || insurances[0];
  const secondary = insurances.find((i) => i.insuranceType === 'Secondary');
  if (!primary && !secondary) return null;

  return {
    primaryInsurance: primary?.insuranceProvider?.name || primary?.payerName || '',
    secondaryInsurance: secondary?.insuranceProvider?.name || secondary?.payerName || '',
    payer: primary?.insuranceProvider?.name || primary?.payerName || '',
    memberId: primary?.memberId || '',
    groupNumber: primary?.groupNumber || '',
    authorizationRequired: false,
    authorizationNumber: '',
    authorizationStatus: 'Not Required',
    submissionDate: '',
    approvalDate: '',
    authorizationExpirationDate: '',
  };
}

async function buildEncounterContext(patientId, appointmentId) {
  if (!appointmentId) {
    return { referringProvider: null, clinicalInformation: null, insurance: null, appointment: null };
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, patientId },
    include: {
      providerRef: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          npi: true,
          mobileNumber: true,
          email: true,
          specialty: { select: { name: true } },
          department: { select: { departmentName: true } },
        },
      },
      departmentRef: { select: { departmentName: true, facilityName: true, address: true, city: true, state: true, zip: true } },
    },
  });

  if (!appointment) {
    return { referringProvider: null, clinicalInformation: null, insurance: null, appointment: null };
  }

  const provider = appointment.providerRef;
  const providerName =
    appointment.provider ||
    (provider ? [provider.firstName, provider.lastName].filter(Boolean).join(' ') : null);

  const referringProvider = {
    providerId: provider?.id || appointment.providerId || null,
    providerName: providerName || '—',
    npi: provider?.npi || null,
    department: appointment.departmentRef?.departmentName || appointment.department || null,
    clinicLocation: appointment.departmentRef?.facilityName || appointment.department || null,
    contactInformation: provider?.mobileNumber || provider?.email || null,
  };

  const [problems, allergies, intakeRecords, insurances, nkdaSetting] = await Promise.all([
    prisma.patientProblem.findMany({
      where: { patientId, deletedAt: null, status: 'Active' },
      take: 10,
      select: { icd10Code: true, diagnosisDescription: true },
    }),
    prisma.patientAllergy.findMany({
      where: { patientId },
      take: 20,
      select: { allergenName: true, severity: true, reaction: true, status: true },
    }),
    prisma.patientIntakeRecord.findMany({
      where: { patientId, appointmentId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      select: { sectionType: true, payload: true, createdAt: true },
    }),
    prisma.patientInsurance.findMany({
      where: { patientId },
      orderBy: { insuranceType: 'asc' },
      include: { insuranceProvider: { select: { name: true } } },
    }),
    prisma.patient.findUnique({
      where: { id: patientId },
      select: { noKnownDrugAllergies: true },
    }),
  ]);

  const ccHpiRecord = intakeRecords.find((r) => r.sectionType === 'chief_complaint_hpi');
  const ccHpi = ccHpiRecord?.payload || {};
  const intakeHpi = buildHpiFromIntakePayload(ccHpi);

  const allergyText = (() => {
    const active = allergies.filter((a) => !a.status || String(a.status).toLowerCase() === 'active');
    if (active.length) {
      return active
        .map((a) => {
          const bits = [a.allergenName];
          if (a.reaction) bits.push(a.reaction);
          if (a.severity) bits.push(`(${a.severity})`);
          return bits.filter(Boolean).join(' — ');
        })
        .join('\n');
    }
    if (nkdaSetting?.noKnownDrugAllergies) return 'NKDA';
    return null;
  })();

  const clinicalInformation = {
    // Prefer appointment visit reason (scheduling form), then intake CC
    chiefComplaint:
      appointment.visitReason ||
      ccHpi.chiefComplaintName ||
      ccHpi.chiefComplaint ||
      ccHpi.reasonOfVisit ||
      null,
    historyOfPresentIllness: intakeHpi,
    assessment: null,
    treatmentHistory: null,
    currentMedications: formatMedicationsFromIntake(intakeRecords),
    allergies: allergyText,
    activeProblems: problems.map((p) => `${p.icd10Code || ''} ${p.diagnosisDescription}`.trim()).join('; ') || null,
    notes: null,
  };

  return {
    referringProvider,
    clinicalInformation,
    insurance: formatInsuranceForReferral(insurances),
    appointment: {
      id: appointment.id,
      encounterNumber: appointment.encounterNumber || null,
      visitReason: appointment.visitReason || null,
      appointmentDate: appointment.appointmentDate || null,
      provider: providerName || null,
    },
  };
}

const referralService = {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  AUTH_STATUS_OPTIONS,
  DELIVERY_METHODS,

  async getReferralTypes(userId) {
    await ensureReferralTypesSeeded(userId);
    const types = await prisma.referralType.findMany({
      where: { ...NOT_DELETED, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, category: true },
    });
    return types.length ? types : DEFAULT_REFERRAL_TYPES.map((name, i) => ({ id: String(i), name, category: 'Clinical' }));
  },

  async getSummaryCounts(patientId, filters = {}) {
    await assertPatientExists(patientId);
    const where = { patientId, ...NOT_DELETED };
    if (filters.appointmentId) where.appointmentId = filters.appointmentId;

    const rows = await prisma.patientReferral.findMany({
      where,
      select: { status: true, authorizationStatus: true, expirationDate: true },
    });

    const now = new Date();
    const summary = {
      total: rows.length,
      pending: 0,
      scheduled: 0,
      authorized: 0,
      completed: 0,
      expired: 0,
      cancelled: 0,
    };

    rows.forEach((row) => {
      if (['Draft', 'Pending', 'Sent', 'Received', 'Authorization Pending'].includes(row.status)) {
        summary.pending += 1;
      }
      if (row.status === 'Scheduled' || row.status === 'In Progress') summary.scheduled += 1;
      if (row.authorizationStatus === 'Approved' || row.status === 'Authorized') summary.authorized += 1;
      if (['Completed', 'Report Received'].includes(row.status)) summary.completed += 1;
      if (row.status === 'Cancelled') summary.cancelled += 1;
      if (row.status === 'Expired' || (row.expirationDate && new Date(row.expirationDate) < now && row.status !== 'Completed')) {
        summary.expired += 1;
      }
    });

    return summary;
  },

  async getPatientPanel(patientId, appointmentId = null) {
    const patient = await assertPatientExists(patientId);

    const [problems, allergies, insurances, recentAppointments, encounterProblems] =
      await Promise.all([
        prisma.patientProblem.findMany({
          where: { patientId, deletedAt: null, status: 'Active' },
          take: 8,
          select: { id: true, icd10Code: true, diagnosisDescription: true },
        }),
        prisma.patientAllergy.findMany({
          where: { patientId },
          take: 8,
          select: { allergenName: true, severity: true },
        }),
        prisma.patientInsurance.findMany({
          where: { patientId },
          orderBy: { insuranceType: 'asc' },
          include: { insuranceProvider: { select: { name: true } } },
        }),
        prisma.appointment.findMany({
          where: { patientId },
          orderBy: { appointmentDate: 'desc' },
          take: 5,
          select: {
            id: true,
            encounterNumber: true,
            appointmentDate: true,
            provider: true,
            status: true,
          },
        }),
        appointmentId
          ? prisma.encounterProblem.findMany({
              where: { patientId, appointmentId, addressedThisVisit: true },
              include: {
                problem: {
                  select: { icd10Code: true, diagnosisDescription: true, deletedAt: true },
                },
              },
              orderBy: [{ isPrimary: 'desc' }, { priority: 'asc' }],
              take: 8,
            })
          : Promise.resolve([]),
      ]);

    const addressedProblems = (encounterProblems || [])
      .filter((r) => r.problem && !r.problem.deletedAt)
      .map((r) => ({
        code: r.problem.icd10Code,
        description: r.problem.diagnosisDescription,
      }));

    let medications = [];
    try {
      const medOrders = await prisma.medicationOrder.findMany({
        where: {
          patientId,
          status: { in: ['Signed', 'Verified', 'Sent', 'Completed'] },
          ...(appointmentId ? { appointmentId } : {}),
        },
        take: 10,
        select: { medicationName: true, sigPreview: true, status: true },
      });
      medications = medOrders.map((m) => m.medicationName || m.sigPreview).filter(Boolean);
    } catch {
      medications = [];
    }

    const primaryInsurance = insurances.find((i) => i.insuranceType === 'Primary') || insurances[0];
    const secondaryInsurance = insurances.find((i) => i.insuranceType === 'Secondary');

    return {
      patientName: [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' '),
      mrn: patient.mrn,
      dateOfBirth: patient.dateOfBirth,
      age: computeAge(patient.dateOfBirth),
      gender: patient.gender,
      allergies: allergies.map((a) => ({ id: a.allergenName, allergenName: a.allergenName, severity: a.severity })),
      currentMedications: medications,
      activeProblems: (addressedProblems.length
        ? addressedProblems
        : problems.map((p) => ({
            code: p.icd10Code,
            description: p.diagnosisDescription,
          }))),
      recentVisits: recentAppointments.map((a) => ({
        id: a.id,
        encounterNumber: a.encounterNumber,
        date: a.appointmentDate,
        provider: a.provider,
        status: a.status,
      })),
      insuranceSummary: {
        primaryInsurance: primaryInsurance
          ? {
              payer: primaryInsurance.insuranceProvider?.name || '—',
              memberId: primaryInsurance.memberId,
              groupNumber: primaryInsurance.groupNumber || null,
            }
          : null,
        secondaryInsurance: secondaryInsurance
          ? {
              payer: secondaryInsurance.insuranceProvider?.name || '—',
              memberId: secondaryInsurance.memberId,
            }
          : null,
      },
    };
  },

  async findAll(patientId, filters = {}) {
    await assertPatientExists(patientId);
    const where = { patientId, ...NOT_DELETED };
    if (filters.status) where.status = filters.status;
    if (filters.appointmentId) where.appointmentId = filters.appointmentId;
    if (filters.priority) where.priority = filters.priority;

    const rows = await prisma.patientReferral.findMany({
      where,
      include: referralInclude,
      orderBy: [{ referralDate: 'desc' }, { createdAt: 'desc' }],
    });

    return rows.map(serializeRow);
  },

  async findById(patientId, referralId) {
    await assertPatientExists(patientId);
    const row = await prisma.patientReferral.findFirst({
      where: { id: referralId, patientId, ...NOT_DELETED },
      include: {
        ...referralInclude,
        notes: {
          include: { author: { select: auditUserSelect } },
          orderBy: { createdAt: 'desc' },
        },
        timelineEvents: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!row) return null;

    const serialized = serializeRow(row);
    serialized.notes = (row.notes || []).map((n) => ({
      id: n.id,
      noteType: n.noteType,
      content: n.content,
      authorId: n.authorId,
      authorName: n.author?.name || n.author?.email || '—',
      createdAt: n.createdAt,
    }));
    serialized.timeline = (row.timelineEvents || []).map((e) => ({
      id: e.id,
      eventType: e.eventType,
      notes: e.notes,
      userId: e.userId,
      userName: e.userName,
      createdAt: e.createdAt,
    }));
    return serialized;
  },

  async create(patientId, body, userId) {
    const patient = await assertPatientExists(patientId);
    const appointmentId = emptyToNull(body.appointmentId);

    if (appointmentId) {
      const linkedAppointment = await prisma.appointment.findFirst({
        where: { id: appointmentId, patientId },
        select: { id: true },
      });
      if (!linkedAppointment) {
        const err = new Error('Related encounter was not found for this patient');
        err.statusCode = 400;
        throw err;
      }
    }

    const listingFields = extractListingFields(body);

    let referringProvider = body.referringProvider || null;
    let clinicalInformation = body.clinicalInformation || null;
    let insurance = body.insurance || null;

    if (appointmentId && (!referringProvider || body.autoPopulateFromEncounter)) {
      const ctx = await buildEncounterContext(patientId, appointmentId);
      referringProvider = referringProvider || ctx.referringProvider;
      if (!clinicalInformation || body.autoPopulateFromEncounter) {
        clinicalInformation = mergePreferFilled(ctx.clinicalInformation || {}, clinicalInformation || {});
      }
      if (!insurance || body.autoPopulateFromEncounter) {
        insurance = mergePreferFilled(ctx.insurance || {}, insurance || {});
      }
    }

    const referralDate = startOfDay(body.referralDate) || startOfDay(new Date());
    const expirationDate = startOfDay(body.expirationDate);

    const referralData = {
      referralNumber: generateReferralNumber(),
      patientId,
      appointmentId,
      referralType: body.referralType,
      specialty: body.specialty,
      priority: PRIORITY_OPTIONS.includes(body.priority) ? body.priority : 'Routine',
      referralDate,
      expirationDate,
      referralReason: body.referralReason,
      destinationType: DESTINATION_TYPES.includes(body.destinationType) ? body.destinationType : 'external',
      status: body.status && STATUS_OPTIONS.includes(body.status) ? body.status : 'Draft',
      referringProvider,
      referredTo: body.referredTo || null,
      diagnoses: body.diagnoses || [],
      clinicalInformation,
      attachments: body.attachments || [],
      insurance,
      tracking: body.tracking || {},
      referralAppointment: body.referralAppointment || null,
      consultationReport: body.consultationReport || null,
      completion: body.completion || null,
      ...listingFields,
    };

    referralData.referralLetter = buildReferralLetter({
      patient,
      referral: referralData,
      referringProvider,
      referredTo: body.referredTo,
      diagnoses: body.diagnoses,
      clinicalInformation,
      attachments: body.attachments,
    });

    if (body.referralLetter?.body) {
      referralData.referralLetter = {
        ...referralData.referralLetter,
        body: body.referralLetter.body,
        isEdited: true,
      };
    }

    referralData.alerts = computeAlerts(referralData);

    const row = await prisma.patientReferral.create({
      data: {
        ...referralData,
        createdBy: userId,
        updatedBy: userId,
      },
      include: referralInclude,
    });

    await recordTimeline(row.id, 'Referral Created', userId, 'Referral created');
    await recordAudit(row.id, 'Referral Created', userId, null, { status: row.status });

    return serializeRow(row);
  },

  async update(patientId, referralId, body, userId) {
    const patient = await assertPatientExists(patientId);
    const existing = await prisma.patientReferral.findFirst({
      where: { id: referralId, patientId, ...NOT_DELETED },
    });
    if (!existing) {
      const err = new Error('Referral not found');
      err.statusCode = 404;
      throw err;
    }

    const listingFields = extractListingFields({ ...existing, ...body });
    const updateData = {
      updatedBy: userId,
    };

    const scalarFields = [
      'referralType',
      'specialty',
      'priority',
      'referralReason',
      'destinationType',
      'status',
      'deliveryMethod',
      'sentBy',
      'completedBy',
    ];
    scalarFields.forEach((field) => {
      if (body[field] !== undefined) updateData[field] = body[field];
    });

    if (body.referralDate !== undefined) updateData.referralDate = startOfDay(body.referralDate);
    if (body.expirationDate !== undefined) updateData.expirationDate = startOfDay(body.expirationDate);
    if (body.appointmentId !== undefined) updateData.appointmentId = emptyToNull(body.appointmentId);

    const jsonFields = [
      'referringProvider',
      'referredTo',
      'diagnoses',
      'clinicalInformation',
      'attachments',
      'insurance',
      'referralLetter',
      'tracking',
      'referralAppointment',
      'consultationReport',
      'completion',
    ];
    jsonFields.forEach((field) => {
      if (body[field] !== undefined) updateData[field] = body[field];
    });

    Object.assign(updateData, listingFields);

    const merged = { ...existing, ...updateData };
    updateData.referralLetter =
      body.referralLetter ||
      buildReferralLetter({
        patient,
        referral: merged,
        referringProvider: merged.referringProvider,
        referredTo: merged.referredTo,
        diagnoses: merged.diagnoses,
        clinicalInformation: merged.clinicalInformation,
        attachments: merged.attachments,
      });
    updateData.alerts = computeAlerts(merged);

    const row = await prisma.patientReferral.update({
      where: { id: referralId },
      data: updateData,
      include: referralInclude,
    });

    await recordTimeline(row.id, 'Referral Modified', userId, 'Referral updated');
    await recordAudit(row.id, 'Referral Modified', userId, { status: existing.status }, { status: row.status });

    return serializeRow(row);
  },

  async updateStatus(patientId, referralId, status, userId, extra = {}) {
    if (!STATUS_OPTIONS.includes(status)) {
      const err = new Error('Invalid referral status');
      err.statusCode = 400;
      throw err;
    }

    const existing = await prisma.patientReferral.findFirst({
      where: { id: referralId, patientId, ...NOT_DELETED },
    });
    if (!existing) {
      const err = new Error('Referral not found');
      err.statusCode = 404;
      throw err;
    }

    const updateData = {
      status,
      updatedBy: userId,
    };

    if (extra.authorizationStatus) updateData.authorizationStatus = extra.authorizationStatus;
    if (extra.tracking) updateData.tracking = { ...(existing.tracking || {}), ...extra.tracking };
    if (extra.referralAppointment) {
      updateData.referralAppointment = extra.referralAppointment;
      updateData.appointmentScheduledDate = parseDateInput(extra.referralAppointment.appointmentDate);
    }
    if (extra.consultationReport) updateData.consultationReport = extra.consultationReport;
    if (extra.completion) {
      updateData.completion = extra.completion;
      updateData.completedAt = new Date();
      updateData.completedBy = userId;
    }

    updateData.alerts = computeAlerts({ ...existing, ...updateData });

    const row = await prisma.patientReferral.update({
      where: { id: referralId },
      data: updateData,
      include: referralInclude,
    });

    await recordTimeline(row.id, `Status Changed to ${status}`, userId, extra.notes || null);
    await recordAudit(row.id, 'Referral Status Updated', userId, { status: existing.status }, { status });

    return serializeRow(row);
  },

  async send(patientId, referralId, body, userId) {
    const existing = await prisma.patientReferral.findFirst({
      where: { id: referralId, patientId, ...NOT_DELETED },
    });
    if (!existing) {
      const err = new Error('Referral not found');
      err.statusCode = 404;
      throw err;
    }

    const deliveryMethod = body.deliveryMethod || existing.deliveryMethod || 'Internal Routing';
    const now = new Date();
    const tracking = {
      ...(existing.tracking || {}),
      dateSent: now.toISOString(),
      sentBy: await getUserName(userId),
      deliveryMethod,
      ...(body.tracking || {}),
    };

    const row = await prisma.patientReferral.update({
      where: { id: referralId },
      data: {
        status: 'Sent',
        deliveryMethod,
        sentAt: now,
        sentBy: userId,
        tracking,
        updatedBy: userId,
        alerts: computeAlerts({ ...existing, status: 'Sent', tracking }),
      },
      include: referralInclude,
    });

    await recordTimeline(row.id, 'Referral Sent', userId, `Sent via ${deliveryMethod}`);
    await recordAudit(row.id, 'Referral Sent', userId, null, { deliveryMethod, sentAt: now });

    return serializeRow(row);
  },

  async addNote(patientId, referralId, body, userId) {
    const existing = await prisma.patientReferral.findFirst({
      where: { id: referralId, patientId, ...NOT_DELETED },
    });
    if (!existing) {
      const err = new Error('Referral not found');
      err.statusCode = 404;
      throw err;
    }

    const note = await prisma.patientReferralNote.create({
      data: {
        referralId,
        noteType: body.noteType || 'General',
        content: body.content,
        authorId: userId,
      },
      include: { author: { select: auditUserSelect } },
    });

    return {
      id: note.id,
      noteType: note.noteType,
      content: note.content,
      authorId: note.authorId,
      authorName: note.author?.name || note.author?.email || '—',
      createdAt: note.createdAt,
    };
  },

  async getTimeline(patientId, referralId) {
    const existing = await prisma.patientReferral.findFirst({
      where: { id: referralId, patientId, ...NOT_DELETED },
      select: { id: true },
    });
    if (!existing) {
      const err = new Error('Referral not found');
      err.statusCode = 404;
      throw err;
    }

    return prisma.patientReferralTimelineEvent.findMany({
      where: { referralId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getAuditLogs(patientId, referralId) {
    const existing = await prisma.patientReferral.findFirst({
      where: { id: referralId, patientId, ...NOT_DELETED },
      select: { id: true },
    });
    if (!existing) {
      const err = new Error('Referral not found');
      err.statusCode = 404;
      throw err;
    }

    return prisma.patientReferralAuditLog.findMany({
      where: { referralId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async cancel(patientId, referralId, userId, notes = null) {
    return this.updateStatus(patientId, referralId, 'Cancelled', userId, { notes });
  },

  async close(patientId, referralId, body, userId) {
    return this.updateStatus(patientId, referralId, 'Completed', userId, {
      completion: body.completion || body,
      notes: body.notes,
    });
  },

  async delete(patientId, referralId, userId) {
    const existing = await prisma.patientReferral.findFirst({
      where: { id: referralId, patientId, ...NOT_DELETED },
    });
    if (!existing) {
      const err = new Error('Referral not found');
      err.statusCode = 404;
      throw err;
    }

    await prisma.patientReferral.update({
      where: { id: referralId },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        updatedBy: userId,
      },
    });

    await recordAudit(referralId, 'Referral Deleted', userId, { status: existing.status }, null);
    return { id: referralId };
  },

  async getEncounterDefaults(patientId, appointmentId) {
    await assertPatientExists(patientId);
    return buildEncounterContext(patientId, appointmentId);
  },
};

module.exports = referralService;
