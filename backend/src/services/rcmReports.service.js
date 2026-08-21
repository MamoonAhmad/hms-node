const prisma = require('../lib/prisma');
const patientLedgerService = require('./patientLedger.service');
const { money, toDateOnly, formatPatientName } = require('./claimEngine.service');

function dateRange(query) {
  const days = Number(query.days) || 30;
  const to = query.dateTo ? new Date(query.dateTo) : new Date();
  const from = query.dateFrom
    ? new Date(query.dateFrom)
    : new Date(to.getTime() - days * 86400000);
  return { from, to };
}

const rcmReportsService = {
  async claimSummary(query = {}) {
    const { from, to } = dateRange(query);
    const claims = await prisma.patientClaim.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        ...(query.payer ? { payerName: { contains: query.payer, mode: 'insensitive' } } : {}),
      },
      include: {
        patient: { select: { mrn: true, firstName: true, lastName: true, middleName: true } },
        appointment: { select: { appointmentDate: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const rows = claims.map((c) => ({
      claimNumber: c.claimNumber,
      patient: formatPatientName(c.patient),
      mrn: c.patient?.mrn,
      dos: toDateOnly(c.appointment?.appointmentDate),
      payer: c.payerName,
      status: c.claimStatus,
      formType: c.formType,
      billed: Number(c.billedAmount || 0),
      paid: Number(c.paidAmount || 0),
      balance: money(Number(c.billedAmount || 0) - Number(c.paidAmount || 0) - Math.abs(Number(c.adjustmentAmount || 0))),
      submittedAt: toDateOnly(c.submittedAt),
    }));

    const summaryCards = [
      { label: 'Claims', value: String(rows.length) },
      { label: 'Billed', value: `$${money(rows.reduce((s, r) => s + r.billed, 0)).toFixed(2)}` },
      { label: 'Paid', value: `$${money(rows.reduce((s, r) => s + r.paid, 0)).toFixed(2)}` },
      { label: 'Open balance', value: `$${money(rows.reduce((s, r) => s + r.balance, 0)).toFixed(2)}` },
    ];

    return {
      columns: [
        { key: 'claimNumber', label: 'Claim #' },
        { key: 'patient', label: 'Patient' },
        { key: 'mrn', label: 'MRN' },
        { key: 'dos', label: 'DOS' },
        { key: 'payer', label: 'Payer' },
        { key: 'status', label: 'Status' },
        { key: 'billed', label: 'Billed' },
        { key: 'paid', label: 'Paid' },
        { key: 'balance', label: 'Balance' },
      ],
      rows,
      summaryCards,
      numericFooterKeys: ['billed', 'paid', 'balance'],
    };
  },

  async claimStatus(query = {}) {
    const { from, to } = dateRange(query);
    const grouped = await prisma.patientClaim.groupBy({
      by: ['claimStatus'],
      where: { updatedAt: { gte: from, lte: to } },
      _count: { _all: true },
      _sum: { billedAmount: true, paidAmount: true },
    });
    const rows = grouped.map((g) => ({
      status: g.claimStatus,
      count: g._count._all,
      billed: Number(g._sum.billedAmount || 0),
      paid: Number(g._sum.paidAmount || 0),
    }));
    return {
      columns: [
        { key: 'status', label: 'Status' },
        { key: 'count', label: 'Count' },
        { key: 'billed', label: 'Billed' },
        { key: 'paid', label: 'Paid' },
      ],
      rows,
      summaryCards: [
        { label: 'Statuses', value: String(rows.length) },
        { label: 'Claims', value: String(rows.reduce((s, r) => s + r.count, 0)) },
      ],
      numericFooterKeys: ['count', 'billed', 'paid'],
    };
  },

  async denial(query = {}) {
    const { from, to } = dateRange(query);
    const denials = await prisma.denialCase.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: {
        claim: {
          include: { patient: { select: { firstName: true, lastName: true, middleName: true, mrn: true } } },
        },
        appeals: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    const rows = denials.map((d) => ({
      claimNumber: d.claim?.claimNumber,
      patient: formatPatientName(d.claim?.patient),
      code: d.denialCode,
      reason: d.denialReason,
      status: d.status,
      deniedAmount: Number(d.deniedAmount || 0),
      appeals: d.appeals.length,
      createdAt: toDateOnly(d.createdAt),
    }));
    return {
      columns: [
        { key: 'claimNumber', label: 'Claim #' },
        { key: 'patient', label: 'Patient' },
        { key: 'code', label: 'Code' },
        { key: 'reason', label: 'Reason' },
        { key: 'status', label: 'Status' },
        { key: 'deniedAmount', label: 'Denied $' },
        { key: 'appeals', label: 'Appeals' },
        { key: 'createdAt', label: 'Opened' },
      ],
      rows,
      summaryCards: [
        { label: 'Denials', value: String(rows.length) },
        { label: 'Denied $', value: `$${money(rows.reduce((s, r) => s + r.deniedAmount, 0)).toFixed(2)}` },
      ],
      numericFooterKeys: ['deniedAmount', 'appeals'],
    };
  },

  async aging(query = {}) {
    const patients = await prisma.patient.findMany({
      where: { deletedAt: null, accountBalance: { gt: 0 } },
      select: { id: true, mrn: true, firstName: true, lastName: true, middleName: true, accountBalance: true },
      take: 200,
      orderBy: { accountBalance: 'desc' },
    });

    const rows = [];
    const totals = { current: 0, days30: 0, days60: 0, days90: 0, days120Plus: 0, total: 0 };
    for (const p of patients) {
      const aging = await patientLedgerService.getAging(p.id);
      rows.push({
        patient: formatPatientName(p),
        mrn: p.mrn,
        total: aging.total,
        current: aging.buckets.current,
        days30: aging.buckets.days30,
        days60: aging.buckets.days60,
        days90: aging.buckets.days90,
        days120Plus: aging.buckets.days120Plus,
      });
      Object.keys(totals).forEach((k) => {
        if (k === 'total') totals.total += aging.total;
        else totals[k] += aging.buckets[k] || 0;
      });
    }

    return {
      columns: [
        { key: 'patient', label: 'Patient' },
        { key: 'mrn', label: 'MRN' },
        { key: 'current', label: '0-30' },
        { key: 'days30', label: '31-60' },
        { key: 'days60', label: '61-90' },
        { key: 'days90', label: '91-120' },
        { key: 'days120Plus', label: '120+' },
        { key: 'total', label: 'Total' },
      ],
      rows,
      summaryCards: [
        { label: 'AR total', value: `$${money(totals.total).toFixed(2)}` },
        { label: 'Patients', value: String(rows.length) },
        { label: '120+', value: `$${money(totals.days120Plus).toFixed(2)}` },
      ],
      numericFooterKeys: ['current', 'days30', 'days60', 'days90', 'days120Plus', 'total'],
    };
  },

  async paymentReconciliation(query = {}) {
    const { from, to } = dateRange(query);
    const batches = await prisma.eraBatch.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { lines: true },
      orderBy: { createdAt: 'desc' },
    });
    const rows = batches.map((b) => ({
      batchNumber: b.batchNumber,
      payer: b.payerName,
      checkNumber: b.checkNumber,
      checkDate: toDateOnly(b.checkDate),
      totalPayment: Number(b.totalPayment),
      status: b.status,
      lines: b.lines.length,
      posted: b.lines.filter((l) => l.status === 'posted').length,
      unmatched: b.lines.filter((l) => l.status === 'unmatched').length,
    }));
    return {
      columns: [
        { key: 'batchNumber', label: 'Batch' },
        { key: 'payer', label: 'Payer' },
        { key: 'checkNumber', label: 'Check #' },
        { key: 'checkDate', label: 'Check date' },
        { key: 'totalPayment', label: 'Payment' },
        { key: 'status', label: 'Status' },
        { key: 'lines', label: 'Lines' },
        { key: 'posted', label: 'Posted' },
        { key: 'unmatched', label: 'Unmatched' },
      ],
      rows,
      summaryCards: [
        { label: 'Batches', value: String(rows.length) },
        { label: 'Payments', value: `$${money(rows.reduce((s, r) => s + r.totalPayment, 0)).toFixed(2)}` },
      ],
      numericFooterKeys: ['totalPayment', 'lines', 'posted', 'unmatched'],
    };
  },

  async providerPerformance(query = {}) {
    const { from, to } = dateRange(query);
    const claims = await prisma.patientClaim.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: {
        appointment: {
          include: { providerRef: { select: { firstName: true, lastName: true, npi: true } } },
        },
      },
      take: 1000,
    });
    const map = new Map();
    for (const c of claims) {
      const name = c.appointment?.providerRef
        ? `${c.appointment.providerRef.lastName}, ${c.appointment.providerRef.firstName}`
        : c.appointment?.provider || 'Unknown';
      const row = map.get(name) || { provider: name, claims: 0, billed: 0, paid: 0 };
      row.claims += 1;
      row.billed += Number(c.billedAmount || 0);
      row.paid += Number(c.paidAmount || 0);
      map.set(name, row);
    }
    const rows = [...map.values()].map((r) => ({
      ...r,
      billed: money(r.billed),
      paid: money(r.paid),
      collectionRate: r.billed ? `${((r.paid / r.billed) * 100).toFixed(1)}%` : '0%',
    }));
    return {
      columns: [
        { key: 'provider', label: 'Provider' },
        { key: 'claims', label: 'Claims' },
        { key: 'billed', label: 'Billed' },
        { key: 'paid', label: 'Paid' },
        { key: 'collectionRate', label: 'Collection %' },
      ],
      rows,
      summaryCards: [{ label: 'Providers', value: String(rows.length) }],
      numericFooterKeys: ['claims', 'billed', 'paid'],
    };
  },

  async encounterVisit(query = {}) {
    const { from, to } = dateRange(query);
    const billings = await prisma.encounterBilling.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: {
        appointment: {
          include: {
            patient: { select: { mrn: true, firstName: true, lastName: true, middleName: true } },
            providerRef: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 500,
    });
    const rows = billings.map((b) => ({
      encounter: b.appointment?.encounterNumber || b.appointmentId,
      patient: formatPatientName(b.appointment?.patient),
      mrn: b.appointment?.patient?.mrn,
      provider: b.appointment?.providerRef
        ? `${b.appointment.providerRef.lastName}, ${b.appointment.providerRef.firstName}`
        : null,
      billingStatus: b.billingStatus,
      dos: toDateOnly(b.appointment?.appointmentDate),
      charges: Array.isArray(b.charges) ? b.charges.length : 0,
      claimId: b.claimId,
    }));
    return {
      columns: [
        { key: 'encounter', label: 'Encounter' },
        { key: 'patient', label: 'Patient' },
        { key: 'mrn', label: 'MRN' },
        { key: 'provider', label: 'Provider' },
        { key: 'dos', label: 'DOS' },
        { key: 'billingStatus', label: 'Billing status' },
        { key: 'charges', label: 'Charge lines' },
      ],
      rows,
      summaryCards: [{ label: 'Encounters', value: String(rows.length) }],
      numericFooterKeys: ['charges'],
    };
  },

  async topProcedure(query = {}) {
    const { from, to } = dateRange(query);
    const lines = await prisma.claimLine.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { cptCode: true, description: true, chargeAmount: true, units: true },
      take: 5000,
    });
    const map = new Map();
    for (const l of lines) {
      const key = l.cptCode || 'UNKNOWN';
      const row = map.get(key) || { cptCode: key, description: l.description, units: 0, charges: 0, count: 0 };
      row.units += Number(l.units || 0);
      row.charges += Number(l.chargeAmount || 0);
      row.count += 1;
      if (!row.description && l.description) row.description = l.description;
      map.set(key, row);
    }
    const rows = [...map.values()]
      .map((r) => ({ ...r, charges: money(r.charges), units: money(r.units) }))
      .sort((a, b) => b.charges - a.charges)
      .slice(0, 50);
    return {
      columns: [
        { key: 'cptCode', label: 'CPT' },
        { key: 'description', label: 'Description' },
        { key: 'count', label: 'Lines' },
        { key: 'units', label: 'Units' },
        { key: 'charges', label: 'Charges' },
      ],
      rows,
      summaryCards: [{ label: 'CPT codes', value: String(rows.length) }],
      numericFooterKeys: ['count', 'units', 'charges'],
    };
  },

  async insurancePayerAnalysis(query = {}) {
    const { from, to } = dateRange(query);
    const grouped = await prisma.patientClaim.groupBy({
      by: ['payerName'],
      where: { createdAt: { gte: from, lte: to } },
      _count: { _all: true },
      _sum: { billedAmount: true, paidAmount: true, adjustmentAmount: true },
    });
    const rows = grouped.map((g) => {
      const billed = Number(g._sum.billedAmount || 0);
      const paid = Number(g._sum.paidAmount || 0);
      return {
        payer: g.payerName || 'Unknown',
        claims: g._count._all,
        billed: money(billed),
        paid: money(paid),
        adjustments: money(Number(g._sum.adjustmentAmount || 0)),
        collectionRate: billed ? `${((paid / billed) * 100).toFixed(1)}%` : '0%',
      };
    }).sort((a, b) => b.billed - a.billed);
    return {
      columns: [
        { key: 'payer', label: 'Payer' },
        { key: 'claims', label: 'Claims' },
        { key: 'billed', label: 'Billed' },
        { key: 'paid', label: 'Paid' },
        { key: 'adjustments', label: 'Adjustments' },
        { key: 'collectionRate', label: 'Collection %' },
      ],
      rows,
      summaryCards: [{ label: 'Payers', value: String(rows.length) }],
      numericFooterKeys: ['claims', 'billed', 'paid', 'adjustments'],
    };
  },

  async patientStatementBilling(query = {}) {
    const cycles = await prisma.statementCycle.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const rows = cycles.map((c) => ({
      cycleNumber: c.cycleNumber,
      status: c.status,
      statements: c.statementCount,
      totalBalance: Number(c.totalBalance),
      channel: c.deliveryChannel,
      periodFrom: toDateOnly(c.periodFrom),
      periodTo: toDateOnly(c.periodTo),
      completedAt: toDateOnly(c.completedAt),
    }));
    return {
      columns: [
        { key: 'cycleNumber', label: 'Cycle' },
        { key: 'status', label: 'Status' },
        { key: 'statements', label: 'Statements' },
        { key: 'totalBalance', label: 'Balance' },
        { key: 'channel', label: 'Channel' },
        { key: 'periodFrom', label: 'From' },
        { key: 'periodTo', label: 'To' },
        { key: 'completedAt', label: 'Completed' },
      ],
      rows,
      summaryCards: [
        { label: 'Cycles', value: String(rows.length) },
        { label: 'Statements', value: String(rows.reduce((s, r) => s + r.statements, 0)) },
      ],
      numericFooterKeys: ['statements', 'totalBalance'],
    };
  },

  async claimAdjustment(query = {}) {
    const { from, to } = dateRange(query);
    const claims = await prisma.patientClaim.findMany({
      where: {
        updatedAt: { gte: from, lte: to },
        OR: [
          { adjustmentAmount: { gt: 0 } },
          { claimStatus: { in: ['partial', 'paid', 'denied'] } },
        ],
      },
      include: { patient: { select: { firstName: true, lastName: true, middleName: true, mrn: true } } },
      take: 500,
      orderBy: { updatedAt: 'desc' },
    });
    const rows = claims.map((c) => ({
      claimNumber: c.claimNumber,
      patient: formatPatientName(c.patient),
      status: c.claimStatus,
      billed: Number(c.billedAmount || 0),
      paid: Number(c.paidAmount || 0),
      adjustment: Number(c.adjustmentAmount || 0),
      denialCode: c.denialCode,
    }));
    return {
      columns: [
        { key: 'claimNumber', label: 'Claim #' },
        { key: 'patient', label: 'Patient' },
        { key: 'status', label: 'Status' },
        { key: 'billed', label: 'Billed' },
        { key: 'paid', label: 'Paid' },
        { key: 'adjustment', label: 'Adjustment' },
        { key: 'denialCode', label: 'Denial code' },
      ],
      rows,
      summaryCards: [{ label: 'Rows', value: String(rows.length) }],
      numericFooterKeys: ['billed', 'paid', 'adjustment'],
    };
  },

  async auditCompliance(query = {}) {
    const { from, to } = dateRange(query);
    const events = await prisma.claimEvent.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { claim: { select: { claimNumber: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    const rows = events.map((e) => ({
      claimNumber: e.claim?.claimNumber,
      eventType: e.eventType,
      fromStatus: e.fromStatus,
      toStatus: e.toStatus,
      summary: e.summary,
      createdBy: e.createdBy,
      createdAt: e.createdAt,
    }));
    return {
      columns: [
        { key: 'claimNumber', label: 'Claim #' },
        { key: 'eventType', label: 'Event' },
        { key: 'fromStatus', label: 'From' },
        { key: 'toStatus', label: 'To' },
        { key: 'summary', label: 'Summary' },
        { key: 'createdBy', label: 'User' },
        { key: 'createdAt', label: 'When' },
      ],
      rows,
      summaryCards: [{ label: 'Events', value: String(rows.length) }],
    };
  },

  async icdCptMapping(query = {}) {
    const billings = await prisma.encounterBilling.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });
    const rows = [];
    for (const b of billings) {
      const diagnoses = Array.isArray(b.diagnoses) ? b.diagnoses : [];
      const charges = Array.isArray(b.charges) ? b.charges : [];
      for (const c of charges) {
        rows.push({
          encounterId: b.appointmentId,
          cpt: c.cptCode,
          description: c.description,
          dxPointers: c.diagnosisPointers,
          linkedDx: diagnoses
            .filter((d) => String(c.diagnosisPointers || '').includes(d.pointer || ''))
            .map((d) => d.code)
            .join(', '),
          unitCharge: Number(c.unitCharge || 0),
        });
      }
    }
    return {
      columns: [
        { key: 'encounterId', label: 'Encounter' },
        { key: 'cpt', label: 'CPT' },
        { key: 'description', label: 'Description' },
        { key: 'dxPointers', label: 'Pointers' },
        { key: 'linkedDx', label: 'ICD' },
        { key: 'unitCharge', label: 'Unit charge' },
      ],
      rows: rows.slice(0, 500),
      summaryCards: [{ label: 'Mappings', value: String(rows.length) }],
      numericFooterKeys: ['unitCharge'],
    };
  },

  async dashboard() {
    const [claimCount, submitted, denied, paid, openAr, eraBatches, openFollowUps, openDenials] = await Promise.all([
      prisma.patientClaim.count(),
      prisma.patientClaim.count({ where: { claimStatus: { in: ['submitted', 'accepted'] } } }),
      prisma.patientClaim.count({ where: { claimStatus: 'denied' } }),
      prisma.patientClaim.count({ where: { claimStatus: { in: ['paid', 'partial'] } } }),
      prisma.patient.aggregate({ where: { deletedAt: null }, _sum: { accountBalance: true } }),
      prisma.eraBatch.count(),
      prisma.followUpTask.count({ where: { status: { in: ['open', 'in_progress'] } } }),
      prisma.denialCase.count({ where: { status: { in: ['open', 'in_progress', 'appealing'] } } }),
    ]);

    return {
      cards: [
        { label: 'Total claims', value: claimCount },
        { label: 'In flight', value: submitted },
        { label: 'Denied', value: denied },
        { label: 'Paid / partial', value: paid },
        { label: 'Open AR', value: `$${money(Number(openAr._sum.accountBalance || 0)).toFixed(2)}` },
        { label: 'ERA batches', value: eraBatches },
        { label: 'Open follow-ups', value: openFollowUps },
        { label: 'Open denials', value: openDenials },
      ],
    };
  },

  async run(slug, query = {}) {
    const map = {
      'claim-summary': this.claimSummary,
      'claim-status': this.claimStatus,
      denial: this.denial,
      aging: this.aging,
      'payment-reconciliation': this.paymentReconciliation,
      'provider-performance': this.providerPerformance,
      'encounter-visit': this.encounterVisit,
      'top-procedure': this.topProcedure,
      'insurance-payer-analysis': this.insurancePayerAnalysis,
      'patient-statement-billing': this.patientStatementBilling,
      'claim-adjustment': this.claimAdjustment,
      'audit-compliance': this.auditCompliance,
      'icd-cpt-mapping': this.icdCptMapping,
      dashboard: this.dashboard,
    };
    const fn = map[slug];
    if (!fn) {
      const err = new Error(`Unknown report: ${slug}`);
      err.statusCode = 404;
      throw err;
    }
    return fn.call(this, query);
  },
};

module.exports = rcmReportsService;
