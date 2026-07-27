const prisma = require('../lib/prisma');
const { randomBytes } = require('crypto');
const { ENCOUNTER_VISIT_STATUS } = require('../utils/encounterVisitStatus');

function formatUserName(user) {
  if (!user) return null;
  const parts = [user.firstName, user.lastName].filter(Boolean);
  if (parts.length) return parts.join(' ');
  return user.name || user.email || null;
}

function providerDisplayName(provider) {
  if (!provider) return null;
  return [provider.firstName, provider.middleName, provider.lastName].filter(Boolean).join(' ');
}

function toDateOnly(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function decimalToNumber(value) {
  if (value == null) return 0;
  return Number(value);
}

function httpError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function generateClaimNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(3).toString('hex').toUpperCase();
  return `CLM-${ts}-${rand}`;
}

const chargeCaptureInclude = {
  diagnoses: { orderBy: { sequence: 'asc' } },
  serviceLines: { orderBy: { lineNumber: 'asc' } },
  renderingProvider: {
    select: { id: true, npi: true, firstName: true, middleName: true, lastName: true, taxId: true },
  },
  claims: {
    select: { id: true, claimNumber: true, status: true, totalCharge: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  },
  appointment: {
    select: {
      id: true,
      encounterNumber: true,
      appointmentDate: true,
      status: true,
      providerId: true,
      provider: true,
      providerRef: {
        select: {
          id: true,
          npi: true,
          firstName: true,
          middleName: true,
          lastName: true,
          taxId: true,
          address: true,
          city: true,
          state: true,
          zip: true,
        },
      },
      departmentRef: {
        select: {
          id: true,
          departmentName: true,
          facilityName: true,
          defaultBillingProvider: true,
        },
      },
    },
  },
  patient: {
    select: {
      id: true,
      mrn: true,
      firstName: true,
      lastName: true,
      middleName: true,
      dateOfBirth: true,
      gender: true,
      address: true,
      city: true,
      state: true,
      zip: true,
      contactNumber: true,
      cellPhone: true,
      billingType: true,
      insurances: {
        include: {
          insuranceProvider: { select: { id: true, name: true, code: true } },
        },
        orderBy: { insuranceType: 'asc' },
      },
      problems: {
        where: { deletedAt: null, clinicalStatus: { in: ['Active', 'active'] } },
        select: {
          id: true,
          icd10Code: true,
          diagnosisDescription: true,
          diagnosisId: true,
        },
        take: 12,
      },
      referrals: {
        where: { deletedAt: null, authorizationStatus: { not: 'Not Required' } },
        select: {
          id: true,
          referralNumber: true,
          authorizationStatus: true,
          appointmentId: true,
          insurance: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  },
};

async function assertPatientExists(patientId) {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, deletedAt: null },
    select: { id: true },
  });
  if (!patient) throw httpError('Patient not found', 404);
}

async function assertAppointment(patientId, appointmentId) {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, patientId },
    include: {
      providerRef: {
        select: {
          id: true,
          npi: true,
          firstName: true,
          middleName: true,
          lastName: true,
          taxId: true,
        },
      },
      departmentRef: {
        select: { defaultBillingProvider: true, departmentName: true, facilityName: true },
      },
      orders: {
        select: {
          id: true,
          procedureCode: true,
          procedureName: true,
          category: true,
          orderDateTime: true,
        },
        take: 20,
      },
    },
  });
  if (!appointment) throw httpError('Encounter not found for this patient', 404);
  return appointment;
}

function serializeChargeCapture(row) {
  if (!row) return null;
  return {
    ...row,
    diagnoses: (row.diagnoses || []).map((d) => ({
      ...d,
      isPrimary: !!d.isPrimary,
    })),
    serviceLines: (row.serviceLines || []).map((l) => ({
      ...l,
      units: decimalToNumber(l.units),
      chargeAmount: decimalToNumber(l.chargeAmount),
    })),
    totalCharge: (row.serviceLines || []).reduce(
      (sum, l) => sum + decimalToNumber(l.chargeAmount) * decimalToNumber(l.units),
      0,
    ),
  };
}

function serializeClaim(row) {
  if (!row) return null;
  return {
    ...row,
    totalCharge: decimalToNumber(row.totalCharge),
    diagnoses: row.diagnoses || [],
    serviceLines: (row.serviceLines || []).map((l) => ({
      ...l,
      units: decimalToNumber(l.units),
      chargeAmount: decimalToNumber(l.chargeAmount),
    })),
    patientName: [row.patientLastName, row.patientFirstName].filter(Boolean).join(', '),
  };
}

function middleInitial(middleName) {
  if (!middleName) return '';
  const trimmed = String(middleName).trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase();
}

function formatPatientDisplayName(patient) {
  if (!patient) return '';
  const mi = middleInitial(patient.middleName);
  return [patient.firstName, mi || null, patient.lastName].filter(Boolean).join(' ');
}

function normalizeInsuranceTier(type) {
  const t = String(type || '').toLowerCase();
  if (t.includes('secondary')) return 'secondary';
  if (t.includes('tertiary')) return 'tertiary';
  if (t.includes('primary')) return 'primary';
  return t || 'primary';
}

function serializeInsuranceForClaimForm(ins) {
  if (!ins) return null;
  const auth = ins.authorizationNumber || '';
  return {
    id: ins.id,
    insuranceType: normalizeInsuranceTier(ins.insuranceType),
    insuranceProviderId: ins.insuranceProviderId || ins.insuranceProvider?.id || null,
    payerName: ins.insuranceProvider?.name || '',
    payerId: ins.insuranceProvider?.code || '',
    memberId: ins.memberId || '',
    policyType: ins.policyType || '',
    copayDue:
      ins.copay != null && ins.copay !== ''
        ? Number(ins.copay).toFixed(2)
        : '',
    groupNumber: ins.groupNumber || '',
    claimControlRef: '',
    authorizationNumber: auth,
    referralType: auth ? 'Prior Auth Number' : 'None',
  };
}

