const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { BILLING_STATUSES } = require('../validation/rcmEncounter.validation');
const claimEngineService = require('./claimEngine.service');
const codeCatalogService = require('./codeCatalog.service');
const { splitProcedureCode } = require('../lib/codeCatalog');

function formatName(person) {
  if (!person) return null;
  return [person.firstName, person.middleName, person.lastName].filter(Boolean).join(' ');
}

function formatPatientDisplayName(patient) {
  if (!patient) return '';
  return [patient.lastName, [patient.firstName, patient.middleName].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');
}

function toDateOnly(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
}

function money(n) {
  return Math.round(Number(n || 0) * 100) / 100;
}

function deriveInitialBillingStatus(appointmentStatus) {
  const status = appointmentStatus || '';
  if (['Completed', 'Check out', 'Checkout'].includes(status)) return 'Coding';
  if (['Cancelled', 'No-Show', 'No Show'].includes(status)) return 'Unbilled';
  return 'Unbilled';
}

function seedOverlay(appointment, patient) {
  const primaryInsurance = (patient?.insurances || []).find((i) => i.insuranceType === 'Primary')
    || patient?.insurances?.[0]
    || null;
  const payerName = primaryInsurance?.insuranceProvider?.name
    || patient?.insuranceProvider?.name
    || (patient?.billingType === 'Self-Pay' ? 'Self-Pay' : 'Unknown payer');

  const problems = (patient?.problems || [])
    .filter((p) => !p.isDeleted && p.status === 'Active')
    .slice(0, 4);

  const diagnoses = problems.length
    ? problems.map((p, idx) => ({
        id: p.id,
        code: p.problemCode || p.diagnosis?.code || `Z00.0${idx}`,
        description: p.description || p.diagnosis?.description,
        pointer: String.fromCharCode(65 + idx),
        isPrimary: idx === 0,
        catalogId: p.diagnosisId || p.diagnosis?.id || null,
      }))
    : [
        {
          id: crypto.randomUUID(),
          code: 'Z00.00',
          description: 'Encounter for general adult medical examination without abnormal findings',
          pointer: 'A',
          isPrimary: true,
        },
      ];

  const charges = [
    {
      id: crypto.randomUUID(),
      cptCode: '99213',
      description: 'Office/outpatient visit, established patient, low MDM',
      modifiers: '',
      units: 1,
      unitCharge: 185,
      diagnosisPointers: 'A',
      placeOfService: '11',
    },
  ];

  return {
    billingStatus: deriveInitialBillingStatus(appointment.status),
    diagnoses,
    charges,
    payments: [],
    followUpNotes: [],
    auditTrail: [
      {
        id: crypto.randomUUID(),
        action: 'Encounter opened for billing',
        userName: 'System',
        createdAt: new Date().toISOString(),
        details: `Seeded from appointment ${appointment.encounterNumber}`,
      },
    ],
    meta: {
      payerName,
      placeOfService: '11 - Office',
    },
    claimId: null,
  };
}

function overlayFromRow(row) {
  return {
    billingStatus: row.billingStatus,
    diagnoses: row.diagnoses || [],
    charges: row.charges || [],
    payments: row.payments || [],
    followUpNotes: row.followUpNotes || [],
    auditTrail: row.auditTrail || [],
    meta: row.meta || {},
    claimId: row.claimId || null,
  };
}

function recomputeClaimFinancials(overlay, claimRow = null) {
  const totalCharge = money(
    (overlay.charges || []).reduce((sum, c) => sum + Number(c.units || 0) * Number(c.unitCharge || 0), 0),
  );
  const amountPaid = claimRow
    ? Number(claimRow.paidAmount || 0)
    : money(
        (overlay.payments || [])
          .filter((p) => p.type === 'Insurance payment' || p.type === 'Patient payment')
          .reduce((sum, p) => sum + Number(p.amount || 0), 0),
      );
  const adjustments = claimRow
    ? Number(claimRow.adjustmentAmount || 0)
    : money(
        (overlay.payments || [])
          .filter((p) => p.type === 'Adjustment' || p.type === 'Write-off')
          .reduce((sum, p) => sum + Number(p.amount || 0), 0),
      );
  const balanceDue = money(totalCharge - amountPaid - Math.abs(adjustments));

  overlay.claim = {
    claimId: claimRow?.claimNumber || overlay.claim?.claimId || null,
    claimDbId: claimRow?.id || overlay.claimId || null,
    claimType: claimRow?.formType === 'UB-04' ? 'institutional' : 'professional',
    form: claimRow?.formType || overlay.claim?.form || 'CMS-1500',
    status: claimRow?.claimStatus
      || overlay.claim?.status
      || (overlay.billingStatus === 'Unbilled' ? 'Not created' : 'Draft'),
    submittedDate: toDateOnly(claimRow?.submittedAt) || overlay.claim?.submittedDate || null,
    tcn: claimRow?.tcn || overlay.claim?.tcn || null,
    totalCharge: claimRow?.billedAmount != null ? Number(claimRow.billedAmount) : totalCharge,
    amountPaid,
    balanceDue: balanceDue < 0 ? 0 : balanceDue,
    rejectionReason: claimRow?.denialReason || overlay.claim?.rejectionReason || null,
    scrubStatus: claimRow?.scrubStatus || null,
    scrubIssues: claimRow?.scrubIssues || [],
  };
  return overlay;
}

function pushAudit(overlay, action, user, details) {
  overlay.auditTrail = [
    {
      id: crypto.randomUUID(),
      action,
      userName: user?.name || user?.email || 'User',
      createdAt: new Date().toISOString(),
      details: details || null,
    },
    ...(overlay.auditTrail || []),
  ].slice(0, 50);
}

function buildAlerts(patient, overlay) {
  const alerts = [];
  const eligibility = patient?.eligibilityChecks?.[0];
  if (!eligibility || eligibility.status === 'Not Verified' || eligibility.status === 'Failed') {
    alerts.push({ type: 'warning', code: 'eligibility', message: 'Eligibility not verified' });
  }
  if (!(overlay.diagnoses || []).length) {
    alerts.push({ type: 'danger', code: 'diagnoses', message: 'No ICD diagnoses coded' });
  }
  if (!(overlay.charges || []).length) {
    alerts.push({ type: 'danger', code: 'charges', message: 'No CPT charges captured' });
  }
  if (overlay.billingStatus === 'Denied') {
    alerts.push({
      type: 'danger',
      code: 'denied',
      message: overlay.claim?.rejectionReason || 'Claim denied — follow-up required',
    });
  }
  if ((overlay.claim?.balanceDue || 0) > 0 && ['Submitted', 'Paid', 'Follow-up'].includes(overlay.billingStatus)) {
    alerts.push({
      type: 'info',
      code: 'balance',
      message: `Open balance $${Number(overlay.claim.balanceDue).toFixed(2)}`,
    });
  }
  const primary = (patient?.insurances || []).find((i) => i.insuranceType === 'Primary');
  if (primary && !primary.authorizationNumber && patient?.billingType !== 'Self-Pay') {
    alerts.push({ type: 'warning', code: 'auth', message: 'Authorization number missing on primary coverage' });
  }
  return alerts;
}

async function loadAppointmentBundle(encounterId) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: encounterId },
    include: {
      patient: {
        include: {
          insurances: {
            include: { insuranceProvider: true },
            orderBy: { insuranceType: 'asc' },
          },
          insuranceProvider: true,
          eligibilityChecks: { orderBy: { verifiedAt: 'desc' }, take: 3 },
          problems: {
            where: { isDeleted: false },
            orderBy: { updatedAt: 'desc' },
            take: 20,
            include: { diagnosis: true },
          },
          documents: { orderBy: { createdAt: 'desc' }, take: 20 },
        },
      },
      providerRef: { select: { id: true, firstName: true, lastName: true, middleName: true, npi: true } },
      departmentRef: { select: { id: true, departmentName: true } },
      appointmentTypeRef: { select: { id: true, name: true } },
      encounterBilling: true,
    },
  });

  if (!appointment) {
    const err = new Error('Encounter not found');
    err.statusCode = 404;
    throw err;
  }

  return appointment;
}

