const prisma = require('../lib/prisma');
const patientService = require('./patient.service');
const patientSummaryService = require('./patientSummary.service');
const patientLedgerService = require('./patientLedger.service');
const eligibilityService = require('./eligibility/eligibility.service');

function httpError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function toNumber(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function daysSince(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

function buildAlerts({ patient, ledger, eligibilityLatest, documents, consents, visits }) {
  const alerts = [];
  const billingType = String(patient.billingType || '').replace('_', '-');

  if (patient.chartStatus === 'deceased') {
    alerts.push({ severity: 'warning', code: 'deceased', message: 'Patient is marked deceased.' });
  } else if (patient.chartStatus === 'inactive') {
    alerts.push({ severity: 'warning', code: 'inactive', message: 'Patient chart is inactive.' });
  }

  if ((ledger?.balance || 0) > 0) {
    alerts.push({
      severity: 'warning',
      code: 'balance_due',
      message: `Account balance due: $${Number(ledger.balance).toFixed(2)}`,
    });
  }

  if (billingType === 'insurance' || billingType === 'Insurance') {
    const hasPrimary = (patient.insuranceList || []).some(
      (row) => (row.insuranceTypeKey || row.insuranceType) === 'primary',
    );
    if (!hasPrimary && !patient.insuranceProviderId) {
      alerts.push({ severity: 'error', code: 'missing_coverage', message: 'No primary insurance on file.' });
    }
    if (!eligibilityLatest) {
      alerts.push({ severity: 'warning', code: 'eligibility_missing', message: 'Eligibility has not been verified.' });
    } else {
      const age = daysSince(eligibilityLatest.verifiedAt);
      if (age != null && age > 14) {
        alerts.push({
          severity: 'warning',
          code: 'eligibility_stale',
          message: `Last eligibility check was ${age} days ago.`,
        });
      }
      if (['Failed', 'Inactive', 'Terminated'].includes(eligibilityLatest.status || eligibilityLatest.coverageStatus)) {
        alerts.push({
          severity: 'error',
          code: 'eligibility_inactive',
          message: `Eligibility is ${eligibilityLatest.coverageStatus || eligibilityLatest.status}.`,
        });
      }
    }
  }

  const docs = documents || [];
  const hasPhotoId = docs.some((d) =>
    /identity|photo id|photo-id/i.test(`${d.documentType || ''} ${d.documentCategory || ''} ${d.documentName || ''}`),
  );
  const hasInsCard = docs.some((d) => /insurance/i.test(`${d.documentType || ''} ${d.documentCategory || ''}`));
  if (!hasPhotoId) {
    alerts.push({ severity: 'info', code: 'missing_photo_id', message: 'Photo ID is not on file.' });
  }
  if ((billingType === 'insurance' || billingType === 'Insurance') && !hasInsCard) {
    alerts.push({ severity: 'info', code: 'missing_insurance_card', message: 'Insurance card image is not on file.' });
  }

  if (!patient.consentFormSigned && !(consents || []).length) {
    alerts.push({ severity: 'warning', code: 'consents_unsigned', message: 'No signed consent forms on file.' });
  }

  if (!visits?.upcoming && !visits?.nextAppointment) {
    const upcoming = (visits?.appointments || []).find((a) =>
      ['Scheduled', 'Rescheduled', 'Confirmed'].includes(a.status),
    );
    if (!upcoming) {
      alerts.push({ severity: 'info', code: 'no_upcoming_visit', message: 'No upcoming appointment scheduled.' });
    }
  }

  return alerts;
}

async function generateStatementNumber() {
  const prefix = `STMT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  for (let i = 0; i < 6; i += 1) {
    const suffix = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    const statementNumber = `${prefix}-${suffix}`;
    const existing = await prisma.patientStatement.findUnique({ where: { statementNumber } });
    if (!existing) return statementNumber;
  }
  return `STMT-${Date.now()}`;
}

async function generateClaimNumber() {
  const prefix = `CLM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  return `${prefix}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
}

const patientChartService = {
  async getChart(patientId) {
    const patient = await patientService.findById(patientId);
    if (!patient) throw httpError('Patient not found', 404);

    const [summary, ledger, eligibilityHistory, statements, claims, appointments, consentForms, aging, guarantor] =
      await Promise.all([
        patientSummaryService.getSummary(patientId).catch(() => null),
        patientLedgerService.getPatientLedger(patientId),
        eligibilityService.listForPatient(patientId),
        prisma.patientStatement.findMany({
          where: { patientId },
          orderBy: { generatedAt: 'desc' },
          take: 25,
        }),
        prisma.patientClaim.findMany({
          where: { patientId },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
        prisma.appointment.findMany({
          where: { patientId },
          orderBy: [{ appointmentDate: 'desc' }, { appointmentTime: 'desc' }],
          take: 75,
          include: {
            appointmentTypeRef: { select: { name: true } },
            providerRef: { select: { firstName: true, middleName: true, lastName: true } },
            departmentRef: { select: { departmentName: true, facilityName: true } },
          },
        }),
        prisma.consentForm.findMany({
          where: { deletedAt: null, status: 'active' },
          select: { id: true, consentTitle: true, consentType: true, isMandatory: true },
        }),
        patientLedgerService.getAging(patientId),
        patient.guarantorId
          ? prisma.guarantor.findUnique({ where: { id: patient.guarantorId } })
          : Promise.resolve(null),
      ]);

    const visits = appointments.map((row) => ({
      id: row.id,
      encounterNumber: row.encounterNumber,
      appointmentDate: row.appointmentDate,
      appointmentTime: row.appointmentTime,
      appointmentEndTime: row.appointmentEndTime,
      visitType: row.appointmentTypeRef?.name || null,
      providerName: [row.providerRef?.firstName, row.providerRef?.middleName, row.providerRef?.lastName]
        .filter(Boolean)
        .join(' ') || row.provider || null,
      department: row.departmentRef?.departmentName || row.department || null,
      location: row.departmentRef?.facilityName || row.department || null,
      status: row.status,
      rcmStatus: row.rcmStatus,
      visitReason: row.visitReason || row.chiefComplaint || null,
      cancellationFeeAmount: row.cancellationFeeAmount,
      noShowFeeAmount: row.noShowFeeAmount,
    }));

    const consents = (patient.consentSignatures || []).map((sig) => {
      const form = consentForms.find((f) => f.id === sig.consentFormId);
      return {
        ...sig,
        title: form?.consentTitle || sig.consentFormId,
        consentType: form?.consentType || null,
        isMandatory: form?.isMandatory || false,
      };
    });

    const missingConsents = consentForms
      .filter((form) => form.isMandatory && !(patient.consentSignatures || []).some((s) => s.consentFormId === form.id))
      .map((form) => ({ id: form.id, title: form.consentTitle, consentType: form.consentType }));

    const eligibilityLatest = eligibilityHistory[0] || null;
    const alerts = buildAlerts({
      patient,
      ledger,
      eligibilityLatest,
      documents: patient.documents,
      consents,
      visits: { appointments: visits, upcoming: summary?.upcomingVisit },
    });

    const visitTotals = {
      total: visits.length,
      completed: visits.filter((v) => v.status === 'Completed').length,
      cancelled: visits.filter((v) => v.status === 'Cancelled').length,
      noShow: visits.filter((v) => v.status === 'No-Show').length,
      upcoming: visits.filter((v) => ['Scheduled', 'Rescheduled', 'Confirmed', 'Checked-In'].includes(v.status)).length,
    };

    return {
      patient,
      summary,
      ledger,
      aging,
      guarantor: guarantor || null,
      visits: {
        totals: visitTotals,
        lastVisit: summary?.lastVisit || null,
        upcomingVisit: summary?.upcomingVisit || null,
        appointments: visits,
      },
      eligibility: {
        latest: eligibilityLatest,
        history: eligibilityHistory,
      },
      coverage: patient.insuranceList || [],
      documents: patient.documents || [],
      consents,
      missingConsents,
      claims,
      statements,
      alerts,
    };
  },

  async updateChartStatus(patientId, data, userId) {
    const existing = await patientService.findById(patientId);
    if (!existing) throw httpError('Patient not found', 404);

    const chartStatus = String(data.chartStatus || '').toLowerCase();
    if (!['active', 'inactive', 'deceased'].includes(chartStatus)) {
      throw httpError('Chart status must be active, inactive, or deceased');
    }

    const payload = {
      chartStatus,
      updatedBy: userId || null,
      financialClass: data.financialClass !== undefined ? data.financialClass || null : undefined,
    };
    if (chartStatus === 'deceased') {
      payload.deceasedAt = data.deceasedAt ? new Date(data.deceasedAt) : existing.deceasedAt || new Date();
    } else {
      payload.deceasedAt = null;
    }

    await prisma.patient.update({ where: { id: patientId }, data: payload });
    return this.getChart(patientId);
  },

  async generateStatement(patientId, data = {}, user) {
    const existing = await patientService.findById(patientId);
    if (!existing) throw httpError('Patient not found', 404);

    const ledger = await patientLedgerService.getPatientLedger(patientId);
    const statementNumber = await generateStatementNumber();
    const row = await prisma.patientStatement.create({
      data: {
        patientId,
        statementNumber,
        periodFrom: data.periodFrom ? new Date(data.periodFrom) : null,
        periodTo: data.periodTo ? new Date(data.periodTo) : new Date(),
        balance: ledger.balance || 0,
        status: 'generated',
        notes: data.notes || null,
        snapshot: {
          balance: ledger.balance,
          entryCount: ledger.entries?.length || 0,
          entries: (ledger.entries || []).slice(-50),
        },
        generatedBy: user?.id || null,
      },
    });

    await prisma.patient.update({
      where: { id: patientId },
      data: { lastStatementAt: row.generatedAt, updatedBy: user?.id || null },
    });

    return row;
  },

  async markStatement(patientId, statementId, action, user) {
    const row = await prisma.patientStatement.findFirst({
      where: { id: statementId, patientId },
      include: { patient: true },
    });
    if (!row) throw httpError('Statement not found', 404);

    const data = { updatedAt: new Date() };
    if (action === 'printed') {
      data.status = 'printed';
      data.printedAt = new Date();
      data.deliveryChannel = 'print';
    } else if (action === 'sent') {
      data.status = 'sent';
      data.sentAt = new Date();
      data.deliveryChannel = row.patient?.email ? 'email' : 'mail';
      try {
        const notificationService = require('./notification.service');
        if (row.patient?.email) {
          await notificationService.enqueue({
            eventKey: 'patient.statement',
            channel: 'email',
            recipient: row.patient.email,
            patientId,
            variables: {
              statementNumber: row.statementNumber,
              balance: String(row.balance),
              patientName: `${row.patient.firstName || ''} ${row.patient.lastName || ''}`.trim(),
            },
          });
        }
      } catch (error) {
        data.deliveryError = error.message;
      }
    } else {
      throw httpError('Action must be printed or sent');
    }

    return prisma.patientStatement.update({
      where: { id: statementId },
      data: { ...data, generatedBy: row.generatedBy || user?.id || null },
    });
  },

  async createClaim(patientId, data = {}, user) {
    const existing = await patientService.findById(patientId);
    if (!existing) throw httpError('Patient not found', 404);

    let appointment = null;
    if (data.appointmentId) {
      appointment = await prisma.appointment.findFirst({
        where: { id: data.appointmentId, patientId },
      });
      if (!appointment) throw httpError('Appointment not found for this patient', 404);
    }

    const primary = (existing.insuranceList || []).find(
      (row) => (row.insuranceTypeKey || row.insuranceType) === 'primary',
    );

    const row = await prisma.patientClaim.create({
      data: {
        patientId,
        appointmentId: appointment?.id || null,
        claimNumber: data.claimNumber || (await generateClaimNumber()),
        claimStatus: data.claimStatus || 'draft',
        claimType: data.claimType || 'original',
        payerName: data.payerName || primary?.payerName || null,
        memberId: data.memberId || primary?.memberId || primary?.policyNumber || null,
        billedAmount: toNumber(data.billedAmount),
        paidAmount: toNumber(data.paidAmount) || 0,
        patientResponsibility: toNumber(data.patientResponsibility),
        denialReason: data.denialReason || null,
        notes: data.notes || null,
        createdBy: user?.id || null,
      },
    });
    return row;
  },

  async updateClaim(patientId, claimId, data = {}) {
    const existing = await prisma.patientClaim.findFirst({
      where: { id: claimId, patientId },
    });
    if (!existing) throw httpError('Claim not found', 404);

    const payload = {};
    ['claimStatus', 'claimType', 'payerName', 'memberId', 'denialReason', 'notes'].forEach((key) => {
      if (data[key] !== undefined) payload[key] = data[key];
    });
    if (data.billedAmount !== undefined) payload.billedAmount = toNumber(data.billedAmount);
    if (data.paidAmount !== undefined) payload.paidAmount = toNumber(data.paidAmount);
    if (data.patientResponsibility !== undefined) {
      payload.patientResponsibility = toNumber(data.patientResponsibility);
    }
    if (data.claimStatus === 'submitted' && !existing.submittedAt) payload.submittedAt = new Date();
    if (data.claimStatus === 'paid') payload.paidAt = new Date();

    const updated = await prisma.patientClaim.update({ where: { id: claimId }, data: payload });

    // When marking paid with an amount, post insurance payment to ledger (ERA stub path)
    if (data.claimStatus === 'paid' && data.paidAmount != null && Number(data.paidAmount) > 0) {
      await patientLedgerService.postEraPayment(
        patientId,
        {
          amount: data.paidAmount,
          claimId,
          appointmentId: existing.appointmentId,
          payerName: updated.payerName,
          claimStatus: 'paid',
          autoAllocate: true,
          adjustmentAmount: data.adjustmentAmount,
          adjustmentType: data.adjustmentType || 'adjustment',
        },
        { id: data.updatedBy || null },
      );
    }

    return updated;
  },
};

module.exports = patientChartService;