function resolveFacilityDisplay(department) {
  if (!department) return 'Main Facility';
  const name =
    (department.facilityName && String(department.facilityName).trim()) ||
    (department.location?.name && String(department.location.name).trim()) ||
    '';
  if (!name || /^main\s+facility$/i.test(name) || /^default$/i.test(name)) {
    return 'Main Facility';
  }
  return name;
}

function buildCms1500FormPayload(claim) {
  const patient = claim.patient || null;
  const appointment = claim.appointment || null;
  const department = appointment?.departmentRef || null;
  const renderingFromRel = claim.renderingProvider;
  const renderingName =
    providerDisplayName(renderingFromRel) ||
    claim.renderingProviderName ||
    providerDisplayName(appointment?.providerRef) ||
    appointment?.provider ||
    '';
  const billingName =
    claim.billingProviderName ||
    department?.defaultBillingProvider ||
    renderingName ||
    '';

  const insurances = (patient?.insurances || []).map(serializeInsuranceForClaimForm);
  const byTier = {
    primary: insurances.find((i) => i.insuranceType === 'primary') || null,
    secondary: insurances.find((i) => i.insuranceType === 'secondary') || null,
    tertiary: insurances.find((i) => i.insuranceType === 'tertiary') || null,
  };

  // Prefer Active Problems (Patient Chart → Problems); fall back to claim diagnoses.
  const problemDx = (patient?.problems || [])
    .map((p) => p.icd10Code || p.diagnosis?.code)
    .filter(Boolean);

  const claimDx = (claim.diagnoses || [])
    .slice()
    .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
    .map((d) => d.icd10Code)
    .filter(Boolean);

  const icdCodes = (problemDx.length ? problemDx : claimDx).slice(0, 12);

  return {
    claimNumber: claim.claimNumber,
    claimId: claim.id,
    status: claim.status,
    patientId: claim.patientId,
    appointmentId: claim.appointmentId,
    patient: {
      id: patient?.id || claim.patientId,
      firstName: patient?.firstName || claim.patientFirstName || '',
      middleName: patient?.middleName || '',
      middleInitial: middleInitial(patient?.middleName),
      lastName: patient?.lastName || claim.patientLastName || '',
      displayName: formatPatientDisplayName({
        firstName: patient?.firstName || claim.patientFirstName,
        middleName: patient?.middleName,
        lastName: patient?.lastName || claim.patientLastName,
      }),
      mrn: patient?.mrn || claim.patientMrn || '',
    },
    renderingProvider: {
      id: claim.renderingProviderId || renderingFromRel?.id || appointment?.providerId || null,
      name: renderingName,
      npi: claim.renderingProviderNpi || renderingFromRel?.npi || null,
    },
    billingProvider: {
      id: null,
      name: billingName,
      npi: claim.billingProviderNpi || null,
      taxId: claim.billingProviderTaxId || null,
    },
    supervisingProvider: {
      id: claim.renderingProviderId || renderingFromRel?.id || appointment?.providerId || null,
      name: renderingName,
      npi: claim.renderingProviderNpi || renderingFromRel?.npi || null,
    },
    facility: resolveFacilityDisplay(department),
    facilityMeta: {
      departmentId: department?.id || null,
      departmentName: department?.departmentName || null,
      facilityName: department?.facilityName || null,
    },
    insurance: {
      primary: byTier.primary,
      secondary: byTier.secondary,
      tertiary: byTier.tertiary,
    },
    icdCodes,
    diagnoses: claim.diagnoses || [],
    serviceLines: claim.serviceLines || [],
  };
}

function pickPrimaryInsurance(insurances = []) {
  const primary = insurances.find((i) => /primary/i.test(i.insuranceType || ''));
  return primary || insurances[0] || null;
}

function pickAuthAndReferral(patient, appointmentId, existing) {
  const insurance = pickPrimaryInsurance(patient?.insurances);
  const referral =
    (patient?.referrals || []).find((r) => r.appointmentId === appointmentId) ||
    (patient?.referrals || [])[0];
  const referralInsurance = referral?.insurance && typeof referral.insurance === 'object'
    ? referral.insurance
    : {};

  return {
    authorizationNumber:
      existing?.authorizationNumber ||
      referralInsurance.authorizationNumber ||
      insurance?.authorizationNumber ||
      null,
    referralNumber: existing?.referralNumber || referral?.referralNumber || null,
  };
}