async function getOrCreateBilling(appointment, user) {
  if (appointment.encounterBilling) {
    return overlayFromRow(appointment.encounterBilling);
  }
  const seeded = seedOverlay(appointment, appointment.patient);
  try {
    const [dxResolved, chargeResolved] = await Promise.all([
      codeCatalogService.enrichDiagnoses(seeded.diagnoses),
      codeCatalogService.enrichCharges(seeded.charges),
    ]);
    seeded.diagnoses = dxResolved.diagnoses;
    seeded.charges = chargeResolved.charges.map((c) => ({
      ...c,
      unitCharge: Number(c.unitCharge) || 185,
      description: c.description || 'Office/outpatient visit, established patient, low MDM',
    }));
  } catch {
    // Catalog lookup is best-effort for first-open seeding.
  }
  const row = await prisma.encounterBilling.create({
    data: {
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      billingStatus: seeded.billingStatus,
      diagnoses: seeded.diagnoses,
      charges: seeded.charges,
      payments: seeded.payments,
      followUpNotes: seeded.followUpNotes,
      auditTrail: seeded.auditTrail,
      meta: seeded.meta,
      createdBy: user?.id || null,
      updatedBy: user?.id || null,
    },
  });
  appointment.encounterBilling = row;
  return overlayFromRow(row);
}

