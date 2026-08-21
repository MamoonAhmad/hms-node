const prisma = require('../lib/prisma');
const appointmentService = require('./appointment.service');
const appointmentStatusService = require('./appointmentStatus.service');
const appointmentPolicyService = require('./appointmentPolicy.service');

const STATUS = {
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No-Show',
  RESCHEDULED: 'Rescheduled',
  SCHEDULED: 'Scheduled',
};

const CANCEL_ALLOWED = new Set(['Scheduled', 'Checked-In']);
const NO_SHOW_ALLOWED = new Set(['Scheduled']);
const RESCHEDULE_ALLOWED = new Set(['Scheduled', 'Checked-In', 'No-Show', 'Cancelled']);

function httpError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

async function recordHistory(appointmentId, { action, summary, changes, user }) {
  return prisma.appointmentHistory.create({
    data: {
      appointmentId,
      action,
      summary,
      changes: changes?.length ? changes : undefined,
      changedBy: user?.id || null,
      changedByName: user?.name || user?.email || null,
    },
  });
}

async function countPatientNoShows(patientId) {
  return prisma.appointment.count({
    where: {
      patientId,
      OR: [{ status: { in: ['No-Show', 'No Show'] } }, { noShowAt: { not: null } }],
    },
  });
}

async function createLinkedAppointment(existing, payload, user) {
  const created = await appointmentService.create(
    {
      patientId: existing.patientId,
      appointmentDate: payload.appointmentDate,
      appointmentTime: payload.appointmentTime,
      appointmentEndTime: payload.appointmentEndTime || null,
      duration: payload.duration || existing.duration || 30,
      appointmentTypeId: payload.appointmentTypeId || existing.appointmentTypeId,
      appointmentType: payload.appointmentType || undefined,
      visitReason: payload.visitReason != null ? payload.visitReason : existing.visitReason,
      departmentId: payload.departmentId != null ? payload.departmentId : existing.departmentId,
      department: payload.department != null ? payload.department : existing.department,
      providerId: payload.providerId != null ? payload.providerId : existing.providerId,
      provider: payload.provider != null ? payload.provider : existing.provider,
      notes: payload.notes != null ? payload.notes : existing.notes,
      status: STATUS.SCHEDULED,
      excludeAppointmentId: existing.id,
    },
    user,
  );

  return prisma.appointment.update({
    where: { id: created.id },
    data: {
      rescheduledFromId: existing.id,
      updatedBy: user?.id || null,
    },
    include: {
      patient: true,
      providerRef: true,
      departmentRef: true,
      appointmentTypeRef: true,
    },
  });
}

function serializeLinked(appointment) {
  if (!appointment) return appointment;
  return {
    ...appointment,
    appointmentType: appointment.appointmentTypeRef?.name || appointment.appointmentType || null,
  };
}