async function getOrCreateChargeCapture(patientId, appointmentId, user) {
  await assertPatientExists(patientId);
  const appointment = await assertAppointment(patientId, appointmentId);

  let capture = await prisma.encounterChargeCapture.findUnique({
    where: { appointmentId },
    include: chargeCaptureInclude,
  });

  if (capture) {
    return {
      chargeCapture: serializeChargeCapture(capture),
      suggestedOrders: appointment.orders || [],
    };
  }

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      insurances: { include: { insuranceProvider: true } },
      problems: {
        where: { deletedAt: null },
        select: {
          id: true,
          icd10Code: true,
          diagnosisDescription: true,
          diagnosisId: true,
          clinicalStatus: true,
          status: true,
        },
        take: 12,
      },
      referrals: {
        where: { deletedAt: null },
        select: {
          referralNumber: true,
          appointmentId: true,
          insurance: true,
          authorizationStatus: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  const provider = appointment.providerRef;
  const authRef = pickAuthAndReferral(patient, appointmentId, null);

  const addressedEncounter = await prisma.encounterProblem.findMany({
    where: { patientId, appointmentId, addressedThisVisit: true },
    include: {
      problem: {
        select: {
          id: true,
          icd10Code: true,
          diagnosisDescription: true,
          diagnosisId: true,
          deletedAt: true,
        },
      },
    },
    orderBy: [{ isPrimary: 'desc' }, { priority: 'asc' }, { createdAt: 'asc' }],
  });

  const fromEncounter = addressedEncounter
    .filter((r) => r.problem && !r.problem.deletedAt && r.problem.icd10Code)
    .map((r) => ({
      problemId: r.problem.id,
      icd10Code: r.problem.icd10Code,
      diagnosisDescription: r.problem.diagnosisDescription,
      diagnosisId: r.problem.diagnosisId,
      isPrimary: !!r.isPrimary,
    }));

  const activeProblems = fromEncounter.length
    ? fromEncounter
    : (patient.problems || []).filter(
        (p) =>
          p.icd10Code &&
          p.status !== 'Resolved' &&
          (!p.clinicalStatus || /active/i.test(p.clinicalStatus)),
      );

  capture = await prisma.encounterChargeCapture.create({
    data: {
      patientId,
      appointmentId,
      status: 'draft',
      placeOfService: '11',
      dateOfService: toDateOnly(appointment.appointmentDate),
      renderingProviderId: provider?.id || null,
      renderingProviderNpi: provider?.npi || null,
      renderingProviderName: providerDisplayName(provider) || appointment.provider || null,
      billingProviderName:
        appointment.departmentRef?.defaultBillingProvider ||
        providerDisplayName(provider) ||
        null,
      billingProviderNpi: provider?.npi || null,
      billingProviderTaxId: provider?.taxId || null,
      authorizationNumber: authRef.authorizationNumber,
      referralNumber: authRef.referralNumber,
      createdBy: user?.id || null,
      updatedBy: user?.id || null,
      diagnoses: {
        create: (() => {
          const slice = activeProblems.slice(0, 12);
          const primaryIdx = fromEncounter.length
            ? slice.findIndex((p) => p.isPrimary)
            : 0;
          const resolvedPrimary = primaryIdx >= 0 ? primaryIdx : 0;
          return slice.map((p, idx) => ({
            sequence: idx + 1,
            icd10Code: p.icd10Code,
            description: p.diagnosisDescription || null,
            diagnosisCodeId: p.diagnosisId || null,
            problemId: p.problemId || p.id || null,
            isPrimary: idx === resolvedPrimary,
          }));
        })(),
      },
      serviceLines: {
        create: (appointment.orders || [])
          .filter((o) => o.procedureCode)
          .slice(0, 6)
          .map((o, idx) => ({
            lineNumber: idx + 1,
            serviceDate: toDateOnly(appointment.appointmentDate),
            procedureCode: o.procedureCode,
            codeType: 'CPT',
            description: o.procedureName || null,
            units: 1,
            chargeAmount: 0,
            diagnosisPointers: '1',
            placeOfService: '11',
          })),
      },
    },
    include: chargeCaptureInclude,
  });

  return {
    chargeCapture: serializeChargeCapture(capture),
    suggestedOrders: appointment.orders || [],
  };
}

function validateCodingPayload(diagnoses, serviceLines) {
  if (!diagnoses?.length) {
    throw httpError('At least one encounter diagnosis (ICD-10) is required');
  }
  const codes = new Set();
  diagnoses.forEach((d, idx) => {
    if (!d.icd10Code?.trim()) throw httpError(`Diagnosis ${idx + 1} is missing ICD-10 code`);
    const key = d.icd10Code.trim().toUpperCase();
    if (codes.has(key)) throw httpError(`Duplicate ICD-10 code: ${d.icd10Code}`);
    codes.add(key);
  });
  const primaries = diagnoses.filter((d) => d.isPrimary);
  if (primaries.length > 1) throw httpError('Only one primary diagnosis is allowed');

  if (!serviceLines?.length) {
    throw httpError('At least one service line (CPT/HCPCS) is required');
  }
  serviceLines.forEach((line, idx) => {
    if (!line.procedureCode?.trim()) {
      throw httpError(`Service line ${idx + 1} is missing procedure code`);
    }
    if (line.chargeAmount == null || Number(line.chargeAmount) < 0) {
      throw httpError(`Service line ${idx + 1} needs a valid charge amount`);
    }
    if (!line.diagnosisPointers?.trim()) {
      throw httpError(`Service line ${idx + 1} needs diagnosis pointers`);
    }
  });
}

async function upsertChargeCapture(patientId, encounterId, body, user) {
  const { chargeCapture: existing } = await getOrCreateChargeCapture(patientId, encounterId, user);
  if (existing.isLocked) {
    throw httpError('Charge capture is locked. Unlock or create a replacement claim workflow first.', 409);
  }

  const diagnoses = body.diagnoses ?? existing.diagnoses;
  const serviceLines = body.serviceLines ?? existing.serviceLines;
  validateCodingPayload(diagnoses, serviceLines);

  const sortedDiagnoses = diagnoses
    .map((d, idx) => ({
      sequence: d.sequence || idx + 1,
      icd10Code: d.icd10Code.trim().toUpperCase(),
      description: d.description?.trim() || null,
      diagnosisCodeId: d.diagnosisCodeId || null,
      problemId: d.problemId || null,
      isPrimary: !!d.isPrimary,
    }))
    .sort((a, b) => a.sequence - b.sequence)
    .map((d, idx) => ({ ...d, sequence: idx + 1 }));

  const primaryIdx = sortedDiagnoses.findIndex((d) => d.isPrimary);
  const finalDiagnoses = sortedDiagnoses.map((d, idx) => ({
    ...d,
    isPrimary: primaryIdx >= 0 ? idx === primaryIdx : idx === 0,
  }));

  const finalLines = serviceLines.map((l, idx) => ({
    lineNumber: l.lineNumber || idx + 1,
    serviceDate: toDateOnly(l.serviceDate || body.dateOfService || existing.dateOfService),
    procedureCode: l.procedureCode.trim().toUpperCase(),
    codeType: l.codeType || 'CPT',
    description: l.description?.trim() || null,
    modifier1: l.modifier1?.trim() || null,
    modifier2: l.modifier2?.trim() || null,
    modifier3: l.modifier3?.trim() || null,
    modifier4: l.modifier4?.trim() || null,
    units: l.units ?? 1,
    chargeAmount: l.chargeAmount,
    diagnosisPointers: String(l.diagnosisPointers || '1').replace(/\s+/g, ''),
    placeOfService: l.placeOfService || body.placeOfService || existing.placeOfService || '11',
  }));

  await prisma.$transaction(async (tx) => {
    await tx.encounterDiagnosis.deleteMany({ where: { chargeCaptureId: existing.id } });
    await tx.encounterServiceLine.deleteMany({ where: { chargeCaptureId: existing.id } });

    await tx.encounterChargeCapture.update({
      where: { id: existing.id },
      data: {
        placeOfService: body.placeOfService || existing.placeOfService,
        dateOfService: toDateOnly(body.dateOfService || existing.dateOfService),
        renderingProviderId:
          body.renderingProviderId !== undefined
            ? body.renderingProviderId
            : existing.renderingProviderId,
        renderingProviderNpi:
          body.renderingProviderNpi !== undefined
            ? body.renderingProviderNpi || null
            : existing.renderingProviderNpi,
        renderingProviderName:
          body.renderingProviderName !== undefined
            ? body.renderingProviderName || null
            : existing.renderingProviderName,
        billingProviderName:
          body.billingProviderName !== undefined
            ? body.billingProviderName || null
            : existing.billingProviderName,
        billingProviderNpi:
          body.billingProviderNpi !== undefined
            ? body.billingProviderNpi || null
            : existing.billingProviderNpi,
        billingProviderTaxId:
          body.billingProviderTaxId !== undefined
            ? body.billingProviderTaxId || null
            : existing.billingProviderTaxId,
        authorizationNumber:
          body.authorizationNumber !== undefined
            ? body.authorizationNumber || null
            : existing.authorizationNumber,
        referralNumber:
          body.referralNumber !== undefined
            ? body.referralNumber || null
            : existing.referralNumber,
        notes: body.notes !== undefined ? body.notes || null : existing.notes,
        updatedBy: user?.id || null,
        diagnoses: { create: finalDiagnoses },
        serviceLines: { create: finalLines },
      },
    });
  });

  const updated = await prisma.encounterChargeCapture.findUnique({
    where: { id: existing.id },
    include: chargeCaptureInclude,
  });
  return serializeChargeCapture(updated);
}

async function lockChargeCapture(patientId, encounterId, user) {
  const { chargeCapture } = await getOrCreateChargeCapture(patientId, encounterId, user);
  validateCodingPayload(chargeCapture.diagnoses, chargeCapture.serviceLines);

  if (!chargeCapture.placeOfService) throw httpError('Place of service is required');
  if (!chargeCapture.renderingProviderNpi && !chargeCapture.renderingProviderName) {
    throw httpError('Rendering provider is required');
  }
  if (!chargeCapture.billingProviderNpi && !chargeCapture.billingProviderName) {
    throw httpError('Billing provider is required');
  }

  const locked = await prisma.encounterChargeCapture.update({
    where: { id: chargeCapture.id },
    data: {
      status: 'locked',
      isLocked: true,
      lockedAt: new Date(),
      lockedBy: user?.id || null,
      lockedByName: formatUserName(user),
      updatedBy: user?.id || null,
    },
    include: chargeCaptureInclude,
  });

  return serializeChargeCapture(locked);
}

async function unlockChargeCapture(patientId, encounterId, user) {
  await assertPatientExists(patientId);
  await assertAppointment(patientId, encounterId);

  const existing = await prisma.encounterChargeCapture.findUnique({
    where: { appointmentId: encounterId },
  });
  if (!existing) throw httpError('Charge capture not found', 404);

  const submittedClaim = await prisma.claim.findFirst({
    where: {
      chargeCaptureId: existing.id,
      status: 'Submitted',
    },
  });
  if (submittedClaim) {
    throw httpError('Cannot unlock charges after a claim has been submitted', 409);
  }

  const unlocked = await prisma.encounterChargeCapture.update({
    where: { id: existing.id },
    data: {
      status: 'draft',
      isLocked: false,
      lockedAt: null,
      lockedBy: null,
      lockedByName: null,
      updatedBy: user?.id || null,
    },
    include: chargeCaptureInclude,
  });
  return serializeChargeCapture(unlocked);
}

async function generateClaimFromEncounter(patientId, encounterId, user) {
  let { chargeCapture } = await getOrCreateChargeCapture(patientId, encounterId, user);

  if (!chargeCapture.isLocked) {
    chargeCapture = await lockChargeCapture(patientId, encounterId, user);
  }

  const draftOrReady = await prisma.claim.findFirst({
    where: {
      appointmentId: encounterId,
      status: { in: ['Draft', 'Ready'] },
    },
  });
  if (draftOrReady) {
    throw httpError(
      `A ${draftOrReady.status.toLowerCase()} claim already exists for this encounter (${draftOrReady.claimNumber})`,
      409,
    );
  }

  const patient = chargeCapture.patient;
  const insurance = pickPrimaryInsurance(patient?.insurances);
  const totalCharge = (chargeCapture.serviceLines || []).reduce(
    (sum, l) => sum + decimalToNumber(l.chargeAmount) * decimalToNumber(l.units),
    0,
  );

  const claim = await prisma.claim.create({
    data: {
      claimNumber: generateClaimNumber(),
      patientId,
      appointmentId: encounterId,
      chargeCaptureId: chargeCapture.id,
      status: 'Draft',
      claimType: 'original',
      dateOfService: toDateOnly(chargeCapture.dateOfService),
      placeOfService: chargeCapture.placeOfService,
      totalCharge,
      patientFirstName: patient?.firstName || null,
      patientLastName: patient?.lastName || null,
      patientMrn: patient?.mrn || null,
      patientDateOfBirth: toDateOnly(patient?.dateOfBirth),
      patientGender: patient?.gender || null,
      patientAddress: patient?.address || null,
      patientCity: patient?.city || null,
      patientState: patient?.state || null,
      patientZip: patient?.zip || null,
      patientPhone: patient?.cellPhone || patient?.contactNumber || null,
      subscriberFirstName: insurance?.subscriberFirstName || patient?.firstName || null,
      subscriberLastName: insurance?.subscriberLastName || patient?.lastName || null,
      subscriberMemberId: insurance?.memberId || null,
      subscriberGroupNumber: insurance?.groupNumber || null,
      subscriberRelationship: insurance?.subscriberRelationship || 'Self',
      payerName: insurance?.insuranceProvider?.name || null,
      payerId: insurance?.insuranceProvider?.code || null,
      insuranceType: insurance?.insuranceType || patient?.billingType || null,
      authorizationNumber: chargeCapture.authorizationNumber,
      referralNumber: chargeCapture.referralNumber,
      renderingProviderId: chargeCapture.renderingProviderId,
      renderingProviderNpi: chargeCapture.renderingProviderNpi,
      renderingProviderName: chargeCapture.renderingProviderName,
      billingProviderName: chargeCapture.billingProviderName,
      billingProviderNpi: chargeCapture.billingProviderNpi,
      billingProviderTaxId: chargeCapture.billingProviderTaxId,
      encounterNumber: chargeCapture.appointment?.encounterNumber || null,
      notes: chargeCapture.notes,
      createdBy: user?.id || null,
      updatedBy: user?.id || null,
      diagnoses: {
        create: (chargeCapture.diagnoses || []).map((d) => ({
          sequence: d.sequence,
          icd10Code: d.icd10Code,
          description: d.description,
          isPrimary: d.isPrimary,
        })),
      },
      serviceLines: {
        create: (chargeCapture.serviceLines || []).map((l) => ({
          lineNumber: l.lineNumber,
          serviceDate: toDateOnly(l.serviceDate),
          procedureCode: l.procedureCode,
          codeType: l.codeType,
          description: l.description,
          modifier1: l.modifier1,
          modifier2: l.modifier2,
          modifier3: l.modifier3,
          modifier4: l.modifier4,
          units: l.units,
          chargeAmount: l.chargeAmount,
          diagnosisPointers: l.diagnosisPointers,
          placeOfService: l.placeOfService || chargeCapture.placeOfService,
        })),
      },
    },
    include: {
      diagnoses: { orderBy: { sequence: 'asc' } },
      serviceLines: { orderBy: { lineNumber: 'asc' } },
    },
  });

  // Generate claim = billing completed → Completed
  await prisma.appointment.update({
    where: { id: encounterId },
    data: { status: ENCOUNTER_VISIT_STATUS.COMPLETED },
  });

  return serializeClaim(claim);
}

async function listClaims(query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 25));
  const skip = (page - 1) * limit;

  const where = {};
  if (query.status && query.status !== 'all') where.status = query.status;
  if (query.patientId) where.patientId = query.patientId;
  if (query.appointmentId) where.appointmentId = query.appointmentId;
  if (query.dateFrom || query.dateTo) {
    where.dateOfService = {};
    if (query.dateFrom) where.dateOfService.gte = toDateOnly(query.dateFrom);
    if (query.dateTo) where.dateOfService.lte = toDateOnly(query.dateTo);
  }
  if (query.search) {
    const s = query.search.trim();
    where.OR = [
      { claimNumber: { contains: s } },
      { patientMrn: { contains: s } },
      { patientFirstName: { contains: s } },
      { patientLastName: { contains: s } },
      { payerName: { contains: s } },
      { encounterNumber: { contains: s } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.claim.count({ where }),
    prisma.claim.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        diagnoses: { orderBy: { sequence: 'asc' }, take: 4 },
        serviceLines: { orderBy: { lineNumber: 'asc' }, take: 6 },
      },
    }),
  ]);

  return {
    data: rows.map(serializeClaim),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || ''),
  );
}