async function persistBilling(appointmentId, overlay, user, claimId = undefined) {
  return prisma.encounterBilling.update({
    where: { appointmentId },
    data: {
      billingStatus: overlay.billingStatus,
      diagnoses: overlay.diagnoses || [],
      charges: overlay.charges || [],
      payments: overlay.payments || [],
      followUpNotes: overlay.followUpNotes || [],
      auditTrail: overlay.auditTrail || [],
      meta: overlay.meta || {},
      ...(claimId !== undefined ? { claimId } : {}),
      updatedBy: user?.id || null,
    },
  });
}

async function loadClaimForOverlay(overlay) {
  if (!overlay.claimId) return null;
  return prisma.patientClaim.findUnique({ where: { id: overlay.claimId } });
}

function serializeEncounter(appointment, overlay, claimRow = null) {
  const patient = appointment.patient;
  const eligibility = patient?.eligibilityChecks?.[0] || null;
  const primaryInsurance = (patient?.insurances || []).find((i) => i.insuranceType === 'Primary') || null;

  recomputeClaimFinancials(overlay, claimRow);

  return {
    id: appointment.id,
    encounterNumber: appointment.encounterNumber,
    appointmentStatus: appointment.status,
    billingStatus: overlay.billingStatus,
    billingStatusFlow: BILLING_STATUSES,
    dateOfService: toDateOnly(appointment.appointmentDate),
    appointmentTime: appointment.appointmentTime,
    visitType: appointment.appointmentTypeRef?.name || appointment.appointmentType || null,
    visitReason: appointment.visitReason || null,
    department: appointment.departmentRef?.departmentName || appointment.department || null,
    placeOfService: overlay.meta?.placeOfService || '11 - Office',
    provider: {
      id: appointment.providerRef?.id || appointment.providerId || null,
      name: formatName(appointment.providerRef) || appointment.provider || null,
      npi: appointment.providerRef?.npi || null,
    },
    patient: {
      id: patient.id,
      mrn: patient.mrn,
      displayName: formatPatientDisplayName(patient),
      firstName: patient.firstName,
      middleName: patient.middleName,
      lastName: patient.lastName,
      dateOfBirth: toDateOnly(patient.dateOfBirth),
      gender: patient.gender,
      genderIdentity: patient.genderIdentity,
      email: patient.email,
      cellPhone: patient.cellPhone,
      homePhone: patient.homePhone,
      contactNumber: patient.contactNumber,
      address: patient.address,
      addressLine2: patient.addressLine2,
      city: patient.city,
      state: patient.state,
      zip: patient.zip,
      billingType: patient.billingType,
      maritalStatus: patient.maritalStatus,
      employmentStatus: patient.employmentStatus,
      employerName: patient.employerName,
      guarantor: {
        name: patient.guarantorName || formatPatientDisplayName(patient),
        relationship: patient.guarantorRelationship || 'Self',
        phone: patient.guarantorPhone || patient.cellPhone || patient.contactNumber || null,
        address: patient.guarantorAddress || [patient.address, patient.city, patient.state, patient.zip]
          .filter(Boolean)
          .join(', '),
      },
    },
    coverage: {
      billingType: patient.billingType,
      primaryPayer: overlay.meta?.payerName || primaryInsurance?.insuranceProvider?.name || null,
      insurances: (patient.insurances || []).map((ins) => ({
        id: ins.id,
        insuranceType: ins.insuranceType,
        insuranceProviderId: ins.insuranceProviderId || null,
        payerName: ins.insuranceProvider?.name || null,
        payerCode: ins.insuranceProvider?.code || null,
        memberId: ins.memberId,
        groupNumber: ins.groupNumber,
        planName: ins.planName,
        policyType: ins.policyType,
        subscriberFirstName: ins.subscriberFirstName || null,
        subscriberLastName: ins.subscriberLastName || null,
        subscriberName: [ins.subscriberFirstName, ins.subscriberLastName].filter(Boolean).join(' ') || null,
        subscriberDateOfBirth: toDateOnly(ins.subscriberDateOfBirth),
        subscriberRelationship: ins.subscriberRelationship,
        coverageStartDate: toDateOnly(ins.coverageStartDate),
        coverageEndDate: toDateOnly(ins.coverageEndDate),
        copay: ins.copay != null ? Number(ins.copay) : null,
        deductible: ins.deductible != null ? Number(ins.deductible) : null,
        coinsurancePercentage: ins.coinsurancePercentage != null ? Number(ins.coinsurancePercentage) : null,
        authorizationNumber: ins.authorizationNumber,
      })),
      eligibility: eligibility
        ? {
            status: eligibility.status,
            verifiedAt: eligibility.verifiedAt,
            payerName: eligibility.payerName,
            memberId: eligibility.memberId,
            notes: eligibility.notes,
          }
        : {
            status: patient.billingType === 'Self-Pay' ? 'Not Applicable' : 'Not Verified',
            verifiedAt: null,
            payerName: overlay.meta?.payerName || null,
            memberId: primaryInsurance?.memberId || null,
            notes: null,
          },
    },
    diagnoses: overlay.diagnoses,
    charges: overlay.charges,
    claim: {
      ...overlay.claim,
      cms1500Path: `/rcm/cms-1500?encounterId=${appointment.id}${overlay.claim.claimDbId ? `&claimId=${overlay.claim.claimDbId}` : ''}`,
      ub04Path: `/rcm/claim-ub04?encounterId=${appointment.id}${overlay.claim.claimDbId ? `&claimId=${overlay.claim.claimDbId}` : ''}`,
      trackerPath: `/rcm/claim-tracker`,
      followUpPath: `/rcm/follow-up-management`,
    },
    payments: overlay.payments,
    documents: (patient?.documents || []).slice(0, 10).map((d) => ({
      id: d.id,
      documentType: d.documentType,
      fileName: d.fileName || d.documentType,
      uploadedBy: d.uploadedBy || null,
      createdAt: d.createdAt,
    })),
    followUpNotes: overlay.followUpNotes,
    auditTrail: overlay.auditTrail,
    alerts: buildAlerts(patient, overlay),
    financials: {
      totalCharges: overlay.claim.totalCharge,
      amountPaid: overlay.claim.amountPaid,
      balanceDue: overlay.claim.balanceDue,
    },
  };
}