const appointmentLifecycleService = {
  async getPolicy() {
    return appointmentPolicyService.getActivePolicy();
  },

  async getReasonCodes(category) {
    return appointmentPolicyService.listReasonCodes(category);
  },

  async getPolicyPreview(id, action) {
    const appointment = await appointmentService.findById(id);
    if (!appointment) throw httpError('Appointment not found', 404);

    const policy = await appointmentPolicyService.getActivePolicy();
    const patientNoShowCount = await countPatientNoShows(appointment.patientId);

    let outcome;
    let canProceed = true;
    const blockers = [];

    if (action === 'cancel') {
      outcome = appointmentPolicyService.evaluateCancel(appointment, policy);
      if (!CANCEL_ALLOWED.has(appointment.status)) {
        canProceed = false;
        blockers.push(`Cannot cancel an appointment with status "${appointment.status}"`);
      }
    } else if (action === 'no_show') {
      outcome = appointmentPolicyService.evaluateNoShow(
        appointment,
        policy,
        patientNoShowCount,
      );
      if (!NO_SHOW_ALLOWED.has(appointment.status)) {
        canProceed = false;
        blockers.push(`Cannot mark no-show for status "${appointment.status}"`);
      }
      if (!outcome.eligibleByTime) {
        blockers.push(
          `Appointment start is less than ${policy.autoNoShowMinutesPast} minutes ago (override allowed on submit)`,
        );
      }
      if (outcome.riskFlag) {
        blockers.push(
          `Patient has ${patientNoShowCount} prior no-shows (policy threshold ${policy.blockAfterNoShowCount})`,
        );
      }
    } else if (action === 'reschedule') {
      outcome = { action: 'reschedule', suggestedFee: 0 };
      if (!RESCHEDULE_ALLOWED.has(appointment.status)) {
        canProceed = false;
        blockers.push(`Cannot reschedule an appointment with status "${appointment.status}"`);
      }
    } else {
      throw httpError('action must be cancel, no_show, or reschedule');
    }

    return {
      appointment: {
        id: appointment.id,
        status: appointment.status,
        encounterNumber: appointment.encounterNumber,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        provider: appointment.provider,
        patient: appointment.patient,
      },
      policy,
      canProceed,
      blockers,
      outcome,
      patientNoShowCount,
    };
  },

  async cancel(id, body, user) {
    const existing = await appointmentService.findById(id);
    if (!existing) throw httpError('Appointment not found', 404);
    if (!CANCEL_ALLOWED.has(existing.status)) {
      throw httpError(`Cannot cancel an appointment with status "${existing.status}"`);
    }

    await appointmentPolicyService.assertReasonCode('cancel', body.reasonCode);
    const policy = await appointmentPolicyService.getActivePolicy();
    const outcome = appointmentPolicyService.evaluateCancel(existing, policy);
    const fee = appointmentPolicyService.resolveFee({
      suggestedFee: outcome.suggestedFee,
      feeAmount: body.feeAmount,
      waiveFee: !!body.waiveFee,
      waiveReason: body.waiveReason,
      allowFeeWaive: policy.allowFeeWaive,
    });

    const willReschedule = !!body.reschedule;
    if (willReschedule && !body.reschedulePayload) {
      throw httpError('reschedulePayload is required when reschedule is true');
    }

    const finalStatus = willReschedule
      ? await appointmentStatusService.assertActiveStatusName(STATUS.RESCHEDULED)
      : await appointmentStatusService.assertActiveStatusName(STATUS.CANCELLED);

    let rescheduledTo = null;
    if (willReschedule) {
      rescheduledTo = serializeLinked(
        await createLinkedAppointment(existing, body.reschedulePayload, user),
      );
    }

    const charge = await appointmentPolicyService.postAppointmentFee({
      patientId: existing.patientId,
      appointmentId: existing.id,
      type: 'cancellation',
      amount: fee.amount,
      user,
    });

    const now = new Date();
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: finalStatus,
        cancelledAt: now,
        cancelledBy: user?.id || null,
        cancellationReasonCode: body.reasonCode,
        cancellationReasonNotes: body.reasonNotes || null,
        cancellationFeeAmount: fee.amount,
        cancellationFeeWaived: fee.waived,
        cancellationFeeWaiveReason: fee.waiveReason,
        rescheduledToId: rescheduledTo?.id || null,
        policyOutcome: { ...outcome, notifyPatient: body.notifyPatient !== false },
        feeChargeId: charge.chargeId,
        updatedBy: user?.id || null,
      },
      include: {
        patient: true,
        providerRef: true,
        departmentRef: true,
        appointmentTypeRef: true,
      },
    });

    const feeLabel = fee.waived
      ? 'fee waived'
      : fee.amount > 0
        ? `fee $${fee.amount.toFixed(2)}`
        : 'no fee';
    const summary = willReschedule
      ? `Rescheduled (from cancel) — ${body.reasonCode} — ${feeLabel}`
      : `Cancelled — ${body.reasonCode} — ${feeLabel}`;

    await recordHistory(id, {
      action: willReschedule ? 'rescheduled' : 'cancelled',
      summary,
      changes: [
        { field: 'status', label: 'Status', from: existing.status, to: finalStatus },
        { field: 'cancellationReasonCode', label: 'Cancel Reason', to: body.reasonCode },
        body.reasonNotes
          ? { field: 'cancellationReasonNotes', label: 'Cancel Notes', to: body.reasonNotes }
          : null,
        { field: 'cancellationFeeAmount', label: 'Cancel Fee', to: fee.amount },
        rescheduledTo
          ? {
              field: 'rescheduledToId',
              label: 'Rescheduled To',
              to: rescheduledTo.encounterNumber || rescheduledTo.id,
            }
          : null,
      ].filter(Boolean),
      user,
    });

    if (rescheduledTo) {
      await recordHistory(rescheduledTo.id, {
        action: 'rescheduled_from',
        summary: `Created from cancelled/rescheduled ${existing.encounterNumber}`,
        changes: [
          {
            field: 'rescheduledFromId',
            label: 'Rescheduled From',
            to: existing.encounterNumber,
          },
        ],
        user,
      });
    }

    const shouldNotify = body.notifyPatient !== false && policy.notifyPatientOnCancel;
    if (shouldNotify) {
      try {
        const notificationService = require('./notification.service');
        await notificationService.notifyAppointmentEvent(
          id,
          willReschedule ? 'appointment.reschedule' : 'appointment.cancellation',
        );
      } catch (_) {
        /* notification failure must not block cancel */
      }
    }

    let waitlistOffer = null;
    if (!willReschedule) {
      try {
        const appointmentOpsService = require('./appointmentOps.service');
        waitlistOffer = await appointmentOpsService.autoOfferWaitlistFromCancellation(
          updated,
          user,
        );
      } catch (_) {
        /* waitlist auto-offer is best-effort */
      }
    }

    return {
      appointment: serializeLinked(updated),
      rescheduledTo,
      fee: charge,
      notified: shouldNotify,
      waitlistOffer,
    };
  },

  async markNoShow(id, body, user) {
    const existing = await appointmentService.findById(id);
    if (!existing) throw httpError('Appointment not found', 404);
    if (!NO_SHOW_ALLOWED.has(existing.status)) {
      throw httpError(`Cannot mark no-show for status "${existing.status}"`);
    }

    await appointmentPolicyService.assertReasonCode('no_show', body.reasonCode);
    const policy = await appointmentPolicyService.getActivePolicy();
    const patientNoShowCount = await countPatientNoShows(existing.patientId);
    const outcome = appointmentPolicyService.evaluateNoShow(
      existing,
      policy,
      patientNoShowCount,
    );
    const fee = appointmentPolicyService.resolveFee({
      suggestedFee: outcome.suggestedFee,
      feeAmount: body.feeAmount,
      waiveFee: !!body.waiveFee,
      waiveReason: body.waiveReason,
      allowFeeWaive: policy.allowFeeWaive,
    });

    const willReschedule = !!body.reschedule;
    if (willReschedule && !body.reschedulePayload) {
      throw httpError('reschedulePayload is required when reschedule is true');
    }

    const finalStatus = willReschedule
      ? await appointmentStatusService.assertActiveStatusName(STATUS.RESCHEDULED)
      : await appointmentStatusService.assertActiveStatusName(STATUS.NO_SHOW);

    let rescheduledTo = null;
    if (willReschedule) {
      rescheduledTo = serializeLinked(
        await createLinkedAppointment(existing, body.reschedulePayload, user),
      );
    }

    const charge = await appointmentPolicyService.postAppointmentFee({
      patientId: existing.patientId,
      appointmentId: existing.id,
      type: 'no_show',
      amount: fee.amount,
      user,
    });

    const now = new Date();
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: finalStatus,
        noShowAt: now,
        noShowBy: user?.id || null,
        noShowReasonCode: body.reasonCode,
        noShowReasonNotes: body.reasonNotes || null,
        noShowFeeAmount: fee.amount,
        noShowFeeWaived: fee.waived,
        noShowFeeWaiveReason: fee.waiveReason,
        rescheduledToId: rescheduledTo?.id || null,
        policyOutcome: { ...outcome, notifyPatient: body.notifyPatient !== false },
        feeChargeId: charge.chargeId,
        updatedBy: user?.id || null,
      },
      include: {
        patient: true,
        providerRef: true,
        departmentRef: true,
        appointmentTypeRef: true,
      },
    });

    const feeLabel = fee.waived
      ? 'fee waived'
      : fee.amount > 0
        ? `fee $${fee.amount.toFixed(2)}`
        : 'no fee';
    const summary = willReschedule
      ? `Rescheduled (from no-show) — ${body.reasonCode} — ${feeLabel}`
      : `No-Show — ${body.reasonCode} — ${feeLabel}`;

    await recordHistory(id, {
      action: willReschedule ? 'rescheduled' : 'no_show',
      summary,
      changes: [
        { field: 'status', label: 'Status', from: existing.status, to: finalStatus },
        { field: 'noShowReasonCode', label: 'No-Show Reason', to: body.reasonCode },
        body.reasonNotes
          ? { field: 'noShowReasonNotes', label: 'No-Show Notes', to: body.reasonNotes }
          : null,
        { field: 'noShowFeeAmount', label: 'No-Show Fee', to: fee.amount },
        rescheduledTo
          ? {
              field: 'rescheduledToId',
              label: 'Rescheduled To',
              to: rescheduledTo.encounterNumber || rescheduledTo.id,
            }
          : null,
      ].filter(Boolean),
      user,
    });

    if (rescheduledTo) {
      await recordHistory(rescheduledTo.id, {
        action: 'rescheduled_from',
        summary: `Created after no-show of ${existing.encounterNumber}`,
        changes: [
          {
            field: 'rescheduledFromId',
            label: 'Rescheduled From',
            to: existing.encounterNumber,
          },
        ],
        user,
      });
    }

    const shouldNotify = body.notifyPatient !== false && policy.notifyPatientOnNoShow;
    if (shouldNotify) {
      try {
        const notificationService = require('./notification.service');
        await notificationService.notifyAppointmentEvent(
          id,
          willReschedule ? 'appointment.reschedule' : 'appointment.no_show',
        );
      } catch (_) {
        /* notification failure must not block no-show */
      }
    }

    let waitlistOffer = null;
    if (!willReschedule) {
      try {
        const appointmentOpsService = require('./appointmentOps.service');
        waitlistOffer = await appointmentOpsService.autoOfferWaitlistFromCancellation(
          updated,
          user,
        );
      } catch (_) {
        /* waitlist auto-offer is best-effort */
      }
    }

    return {
      appointment: serializeLinked(updated),
      rescheduledTo,
      fee: charge,
      notified: shouldNotify,
      waitlistOffer,
    };
  },

  async reschedule(id, body, user) {
    const existing = await appointmentService.findById(id);
    if (!existing) throw httpError('Appointment not found', 404);
    if (!RESCHEDULE_ALLOWED.has(existing.status)) {
      throw httpError(`Cannot reschedule an appointment with status "${existing.status}"`);
    }

    const finalStatus = await appointmentStatusService.assertActiveStatusName(
      STATUS.RESCHEDULED,
    );

    const next = serializeLinked(await createLinkedAppointment(existing, body, user));

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: finalStatus,
        rescheduledToId: next.id,
        cancellationReasonCode: body.reasonCode || existing.cancellationReasonCode,
        cancellationReasonNotes: body.notes || existing.cancellationReasonNotes,
        updatedBy: user?.id || null,
      },
      include: {
        patient: true,
        providerRef: true,
        departmentRef: true,
        appointmentTypeRef: true,
      },
    });

    await recordHistory(id, {
      action: 'rescheduled',
      summary: `Rescheduled → ${next.encounterNumber}`,
      changes: [
        { field: 'status', label: 'Status', from: existing.status, to: finalStatus },
        {
          field: 'rescheduledToId',
          label: 'Rescheduled To',
          to: next.encounterNumber || next.id,
        },
      ],
      user,
    });

    await recordHistory(next.id, {
      action: 'rescheduled_from',
      summary: `Created from ${existing.encounterNumber}`,
      changes: [
        {
          field: 'rescheduledFromId',
          label: 'Rescheduled From',
          to: existing.encounterNumber,
        },
      ],
      user,
    });

    try {
      const notificationService = require('./notification.service');
      await notificationService.notifyAppointmentEvent(id, 'appointment.reschedule');
      await notificationService.notifyAppointmentEvent(next.id, 'appointment.confirmation');
    } catch (_) {
      /* notification failure must not block reschedule */
    }

    return {
      previous: serializeLinked(updated),
      next,
    };
  },
};

module.exports = appointmentLifecycleService;