async function getClaimById(claimId) {
  const key = String(claimId || '').trim();
  const where = isUuid(key)
    ? { OR: [{ id: key }, { claimNumber: key }] }
    : { claimNumber: key };

  const claim = await prisma.claim.findFirst({
    where,
    include: {
      diagnoses: { orderBy: { sequence: 'asc' } },
      serviceLines: { orderBy: { lineNumber: 'asc' } },
      renderingProvider: {
        select: {
          id: true,
          npi: true,
          firstName: true,
          middleName: true,
          lastName: true,
          taxId: true,
        },
      },
      appointment: {
        select: {
          id: true,
          encounterNumber: true,
          appointmentDate: true,
          status: true,
          providerId: true,
          provider: true,
          providerRef: {
            select: {
              id: true,
              npi: true,
              firstName: true,
              middleName: true,
              lastName: true,
              taxId: true,
            },
          },
          departmentRef: {
            select: {
              id: true,
              departmentName: true,
              facilityName: true,
              defaultBillingProvider: true,
              location: { select: { id: true, name: true } },
            },
          },
        },
      },
      patient: {
        select: {
          id: true,
          mrn: true,
          firstName: true,
          middleName: true,
          lastName: true,
          dateOfBirth: true,
          gender: true,
          insurances: {
            include: {
              insuranceProvider: { select: { id: true, name: true, code: true } },
            },
            orderBy: { insuranceType: 'asc' },
          },
          problems: {
            where: {
              deletedAt: null,
              OR: [
                { status: 'Active' },
                { clinicalStatus: { in: ['Active', 'active'] } },
              ],
            },
            select: {
              id: true,
              icd10Code: true,
              diagnosisDescription: true,
              diagnosisId: true,
              status: true,
              clinicalStatus: true,
              diagnosis: { select: { id: true, code: true, description: true } },
            },
            orderBy: { createdAt: 'asc' },
            take: 12,
          },
        },
      },
    },
  });
  if (!claim) throw httpError('Claim not found', 404);

  const serialized = serializeClaim(claim);
  return {
    ...serialized,
    form: buildCms1500FormPayload(claim),
  };
}

