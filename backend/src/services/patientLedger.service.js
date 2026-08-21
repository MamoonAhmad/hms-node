const prisma = require('../lib/prisma');

function httpError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function toAmount(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw httpError('Amount must be a non-negative number');
  return Math.round(n * 100) / 100;
}

const DEBIT_TYPES = new Set([
  'charge',
  'copay_charge',
  'no_show_fee',
  'cancellation_fee',
  'patient_responsibility',
  'debit',
]);
const CREDIT_TYPES = new Set([
  'payment',
  'copay_payment',
  'insurance_payment',
  'adjustment',
  'discount',
  'write_off',
  'refund',
  'credit',
]);

async function syncAccountBalance(patientId, client = prisma) {
  const rows = await client.ledgerTransaction.findMany({
    where: { patientId, status: 'posted' },
    select: { amount: true, direction: true },
  });
  let balance = 0;
  for (const row of rows) {
    const amt = Number(row.amount);
    balance += row.direction === 'debit' ? amt : -amt;
  }
  balance = Math.round(balance * 100) / 100;
  await client.patient.update({
    where: { id: patientId },
    data: { accountBalance: balance },
  });
  return balance;
}

const patientLedgerService = {
  syncAccountBalance,

  async postTransaction({
    patientId,
    appointmentId = null,
    transactionType,
    amount,
    description = null,
    referenceType = null,
    referenceId = null,
    paymentMethod = null,
    externalRef = null,
    meta = null,
    user = null,
    autoAllocate = false,
  }) {
    if (!patientId) throw httpError('patientId is required');
    if (!transactionType) throw httpError('transactionType is required');
    const amt = toAmount(amount);
    if (amt === 0) {
      return { transaction: null, amount: 0, status: 'none' };
    }

    let direction = 'debit';
    if (CREDIT_TYPES.has(transactionType)) direction = 'credit';
    else if (!DEBIT_TYPES.has(transactionType)) {
      throw httpError(`Unsupported transaction type: ${transactionType}`);
    }

    const transaction = await prisma.ledgerTransaction.create({
      data: {
        patientId,
        appointmentId,
        transactionType,
        amount: amt,
        direction,
        description,
        referenceType,
        referenceId,
        paymentMethod,
        externalRef,
        status: 'posted',
        meta: meta || undefined,
        createdBy: user?.id || null,
      },
    });

    await syncAccountBalance(patientId);

    let allocations = [];
    if (autoAllocate && direction === 'credit') {
      allocations = await this.autoAllocatePayment(patientId, transaction.id, amt, user);
    }

    return {
      transaction,
      amount: amt,
      chargeId: transaction.id,
      status: 'posted',
      allocations,
    };
  },

  async postCharge({
    patientId,
    appointmentId = null,
    amount,
    description = 'Patient charge',
    referenceType = 'manual_charge',
    referenceId = null,
    user = null,
  }) {
    return this.postTransaction({
      patientId,
      appointmentId,
      transactionType: 'charge',
      amount,
      description,
      referenceType,
      referenceId,
      user,
    });
  },

  async reverseTransaction(id, user, reason) {
    const original = await prisma.ledgerTransaction.findUnique({ where: { id } });
    if (!original) throw httpError('Ledger transaction not found', 404);
    if (original.status === 'reversed') throw httpError('Transaction already reversed');

    const reversalType = original.direction === 'debit' ? 'credit' : 'debit';

    const result = await prisma.$transaction(async (tx) => {
      const reversal = await tx.ledgerTransaction.create({
        data: {
          patientId: original.patientId,
          appointmentId: original.appointmentId,
          transactionType: `reversal_${original.transactionType}`,
          amount: original.amount,
          direction: reversalType === 'credit' ? 'credit' : 'debit',
          description: reason || `Reversal of ${original.id}`,
          referenceType: 'ledger_transaction',
          referenceId: original.id,
          status: 'posted',
          reversalOfId: original.id,
          createdBy: user?.id || null,
        },
      });
      await tx.ledgerTransaction.update({
        where: { id: original.id },
        data: { status: 'reversed', reversedAt: new Date() },
      });
      await tx.paymentAllocation.deleteMany({
        where: {
          OR: [{ paymentTransactionId: original.id }, { chargeTransactionId: original.id }],
        },
      });
      await syncAccountBalance(original.patientId, tx);
      return reversal;
    });

    return result;
  },

  async getOpenCharges(patientId) {
    const charges = await prisma.ledgerTransaction.findMany({
      where: {
        patientId,
        status: 'posted',
        direction: 'debit',
        transactionType: { in: [...DEBIT_TYPES] },
      },
      orderBy: { postedAt: 'asc' },
    });
    const allocations = await prisma.paymentAllocation.findMany({
      where: { patientId, chargeTransactionId: { in: charges.map((c) => c.id) } },
    });
    const allocatedByCharge = allocations.reduce((acc, row) => {
      acc[row.chargeTransactionId] = (acc[row.chargeTransactionId] || 0) + Number(row.amount);
      return acc;
    }, {});

    return charges
      .map((charge) => {
        const allocated = allocatedByCharge[charge.id] || 0;
        const openAmount = Math.round((Number(charge.amount) - allocated) * 100) / 100;
        return { ...charge, allocatedAmount: allocated, openAmount };
      })
      .filter((c) => c.openAmount > 0);
  },

  async allocatePayment(patientId, body = {}, user = null) {
    const paymentTransactionId = body.paymentTransactionId;
    const allocations = body.allocations || [];
    const payment = await prisma.ledgerTransaction.findFirst({
      where: { id: paymentTransactionId, patientId, status: 'posted', direction: 'credit' },
    });
    if (!payment) throw httpError('Payment transaction not found', 404);

    const existing = await prisma.paymentAllocation.aggregate({
      where: { paymentTransactionId },
      _sum: { amount: true },
    });
    let remaining =
      Math.round((Number(payment.amount) - Number(existing._sum.amount || 0)) * 100) / 100;

    const created = [];
    for (const item of allocations) {
      const amount = toAmount(item.amount);
      if (amount <= 0) continue;
      if (amount > remaining + 0.001) throw httpError('Allocation exceeds unallocated payment amount');

      const charge = await prisma.ledgerTransaction.findFirst({
        where: {
          id: item.chargeTransactionId,
          patientId,
          status: 'posted',
          direction: 'debit',
        },
      });
      if (!charge) throw httpError(`Charge ${item.chargeTransactionId} not found`);

      const openCharges = await this.getOpenCharges(patientId);
      const open = openCharges.find((c) => c.id === charge.id);
      if (!open || amount > open.openAmount + 0.001) {
        throw httpError(`Allocation exceeds open balance on charge ${charge.id}`);
      }

      const row = await prisma.paymentAllocation.create({
        data: {
          patientId,
          paymentTransactionId,
          chargeTransactionId: charge.id,
          amount,
          notes: item.notes || null,
          createdBy: user?.id || null,
        },
      });
      created.push(row);
      remaining = Math.round((remaining - amount) * 100) / 100;
    }

    return { payment, allocations: created, unallocated: remaining };
  },

  async autoAllocatePayment(patientId, paymentTransactionId, amount, user) {
    const openCharges = await this.getOpenCharges(patientId);
    let remaining = toAmount(amount);
    const plan = [];
    for (const charge of openCharges) {
      if (remaining <= 0) break;
      const apply = Math.min(remaining, charge.openAmount);
      plan.push({ chargeTransactionId: charge.id, amount: apply });
      remaining = Math.round((remaining - apply) * 100) / 100;
    }
    if (!plan.length) return [];
    const result = await this.allocatePayment(
      patientId,
      { paymentTransactionId, allocations: plan },
      user,
    );
    return result.allocations;
  },

  async getAging(patientId) {
    const openCharges = await this.getOpenCharges(patientId);
    const buckets = {
      current: 0,
      days30: 0,
      days60: 0,
      days90: 0,
      days120Plus: 0,
    };
    const now = Date.now();
    for (const charge of openCharges) {
      const age = Math.floor((now - new Date(charge.postedAt).getTime()) / 86400000);
      if (age <= 30) buckets.current += charge.openAmount;
      else if (age <= 60) buckets.days30 += charge.openAmount;
      else if (age <= 90) buckets.days60 += charge.openAmount;
      else if (age <= 120) buckets.days90 += charge.openAmount;
      else buckets.days120Plus += charge.openAmount;
    }
    Object.keys(buckets).forEach((key) => {
      buckets[key] = Math.round(buckets[key] * 100) / 100;
    });
    const total = Object.values(buckets).reduce((sum, n) => sum + n, 0);
    return {
      patientId,
      total: Math.round(total * 100) / 100,
      buckets,
      openCharges,
    };
  },

  async postEraPayment(patientId, body, user) {
    const amount = toAmount(body.amount);
    const payment = await this.postTransaction({
      patientId,
      appointmentId: body.appointmentId || null,
      transactionType: 'insurance_payment',
      amount,
      description: body.description || 'ERA/835 insurance payment',
      paymentMethod: 'era',
      externalRef: body.eraTraceNumber || body.externalRef || null,
      referenceType: 'era',
      referenceId: body.claimId || null,
      meta: {
        payerName: body.payerName || null,
        claimId: body.claimId || null,
        adjustments: body.adjustments || [],
        stub: true,
      },
      user,
      autoAllocate: body.autoAllocate !== false,
    });

    if (body.adjustmentAmount && Number(body.adjustmentAmount) > 0) {
      await this.postTransaction({
        patientId,
        appointmentId: body.appointmentId || null,
        transactionType: body.adjustmentType || 'adjustment',
        amount: body.adjustmentAmount,
        description: body.adjustmentDescription || 'ERA contractual adjustment',
        referenceType: 'era',
        referenceId: body.claimId || null,
        user,
      });
    }

    if (body.claimId && body.claimStatus) {
      await prisma.patientClaim.updateMany({
        where: { id: body.claimId, patientId },
        data: {
          claimStatus: body.claimStatus,
          paidAmount: amount,
          paidAt: new Date(),
        },
      });
    }

    const ledger = await this.getPatientLedger(patientId);
    return { payment, ledger };
  },

  async getPatientLedger(patientId, { appointmentId } = {}) {
    const where = { patientId, status: 'posted' };
    if (appointmentId) where.appointmentId = appointmentId;

    const rows = await prisma.ledgerTransaction.findMany({
      where,
      orderBy: { postedAt: 'asc' },
    });

    let balance = 0;
    const entries = rows.map((row) => {
      const signed = row.direction === 'debit' ? Number(row.amount) : -Number(row.amount);
      balance = Math.round((balance + signed) * 100) / 100;
      return { ...row, signedAmount: signed, runningBalance: balance };
    });

    const synced = await syncAccountBalance(patientId);

    return {
      patientId,
      balance: synced,
      entries,
    };
  },

  async getAppointmentLedger(appointmentId) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { id: true, patientId: true },
    });
    if (!appointment) throw httpError('Appointment not found', 404);
    return this.getPatientLedger(appointment.patientId, { appointmentId });
  },
};

module.exports = patientLedgerService;
