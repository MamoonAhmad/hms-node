const crypto = require('crypto');
const prisma = require('../lib/prisma');
const patientLedgerService = require('./patientLedger.service');
const { isValidCpt, isValidHcpcs, isValidIcd10, normalizeIcd10 } = require('../lib/codeCatalog');
const codeCatalogService = require('./codeCatalog.service');

function money(n) {
  return Math.round(Number(n || 0) * 100) / 100;
}

function toDateOnly(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
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

async function addEvent(claimId, eventType, fromStatus, toStatus, summary, details, user) {
  return prisma.claimEvent.create({
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

function scrubClaim(claim, lines, patient, appointment) {
  const issues = [];
  if (!claim.payerName || claim.payerName === 'Self-Pay') {
    issues.push({ severity: 'warning', code: 'PAYER', message: 'Self-pay or missing payer — claim may be patient bill only' });
  }
  if (!claim.memberId && claim.payerName && claim.payerName !== 'Self-Pay') {
    issues.push({ severity: 'error', code: 'MEMBER', message: 'Member ID required for insured claims' });
  }
  if (!(lines || []).length) {
    issues.push({ severity: 'error', code: 'LINES', message: 'At least one service line is required' });
  }
  (lines || []).forEach((line, idx) => {
    if (!line.cptCode && !line.hcpcsCode) {
      issues.push({ severity: 'error', code: 'CPT', message: `Line ${idx + 1}: CPT/HCPCS code required` });
    }
    if (line.cptCode && !isValidCpt(line.cptCode) && !isValidHcpcs(line.cptCode)) {
      issues.push({
        severity: 'error',
        code: 'CPT_FORMAT',
        message: `Line ${idx + 1}: CPT/HCPCS ${line.cptCode} has an invalid format`,
      });
    }
    if (line.hcpcsCode && !isValidHcpcs(line.hcpcsCode) && !isValidCpt(line.hcpcsCode)) {
      issues.push({
        severity: 'error',
        code: 'HCPCS_FORMAT',
        message: `Line ${idx + 1}: HCPCS ${line.hcpcsCode} has an invalid format`,
      });
    }
    if (Number(line.chargeAmount) <= 0) {
      issues.push({ severity: 'error', code: 'CHARGE', message: `Line ${idx + 1}: charge must be greater than zero` });
    }
    if (!line.diagnosisPointers) {
      issues.push({ severity: 'warning', code: 'DXPTR', message: `Line ${idx + 1}: diagnosis pointer missing` });
    }
  });
  (claim.diagnosesSnapshot || []).forEach((dx, idx) => {
    const code = normalizeIcd10(dx.code || dx);
    if (code && !isValidIcd10(code)) {
      issues.push({
        severity: 'error',
        code: 'ICD_FORMAT',
        message: `Diagnosis ${idx + 1}: ${code} is not a valid ICD-10-CM code`,
      });
    }
  });
  if (!patient?.dateOfBirth) {
    issues.push({ severity: 'error', code: 'DOB', message: 'Patient date of birth required' });
  }
  if (!appointment?.appointmentDate && !lines?.[0]?.serviceDate) {
    issues.push({ severity: 'error', code: 'DOS', message: 'Date of service required' });
  }
  if (!claim.renderingProviderNpi && !appointment?.providerRef?.npi) {
    issues.push({ severity: 'warning', code: 'NPI', message: 'Rendering provider NPI missing' });
  }

  const hasError = issues.some((i) => i.severity === 'error');
  return {
    scrubStatus: hasError ? 'failed' : issues.length ? 'passed_with_warnings' : 'passed',
    scrubIssues: issues,
  };
}

async function scrubClaimWithCatalog(claim, lines, patient, appointment, diagnoses = []) {
  const result = scrubClaim(claim, lines, patient, appointment);
  const extra = [];
  const dxList = diagnoses.length
    ? diagnoses
    : claim.formPayload?.diagnoses || [];

  for (const [idx, dx] of dxList.entries()) {
    const resolved = await codeCatalogService.resolveDiagnosis(dx.code || dx);
    extra.push(
      ...resolved.issues.map((issue) => ({
        ...issue,
        message: `Diagnosis ${idx + 1}: ${issue.message}`,
      })),
    );
  }

  for (const [idx, line] of (lines || []).entries()) {
    const resolved = await codeCatalogService.resolveProcedureCode(line.cptCode || line.hcpcsCode);
    extra.push(
      ...resolved.issues.map((issue) => ({
        ...issue,
        message: `Line ${idx + 1}: ${issue.message}`,
      })),
    );
  }

  const issues = [...result.scrubIssues, ...extra];
  const hasError = issues.some((i) => i.severity === 'error');
  return {
    scrubStatus: hasError ? 'failed' : issues.length ? 'passed_with_warnings' : 'passed',
    scrubIssues: issues,
  };
}

function buildFormPayload(claim, lines, patient, appointment, diagnoses = []) {
  return {
    formType: claim.formType || 'CMS-1500',
    claimNumber: claim.claimNumber,
    patient: {
      mrn: patient?.mrn,
      name: formatPatientName(patient),
      dob: toDateOnly(patient?.dateOfBirth),
      gender: patient?.gender,
      address: [patient?.address, patient?.city, patient?.state, patient?.zip].filter(Boolean).join(', '),
    },
    insurance: {
      payerName: claim.payerName,
      memberId: claim.memberId,
      groupNumber: claim.groupNumber,
    },
    provider: {
      renderingNpi: claim.renderingProviderNpi || appointment?.providerRef?.npi || null,
      billingNpi: claim.billingProviderNpi || appointment?.providerRef?.npi || null,
      name: formatProviderName(appointment?.providerRef) || appointment?.provider || null,
    },
    service: {
      dateOfService: toDateOnly(appointment?.appointmentDate),
      placeOfService: claim.placeOfService || '11',
      frequencyCode: claim.frequencyCode || '1',
    },
    diagnoses,
    lines: (lines || []).map((l) => ({
      lineNumber: l.lineNumber,
      cptCode: l.cptCode,
      hcpcsCode: l.hcpcsCode,
      modifiers: l.modifiers,
      units: Number(l.units),
      unitCharge: Number(l.unitCharge),
      chargeAmount: Number(l.chargeAmount),
      diagnosisPointers: l.diagnosisPointers,
      placeOfService: l.placeOfService,
      revenueCode: l.revenueCode,
      description: l.description,
      serviceDate: toDateOnly(l.serviceDate),
    })),
    totals: {
      billedAmount: Number(claim.billedAmount || 0),
    },
  };
}

function serializeClaimListRow(claim) {
  const patient = claim.patient;
  const appointment = claim.appointment;
  const billed = Number(claim.billedAmount || 0);
  const paid = Number(claim.paidAmount || 0);
  const adj = Number(claim.adjustmentAmount || 0);
  const balance = money(billed - paid - Math.abs(adj));
  return {
    id: claim.id,
    claimId: claim.claimNumber,
    claimNumber: claim.claimNumber,
    tcn: claim.tcn,
    patientId: claim.patientId,
    patientName: formatPatientName(patient),
    patientMrn: patient?.mrn || null,
    dateOfService: toDateOnly(appointment?.appointmentDate) || toDateOnly(claim.createdAt),
    dos: toDateOnly(appointment?.appointmentDate) || toDateOnly(claim.createdAt),
    payer: claim.payerName || '',
    payerId: claim.memberId || '',
    status: claim.claimStatus,
    claimType: claim.claimType,
    formType: claim.formType,
    totalCharge: billed,
    claimAmount: billed,
    billedAmount: billed,
    amountPaid: paid,
    balanceDue: balance < 0 ? 0 : balance,
    submittedDate: toDateOnly(claim.submittedAt),
    statusDate: toDateOnly(claim.updatedAt),
    renderingProvider: formatProviderName(appointment?.providerRef) || appointment?.provider || null,
    provider: formatProviderName(appointment?.providerRef) || appointment?.provider || null,
    placeOfService: claim.placeOfService || '11',
    rejectionReason: claim.denialReason || null,
    clearinghouseStatus: claim.clearinghouseStatus,
    scrubStatus: claim.scrubStatus,
    currentClaimStatus: String(claim.claimStatus || '').toUpperCase(),
    taskAssign: claim.followUpTasks?.[0]?.assignee || '',
    taskDueDate: toDateOnly(claim.followUpTasks?.[0]?.dueDate) || '',
    taskStatus: claim.followUpTasks?.[0]?.status || '',
    tcnWithPrefix: claim.tcn || claim.claimNumber,
    submitter: 'Office',
  };
}

const claimEngineService = {
  async list(query = {}) {
    const where = { deletedAt: null };
    if (query.status && query.status !== 'all') where.claimStatus = query.status;
    if (query.claimType && query.claimType !== 'all') where.claimType = query.claimType;
    if (query.formType) where.formType = query.formType;
    if (query.patientId) where.patientId = query.patientId;
    if (query.payer) where.payerName = { contains: query.payer, mode: 'insensitive' };
    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { claimNumber: { contains: term, mode: 'insensitive' } },
        { tcn: { contains: term, mode: 'insensitive' } },
        { payerName: { contains: term, mode: 'insensitive' } },
        { patient: { mrn: { contains: term, mode: 'insensitive' } } },
        { patient: { lastName: { contains: term, mode: 'insensitive' } } },
        { patient: { firstName: { contains: term, mode: 'insensitive' } } },
      ];
    }
    if (query.dosFrom || query.dosTo) {
      where.appointment = { appointmentDate: {} };
      if (query.dosFrom) where.appointment.appointmentDate.gte = new Date(query.dosFrom);
      if (query.dosTo) where.appointment.appointmentDate.lte = new Date(query.dosTo);
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(query.limit) || 50));
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
          followUpTasks: {
            where: { status: { in: ['open', 'in_progress'] } },
            orderBy: { dueDate: 'asc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: rows.map(serializeClaimListRow),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    };
  },

  async getById(id) {
    const claim = await prisma.patientClaim.findUnique({
      where: { id },
      include: {
        patient: true,
        appointment: {
          include: {
            providerRef: true,
          },
        },
        lines: { orderBy: { lineNumber: 'asc' } },
        events: { orderBy: { createdAt: 'desc' }, take: 50 },
        ediTransactions: { orderBy: { createdAt: 'desc' }, take: 20 },
        denials: { include: { appeals: true }, orderBy: { createdAt: 'desc' } },
        followUpTasks: { orderBy: { createdAt: 'desc' } },
        eraLines: { include: { eraBatch: true }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!claim) {
      const err = new Error('Claim not found');
      err.statusCode = 404;
      throw err;
    }
    return {
      ...serializeClaimListRow(claim),
      groupNumber: claim.groupNumber,
      billingProviderNpi: claim.billingProviderNpi,
      renderingProviderNpi: claim.renderingProviderNpi,
      formPayload: claim.formPayload,
      scrubIssues: claim.scrubIssues,
      notes: claim.notes,
      lines: claim.lines.map((l) => ({
        ...l,
        units: Number(l.units),
        unitCharge: Number(l.unitCharge),
        chargeAmount: Number(l.chargeAmount),
        allowedAmount: l.allowedAmount != null ? Number(l.allowedAmount) : null,
        paidAmount: l.paidAmount != null ? Number(l.paidAmount) : null,
        serviceDate: toDateOnly(l.serviceDate),
      })),
      events: claim.events,
      ediTransactions: claim.ediTransactions,
      denials: claim.denials,
      followUpTasks: claim.followUpTasks,
      eraLines: claim.eraLines,
      patient: claim.patient,
      appointment: claim.appointment,
    };
  },

  async nextClaimNumber() {
    return require('./cms1500Claim.service').nextClaimNumber();
  },

  /**
   * Build or refresh a durable claim from encounter billing overlay data.
   */
  async buildFromEncounter({
    appointmentId,
    patientId,
    formType = 'CMS-1500',
    diagnoses = [],
    charges = [],
    meta = {},
    existingClaimId = null,
    user = null,
  }) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          include: {
            insurances: {
              where: { isActive: true },
              include: { insuranceProvider: true },
              orderBy: [{ cobOrder: 'asc' }, { insuranceType: 'asc' }],
            },
          },
        },
        providerRef: true,
      },
    });
    if (!appointment) {
      const err = new Error('Appointment/encounter not found');
      err.statusCode = 404;
      throw err;
    }

    const patient = appointment.patient;
    const primary = (patient.insurances || []).find((i) => i.insuranceType === 'Primary')
      || patient.insurances?.[0]
      || null;
    const payerName = meta.payerName
      || primary?.insuranceProvider?.name
      || (patient.billingType === 'Self-Pay' ? 'Self-Pay' : 'Unknown payer');

    const lineInputs = (charges || []).map((c, idx) => {
      const units = Number(c.units) || 1;
      const unitCharge = Number(c.unitCharge) || 0;
      return {
        lineNumber: idx + 1,
        serviceDate: appointment.appointmentDate,
        cptCode: c.cptCode || null,
        hcpcsCode: c.hcpcsCode || null,
        modifiers: c.modifiers || null,
        diagnosisPointers: c.diagnosisPointers || 'A',
        units,
        unitCharge,
        chargeAmount: money(units * unitCharge),
        placeOfService: c.placeOfService || '11',
        revenueCode: c.revenueCode || null,
        description: c.description || null,
      };
    });
    const billedAmount = money(lineInputs.reduce((s, l) => s + l.chargeAmount, 0));

    let claim;
    if (existingClaimId) {
      claim = await prisma.patientClaim.findUnique({ where: { id: existingClaimId } });
    }
    if (!claim && appointmentId) {
      claim = await prisma.patientClaim.findFirst({
        where: {
          appointmentId,
          claimStatus: { notIn: ['voided', 'cancelled'] },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    const claimData = {
      patientId: patientId || patient.id,
      appointmentId,
      claimType: 'original',
      formType: formType === 'UB-04' ? 'UB-04' : 'CMS-1500',
      payerName,
      memberId: primary?.memberId || null,
      groupNumber: primary?.groupNumber || null,
      billingProviderNpi: appointment.providerRef?.npi || null,
      renderingProviderNpi: appointment.providerRef?.npi || null,
      placeOfService: meta.placeOfService?.split(' ')?.[0] || '11',
      frequencyCode: '1',
      billedAmount,
      allowedAmount: null,
      paidAmount: claim?.paidAmount || 0,
      adjustmentAmount: claim?.adjustmentAmount || 0,
      patientResponsibility: null,
      claimStatus: claim?.claimStatus === 'submitted' || claim?.claimStatus === 'paid'
        ? claim.claimStatus
        : 'ready',
      scrubStatus: 'pending',
      scrubIssues: [],
      formPayload: null,
      updatedBy: user?.id || null,
    };

    if (claim) {
      await prisma.claimLine.deleteMany({ where: { claimId: claim.id } });
      claim = await prisma.patientClaim.update({
        where: { id: claim.id },
        data: claimData,
      });
    } else {
      claim = await prisma.patientClaim.create({
        data: {
          ...claimData,
          claimNumber: await this.nextClaimNumber(),
          createdBy: user?.id || null,
        },
      });
    }

    if (lineInputs.length) {
      await prisma.claimLine.createMany({
        data: lineInputs.map((l) => ({ ...l, claimId: claim.id })),
      });
    }

    const lines = await prisma.claimLine.findMany({
      where: { claimId: claim.id },
      orderBy: { lineNumber: 'asc' },
    });

    const payload = buildFormPayload(claim, lines, patient, appointment, diagnoses);
    claim = await prisma.patientClaim.update({
      where: { id: claim.id },
      data: { formPayload: payload },
    });

    await addEvent(
      claim.id,
      'built',
      null,
      claim.claimStatus,
      'Claim built from encounter charge capture',
      { lineCount: lines.length, billedAmount },
      user,
    );

    // Post encounter charges to patient ledger if not already present for this claim
    for (const line of lines) {
      const existing = await prisma.ledgerTransaction.findFirst({
        where: {
          patientId: claim.patientId,
          referenceType: 'claim_line',
          referenceId: line.id,
          status: 'posted',
        },
      });
      if (!existing && Number(line.chargeAmount) > 0) {
        await patientLedgerService.postTransaction({
          patientId: claim.patientId,
          appointmentId,
          transactionType: 'charge',
          amount: Number(line.chargeAmount),
          description: `${line.cptCode || line.hcpcsCode || 'Charge'} — ${line.description || 'Claim line'}`,
          referenceType: 'claim_line',
          referenceId: line.id,
          meta: { claimId: claim.id, claimNumber: claim.claimNumber },
          user,
        });
      }
    }

    return this.getById(claim.id);
  },

  async scrub(claimId, user) {
    const claim = await prisma.patientClaim.findUnique({
      where: { id: claimId },
      include: {
        lines: true,
        patient: true,
        appointment: { include: { providerRef: true } },
      },
    });
    if (!claim) {
      const err = new Error('Claim not found');
      err.statusCode = 404;
      throw err;
    }

    const result = await scrubClaimWithCatalog(
      claim,
      claim.lines,
      claim.patient,
      claim.appointment,
      claim.formPayload?.diagnoses || [],
    );
    const updated = await prisma.patientClaim.update({
      where: { id: claimId },
      data: {
        scrubStatus: result.scrubStatus,
        scrubIssues: result.scrubIssues,
        claimStatus: result.scrubStatus === 'failed' ? 'draft' : (claim.claimStatus === 'draft' ? 'ready' : claim.claimStatus),
        updatedBy: user?.id || null,
      },
    });
    await addEvent(claimId, 'scrubbed', claim.claimStatus, updated.claimStatus, `Scrub ${result.scrubStatus}`, result, user);
    return this.getById(claimId);
  },

  async submit(claimId, user, { autoAck = true } = {}) {
    let claim = await prisma.patientClaim.findUnique({
      where: { id: claimId },
      include: {
        lines: true,
        patient: true,
        appointment: { include: { providerRef: true } },
      },
    });
    if (!claim) {
      const err = new Error('Claim not found');
      err.statusCode = 404;
      throw err;
    }

    const scrub = await scrubClaimWithCatalog(
      claim,
      claim.lines,
      claim.patient,
      claim.appointment,
      claim.formPayload?.diagnoses || [],
    );
    if (scrub.scrubStatus === 'failed') {
      await prisma.patientClaim.update({
        where: { id: claimId },
        data: { scrubStatus: scrub.scrubStatus, scrubIssues: scrub.scrubIssues },
      });
      const err = new Error('Claim failed scrub — fix errors before submit');
      err.statusCode = 400;
      err.details = scrub.scrubIssues;
      throw err;
    }

    const controlNumber = `ISA${Date.now().toString().slice(-9)}`;
    const tcn = `TCN${Date.now().toString().slice(-10)}`;
    const fromStatus = claim.claimStatus;

    const ediPayload = {
      transactionSet: claim.formType === 'UB-04' ? '837I' : '837P',
      controlNumber,
      claimNumber: claim.claimNumber,
      payerName: claim.payerName,
      memberId: claim.memberId,
      billedAmount: Number(claim.billedAmount || 0),
      lines: claim.lines.map((l) => ({
        cpt: l.cptCode,
        units: Number(l.units),
        charge: Number(l.chargeAmount),
      })),
      mock: true,
    };

    const edi = await prisma.ediTransaction.create({
      data: {
        claimId,
        transactionType: claim.formType === 'UB-04' ? '837I' : '837P',
        direction: 'outbound',
        controlNumber,
        status: 'sent',
        payload: ediPayload,
        providerName: 'mock-clearinghouse',
        createdBy: user?.id || null,
        sentAt: new Date(),
      },
    });

    claim = await prisma.patientClaim.update({
      where: { id: claimId },
      data: {
        claimStatus: 'submitted',
        scrubStatus: scrub.scrubStatus,
        scrubIssues: scrub.scrubIssues,
        clearinghouseStatus: 'submitted',
        controlNumber,
        tcn,
        submittedAt: new Date(),
        formPayload: buildFormPayload(claim, claim.lines, claim.patient, claim.appointment, claim.formPayload?.diagnoses || []),
        updatedBy: user?.id || null,
      },
    });

    await addEvent(claimId, 'submitted', fromStatus, 'submitted', 'Claim submitted to mock clearinghouse (837)', { ediId: edi.id, tcn }, user);

    if (autoAck) {
      await this.acknowledge277(claimId, user, { accept: true });
    }

    return this.getById(claimId);
  },

  async acknowledge277(claimId, user, { accept = true, reason = null } = {}) {
    const claim = await prisma.patientClaim.findUnique({ where: { id: claimId } });
    if (!claim) {
      const err = new Error('Claim not found');
      err.statusCode = 404;
      throw err;
    }

    const status = accept ? 'accepted' : 'rejected';
    await prisma.ediTransaction.create({
      data: {
        claimId,
        transactionType: '277CA',
        direction: 'inbound',
        controlNumber: claim.controlNumber || `ACK${Date.now().toString().slice(-8)}`,
        status,
        responsePayload: {
          accepted: accept,
          reason: reason || (accept ? 'Claim accepted by payer gateway' : 'Claim rejected by clearinghouse'),
          mock: true,
        },
        acknowledgedAt: new Date(),
        providerName: 'mock-clearinghouse',
        createdBy: user?.id || null,
      },
    });

    const updated = await prisma.patientClaim.update({
      where: { id: claimId },
      data: {
        claimStatus: status,
        clearinghouseStatus: status,
        acceptedAt: accept ? new Date() : null,
        rejectedAt: accept ? null : new Date(),
        denialReason: accept ? claim.denialReason : (reason || 'Clearinghouse rejection'),
        updatedBy: user?.id || null,
      },
    });

    await addEvent(claimId, '277ca', claim.claimStatus, status, `277CA ${status}`, { reason }, user);
    return this.getById(updated.id);
  },

  async voidClaim(claimId, user, reason) {
    const claim = await prisma.patientClaim.findUnique({ where: { id: claimId } });
    if (!claim) {
      const err = new Error('Claim not found');
      err.statusCode = 404;
      throw err;
    }
    await prisma.patientClaim.update({
      where: { id: claimId },
      data: {
        claimStatus: 'voided',
        notes: [claim.notes, reason].filter(Boolean).join('\n'),
        updatedBy: user?.id || null,
      },
    });
    await addEvent(claimId, 'voided', claim.claimStatus, 'voided', reason || 'Claim voided', null, user);
    return this.getById(claimId);
  },

  async updateStatus(claimId, claimStatus, user, extras = {}) {
    const claim = await prisma.patientClaim.findUnique({ where: { id: claimId } });
    if (!claim) {
      const err = new Error('Claim not found');
      err.statusCode = 404;
      throw err;
    }
    const data = {
      claimStatus,
      updatedBy: user?.id || null,
      ...extras,
    };
    await prisma.patientClaim.update({ where: { id: claimId }, data });
    await addEvent(claimId, 'status_change', claim.claimStatus, claimStatus, `Status → ${claimStatus}`, extras, user);
    return this.getById(claimId);
  },

  /** Mock eligibility button action — logs 270/271, does not call a real clearinghouse. */
  async mockEligibilityCheck({ patientId, claimId = null, appointmentId = null, user = null } = {}) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        insurances: {
          where: { isActive: true },
          include: { insuranceProvider: true },
          orderBy: { cobOrder: 'asc' },
          take: 1,
        },
      },
    });
    if (!patient) {
      const err = new Error('Patient not found');
      err.statusCode = 404;
      throw err;
    }
    const primary = patient.insurances?.[0];
    const controlNumber = `ELG${Date.now().toString().slice(-8)}`;
    const eligible = patient.billingType === 'Self-Pay'
      ? false
      : Boolean(primary?.memberId);

    const request = {
      transactionSet: '270',
      controlNumber,
      patientId,
      memberId: primary?.memberId || null,
      payer: primary?.insuranceProvider?.name || null,
      mock: true,
    };
    const response = {
      transactionSet: '271',
      eligible,
      coverageStatus: eligible ? 'Active' : (patient.billingType === 'Self-Pay' ? 'Self-Pay' : 'Not Verified'),
      copay: primary?.copay != null ? Number(primary.copay) : null,
      deductible: primary?.deductible != null ? Number(primary.deductible) : null,
      mock: true,
      message: eligible
        ? 'Mock 271: coverage active (button-only eligibility — not a live clearinghouse)'
        : 'Mock 271: unable to confirm coverage',
    };

    const edi = await prisma.ediTransaction.create({
      data: {
        claimId: claimId || null,
        transactionType: '270/271',
        direction: 'outbound',
        controlNumber,
        status: eligible ? 'accepted' : 'rejected',
        payload: request,
        responsePayload: response,
        sentAt: new Date(),
        acknowledgedAt: new Date(),
        providerName: 'mock-clearinghouse',
        createdBy: user?.id || null,
      },
    });

    if (primary) {
      await prisma.insuranceEligibility.create({
        data: {
          patientId,
          appointmentId: appointmentId || null,
          patientInsuranceId: primary.id,
          insuranceProviderId: primary.insuranceProviderId || null,
          status: eligible ? 'Verified' : 'Failed',
          coverageStatus: response.coverageStatus,
          payerName: primary.insuranceProvider?.name || null,
          memberId: primary.memberId,
          groupNumber: primary.groupNumber || null,
          copay: primary.copay,
          deductible: primary.deductible,
          notes: response.message,
          verifiedAt: new Date(),
          verificationSource: 'mock-270-271',
          requestPayload: request,
          responsePayload: response,
          createdBy: user?.id || null,
        },
      }).catch(() => null);
    }

    return { edi, request, response, appointmentId };
  },
};

module.exports = claimEngineService;
module.exports.money = money;
module.exports.toDateOnly = toDateOnly;
module.exports.formatPatientName = formatPatientName;