async function updateClaimStatus(claimId, body, user) {
  const key = String(claimId || '').trim();
  const where = isUuid(key)
    ? { OR: [{ id: key }, { claimNumber: key }] }
    : { claimNumber: key };
  const claim = await prisma.claim.findFirst({ where });
  if (!claim) throw httpError('Claim not found', 404);

  const next = body.status;
  const current = claim.status;
  const allowed = {
    Draft: ['Ready'],
    Ready: ['Draft', 'Submitted'],
    Submitted: [],
  };
  if (!allowed[current]?.includes(next)) {
    throw httpError(`Cannot move claim from ${current} to ${next}`, 409);
  }

  const data = {
    status: next,
    updatedBy: user?.id || null,
    notes: body.notes !== undefined ? body.notes || null : claim.notes,
  };

  if (next === 'Ready') {
    data.readyAt = new Date();
    data.readyBy = user?.id || null;
    data.readyByName = formatUserName(user);
  }
  if (next === 'Submitted') {
    data.submittedAt = new Date();
    data.submittedBy = user?.id || null;
    data.submittedByName = formatUserName(user);
  }
  if (next === 'Draft' && current === 'Ready') {
    data.readyAt = null;
    data.readyBy = null;
    data.readyByName = null;
  }

  const updated = await prisma.claim.update({
    where: { id: claim.id },
    data,
    include: {
      diagnoses: { orderBy: { sequence: 'asc' } },
      serviceLines: { orderBy: { lineNumber: 'asc' } },
    },
  });
  return serializeClaim(updated);
}

