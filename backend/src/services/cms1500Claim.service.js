const prisma = require('../lib/prisma');
const { CHARGE_ROUTING_VALUES, ICD_POINTERS, INSURANCE_TIERS } = require('../lib/claimConstants');

function money(n) {
  return Math.round(Number(n || 0) * 100) / 100;
}

function toDateOnly(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function toDate(value) {
  const iso = toDateOnly(value);
  return iso ? new Date(`${iso}T00:00:00.000Z`) : null;
}

function emptyToNull(value) {
  if (value === undefined || value === null || value === '') return null;
  return value;
}

function formatPatientName(patient) {
  if (!patient) return '';
  return [patient.lastName, [patient.firstName, patient.middleName].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');
}

function formatProviderName(provider) {
  if (!provider) return null;
  return [provider.firstName, provider.middleName, provider.lastName].filter(Boolean).join(' ');
}

function formatFacilityLabel(location) {
  if (!location) return null;
  const cityState = [location.city, location.state].filter(Boolean).join(', ');
  return [location.name, cityState].filter(Boolean).join(' — ');
}

function validationError(errors) {
  const err = new Error('Claim validation failed');
  err.statusCode = 400;
  err.errors = errors;
  return err;
}

function notFound(message = 'Claim not found') {
  const err = new Error(message);
  err.statusCode = 404;
  return err;
}

function badRequest(message, errors) {
  const err = new Error(message);
  err.statusCode = 400;
  if (errors) err.errors = errors;
  return err;
}

const billingProviderSelect = {
  id: true,
  name: true,
  code: true,
  npi: true,
  taxId: true,
  address: true,
  isActive: true,
};

const providerSelect = {
  id: true,
  npi: true,
  firstName: true,
  middleName: true,
  lastName: true,
  isActive: true,
  specialty: { select: { name: true } },
  department: { select: { departmentName: true } },
};

const payerSelect = {
  id: true,
  name: true,
  code: true,
  address: true,
  city: true,
  state: true,
  zip: true,
  isActive: true,
};

const facilitySelect = {
  id: true,
  name: true,
  address: true,
  city: true,
  state: true,
  phone: true,
};

const completeInclude = {
  patient: {
    include: {
      insurances: {
        where: { isActive: true },
        include: { insuranceProvider: { select: payerSelect } },
        orderBy: [{ cobOrder: 'asc' }, { insuranceType: 'asc' }],
      },
    },
  },
  appointment: {
    include: {
      providerRef: { select: providerSelect },
    },
  },
  renderingProvider: { select: providerSelect },
  billingProvider: { select: billingProviderSelect },
  supervisingProvider: { select: providerSelect },
  orderingProvider: { select: providerSelect },
  referringProvider: { select: providerSelect },
  facility: { select: facilitySelect },
  primaryPayer: { select: payerSelect },
  secondaryPayer: { select: payerSelect },
  tertiaryPayer: { select: payerSelect },
  lines: { orderBy: { lineNumber: 'asc' } },
  diagnoses: { orderBy: { sortOrder: 'asc' } },
  insurances: { include: { payer: { select: payerSelect } }, orderBy: { tier: 'asc' } },
  additionalInfo: true,
  ambulanceInfo: true,
  events: { orderBy: { createdAt: 'desc' }, take: 50 },
  ediTransactions: { orderBy: { createdAt: 'desc' }, take: 20 },
  denials: { include: { appeals: true }, orderBy: { createdAt: 'desc' } },
  followUpTasks: { orderBy: { createdAt: 'desc' } },
  eraLines: { include: { eraBatch: true }, orderBy: { createdAt: 'desc' } },
};

async function nextClaimNumber(tx) {
  const db = tx || prisma;
  const year = new Date().getFullYear();
  const prefix = `CLM-${year}-`;
  const latest = await db.patientClaim.findFirst({
    where: { claimNumber: { startsWith: prefix } },
    orderBy: { claimNumber: 'desc' },
    select: { claimNumber: true },
  });
  let seq = 1;
  if (latest?.claimNumber) {
    const parsed = Number(latest.claimNumber.slice(prefix.length));
    if (Number.isFinite(parsed)) seq = parsed + 1;
  }
  return `${prefix}${String(seq).padStart(6, '0')}`;
}

async function addEvent(tx, claimId, eventType, fromStatus, toStatus, summary, details, user) {
  return tx.claimEvent.create({
    data: {
      claimId,
      eventType,
      fromStatus: fromStatus || null,
      toStatus: toStatus || null,
      summary: summary || null,
      details: details || undefined,
      createdBy: user?.id || user?.email || null,
    },
  });
}

function serializeBillingProvider(provider) {
  if (!provider) return null;
  return {
    id: provider.id,
    name: provider.name,
    code: provider.code || null,
    npi: provider.npi || null,
    taxId: provider.taxId || null,
    address: provider.address || null,
    isActive: provider.isActive,
  };
}

function serializeProvider(provider) {
  if (!provider) return null;
  return {
    id: provider.id,
    name: formatProviderName(provider),
    npi: provider.npi || null,
    specialty: provider.specialty?.name || null,
    department: provider.department?.departmentName || null,
    isActive: provider.isActive,
  };
}

function serializePayer(payer) {
  if (!payer) return null;
  return {
    id: payer.id,
    name: payer.name,
    code: payer.code || null,
    address: [payer.address, payer.city, payer.state, payer.zip].filter(Boolean).join(', ') || null,
    isActive: payer.isActive,
  };
}

function serializeLine(line) {
  const units = Number(line.units || 0);
  const unitCharge = Number(line.unitCharge || 0);
  const chargeAmount = Number(line.chargeAmount || units * unitCharge);
  return {
    id: line.id,
    lineNumber: line.lineNumber,
    serviceFromDate: toDateOnly(line.serviceDate),
    serviceToDate: toDateOnly(line.serviceToDate),
    serviceDate: toDateOnly(line.serviceDate),
    placeOfService: line.placeOfService || '',
    typeOfService: line.typeOfService || '',
    procedureCode: line.cptCode || line.hcpcsCode || '',
    cptCode: line.cptCode,
    hcpcsCode: line.hcpcsCode,
    modifier1: line.modifier1 || '',
    modifier2: line.modifier2 || '',
    modifier3: line.modifier3 || '',
    modifier4: line.modifier4 || '',
    modifiers: line.modifiers || [line.modifier1, line.modifier2, line.modifier3, line.modifier4].filter(Boolean).join(''),
    diagnosisPointer: line.diagnosisPointers || '',
    diagnosisPointers: line.diagnosisPointers || '',
    units,
    unitCharge,
    chargeAmount,
    lineTotal: chargeAmount,
    chargeStatus: line.chargeStatus || 'no_change',
    inventoryCode: line.inventoryCode || '',
    chiropractic: !!line.chiropractic,
    description: line.description || '',
    allowedAmount: line.allowedAmount != null ? Number(line.allowedAmount) : null,
    paidAmount: line.paidAmount != null ? Number(line.paidAmount) : null,
  };
}

function firstServiceDate(claim) {
  const lineDate = (claim.lines || []).find((l) => l.serviceDate)?.serviceDate;
  return toDateOnly(lineDate)
    || toDateOnly(claim.appointment?.appointmentDate)
    || toDateOnly(claim.createdAt);
}

function serializeListRow(claim) {
  const billed = Number(claim.totalCharge ?? claim.billedAmount ?? 0);
  const paid = Number(claim.paidAmount || 0);
  const adj = Number(claim.adjustmentAmount || 0);
  const balance = money(billed - paid - Math.abs(adj));
  return {
    id: claim.id,
    claimId: claim.claimNumber,
    claimNumber: claim.claimNumber,
    patientId: claim.patientId,
    patientName: formatPatientName(claim.patient),
    patientMrn: claim.patient?.mrn || null,
    dateOfService: firstServiceDate(claim),
    dos: firstServiceDate(claim),
    payer: claim.primaryPayer?.name || claim.payerName || '',
    primaryInsurance: claim.primaryPayer?.name || claim.payerName || '',
    payerId: claim.primaryPayerId || claim.memberId || '',
    status: claim.claimStatus,
    claimStatus: claim.claimStatus,
    submissionStatus: claim.submissionStatus || 'not_submitted',
    claimType: claim.claimType,
    formType: claim.formType,
    totalCharge: billed,
    claimAmount: billed,
    billedAmount: billed,
    amountPaid: paid,
    balanceDue: balance < 0 ? 0 : balance,
    patientBalance: Number(claim.patientBalance || (balance < 0 ? 0 : balance)),
    submittedDate: toDateOnly(claim.submittedAt),
    createdAt: claim.createdAt,
    updatedAt: claim.updatedAt,
    renderingProvider: formatProviderName(claim.renderingProvider)
      || formatProviderName(claim.appointment?.providerRef)
      || claim.appointment?.provider
      || null,
    billingProvider: claim.billingProvider?.name || null,
    facility: claim.facility?.name || null,
    tcn: claim.tcn,
    clearinghouseStatus: claim.clearinghouseStatus,
    scrubStatus: claim.scrubStatus,
  };
}

function serializeComplete(claim) {
  const list = serializeListRow(claim);
  return {
    ...list,
    groupNumber: claim.groupNumber,
    billingProviderNpi: claim.billingProviderNpi || claim.billingProvider?.npi || null,
    renderingProviderNpi: claim.renderingProviderNpi || claim.renderingProvider?.npi || null,
    frequencyCode: claim.frequencyCode || '1',
    officeLocation: claim.officeLocation || '',
    claimRef: claim.claimRef || '',
    notes: claim.notes,
    formPayload: claim.formPayload,
    scrubIssues: claim.scrubIssues,
    savedAt: claim.savedAt,
    deletedAt: claim.deletedAt,
    sourceClaimId: claim.sourceClaimId,
    splitFromClaimId: claim.splitFromClaimId,
    createdBy: claim.createdBy,
    updatedBy: claim.updatedBy,
    patient: claim.patient,
    appointment: claim.appointment,
    renderingProviderId: claim.renderingProviderId,
    billingProviderId: claim.billingProviderId,
    supervisingProviderId: claim.supervisingProviderId,
    orderingProviderId: claim.orderingProviderId,
    referringProviderId: claim.referringProviderId,
    facilityId: claim.facilityId,
    primaryPayerId: claim.primaryPayerId,
    secondaryPayerId: claim.secondaryPayerId,
    tertiaryPayerId: claim.tertiaryPayerId,
    renderingProvider: serializeProvider(claim.renderingProvider),
    billingProvider: serializeBillingProvider(claim.billingProvider),
    supervisingProvider: serializeProvider(claim.supervisingProvider),
    orderingProvider: serializeProvider(claim.orderingProvider),
    referringProvider: serializeProvider(claim.referringProvider),
    facility: claim.facility
      ? {
          id: claim.facility.id,
          name: claim.facility.name,
          label: formatFacilityLabel(claim.facility),
          address: claim.facility.address,
          city: claim.facility.city,
          state: claim.facility.state,
        }
      : null,
    primaryPayer: serializePayer(claim.primaryPayer),
    secondaryPayer: serializePayer(claim.secondaryPayer),
    tertiaryPayer: serializePayer(claim.tertiaryPayer),
    diagnoses: (claim.diagnoses || []).map((dx) => ({
      id: dx.id,
      pointer: dx.pointer,
      diagnosisCodeId: dx.diagnosisCodeId,
      code: dx.code,
      description: dx.description,
    })),
    insurances: (claim.insurances || []).map((ins) => ({
      id: ins.id,
      tier: ins.tier,
      payerId: ins.payerId,
      payer: serializePayer(ins.payer),
      memberId: ins.memberId || '',
      groupNumber: ins.groupNumber || '',
      policyType: ins.policyType || '',
      subscriberFirstName: ins.subscriberFirstName || '',
      subscriberLastName: ins.subscriberLastName || '',
      subscriberName: ins.subscriberName || [ins.subscriberLastName, ins.subscriberFirstName].filter(Boolean).join(', '),
      subscriberDob: toDateOnly(ins.subscriberDob),
      subscriberRelationship: ins.subscriberRelationship || '',
      copayDue: ins.copayDue != null ? Number(ins.copayDue) : 0,
      authorizationNumber: ins.authorizationNumber || '',
      referralType: ins.referralType || '',
      claimControlRef: ins.claimControlRef || '',
    })),
    charges: (claim.lines || []).map(serializeLine),
    lines: (claim.lines || []).map(serializeLine),
    additionalInfo: claim.additionalInfo || null,
    ambulanceInfo: claim.ambulanceInfo || null,
    events: claim.events || [],
    ediTransactions: claim.ediTransactions || [],
    denials: claim.denials || [],
    followUpTasks: claim.followUpTasks || [],
    eraLines: claim.eraLines || [],
  };
}

function normalizeCharges(charges = []) {
  return (charges || [])
    .filter((row) => row && !row.delete)
    .map((row, idx) => {
      const units = Number(row.units ?? 1) || 0;
      const unitCharge = Number(row.unitCharge ?? 0) || 0;
      const chargeAmount = money(Number(row.chargeAmount ?? row.lineTotal ?? units * unitCharge));
      const procedure = emptyToNull(row.procedureCode || row.cptCode || row.hcpcsCode);
      const modifiers = [row.modifier1, row.modifier2, row.modifier3, row.modifier4].filter(Boolean);
      return {
        id: emptyToNull(row.id),
        lineNumber: idx + 1,
        serviceDate: toDate(row.serviceFromDate || row.serviceDate),
        serviceToDate: toDate(row.serviceToDate),
        cptCode: procedure,
        hcpcsCode: emptyToNull(row.hcpcsCode),
        modifiers: emptyToNull(row.modifiers) || (modifiers.length ? modifiers.join('') : null),
        modifier1: emptyToNull(row.modifier1),
        modifier2: emptyToNull(row.modifier2),
        modifier3: emptyToNull(row.modifier3),
        modifier4: emptyToNull(row.modifier4),
        diagnosisPointers: emptyToNull(row.diagnosisPointer || row.diagnosisPointers),
        units,
        unitCharge,
        chargeAmount,
        placeOfService: emptyToNull(row.placeOfService),
        typeOfService: emptyToNull(row.typeOfService),
        inventoryCode: emptyToNull(row.inventoryCode),
        chiropractic: !!row.chiropractic,
        chargeStatus: CHARGE_ROUTING_VALUES.includes(row.chargeStatus) ? row.chargeStatus : 'no_change',
        description: emptyToNull(row.description),
      };
    });
}

function normalizeDiagnoses(diagnoses = []) {
  return (diagnoses || [])
    .filter((dx) => dx && (dx.code || dx.diagnosisCodeId))
    .map((dx, idx) => ({
      pointer: ICD_POINTERS.includes(dx.pointer) ? dx.pointer : ICD_POINTERS[idx] || 'A',
      sortOrder: idx,
      diagnosisCodeId: emptyToNull(dx.diagnosisCodeId),
      code: emptyToNull(dx.code),
      description: emptyToNull(dx.description),
    }));
}

function normalizeInsurances(payload) {
  const fromArray = Array.isArray(payload.insurances) ? payload.insurances : [];
  const byTier = {};
  for (const row of fromArray) {
    if (row?.tier) byTier[row.tier] = row;
  }
  return INSURANCE_TIERS.map((tier) => {
    const existing = byTier[tier] || {};
    const payerId = emptyToNull(existing.payerId || payload[`${tier}PayerId`]);
    return {
      tier,
      payerId,
      memberId: emptyToNull(existing.memberId),
      groupNumber: emptyToNull(existing.groupNumber),
      policyType: emptyToNull(existing.policyType),
      subscriberFirstName: emptyToNull(existing.subscriberFirstName),
      subscriberLastName: emptyToNull(existing.subscriberLastName),
      subscriberName: emptyToNull(existing.subscriberName)
        || [existing.subscriberLastName, existing.subscriberFirstName].filter(Boolean).join(', ')
        || null,
      subscriberDob: toDate(existing.subscriberDob),
      subscriberRelationship: emptyToNull(existing.subscriberRelationship),
      copayDue: existing.copayDue != null && existing.copayDue !== '' ? money(existing.copayDue) : null,
      authorizationNumber: emptyToNull(existing.authorizationNumber),
      referralType: emptyToNull(existing.referralType),
      claimControlRef: emptyToNull(existing.claimControlRef),
    };
  }).filter((row) => row.payerId || row.memberId || row.groupNumber || row.subscriberName);
}

function yesNoToBool(value) {
  if (typeof value === 'boolean') return value;
  return String(value || '').toLowerCase() === 'yes' || value === true;
}

function normalizeAdditional(info) {
  if (!info) return null;
  return {
    employmentRelated: yesNoToBool(info.employmentRelated),
    autoAccident: yesNoToBool(info.autoAccident),
    accidentState: emptyToNull(info.accidentState)?.toUpperCase() || null,
    otherAccident: yesNoToBool(info.otherAccident),
    onsetDate: toDate(info.onsetDate || info.accidentDate),
    lastMenstrualPeriod: toDate(info.lastMenstrualPeriod),
    initialTreatmentDate: toDate(info.initialTreatmentDate),
    similarIllnessDate: toDate(info.similarIllnessDate),
    dateLastSeen: toDate(info.dateLastSeen),
    unableToWorkFrom: toDate(info.unableToWorkFrom),
    unableToWorkTo: toDate(info.unableToWorkTo),
    hospitalizationFrom: toDate(info.hospitalizationFrom),
    hospitalizationTo: toDate(info.hospitalizationTo),
    patientHomebound: emptyToNull(info.patientHomebound),
    outsideLab: yesNoToBool(info.outsideLab) || Number(info.labCharge) > 0,
    labCharge: info.labCharge != null && info.labCharge !== '' ? money(info.labCharge) : null,
    priorAuthorizationNumber: emptyToNull(info.priorAuthorizationNumber),
    originalReferenceNumber: emptyToNull(info.originalReferenceNumber),
    resubmissionCode: emptyToNull(info.resubmissionCode || info.resubmitReasonCode),
    claimCodes: emptyToNull(info.claimCodes),
    otherClaimId: emptyToNull(info.otherClaimId),
    additionalClaimInfo: emptyToNull(info.additionalClaimInfo),
    notes: emptyToNull(info.notes || info.claimNote),
    delayReasonCode: emptyToNull(info.delayReasonCode),
    specialProgramCode: emptyToNull(info.specialProgramCode),
    patientSignatureOnFile: emptyToNull(info.patientSignatureOnFile),
    insuredSignatureOnFile: emptyToNull(info.insuredSignatureOnFile),
    providerAcceptAssignment: emptyToNull(info.providerAcceptAssignment),
    documentationMethod: emptyToNull(info.documentationMethod),
    documentationType: emptyToNull(info.documentationType),
    documentationTypeOther: emptyToNull(info.documentationTypeOther),
    patientHeight: emptyToNull(info.patientHeight),
    patientWeight: emptyToNull(info.patientWeight),
    serviceAuthException: emptyToNull(info.serviceAuthException),
    demonstrationProject: emptyToNull(info.demonstrationProject),
    mammographyCert: emptyToNull(info.mammographyCert),
    investigationalDevice: emptyToNull(info.investigationalDevice),
    ambulatoryPatientGroup: emptyToNull(info.ambulatoryPatientGroup),
    showBoxNumbers: emptyToNull(info.showBoxNumbers),
  };
}

function normalizeAmbulance(info) {
  if (!info) return null;
  const isAmbulance = yesNoToBool(info.isAmbulanceClaim || info.ambulanceClaim);
  return {
    isAmbulanceClaim: isAmbulance,
    ambulanceTransportReason: emptyToNull(info.ambulanceTransportReason || info.transportReason),
    pickupLocation: emptyToNull(info.pickupLocation),
    dropoffLocation: emptyToNull(info.dropoffLocation),
    pickupDate: toDate(info.pickupDate),
    pickupTime: emptyToNull(info.pickupTime),
    mileage: info.mileage != null && info.mileage !== '' ? money(info.mileage) : null,
    ambulanceProvider: emptyToNull(info.ambulanceProvider),
    origin: emptyToNull(info.origin),
    destination: emptyToNull(info.destination),
    transportType: emptyToNull(info.transportType),
    medicalNecessity: emptyToNull(info.medicalNecessity),
    notes: emptyToNull(info.notes),
    transportMiles: info.transportMiles != null && info.transportMiles !== '' ? money(info.transportMiles) : null,
    patientWeight: info.patientWeight != null && info.patientWeight !== '' ? money(info.patientWeight) : null,
    roundTripReason: emptyToNull(info.roundTripReason),
    stretcherReason: emptyToNull(info.stretcherReason),
    pickupAddress: info.pickupAddress || null,
    dropoffAddress: info.dropoffAddress || null,
    certifications: info.certifications || info.certificationFields || null,
  };
}

async function assertReferences(payload) {
  const errors = {};
  if (!payload.patientId) errors.patientId = 'Patient is required';
  if (!payload.renderingProviderId) errors.renderingProviderId = 'Rendering provider is required';
  if (!payload.billingProviderId) errors.billingProviderId = 'Billing provider is required';

  const [patient, rendering, billing, supervising, ordering, referring, facility, primary, secondary, tertiary] = await Promise.all([
    payload.patientId ? prisma.patient.findFirst({ where: { id: payload.patientId, deletedAt: null } }) : null,
    payload.renderingProviderId ? prisma.provider.findUnique({ where: { id: payload.renderingProviderId } }) : null,
    payload.billingProviderId ? prisma.billingProvider.findFirst({ where: { id: payload.billingProviderId, deletedAt: null } }) : null,
    payload.supervisingProviderId ? prisma.provider.findUnique({ where: { id: payload.supervisingProviderId } }) : null,
    payload.orderingProviderId ? prisma.provider.findUnique({ where: { id: payload.orderingProviderId } }) : null,
    payload.referringProviderId ? prisma.provider.findUnique({ where: { id: payload.referringProviderId } }) : null,
    payload.facilityId ? prisma.location.findUnique({ where: { id: payload.facilityId } }) : null,
    payload.primaryPayerId ? prisma.insuranceProvider.findFirst({ where: { id: payload.primaryPayerId, deletedAt: null } }) : null,
    payload.secondaryPayerId ? prisma.insuranceProvider.findFirst({ where: { id: payload.secondaryPayerId, deletedAt: null } }) : null,
    payload.tertiaryPayerId ? prisma.insuranceProvider.findFirst({ where: { id: payload.tertiaryPayerId, deletedAt: null } }) : null,
  ]);

  if (payload.patientId && !patient) errors.patientId = 'Patient does not exist';
  if (payload.renderingProviderId && !rendering) errors.renderingProviderId = 'Rendering provider does not exist';
  if (payload.billingProviderId && !billing) errors.billingProviderId = 'Billing provider does not exist';
  if (payload.supervisingProviderId && !supervising) errors.supervisingProviderId = 'Supervising provider does not exist';
  if (payload.orderingProviderId && !ordering) errors.orderingProviderId = 'Ordering provider does not exist';
  if (payload.referringProviderId && !referring) errors.referringProviderId = 'Referring provider does not exist';
  if (payload.facilityId && !facility) errors.facilityId = 'Facility does not exist';
  if (payload.primaryPayerId && !primary) errors.primaryPayerId = 'Primary payer does not exist';
  if (payload.secondaryPayerId && !secondary) errors.secondaryPayerId = 'Secondary payer does not exist';
  if (payload.tertiaryPayerId && !tertiary) errors.tertiaryPayerId = 'Tertiary payer does not exist';

  const diagnoses = normalizeDiagnoses(payload.diagnoses);
  for (const [idx, dx] of diagnoses.entries()) {
    if (dx.diagnosisCodeId) {
      const found = await prisma.diagnosisCode.findFirst({
        where: { id: dx.diagnosisCodeId, deletedAt: null },
      });
      if (!found) errors[`diagnoses.${idx}.diagnosisCodeId`] = 'Diagnosis code does not exist';
    } else if (dx.code) {
      const found = await prisma.diagnosisCode.findFirst({
        where: { code: { equals: dx.code, mode: 'insensitive' }, deletedAt: null },
      });
      if (!found) errors[`diagnoses.${idx}.code`] = 'Diagnosis code is not in the catalog';
      else {
        dx.diagnosisCodeId = found.id;
        dx.description = dx.description || found.description;
        dx.code = found.code;
      }
    }
  }

  const charges = normalizeCharges(payload.charges);
  charges.forEach((line, idx) => {
    if (line.units < 0) errors[`charges.${idx}.units`] = 'Units must be zero or greater';
    if (line.unitCharge < 0) errors[`charges.${idx}.unitCharge`] = 'Charge amount must be zero or greater';
    if (line.chargeAmount < 0) errors[`charges.${idx}.chargeAmount`] = 'Line total must be zero or greater';
    if (line.serviceDate && line.serviceToDate && line.serviceToDate < line.serviceDate) {
      errors[`charges.${idx}.serviceToDate`] = 'To date cannot be before from date';
    }
  });

  const additional = normalizeAdditional(payload.additionalInfo);
  if (additional?.autoAccident && !additional.accidentState) {
    errors['additionalInfo.accidentState'] = 'Accident state is required when auto accident is yes';
  }
  if (additional?.unableToWorkFrom && additional?.unableToWorkTo && additional.unableToWorkTo < additional.unableToWorkFrom) {
    errors['additionalInfo.unableToWorkTo'] = 'Unable-to-work end date cannot be before start date';
  }
  if (additional?.hospitalizationFrom && additional?.hospitalizationTo && additional.hospitalizationTo < additional.hospitalizationFrom) {
    errors['additionalInfo.hospitalizationTo'] = 'Hospitalization end date cannot be before start date';
  }
  if (additional?.outsideLab && (additional.labCharge == null || additional.labCharge < 0)) {
    errors['additionalInfo.labCharge'] = 'Lab charge is required when outside lab is indicated';
  }

  const ambulance = normalizeAmbulance(payload.ambulanceInfo);
  if (ambulance?.isAmbulanceClaim) {
    const pickup = ambulance.pickupAddress || {};
    const dropoff = ambulance.dropoffAddress || {};
    if (!ambulance.pickupLocation && !pickup.line1 && !pickup.city) {
      errors['ambulanceInfo.pickupAddress'] = 'Pickup location is required for ambulance claims';
    }
    if (!ambulance.dropoffLocation && !dropoff.line1 && !dropoff.city && !dropoff.name) {
      errors['ambulanceInfo.dropoffAddress'] = 'Dropoff location is required for ambulance claims';
    }
    if (ambulance.transportMiles != null && ambulance.transportMiles < 0) {
      errors['ambulanceInfo.transportMiles'] = 'Mileage must be zero or greater';
    }
  }

  if (Object.keys(errors).length) throw validationError(errors);

  return {
    patient,
    rendering,
    billing,
    diagnoses,
    charges,
    additional,
    ambulance,
    insurances: normalizeInsurances(payload),
  };
}

function buildFormPayload(claim, relations) {
  return {
    formType: 'CMS-1500',
    claimNumber: claim.claimNumber,
    patient: {
      id: relations.patient?.id,
      mrn: relations.patient?.mrn,
      name: formatPatientName(relations.patient),
      dob: toDateOnly(relations.patient?.dateOfBirth),
      gender: relations.patient?.gender,
    },
    providers: {
      renderingProviderId: claim.renderingProviderId,
      billingProviderId: claim.billingProviderId,
    },
    diagnoses: relations.diagnoses,
    lines: relations.charges.map((l) => ({
      lineNumber: l.lineNumber,
      cptCode: l.cptCode,
      units: l.units,
      chargeAmount: l.chargeAmount,
      diagnosisPointers: l.diagnosisPointers,
      serviceDate: toDateOnly(l.serviceDate),
    })),
    totals: { billedAmount: Number(claim.billedAmount || 0) },
  };
}

function headerData(payload, relations, user, existing = null) {
  const billed = money(relations.charges.reduce((sum, line) => sum + Number(line.chargeAmount || 0), 0));
  const primaryIns = relations.insurances.find((i) => i.tier === 'primary') || relations.insurances[0];
  return {
    patientId: payload.patientId,
    appointmentId: emptyToNull(payload.appointmentId) || existing?.appointmentId || null,
    claimStatus: payload.claimStatus || existing?.claimStatus || 'draft',
    claimType: existing?.claimType || 'original',
    formType: 'CMS-1500',
    frequencyCode: emptyToNull(payload.frequencyCode) || existing?.frequencyCode || '1',
    claimRef: emptyToNull(payload.claimRef),
    officeLocation: emptyToNull(payload.officeLocation),
    renderingProviderId: emptyToNull(payload.renderingProviderId),
    billingProviderId: emptyToNull(payload.billingProviderId),
    supervisingProviderId: emptyToNull(payload.supervisingProviderId),
    orderingProviderId: emptyToNull(payload.orderingProviderId),
    referringProviderId: emptyToNull(payload.referringProviderId),
    facilityId: emptyToNull(payload.facilityId),
    primaryPayerId: emptyToNull(payload.primaryPayerId),
    secondaryPayerId: emptyToNull(payload.secondaryPayerId),
    tertiaryPayerId: emptyToNull(payload.tertiaryPayerId),
    payerName: primaryIns ? undefined : existing?.payerName,
    memberId: primaryIns?.memberId || existing?.memberId || null,
    groupNumber: primaryIns?.groupNumber || existing?.groupNumber || null,
    billingProviderNpi: relations.billing?.npi || existing?.billingProviderNpi || null,
    renderingProviderNpi: relations.rendering?.npi || existing?.renderingProviderNpi || null,
    billedAmount: billed,
    totalCharge: billed,
    patientBalance: billed,
    notes: emptyToNull(payload.notes),
    savedAt: new Date(),
    updatedBy: user?.id || null,
    deletedAt: null,
  };
}

async function persistChildren(tx, claimId, relations, user, previousLines = []) {
  await tx.claimDiagnosis.deleteMany({ where: { claimId } });
  if (relations.diagnoses.length) {
    await tx.claimDiagnosis.createMany({
      data: relations.diagnoses.map((dx) => ({ ...dx, claimId })),
    });
  }

  await tx.claimInsurance.deleteMany({ where: { claimId } });
  if (relations.insurances.length) {
    await tx.claimInsurance.createMany({
      data: relations.insurances.map((ins) => ({ ...ins, claimId })),
    });
  }

  const keepIds = relations.charges.map((line) => line.id).filter(Boolean);
  if (keepIds.length) {
    await tx.claimLine.deleteMany({ where: { claimId, id: { notIn: keepIds } } });
  } else {
    await tx.claimLine.deleteMany({ where: { claimId } });
  }
  const createdLines = [];
  for (const line of relations.charges) {
    const data = {
      claimId,
      lineNumber: line.lineNumber,
      serviceDate: line.serviceDate,
      serviceToDate: line.serviceToDate,
      cptCode: line.cptCode,
      hcpcsCode: line.hcpcsCode,
      modifiers: line.modifiers,
      modifier1: line.modifier1,
      modifier2: line.modifier2,
      modifier3: line.modifier3,
      modifier4: line.modifier4,
      diagnosisPointers: line.diagnosisPointers,
      units: line.units,
      unitCharge: line.unitCharge,
      chargeAmount: line.chargeAmount,
      placeOfService: line.placeOfService,
      typeOfService: line.typeOfService,
      inventoryCode: line.inventoryCode,
      chiropractic: line.chiropractic,
      chargeStatus: line.chargeStatus,
      description: line.description,
    };
    const existingLine = line.id
      ? previousLines.find((prev) => prev.id === line.id)
      : null;
    const saved = existingLine
      ? await tx.claimLine.update({ where: { id: existingLine.id }, data })
      : await tx.claimLine.create({ data });
    createdLines.push(saved);
  }

  if (relations.additional) {
    await tx.claimAdditionalInfo.upsert({
      where: { claimId },
      create: { claimId, ...relations.additional },
      update: relations.additional,
    });
  }

  if (relations.ambulance) {
    await tx.claimAmbulanceInfo.upsert({
      where: { claimId },
      create: { claimId, ...relations.ambulance },
      update: relations.ambulance,
    });
  }

  await writeChargeHistory(tx, claimId, previousLines, createdLines, user);
  return createdLines;
}

function lineSnapshot(line) {
  return {
    id: line.id,
    lineNumber: line.lineNumber,
    procedure: line.cptCode || line.hcpcsCode || '',
    serviceDate: toDateOnly(line.serviceDate),
    serviceToDate: toDateOnly(line.serviceToDate),
    units: String(Number(line.units || 0)),
    unitCharge: String(Number(line.unitCharge || 0)),
    chargeAmount: String(Number(line.chargeAmount || 0)),
    chargeStatus: line.chargeStatus || 'no_change',
    diagnosisPointers: line.diagnosisPointers || '',
    modifiers: line.modifiers || [line.modifier1, line.modifier2, line.modifier3, line.modifier4].filter(Boolean).join(''),
  };
}

async function writeChargeHistory(tx, claimId, previousLines, nextLines, user) {
  const prevById = new Map((previousLines || []).map((l) => [l.id, l]));
  const nextByPrev = new Map();
  nextLines.forEach((line, idx) => {
    const prev = previousLines?.[idx];
    if (prev) nextByPrev.set(prev.id, line);
  });

  const records = [];
  for (const prev of previousLines || []) {
    const next = nextLines.find((l) => l.id === prev.id) || nextByPrev.get(prev.id);
    if (!next) {
      records.push({
        claimId,
        claimChargeId: null,
        action: 'deleted',
        fieldName: 'line',
        oldValue: JSON.stringify(lineSnapshot(prev)),
        newValue: null,
        changedBy: user?.id || user?.email || null,
      });
      continue;
    }
    const before = lineSnapshot(prev);
    const after = lineSnapshot(next);
    for (const field of Object.keys(before)) {
      if (field === 'id' || field === 'lineNumber') continue;
      if (String(before[field] ?? '') !== String(after[field] ?? '')) {
        records.push({
          claimId,
          claimChargeId: next.id,
          action: 'updated',
          fieldName: field,
          oldValue: String(before[field] ?? ''),
          newValue: String(after[field] ?? ''),
          changedBy: user?.id || user?.email || null,
        });
      }
    }
  }

  if (!previousLines?.length) {
    for (const next of nextLines) {
      records.push({
        claimId,
        claimChargeId: next.id,
        action: 'created',
        fieldName: 'line',
        oldValue: null,
        newValue: JSON.stringify(lineSnapshot(next)),
        changedBy: user?.id || user?.email || null,
      });
    }
  } else {
    const matchedPrev = new Set((previousLines || []).map((l) => l.id));
    nextLines.forEach((next, idx) => {
      const prev = previousLines[idx];
      if (!prev && !matchedPrev.has(next.id)) {
        records.push({
          claimId,
          claimChargeId: next.id,
          action: 'created',
          fieldName: 'line',
          oldValue: null,
          newValue: JSON.stringify(lineSnapshot(next)),
          changedBy: user?.id || user?.email || null,
        });
      }
    });
  }

  if (records.length) await tx.claimChargeHistory.createMany({ data: records });
}

const cms1500ClaimService = {
  async list(query = {}) {
    const where = { deletedAt: null };
    if (query.status && query.status !== 'all') where.claimStatus = query.status;
    if (query.submissionStatus && query.submissionStatus !== 'all') where.submissionStatus = query.submissionStatus;
    if (query.claimType && query.claimType !== 'all') where.claimType = query.claimType;
    if (query.formType) where.formType = query.formType;
    if (query.patientId) where.patientId = query.patientId;
    if (query.payerId) {
      where.OR = [
        { primaryPayerId: query.payerId },
        { secondaryPayerId: query.payerId },
        { tertiaryPayerId: query.payerId },
      ];
    }
    if (query.providerId) {
      where.OR = [
        ...(where.OR || []),
        { renderingProviderId: query.providerId },
        { billingProviderId: query.providerId },
      ];
    }
    if (query.payer) {
      where.OR = [
        ...(where.OR || []),
        { payerName: { contains: query.payer, mode: 'insensitive' } },
        { primaryPayer: { name: { contains: query.payer, mode: 'insensitive' } } },
      ];
    }
    if (query.claimNumber) {
      where.claimNumber = { contains: query.claimNumber, mode: 'insensitive' };
    }
    if (query.search) {
      const term = query.search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { claimNumber: { contains: term, mode: 'insensitive' } },
            { tcn: { contains: term, mode: 'insensitive' } },
            { payerName: { contains: term, mode: 'insensitive' } },
            { claimRef: { contains: term, mode: 'insensitive' } },
            { patient: { mrn: { contains: term, mode: 'insensitive' } } },
            { patient: { lastName: { contains: term, mode: 'insensitive' } } },
            { patient: { firstName: { contains: term, mode: 'insensitive' } } },
            { primaryPayer: { name: { contains: term, mode: 'insensitive' } } },
          ],
        },
      ];
    }
    if (query.dosFrom || query.dosTo) {
      const dateFilter = {};
      if (query.dosFrom) dateFilter.gte = new Date(query.dosFrom);
      if (query.dosTo) dateFilter.lte = new Date(query.dosTo);
      where.OR = [
        ...(where.OR || []),
        { lines: { some: { serviceDate: dateFilter } } },
        { appointment: { appointmentDate: dateFilter } },
      ];
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(query.limit) || 50));
    const sortDir = query.sortDir === 'asc' ? 'asc' : 'desc';
    const orderBy = query.sort === 'claimNumber'
      ? { claimNumber: sortDir }
      : query.sort === 'createdAt'
        ? { createdAt: sortDir }
        : { updatedAt: sortDir };

    const [total, rows] = await Promise.all([
      prisma.patientClaim.count({ where }),
      prisma.patientClaim.findMany({
        where,
        include: {
          patient: { select: { id: true, mrn: true, firstName: true, middleName: true, lastName: true } },
          appointment: {
            select: {
              appointmentDate: true,
              provider: true,
              providerRef: { select: { firstName: true, middleName: true, lastName: true, npi: true } },
            },
          },
          renderingProvider: { select: providerSelect },
          billingProvider: { select: billingProviderSelect },
          primaryPayer: { select: payerSelect },
          facility: { select: { id: true, name: true } },
          lines: { select: { serviceDate: true, chargeAmount: true }, orderBy: { lineNumber: 'asc' }, take: 1 },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: rows.map(serializeListRow),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1, totalPages: Math.ceil(total / limit) || 1 },
    };
  },

  async getById(id) {
    const claim = await prisma.patientClaim.findFirst({
      where: { id, deletedAt: null },
      include: completeInclude,
    });
    if (!claim) throw notFound();
    return serializeComplete(claim);
  },

  async create(payload, user) {
    const relations = await assertReferences(payload);
    const created = await prisma.$transaction(async (tx) => {
      const claimNumber = await nextClaimNumber(tx);
      const header = headerData(payload, relations, user);
      const primary = relations.insurances.find((i) => i.tier === 'primary');
      const claim = await tx.patientClaim.create({
        data: {
          ...header,
          claimNumber,
          claimStatus: 'draft',
          submissionStatus: 'not_submitted',
          createdBy: user?.id || null,
          payerName: primary ? undefined : header.payerName || null,
        },
      });
      if (primary?.payerId) {
        const payer = await tx.insuranceProvider.findUnique({ where: { id: primary.payerId } });
        await tx.patientClaim.update({
          where: { id: claim.id },
          data: { payerName: payer?.name || null },
        });
      }
      await persistChildren(tx, claim.id, relations, user, []);
      await addEvent(tx, claim.id, 'created', null, 'draft', 'CMS-1500 claim created as draft', {
        claimNumber,
      }, user);
      const formPayload = buildFormPayload({ ...claim, claimNumber, billedAmount: header.billedAmount }, relations);
      await tx.patientClaim.update({
        where: { id: claim.id },
        data: { formPayload },
      });
      return claim.id;
    });
    return this.getById(created);
  },

  async update(id, payload, user) {
    const existing = await prisma.patientClaim.findFirst({
      where: { id, deletedAt: null },
      include: { lines: true },
    });
    if (!existing) throw notFound();
    if (['submitted', 'accepted', 'paid'].includes(existing.claimStatus) && payload.claimStatus !== existing.claimStatus) {
      // allow field edits on draft/ready/on_hold/rejected/denied; submitted claims stay editable only as draft/ready updates
    }

    const relations = await assertReferences(payload);
    await prisma.$transaction(async (tx) => {
      const header = headerData(payload, relations, user, existing);
      const primary = relations.insurances.find((i) => i.tier === 'primary');
      let payerName = existing.payerName;
      if (primary?.payerId) {
        const payer = await tx.insuranceProvider.findUnique({ where: { id: primary.payerId } });
        payerName = payer?.name || payerName;
      }
      await tx.patientClaim.update({
        where: { id },
        data: {
          ...header,
          claimNumber: existing.claimNumber,
          payerName,
          formPayload: buildFormPayload({ ...existing, ...header }, relations),
        },
      });
      await persistChildren(tx, id, relations, user, existing.lines);
      const changes = [];
      if (existing.patientId !== payload.patientId) changes.push('patient');
      if (existing.renderingProviderId !== payload.renderingProviderId) changes.push('rendering provider');
      if (existing.billingProviderId !== payload.billingProviderId) changes.push('billing provider');
      if (existing.primaryPayerId !== payload.primaryPayerId) changes.push('primary payer');
      if (existing.claimStatus !== header.claimStatus) changes.push('status');
      await addEvent(tx, id, 'updated', existing.claimStatus, header.claimStatus, 'CMS-1500 claim updated', {
        changes,
      }, user);
    });
    return this.getById(id);
  },

  async remove(id, user) {
    const existing = await prisma.patientClaim.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw notFound();
    if (['submitted', 'accepted', 'paid'].includes(existing.claimStatus)) {
      throw badRequest('Submitted or paid claims cannot be deleted. Cancel the claim instead.');
    }
    await prisma.$transaction(async (tx) => {
      await tx.patientClaim.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          claimStatus: 'cancelled',
          updatedBy: user?.id || null,
        },
      });
      await addEvent(tx, id, 'cancelled', existing.claimStatus, 'cancelled', 'Claim cancelled / soft-deleted', null, user);
    });
    return { id, deleted: true };
  },

  async copy(id, user) {
    const source = await prisma.patientClaim.findFirst({
      where: { id, deletedAt: null },
      include: {
        lines: { orderBy: { lineNumber: 'asc' } },
        diagnoses: { orderBy: { sortOrder: 'asc' } },
        insurances: true,
        additionalInfo: true,
        ambulanceInfo: true,
      },
    });
    if (!source) throw notFound();

    const createdId = await prisma.$transaction(async (tx) => {
      const claimNumber = await nextClaimNumber(tx);
      const copy = await tx.patientClaim.create({
        data: {
          patientId: source.patientId,
          appointmentId: source.appointmentId,
          claimNumber,
          claimStatus: 'draft',
          claimType: 'original',
          formType: source.formType || 'CMS-1500',
          frequencyCode: source.frequencyCode || '1',
          claimRef: source.claimRef,
          officeLocation: source.officeLocation,
          renderingProviderId: source.renderingProviderId,
          billingProviderId: source.billingProviderId,
          supervisingProviderId: source.supervisingProviderId,
          orderingProviderId: source.orderingProviderId,
          referringProviderId: source.referringProviderId,
          facilityId: source.facilityId,
          primaryPayerId: source.primaryPayerId,
          secondaryPayerId: source.secondaryPayerId,
          tertiaryPayerId: source.tertiaryPayerId,
          payerName: source.payerName,
          memberId: source.memberId,
          groupNumber: source.groupNumber,
          billingProviderNpi: source.billingProviderNpi,
          renderingProviderNpi: source.renderingProviderNpi,
          placeOfService: source.placeOfService,
          billedAmount: source.billedAmount,
          totalCharge: source.totalCharge,
          patientBalance: source.totalCharge,
          notes: source.notes,
          submissionStatus: 'not_submitted',
          sourceClaimId: source.id,
          createdBy: user?.id || null,
          updatedBy: user?.id || null,
          savedAt: new Date(),
        },
      });

      if (source.diagnoses.length) {
        await tx.claimDiagnosis.createMany({
          data: source.diagnoses.map((dx) => ({
            claimId: copy.id,
            pointer: dx.pointer,
            sortOrder: dx.sortOrder,
            diagnosisCodeId: dx.diagnosisCodeId,
            code: dx.code,
            description: dx.description,
          })),
        });
      }
      if (source.insurances.length) {
        await tx.claimInsurance.createMany({
          data: source.insurances.map((ins) => ({
            claimId: copy.id,
            tier: ins.tier,
            payerId: ins.payerId,
            memberId: ins.memberId,
            groupNumber: ins.groupNumber,
            policyType: ins.policyType,
            subscriberFirstName: ins.subscriberFirstName,
            subscriberLastName: ins.subscriberLastName,
            subscriberName: ins.subscriberName,
            subscriberDob: ins.subscriberDob,
            subscriberRelationship: ins.subscriberRelationship,
            copayDue: ins.copayDue,
            authorizationNumber: ins.authorizationNumber,
            referralType: ins.referralType,
            claimControlRef: ins.claimControlRef,
          })),
        });
      }
      for (const line of source.lines) {
        await tx.claimLine.create({
          data: {
            claimId: copy.id,
            lineNumber: line.lineNumber,
            serviceDate: line.serviceDate,
            serviceToDate: line.serviceToDate,
            cptCode: line.cptCode,
            hcpcsCode: line.hcpcsCode,
            modifiers: line.modifiers,
            modifier1: line.modifier1,
            modifier2: line.modifier2,
            modifier3: line.modifier3,
            modifier4: line.modifier4,
            diagnosisPointers: line.diagnosisPointers,
            units: line.units,
            unitCharge: line.unitCharge,
            chargeAmount: line.chargeAmount,
            placeOfService: line.placeOfService,
            typeOfService: line.typeOfService,
            inventoryCode: line.inventoryCode,
            chiropractic: line.chiropractic,
            chargeStatus: line.chargeStatus,
            description: line.description,
          },
        });
      }
      if (source.additionalInfo) {
        const { id: _id, claimId: _claimId, createdAt: _c, updatedAt: _u, ...rest } = source.additionalInfo;
        await tx.claimAdditionalInfo.create({ data: { claimId: copy.id, ...rest } });
      }
      if (source.ambulanceInfo) {
        const { id: _id, claimId: _claimId, createdAt: _c, updatedAt: _u, ...rest } = source.ambulanceInfo;
        await tx.claimAmbulanceInfo.create({ data: { claimId: copy.id, ...rest } });
      }
      await addEvent(tx, copy.id, 'copied', null, 'draft', `Copied from ${source.claimNumber}`, {
        sourceClaimId: source.id,
        sourceClaimNumber: source.claimNumber,
      }, user);
      await addEvent(tx, source.id, 'copied_from', source.claimStatus, source.claimStatus, `Copied to ${claimNumber}`, {
        newClaimId: copy.id,
        newClaimNumber: claimNumber,
      }, user);
      return copy.id;
    });
    return this.getById(createdId);
  },

  async split(id, { chargeIds = [] } = {}, user) {
    if (!chargeIds.length) throw badRequest('Select at least one charge line to split', {
      chargeIds: 'Select at least one charge line to split',
    });

    const source = await prisma.patientClaim.findFirst({
      where: { id, deletedAt: null },
      include: {
        lines: { orderBy: { lineNumber: 'asc' } },
        diagnoses: { orderBy: { sortOrder: 'asc' } },
        insurances: true,
        additionalInfo: true,
        ambulanceInfo: true,
      },
    });
    if (!source) throw notFound();

    const moveSet = new Set(chargeIds);
    const moving = source.lines.filter((l) => moveSet.has(l.id));
    const remaining = source.lines.filter((l) => !moveSet.has(l.id));
    if (!moving.length) throw badRequest('None of the selected charge lines belong to this claim', {
      chargeIds: 'None of the selected charge lines belong to this claim',
    });
    if (!remaining.length) throw badRequest('A split must leave at least one charge on the original claim', {
      chargeIds: 'A split must leave at least one charge on the original claim',
    });

    const createdId = await prisma.$transaction(async (tx) => {
      const claimNumber = await nextClaimNumber(tx);
      const movedTotal = money(moving.reduce((s, l) => s + Number(l.chargeAmount || 0), 0));
      const remainTotal = money(remaining.reduce((s, l) => s + Number(l.chargeAmount || 0), 0));

      const copy = await tx.patientClaim.create({
        data: {
          patientId: source.patientId,
          appointmentId: source.appointmentId,
          claimNumber,
          claimStatus: 'draft',
          claimType: 'original',
          formType: source.formType || 'CMS-1500',
          frequencyCode: source.frequencyCode || '1',
          claimRef: source.claimRef,
          officeLocation: source.officeLocation,
          renderingProviderId: source.renderingProviderId,
          billingProviderId: source.billingProviderId,
          supervisingProviderId: source.supervisingProviderId,
          orderingProviderId: source.orderingProviderId,
          referringProviderId: source.referringProviderId,
          facilityId: source.facilityId,
          primaryPayerId: source.primaryPayerId,
          secondaryPayerId: source.secondaryPayerId,
          tertiaryPayerId: source.tertiaryPayerId,
          payerName: source.payerName,
          memberId: source.memberId,
          groupNumber: source.groupNumber,
          billingProviderNpi: source.billingProviderNpi,
          renderingProviderNpi: source.renderingProviderNpi,
          placeOfService: source.placeOfService,
          billedAmount: movedTotal,
          totalCharge: movedTotal,
          patientBalance: movedTotal,
          notes: source.notes,
          submissionStatus: 'not_submitted',
          splitFromClaimId: source.id,
          createdBy: user?.id || null,
          updatedBy: user?.id || null,
          savedAt: new Date(),
        },
      });

      if (source.diagnoses.length) {
        await tx.claimDiagnosis.createMany({
          data: source.diagnoses.map((dx) => ({
            claimId: copy.id,
            pointer: dx.pointer,
            sortOrder: dx.sortOrder,
            diagnosisCodeId: dx.diagnosisCodeId,
            code: dx.code,
            description: dx.description,
          })),
        });
      }
      if (source.insurances.length) {
        await tx.claimInsurance.createMany({
          data: source.insurances.map((ins) => ({
            claimId: copy.id,
            tier: ins.tier,
            payerId: ins.payerId,
            memberId: ins.memberId,
            groupNumber: ins.groupNumber,
            policyType: ins.policyType,
            subscriberFirstName: ins.subscriberFirstName,
            subscriberLastName: ins.subscriberLastName,
            subscriberName: ins.subscriberName,
            subscriberDob: ins.subscriberDob,
            subscriberRelationship: ins.subscriberRelationship,
            copayDue: ins.copayDue,
            authorizationNumber: ins.authorizationNumber,
            referralType: ins.referralType,
            claimControlRef: ins.claimControlRef,
          })),
        });
      }
      if (source.additionalInfo) {
        const { id: _id, claimId: _claimId, createdAt: _c, updatedAt: _u, ...rest } = source.additionalInfo;
        await tx.claimAdditionalInfo.create({ data: { claimId: copy.id, ...rest } });
      }
      if (source.ambulanceInfo) {
        const { id: _id, claimId: _claimId, createdAt: _c, updatedAt: _u, ...rest } = source.ambulanceInfo;
        await tx.claimAmbulanceInfo.create({ data: { claimId: copy.id, ...rest } });
      }

      for (const [idx, line] of moving.entries()) {
        await tx.claimLine.update({
          where: { id: line.id },
          data: { claimId: copy.id, lineNumber: idx + 1 },
        });
        await tx.claimChargeHistory.create({
          data: {
            claimId: copy.id,
            claimChargeId: line.id,
            action: 'split_in',
            fieldName: 'claimId',
            oldValue: source.id,
            newValue: copy.id,
            changedBy: user?.id || user?.email || null,
          },
        });
        await tx.claimChargeHistory.create({
          data: {
            claimId: source.id,
            claimChargeId: line.id,
            action: 'split_out',
            fieldName: 'claimId',
            oldValue: source.id,
            newValue: copy.id,
            changedBy: user?.id || user?.email || null,
          },
        });
      }

      for (const [idx, line] of remaining.entries()) {
        await tx.claimLine.update({
          where: { id: line.id },
          data: { lineNumber: idx + 1 },
        });
      }

      await tx.patientClaim.update({
        where: { id: source.id },
        data: {
          billedAmount: remainTotal,
          totalCharge: remainTotal,
          patientBalance: remainTotal,
          updatedBy: user?.id || null,
        },
      });

      await addEvent(tx, copy.id, 'split', null, 'draft', `Split from ${source.claimNumber}`, {
        sourceClaimId: source.id,
        movedChargeIds: moving.map((l) => l.id),
      }, user);
      await addEvent(tx, source.id, 'split_from', source.claimStatus, source.claimStatus, `Split into ${claimNumber}`, {
        newClaimId: copy.id,
        movedChargeIds: moving.map((l) => l.id),
      }, user);
      return copy.id;
    });

    const [original, created] = await Promise.all([this.getById(id), this.getById(createdId)]);
    return { original, created };
  },

  async chargeHistory(id) {
    const claim = await prisma.patientClaim.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!claim) throw notFound();
    const rows = await prisma.claimChargeHistory.findMany({
      where: { claimId: id },
      include: {
        charge: { select: { id: true, lineNumber: true, cptCode: true, hcpcsCode: true } },
      },
      orderBy: { changedAt: 'desc' },
    });
    return rows.map((row) => ({
      id: row.id,
      claimId: row.claimId,
      claimChargeId: row.claimChargeId,
      chargeLine: row.charge
        ? `Line ${row.charge.lineNumber} ${row.charge.cptCode || row.charge.hcpcsCode || ''}`.trim()
        : 'Charge line',
      action: row.action,
      fieldName: row.fieldName,
      oldValue: row.oldValue,
      newValue: row.newValue,
      reason: row.reason,
      changedBy: row.changedBy,
      changedAt: row.changedAt,
    }));
  },

  async electronicPreview(id) {
    const claim = await this.getById(id);
    const primary = (claim.insurances || []).find((i) => i.tier === 'primary') || {};
    return {
      format: 'X12-837P',
      claimNumber: claim.claimNumber,
      claimInformation: {
        claimId: claim.id,
        claimNumber: claim.claimNumber,
        claimStatus: claim.claimStatus,
        frequencyCode: claim.frequencyCode,
        totalCharge: claim.totalCharge,
        dateOfService: claim.dateOfService,
      },
      subscriberInformation: {
        subscriberName: primary.subscriberName || formatPatientName(claim.patient),
        subscriberDob: primary.subscriberDob || toDateOnly(claim.patient?.dateOfBirth),
        relationship: primary.subscriberRelationship || 'self',
        memberId: primary.memberId || claim.patient?.mrn,
        groupNumber: primary.groupNumber,
      },
      payerInformation: {
        primary: claim.primaryPayer,
        secondary: claim.secondaryPayer,
        tertiary: claim.tertiaryPayer,
      },
      providerInformation: {
        rendering: claim.renderingProvider,
        billing: claim.billingProvider,
        supervising: claim.supervisingProvider,
        ordering: claim.orderingProvider,
        referring: claim.referringProvider,
        facility: claim.facility,
      },
      diagnosis: claim.diagnoses,
      serviceLines: claim.charges,
      charges: {
        totalCharge: claim.totalCharge,
        patientBalance: claim.patientBalance,
      },
    };
  },

  async printData(id) {
    return this.getById(id);
  },
};

module.exports = cms1500ClaimService;
module.exports.nextClaimNumber = nextClaimNumber;
