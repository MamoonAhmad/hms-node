const prisma = require('../lib/prisma');

const DEFAULT_POLICY = {
  lateCancelHours: 24,
  lateCancelFee: 25,
  noShowFee: 50,
  allowFeeWaive: true,
  blockAfterNoShowCount: 3,
  autoNoShowMinutesPast: 15,
  notifyPatientOnCancel: true,
  notifyPatientOnNoShow: true,
  isActive: true,
};

function toNumber(value, fallback = 0) {
  if (value == null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseAppointmentDateTime(appointment) {
  const date = new Date(appointment.appointmentDate);
  const [hh = '0', mm = '0'] = String(appointment.appointmentTime || '00:00').split(':');
  date.setHours(parseInt(hh, 10) || 0, parseInt(mm, 10) || 0, 0, 0);
  return date;
}

const appointmentPolicyService = {
  async getActivePolicy() {
    let policy = await prisma.appointmentPolicy.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!policy) {
      policy = await prisma.appointmentPolicy.create({ data: { ...DEFAULT_POLICY } });
    }

    return {
      ...policy,
      lateCancelFee: toNumber(policy.lateCancelFee),
      noShowFee: toNumber(policy.noShowFee),
    };
  },

  async listReasonCodes(category) {
    const where = { isActive: true };
    if (category) where.category = category;
    return prisma.appointmentReasonCode.findMany({
      where,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { label: 'asc' }],
    });
  },

  async assertReasonCode(category, code) {
    const row = await prisma.appointmentReasonCode.findFirst({
      where: { category, code: String(code).trim(), isActive: true },
    });
    if (!row) {
      const err = new Error(`Invalid ${category} reason code`);
      err.statusCode = 400;
      throw err;
    }
    return row;
  },

  evaluateCancel(appointment, policy, now = new Date()) {
    const start = parseAppointmentDateTime(appointment);
    const hoursUntilStart = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isLate = hoursUntilStart < policy.lateCancelHours;
    const suggestedFee = isLate ? toNumber(policy.lateCancelFee) : 0;
    return {
      action: 'cancel',
      hoursUntilStart: Math.round(hoursUntilStart * 100) / 100,
      isLate,
      lateCancelHours: policy.lateCancelHours,
      suggestedFee,
      allowFeeWaive: !!policy.allowFeeWaive,
      notifyPatientDefault: !!policy.notifyPatientOnCancel,
    };
  },

  evaluateNoShow(appointment, policy, patientNoShowCount = 0, now = new Date()) {
    const start = parseAppointmentDateTime(appointment);
    const minutesPastStart = (now.getTime() - start.getTime()) / (1000 * 60);
    const eligibleByTime = minutesPastStart >= toNumber(policy.autoNoShowMinutesPast, 15);
    const threshold = policy.blockAfterNoShowCount;
    const riskFlag =
      threshold != null && threshold > 0 && patientNoShowCount >= threshold;
    return {
      action: 'no_show',
      minutesPastStart: Math.round(minutesPastStart * 100) / 100,
      eligibleByTime,
      autoNoShowMinutesPast: policy.autoNoShowMinutesPast,
      suggestedFee: toNumber(policy.noShowFee),
      allowFeeWaive: !!policy.allowFeeWaive,
      patientNoShowCount,
      riskFlag,
      blockAfterNoShowCount: threshold,
      notifyPatientDefault: !!policy.notifyPatientOnNoShow,
    };
  },

  resolveFee({ suggestedFee, feeAmount, waiveFee, waiveReason, allowFeeWaive }) {
    if (waiveFee) {
      if (!allowFeeWaive) {
        const err = new Error('Fee waiver is not allowed by policy');
        err.statusCode = 400;
        throw err;
      }
      if (!waiveReason || String(waiveReason).trim().length < 3) {
        const err = new Error('Waiver reason is required when waiving a fee');
        err.statusCode = 400;
        throw err;
      }
      return { amount: 0, waived: true, waiveReason: String(waiveReason).trim() };
    }

    const amount =
      feeAmount != null && feeAmount !== '' ? toNumber(feeAmount) : toNumber(suggestedFee);
    if (amount < 0) {
      const err = new Error('Fee amount cannot be negative');
      err.statusCode = 400;
      throw err;
    }
    return { amount, waived: false, waiveReason: null };
  },

  /** Posts fees to the real patient ledger (extends prior stub). */
  async postAppointmentFee({ patientId, appointmentId, type, amount, user }) {
    if (!amount || amount <= 0) {
      return { chargeId: null, amount: 0, status: 'none' };
    }
    try {
      const patientLedgerService = require('./patientLedger.service');
      const transactionType =
        type === 'no_show' || type === 'no_show_fee' ? 'no_show_fee' : 'cancellation_fee';
      const result = await patientLedgerService.postTransaction({
        patientId,
        appointmentId,
        transactionType,
        amount,
        description: `${transactionType.replace(/_/g, ' ')} for appointment`,
        referenceType: 'appointment',
        referenceId: appointmentId,
        user,
      });
      return {
        chargeId: result.chargeId,
        amount: result.amount,
        status: result.status,
        patientId,
        appointmentId,
        type,
      };
    } catch (error) {
      // Preserve cancel/no-show even if ledger write fails
      return {
        chargeId: null,
        amount: Number(amount),
        status: 'ledger_error',
        error: error.message,
        patientId,
        appointmentId,
        type,
      };
    }
  },
};

module.exports = appointmentPolicyService;