const WORKLIST_DOC_STATUSES = [
  'pending',
  'signed',
  'not_signed',
  'non_billable',
  'no_medical_record',
  'unbilled',
  'not_completed',
];

const PATIENT_TYPE_LABELS = {
  'in-house': 'In Person',
  telehealth: 'Telehealth',
  'home-visit': 'Home Visit',
};

function calcAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

function formatInsuranceInfo(patient) {
  if (!patient) return { label: '—', isSelfPay: false };
  const billing = String(patient.billingType || '').toLowerCase();
  if (billing === 'self_pay' || billing === 'self-pay') {
    return { label: 'Self Pay', isSelfPay: true };
  }

  const insurances = Array.isArray(patient.insurances) ? patient.insurances : [];
  const primary =
    insurances.find((ins) => String(ins.insuranceType || '').toLowerCase() === 'primary') ||
    insurances[0];

  if (primary) {
    const company = primary.insuranceProvider?.name || 'Insurance';
    const memberId = primary.memberId || '';
    return {
      label: memberId ? `${company} · ${memberId}` : company,
      company,
      memberId,
      isSelfPay: false,
    };
  }

  if (patient.insuranceProvider?.name) {
    return {
      label: patient.insuranceProvider.name,
      company: patient.insuranceProvider.name,
      memberId: '',
      isSelfPay: false,
    };
  }

  return { label: billing === 'insurance' ? 'Insurance' : 'Self Pay', isSelfPay: billing !== 'insurance' };
}

function deriveDocStatus(checkout, appointment) {
  if (checkout?.worklistDocStatus) return checkout.worklistDocStatus;

  const claims = appointment?.claims || [];
  const chargeCapture = appointment?.chargeCapture;
  const billing = checkout?.billingData || {};

  if (billing.nonBillable === true || billing.isNonBillable === true) return 'non_billable';
  if (billing.noMedicalRecord === true) return 'no_medical_record';

  if (claims.some((c) => c.status === 'Submitted')) return 'signed';
  if (claims.some((c) => c.status === 'Ready' || c.status === 'Draft')) return 'pending';
  if (chargeCapture?.isLocked) return 'pending';
  if (chargeCapture) return 'unbilled';
  return 'unbilled';
}

const WORKLIST_APPOINTMENT_STATUSES = [
  'Checked Out',
  'Completed',
  'Visit Completed',
];

const worklistPatientSelect = {
  id: true,
  mrn: true,
  firstName: true,
  lastName: true,
  middleName: true,
  dateOfBirth: true,
  gender: true,
  billingType: true,
  visitModality: true,
  assignedToId: true,
  assignedTo: { select: { id: true, name: true, email: true } },
  insuranceProvider: { select: { id: true, name: true, code: true } },
  insurances: {
    select: {
      insuranceType: true,
      memberId: true,
      insuranceProvider: { select: { id: true, name: true, code: true } },
    },
    orderBy: { insuranceType: 'asc' },
  },
};