async function ensureClaimFromEncounter(appointment, overlay, user, { submit = false } = {}) {
  const built = await claimEngineService.buildFromEncounter({
    appointmentId: appointment.id,
    patientId: appointment.patientId,
    formType: overlay.meta?.formType || 'CMS-1500',
    diagnoses: overlay.diagnoses,
    charges: overlay.charges,
    meta: overlay.meta,
    existingClaimId: overlay.claimId,
    user,
  });

  overlay.claimId = built.id;
  await persistBilling(appointment.id, overlay, user, built.id);

  let claim = built;
  claim = await claimEngineService.scrub(built.id, user);
  if (submit) {
    claim = await claimEngineService.submit(built.id, user, { autoAck: true });
  }
  return claim;
}

const rcmEncounterService = {
  async getById(encounterId) {
    const appointment = await loadAppointmentBundle(encounterId);
    const overlay = await getOrCreateBilling(appointment);
    const claimRow = await loadClaimForOverlay(overlay);
    return serializeEncounter(appointment, overlay, claimRow);
  },

  async updateBillingStatus(encounterId, billingStatus, user) {
    const appointment = await loadAppointmentBundle(encounterId);
    const overlay = await getOrCreateBilling(appointment, user);
    overlay.billingStatus = billingStatus;

    let claimRow = await loadClaimForOverlay(overlay);

    if (billingStatus === 'Ready to submit') {
      const claim = await ensureClaimFromEncounter(appointment, overlay, user, { submit: false });
      claimRow = await prisma.patientClaim.findUnique({ where: { id: claim.id } });
      overlay.billingStatus = 'Ready to submit';
    }

    if (billingStatus === 'Submitted') {
      const claim = await ensureClaimFromEncounter(appointment, overlay, user, { submit: true });
      claimRow = await prisma.patientClaim.findUnique({ where: { id: claim.id } });
      overlay.billingStatus = 'Submitted';
    }

    if (billingStatus === 'Paid') {
      // status only — ERA posting updates claim financially
    }
    if (billingStatus === 'Denied') {
      if (claimRow) {
        await claimEngineService.updateStatus(claimRow.id, 'denied', user, {
          denialReason: claimRow.denialReason || 'Manual denial — review coding and resubmit',
        });
        claimRow = await prisma.patientClaim.findUnique({ where: { id: claimRow.id } });
      }
    }

    pushAudit(overlay, 'Billing status updated', user, billingStatus);
    await persistBilling(appointment.id, overlay, user, overlay.claimId);
    return serializeEncounter(appointment, overlay, claimRow);
  },

  async updateDiagnoses(encounterId, diagnoses, user) {
    const appointment = await loadAppointmentBundle(encounterId);
    const overlay = await getOrCreateBilling(appointment, user);
    const { diagnoses: enriched, issues } = await codeCatalogService.enrichDiagnoses(diagnoses);
    const blocking = issues.filter((i) => i.severity === 'error');
    if (blocking.length) {
      const err = new Error(blocking[0].message);
      err.statusCode = 400;
      err.details = blocking;
      throw err;
    }
    overlay.diagnoses = enriched.map((d, idx) => ({
      id: d.id || crypto.randomUUID(),
      code: d.code,
      description: d.description,
      pointer: d.pointer || String.fromCharCode(65 + idx),
      isPrimary: d.isPrimary ?? idx === 0,
      catalogId: d.catalogId || null,
    }));
    overlay.meta = { ...(overlay.meta || {}), diagnosisWarnings: issues };
    if (overlay.billingStatus === 'Unbilled') overlay.billingStatus = 'Coding';
    pushAudit(overlay, 'Diagnoses updated', user, `${overlay.diagnoses.length} ICD code(s)`);
    await persistBilling(appointment.id, overlay, user);
    const claimRow = await loadClaimForOverlay(overlay);
    return serializeEncounter(appointment, overlay, claimRow);
  },

  async updateCharges(encounterId, charges, user) {
    const appointment = await loadAppointmentBundle(encounterId);
    const overlay = await getOrCreateBilling(appointment, user);
    const { charges: enriched, issues } = await codeCatalogService.enrichCharges(charges);
    const blocking = issues.filter((i) => i.severity === 'error');
    if (blocking.length) {
      const err = new Error(blocking[0].message);
      err.statusCode = 400;
      err.details = blocking;
      throw err;
    }
    overlay.charges = enriched.map((c) => {
      const split = splitProcedureCode(c.cptCode || c.hcpcsCode);
      return {
        id: c.id || crypto.randomUUID(),
        cptCode: c.cptCode || split.cptCode,
        hcpcsCode: c.hcpcsCode || split.hcpcsCode,
        description: c.description,
        modifiers: c.modifiers || '',
        units: Number(c.units) || 1,
        unitCharge: Number(c.unitCharge) || 0,
        diagnosisPointers: c.diagnosisPointers || 'A',
        placeOfService: c.placeOfService || '11',
        revenueCode: c.revenueCode || null,
        catalogId: c.catalogId || null,
      };
    });
    overlay.meta = { ...(overlay.meta || {}), chargeWarnings: issues };
    if (['Unbilled', 'Coding'].includes(overlay.billingStatus) && overlay.charges.length) {
      overlay.billingStatus = 'Coding';
    }
    pushAudit(overlay, 'Charges updated', user, `${overlay.charges.length} CPT line(s)`);
    await persistBilling(appointment.id, overlay, user);
    const claimRow = await loadClaimForOverlay(overlay);
    return serializeEncounter(appointment, overlay, claimRow);
  },

  async addPayment(encounterId, payment, user) {
    const appointment = await loadAppointmentBundle(encounterId);
    const overlay = await getOrCreateBilling(appointment, user);
    const row = {
      id: crypto.randomUUID(),
      type: payment.type,
      amount: money(payment.amount),
      payer: payment.payer || overlay.meta?.payerName || null,
      reference: payment.reference || null,
      notes: payment.notes || null,
      postedDate: payment.postedDate || new Date().toISOString().slice(0, 10),
      postedBy: user?.name || user?.email || 'User',
    };
    overlay.payments = [row, ...(overlay.payments || [])];
    recomputeClaimFinancials(overlay);
    if (overlay.claim.balanceDue <= 0) {
      overlay.billingStatus = 'Paid';
    } else if (overlay.claim.amountPaid > 0) {
      overlay.billingStatus = 'Follow-up';
    }
    pushAudit(overlay, 'Payment posted', user, `${row.type} $${row.amount.toFixed(2)}`);
    await persistBilling(appointment.id, overlay, user);
    const claimRow = await loadClaimForOverlay(overlay);
    return serializeEncounter(appointment, overlay, claimRow);
  },

  async addFollowUpNote(encounterId, payload, user) {
    const appointment = await loadAppointmentBundle(encounterId);
    const overlay = await getOrCreateBilling(appointment, user);
    const note = {
      id: crypto.randomUUID(),
      note: payload.note,
      nextAction: payload.nextAction || null,
      dueDate: payload.dueDate || null,
      assignee: payload.assignee || user?.name || null,
      createdBy: user?.name || user?.email || 'User',
      createdAt: new Date().toISOString(),
    };
    overlay.followUpNotes = [note, ...(overlay.followUpNotes || [])];
    if (!['Paid', 'Submitted'].includes(overlay.billingStatus)) {
      overlay.billingStatus = 'Follow-up';
    }
    pushAudit(overlay, 'Follow-up note added', user, payload.nextAction || null);

    await prisma.followUpTask.create({
      data: {
        claimId: overlay.claimId || null,
        patientId: appointment.patientId,
        appointmentId: appointment.id,
        taskType: 'encounter_follow_up',
        status: 'open',
        priority: 'normal',
        summary: payload.nextAction || 'Encounter follow-up',
        notes: payload.note,
        assignee: note.assignee,
        dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
        createdBy: user?.id || null,
      },
    });

    await persistBilling(appointment.id, overlay, user);
    const claimRow = await loadClaimForOverlay(overlay);
    return serializeEncounter(appointment, overlay, claimRow);
  },

  async verifyEligibility(encounterId, user) {
    const appointment = await loadAppointmentBundle(encounterId);
    const result = await claimEngineService.mockEligibilityCheck({
      patientId: appointment.patientId,
      appointmentId: appointment.id,
      user,
    });
    return result;
  },
};

module.exports = rcmEncounterService;
