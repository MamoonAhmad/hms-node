const prisma = require('../lib/prisma');
const eligibilityService = require('./eligibility/eligibility.service');
const patientLedgerService = require('./patientLedger.service');
const notificationService = require('./notification.service');
const appointmentStatusService = require('./appointmentStatus.service');

function httpError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

/** Appointment operational transitions (RCM statuses stay separate). */
const ALLOWED_TRANSITIONS = {
  Scheduled: ['Confirmed', 'Arrived', 'Checked-In', 'Cancelled', 'No-Show', 'Rescheduled'],
  Confirmed: ['Arrived', 'Checked-In', 'Cancelled', 'No-Show', 'Rescheduled', 'Scheduled'],
  Arrived: ['Checked-In', 'Cancelled', 'No-Show'],
  'Checked-In': ['In Progress', 'Cancelled'],
  'In Progress': ['Completed', 'Checked-In'],
  Completed: [],
  Cancelled: ['Rescheduled'],
  'No-Show': ['Rescheduled'],
  Rescheduled: [],
};

async function recordHistory(appointmentId, action, summary, user, changes) {
  return prisma.appointmentHistory.create({
    data: {
      appointmentId,
      action,
      summary,
      changes: changes || undefined,
      changedBy: user?.id || null,
      changedByName: user?.name || user?.email || null,
    },
  });
}

const appointmentWorkflowService = {
  getAllowedTransitions(status) {
    return ALLOWED_TRANSITIONS[status] || [];
  },

  assertTransition(from, to) {
    const allowed = ALLOWED_TRANSITIONS[from] || [];
    if (!allowed.includes(to)) {
      throw httpError(`Invalid status transition from "${from}" to "${to}"`);
    }
  },

  async transition(id, nextStatus, user, extraData = {}) {
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) throw httpError('Appointment not found', 404);
    this.assertTransition(existing.status, nextStatus);
    const status = await appointmentStatusService.assertActiveStatusName(nextStatus);
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status,
        ...extraData,
        updatedBy: user?.id || null,
      },
    });
    await recordHistory(id, 'status_transition', `${existing.status} → ${status}`, user, [
      { field: 'status', from: existing.status, to: status },
    ]);
    return updated;
  },

  async confirm(id, user) {
    const updated = await this.transition(id, 'Confirmed', user, { confirmedAt: new Date() });
    await notificationService.notifyAppointmentEvent(id, 'appointment.confirmation');
    return updated;
  },

  async markArrived(id, user) {
    return this.transition(id, 'Arrived', user, { arrivedAt: new Date() });
  },

  async checkIn(id, body, user) {
    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: {
        latestEligibility: true,
        primaryInsurance: true,
        patient: true,
      },
    });
    if (!existing) throw httpError('Appointment not found', 404);

    if (!['Scheduled', 'Confirmed', 'Arrived'].includes(existing.status)) {
      throw httpError(`Cannot check in from status "${existing.status}"`);
    }

    let eligibility = existing.latestEligibility;
    if (body.verifyEligibility !== false) {
      eligibility = await eligibilityService.verifyForAppointment(
        id,
        { patientInsuranceId: body.patientInsuranceId || existing.primaryInsuranceId },
        user,
      );
    }

    const copayDue =
      body.copayAmount != null
        ? Number(body.copayAmount)
        : eligibility?.copay != null
          ? Number(eligibility.copay)
          : 0;

    let payment = null;
    let ledger = null;
    if (body.collectPayment && copayDue > 0) {
      ledger = await patientLedgerService.postTransaction({
        patientId: existing.patientId,
        appointmentId: id,
        transactionType: 'copay_charge',
        amount: copayDue,
        description: 'Copay charge at check-in',
        user,
      });
      const pay = await patientLedgerService.postTransaction({
        patientId: existing.patientId,
        appointmentId: id,
        transactionType: 'copay_payment',
        amount: body.collectedAmount != null ? Number(body.collectedAmount) : copayDue,
        description: 'Copay collected at check-in',
        paymentMethod: body.paymentMethod || 'cash',
        externalRef: body.externalRef || null,
        user,
      });
      payment = await prisma.appointmentPayment.create({
        data: {
          patientId: existing.patientId,
          appointmentId: id,
          ledgerTransactionId: pay.transaction?.id || null,
          amount: pay.amount,
          paymentMethod: body.paymentMethod || 'cash',
          paymentStatus: 'collected',
          purpose: 'copay',
          externalRef: body.externalRef || null,
          notes: body.notes || null,
          collectedBy: user?.id || null,
        },
      });
    }

    const status = await appointmentStatusService.assertActiveStatusName('Checked-In');
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status,
        checkedInAt: new Date(),
        checkedInBy: user?.id || null,
        arrivedAt: existing.arrivedAt || new Date(),
        rcmStatus: eligibility?.priorAuthRequired
          ? 'Authorization Pending'
          : 'Eligibility Verified',
        updatedBy: user?.id || null,
      },
    });

    await recordHistory(id, 'checked_in', 'Patient checked in', user);

    return {
      appointment: updated,
      eligibility,
      copayDue,
      payment,
      ledgerChargeId: ledger?.chargeId || null,
    };
  },

  async markReady(id, user) {
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) throw httpError('Appointment not found', 404);
    if (existing.status !== 'Checked-In') {
      throw httpError('Patient must be Checked-In before Ready');
    }
    return prisma.appointment.update({
      where: { id },
      data: { readyAt: new Date(), updatedBy: user?.id || null },
    });
  },

  async startVisit(id, user) {
    return this.transition(id, 'In Progress', user);
  },

  async complete(id, user) {
    return this.transition(id, 'Completed', user, {
      checkoutStatus: 'Completed',
      rcmStatus: 'Charges Pending',
    });
  },

  async checkout(id, body, user) {
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) throw httpError('Appointment not found', 404);
    if (!['In Progress', 'Completed', 'Checked-In'].includes(existing.status)) {
      throw httpError(`Cannot checkout from status "${existing.status}"`);
    }
    if (existing.status !== 'Completed') {
      await this.transition(id, 'Completed', user);
    }
    return prisma.appointment.update({
      where: { id },
      data: {
        checkoutAt: new Date(),
        checkoutStatus: body?.checkoutStatus || 'Completed',
        updatedBy: user?.id || null,
      },
    });
  },

  async collectPayment(id, body, user) {
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw httpError('Appointment not found', 404);
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw httpError('amount must be > 0');

    if (body.createCharge) {
      await patientLedgerService.postTransaction({
        patientId: appointment.patientId,
        appointmentId: id,
        transactionType: body.chargeType || 'patient_responsibility',
        amount,
        description: body.description || 'Patient responsibility',
        user,
      });
    }

    const pay = await patientLedgerService.postTransaction({
      patientId: appointment.patientId,
      appointmentId: id,
      transactionType: body.purpose === 'copay' ? 'copay_payment' : 'payment',
      amount,
      description: body.description || 'Appointment payment',
      paymentMethod: body.paymentMethod || 'cash',
      externalRef: body.externalRef || null,
      user,
    });

    const payment = await prisma.appointmentPayment.create({
      data: {
        patientId: appointment.patientId,
        appointmentId: id,
        ledgerTransactionId: pay.transaction?.id || null,
        amount,
        paymentMethod: body.paymentMethod || 'cash',
        paymentStatus: 'collected',
        purpose: body.purpose || 'copay',
        externalRef: body.externalRef || null,
        notes: body.notes || null,
        collectedBy: user?.id || null,
      },
    });

    return { payment, ledger: pay };
  },
};

module.exports = appointmentWorkflowService;