const worklistAppointmentSelect = {
  id: true,
  encounterNumber: true,
  appointmentDate: true,
  appointmentTime: true,
  visitModality: true,
  status: true,
  provider: true,
  providerId: true,
  patientId: true,
  createdAt: true,
  providerRef: {
    select: { id: true, firstName: true, middleName: true, lastName: true, npi: true },
  },
  chargeCapture: {
    select: {
      id: true,
      isLocked: true,
      renderingProviderName: true,
      status: true,
    },
  },
  claims: {
    select: { id: true, claimNumber: true, status: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 3,
  },
  checkout: {
    select: {
      id: true,
      status: true,
      completedAt: true,
      completedByName: true,
      billingData: true,
      worklistRemovedAt: true,
      worklistAssignedToId: true,
      worklistAssignedToName: true,
      worklistDocStatus: true,
      createdAt: true,
    },
  },
  patient: { select: worklistPatientSelect },
};

function serializeWorklistRowFromAppointment(appointment) {
  const checkout = appointment.checkout || null;
  const patient = appointment.patient;
  const provider = appointment.providerRef;
  const renderingProvider =
    providerDisplayName(provider) ||
    appointment.provider ||
    appointment.chargeCapture?.renderingProviderName ||
    '—';
  const insurance = formatInsuranceInfo(patient);
  const modality = appointment.visitModality || patient?.visitModality || 'in-house';
  const claims = appointment.claims || [];
  const latestClaim = claims[0] || null;
  const rowId = checkout?.id || `appt:${appointment.id}`;

  return {
    id: rowId,
    checkoutId: checkout?.id || null,
    patientId: patient?.id || appointment.patientId,
    appointmentId: appointment.id,
    patientName: patient
      ? [patient.lastName, [patient.firstName, patient.middleName].filter(Boolean).join(' ')].filter(Boolean).join(', ')
      : '—',
    patientFirstName: patient?.firstName || '',
    patientLastName: patient?.lastName || '',
    mrn: patient?.mrn || '—',
    encounterNumber: appointment.encounterNumber || '—',
    encounterDate: appointment.appointmentDate || null,
    dateOfBirth: patient?.dateOfBirth || null,
    age: calcAge(patient?.dateOfBirth),
    gender: patient?.gender || '—',
    insuranceLabel: insurance.label,
    insuranceCompany: insurance.company || null,
    insuranceMemberId: insurance.memberId || null,
    isSelfPay: insurance.isSelfPay,
    patientType: PATIENT_TYPE_LABELS[modality] || modality,
    patientTypeRaw: modality,
    dischargeDate: checkout?.completedAt || appointment.appointmentDate || null,
    renderingProvider,
    docStatus: deriveDocStatus(checkout, appointment),
    assignedUserId: checkout?.worklistAssignedToId || patient?.assignedToId || null,
    assignedUserName:
      checkout?.worklistAssignedToName ||
      formatUserName(patient?.assignedTo) ||
      null,
    createdAt: checkout?.createdAt || appointment.createdAt,
    completedAt: checkout?.completedAt || null,
    completedByName: checkout?.completedByName || null,
    claimId: latestClaim?.id || null,
    claimNumber: latestClaim?.claimNumber || null,
    claimStatus: latestClaim?.status || null,
    hasChargeCapture: Boolean(appointment.chargeCapture),
    chargeCaptureLocked: Boolean(appointment.chargeCapture?.isLocked),
    appointmentStatus: appointment.status || null,
  };
}

/** Ensure a checkout row exists so worklist assign/remove can persist. */
async function ensureWorklistCheckout(appointmentId, user) {
  const existing = await prisma.patientCheckout.findUnique({ where: { appointmentId } });
  if (existing) {
    if (existing.status !== 'completed' || !existing.completedAt) {
      return prisma.patientCheckout.update({
        where: { id: existing.id },
        data: {
          status: 'completed',
          completedAt: existing.completedAt || new Date(),
          completedBy: existing.completedBy || user?.id || null,
          completedByName: existing.completedByName || formatUserName(user),
          isLocked: true,
          worklistRemovedAt: null,
          updatedBy: user?.id || null,
        },
      });
    }
    if (existing.worklistRemovedAt) {
      return prisma.patientCheckout.update({
        where: { id: existing.id },
        data: { worklistRemovedAt: null, updatedBy: user?.id || null },
      });
    }
    return existing;
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { id: true, patientId: true },
  });
  if (!appointment) throw httpError('Appointment not found', 404);

  return prisma.patientCheckout.create({
    data: {
      patientId: appointment.patientId,
      appointmentId: appointment.id,
      status: 'completed',
      completedAt: new Date(),
      completedBy: user?.id || null,
      completedByName: formatUserName(user),
      isLocked: true,
      createdBy: user?.id || null,
      updatedBy: user?.id || null,
    },
  });
}

async function listClaimsWorklist(query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 25));
  const skip = (page - 1) * limit;

  const where = {
    status: { in: WORKLIST_APPOINTMENT_STATUSES },
    OR: [
      { checkout: null },
      { checkout: { is: { worklistRemovedAt: null } } },
    ],
  };

  if (query.dateFrom || query.dateTo) {
    const dateFilter = {};
    if (query.dateFrom) dateFilter.gte = toDateOnly(query.dateFrom);
    if (query.dateTo) dateFilter.lte = toDateOnly(query.dateTo);
    // Match either encounter DOS or checkout discharge timestamp date
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { appointmentDate: dateFilter },
          {
            checkout: {
              is: {
                completedAt: {
                  ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
                  ...(query.dateTo
                    ? {
                        lte: (() => {
                          const end = new Date(query.dateTo);
                          end.setHours(23, 59, 59, 999);
                          return end;
                        })(),
                      }
                    : {}),
                },
              },
            },
          },
        ],
      },
    ];
  }

  if (query.assignedToId) {
    where.checkout = {
      is: {
        ...(where.checkout?.is || {}),
        worklistAssignedToId: query.assignedToId,
        worklistRemovedAt: null,
      },
    };
    delete where.OR;
  } else if (query.unassigned === true || query.unassigned === 'true') {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { checkout: null },
          { checkout: { is: { worklistAssignedToId: null, worklistRemovedAt: null } } },
        ],
      },
    ];
  }

  if (query.search) {
    const s = query.search.trim();
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { encounterNumber: { contains: s, mode: 'insensitive' } },
          { patient: { firstName: { contains: s, mode: 'insensitive' } } },
          { patient: { lastName: { contains: s, mode: 'insensitive' } } },
          { patient: { mrn: { contains: s, mode: 'insensitive' } } },
          { checkout: { is: { worklistAssignedToName: { contains: s, mode: 'insensitive' } } } },
        ],
      },
    ];
  }

  if (query.providerId) {
    where.providerId = query.providerId;
  }

  if (query.patientType && query.patientType !== 'all') {
    where.visitModality = query.patientType;
  }

  const docStatusFilter = query.docStatus && query.docStatus !== 'all' ? query.docStatus : null;

  const fetchRows = async ({ withPaging } = { withPaging: true }) => {
    return prisma.appointment.findMany({
      where,
      ...(withPaging ? { skip, take: limit } : {}),
      orderBy: [{ appointmentDate: 'desc' }, { createdAt: 'desc' }],
      select: worklistAppointmentSelect,
    });
  };

  if (docStatusFilter) {
    const allRows = await fetchRows({ withPaging: false });
    const filtered = allRows
      .map(serializeWorklistRowFromAppointment)
      .filter((row) => row.docStatus === docStatusFilter);
    const total = filtered.length;
    return {
      data: filtered.slice(skip, skip + limit),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      meta: { docStatuses: WORKLIST_DOC_STATUSES },
    };
  }

  const [total, rows] = await Promise.all([
    prisma.appointment.count({ where }),
    fetchRows({ withPaging: true }),
  ]);

  return {
    data: rows.map(serializeWorklistRowFromAppointment),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
    meta: {
      docStatuses: WORKLIST_DOC_STATUSES,
    },
  };
}

async function updateWorklistItem(checkoutOrAppointmentKey, body, user) {
  let checkoutId = checkoutOrAppointmentKey;
  if (String(checkoutOrAppointmentKey).startsWith('appt:')) {
    const appointmentId = String(checkoutOrAppointmentKey).slice(5);
    const ensured = await ensureWorklistCheckout(appointmentId, user);
    checkoutId = ensured.id;
  }

  const existing = await prisma.patientCheckout.findUnique({ where: { id: checkoutId } });
  if (!existing) {
    // Allow callers to pass appointmentId directly
    const asAppointment = await prisma.appointment.findUnique({ where: { id: checkoutOrAppointmentKey } });
    if (!asAppointment) throw httpError('Worklist item not found', 404);
    const ensured = await ensureWorklistCheckout(asAppointment.id, user);
    checkoutId = ensured.id;
  }

  const checkout = await prisma.patientCheckout.findUnique({ where: { id: checkoutId } });
  if (!checkout) throw httpError('Worklist item not found', 404);
  if (checkout.worklistRemovedAt) {
    throw httpError('Encounter was removed from the worklist', 410);
  }

  const data = { updatedBy: user?.id || null };

  if (body.assignedUserName !== undefined || body.assignedUserId !== undefined) {
    data.worklistAssignedToId = body.assignedUserId || null;
    data.worklistAssignedToName = body.assignedUserName
      ? String(body.assignedUserName).trim() || null
      : null;
  }

  if (body.docStatus !== undefined) {
    if (body.docStatus && !WORKLIST_DOC_STATUSES.includes(body.docStatus)) {
      throw httpError('Invalid documentation status', 400);
    }
    data.worklistDocStatus = body.docStatus || null;
  }

  // Keep checkout completed so it remains eligible
  if (checkout.status !== 'completed') {
    data.status = 'completed';
    data.completedAt = checkout.completedAt || new Date();
    data.isLocked = true;
  }

  await prisma.patientCheckout.update({
    where: { id: checkoutId },
    data,
  });

  const appointment = await prisma.appointment.findUnique({
    where: { id: checkout.appointmentId },
    select: worklistAppointmentSelect,
  });
  return serializeWorklistRowFromAppointment(appointment);
}

async function removeFromWorklist(checkoutOrAppointmentKey, user) {
  let checkoutId = checkoutOrAppointmentKey;
  let appointmentId = null;

  if (String(checkoutOrAppointmentKey).startsWith('appt:')) {
    appointmentId = String(checkoutOrAppointmentKey).slice(5);
    const ensured = await ensureWorklistCheckout(appointmentId, user);
    checkoutId = ensured.id;
  } else {
    const existing = await prisma.patientCheckout.findUnique({ where: { id: checkoutOrAppointmentKey } });
    if (!existing) {
      const asAppointment = await prisma.appointment.findUnique({
        where: { id: checkoutOrAppointmentKey },
      });
      if (!asAppointment) throw httpError('Worklist item not found', 404);
      const ensured = await ensureWorklistCheckout(asAppointment.id, user);
      checkoutId = ensured.id;
      appointmentId = asAppointment.id;
    } else {
      appointmentId = existing.appointmentId;
    }
  }

  const updated = await prisma.patientCheckout.update({
    where: { id: checkoutId },
    data: {
      worklistRemovedAt: new Date(),
      updatedBy: user?.id || null,
    },
  });

  return { id: updated.id, appointmentId, removed: true };
}

module.exports = {
  getOrCreateChargeCapture,
  upsertChargeCapture,
  lockChargeCapture,
  unlockChargeCapture,
  generateClaimFromEncounter,
  listClaims,
  getClaimById,
  updateClaimStatus,
  listClaimsWorklist,
  updateWorklistItem,
  removeFromWorklist,
  WORKLIST_DOC_STATUSES,
};
