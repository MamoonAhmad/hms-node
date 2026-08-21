const prisma = require('../lib/prisma');
const appointmentService = require('./appointment.service');
const appointmentPolicyService = require('./appointmentPolicy.service');
const appointmentStatusService = require('./appointmentStatus.service');
const waitlistService = require('./waitlist.service');
const notificationService = require('./notification.service');

function httpError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

const appointmentOpsService = {
  async setCoverage(appointmentId, body, user) {
    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) throw httpError('Appointment not found', 404);

    if (body.primaryInsuranceId) {
      const primary = await prisma.patientInsurance.findFirst({
        where: { id: body.primaryInsuranceId, patientId: appointment.patientId },
      });
      if (!primary) throw httpError('Primary insurance not found for patient', 404);
    }
    if (body.secondaryInsuranceId) {
      const secondary = await prisma.patientInsurance.findFirst({
        where: { id: body.secondaryInsuranceId, patientId: appointment.patientId },
      });
      if (!secondary) throw httpError('Secondary insurance not found for patient', 404);
    }

    return prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        primaryInsuranceId: body.primaryInsuranceId || null,
        secondaryInsuranceId: body.secondaryInsuranceId || null,
        locationId: body.locationId !== undefined ? body.locationId || null : undefined,
        placeOfService: body.placeOfService !== undefined ? body.placeOfService || null : undefined,
        updatedBy: user?.id || null,
      },
      include: {
        primaryInsurance: { include: { insuranceProvider: true } },
        secondaryInsurance: { include: { insuranceProvider: true } },
        location: true,
      },
    });
  },

  async assignRoom(appointmentId, body, user) {
    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) throw httpError('Appointment not found', 404);
    if (!body.roomId) throw httpError('roomId is required');

    const room = await prisma.room.findFirst({
      where: { id: body.roomId, deletedAt: null },
    });
    if (!room) throw httpError('Room not found', 404);

    await prisma.roomAssignment.updateMany({
      where: { appointmentId, status: 'Assigned' },
      data: { status: 'Released', releasedAt: new Date() },
    });

    const assignment = await prisma.roomAssignment.create({
      data: {
        appointmentId,
        roomId: body.roomId,
        assignedBy: user?.id || null,
        notes: body.notes || null,
        status: 'Assigned',
      },
      include: { room: true },
    });

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { roomId: body.roomId, readyAt: new Date(), updatedBy: user?.id || null },
    });

    return assignment;
  },

  async releaseRoom(appointmentId, user) {
    await prisma.roomAssignment.updateMany({
      where: { appointmentId, status: 'Assigned' },
      data: { status: 'Released', releasedAt: new Date() },
    });
    return prisma.appointment.update({
      where: { id: appointmentId },
      data: { roomId: null, updatedBy: user?.id || null },
    });
  },

  async upsertTelehealth(appointmentId, body, user) {
    return prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        telehealthPlatform: body.platform || body.telehealthPlatform || null,
        telehealthJoinUrl: body.joinUrl || body.telehealthJoinUrl || null,
        telehealthMeetingId: body.meetingId || body.telehealthMeetingId || null,
        telehealthJoinStatus: body.joinStatus || body.telehealthJoinStatus || 'Ready',
        updatedBy: user?.id || null,
      },
    });
  },

  async createReferral(appointmentId, body, user) {
    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) throw httpError('Appointment not found', 404);

    const referral = await prisma.referralRecord.create({
      data: {
        patientId: appointment.patientId,
        appointmentId,
        referralType: body.referralType || null,
        referralNumber: body.referralNumber || null,
        referringProviderName: body.referringProviderName || null,
        referringProviderNpi: body.referringProviderNpi || null,
        referredProviderId: body.referredProviderId || appointment.providerId || null,
        referringFacility: body.referringFacility || null,
        receivingFacility: body.receivingFacility || null,
        referralDate: body.referralDate ? new Date(body.referralDate) : new Date(),
        referralReason: body.referralReason || null,
        diagnosisCode: body.diagnosisCode || null,
        diagnosisDescription: body.diagnosisDescription || null,
        authorizationNumber: body.authorizationNumber || null,
        effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : null,
        expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
        status: body.status || 'Active',
        notes: body.notes || null,
        legacyPayload: body.legacyPayload || undefined,
        createdBy: user?.id || null,
      },
    });

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { referralId: referral.id, updatedBy: user?.id || null },
    });

    return referral;
  },

  async createRecurringSeries(body, user) {
    if (!body.patientId || !body.startDate || !body.preferredTime || !body.appointmentTypeId) {
      throw httpError('patientId, startDate, preferredTime, and appointmentTypeId are required');
    }

    const series = await prisma.recurringAppointmentSeries.create({
      data: {
        patientId: body.patientId,
        providerId: body.providerId || null,
        departmentId: body.departmentId || null,
        appointmentTypeId: body.appointmentTypeId,
        frequency: body.frequency || 'weekly',
        interval: body.interval || 1,
        daysOfWeek: body.daysOfWeek || undefined,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        occurrenceCount: body.occurrenceCount || null,
        exclusions: body.exclusions || undefined,
        preferredTime: body.preferredTime,
        duration: body.duration || 30,
        notes: body.notes || null,
        createdBy: user?.id || null,
      },
    });

    const occurrences = [];
    let cursor = new Date(body.startDate);
    const max = body.occurrenceCount || 12;
    const end = body.endDate ? new Date(body.endDate) : null;
    const exclusions = new Set((body.exclusions || []).map((d) => String(d).slice(0, 10)));

    while (occurrences.length < max) {
      if (end && cursor > end) break;
      const dateKey = cursor.toISOString().slice(0, 10);
      if (!exclusions.has(dateKey)) {
        try {
          const created = await appointmentService.create(
            {
              patientId: body.patientId,
              appointmentDate: dateKey,
              appointmentTime: body.preferredTime,
              duration: body.duration || 30,
              appointmentTypeId: body.appointmentTypeId,
              providerId: body.providerId,
              departmentId: body.departmentId,
              visitReason: body.visitReason || 'Recurring appointment',
              notes: body.notes,
              status: 'Scheduled',
            },
            user,
          );
          await prisma.appointment.update({
            where: { id: created.id },
            data: {
              recurringSeriesId: series.id,
              recurringOccurrenceIndex: occurrences.length + 1,
            },
          });
          occurrences.push(created);
        } catch (error) {
          // Skip conflicted slots; continue series generation
          if (error.statusCode !== 400 && error.statusCode !== 409) throw error;
        }
      }

      if ((body.frequency || 'weekly') === 'daily') cursor = addDays(cursor, body.interval || 1);
      else if (body.frequency === 'monthly') cursor = addMonths(cursor, body.interval || 1);
      else cursor = addDays(cursor, 7 * (body.interval || 1));
    }

    return { series, occurrences };
  },

  async autoNoShow(user) {
    const policy = await appointmentPolicyService.getActivePolicy();
    const grace = policy.autoNoShowMinutesPast || 15;
    const now = new Date();

    const candidates = await prisma.appointment.findMany({
      where: {
        status: { in: ['Scheduled', 'Confirmed', 'Arrived'] },
        appointmentDate: { lte: now },
      },
      take: 500,
    });

    const noShowStatus = await appointmentStatusService.assertActiveStatusName('No-Show');
    let marked = 0;

    for (const apt of candidates) {
      const start = new Date(apt.appointmentDate);
      const [hh, mm] = String(apt.appointmentTime || '00:00').split(':');
      start.setHours(parseInt(hh, 10) || 0, parseInt(mm, 10) || 0, 0, 0);
      const minutesPast = (now - start) / 60000;
      if (minutesPast < grace) continue;
      if (apt.checkedInAt || apt.arrivedAt) continue;

      await prisma.appointment.update({
        where: { id: apt.id },
        data: {
          status: noShowStatus,
          noShowAt: now,
          noShowBy: user?.id || 'system',
          noShowReasonCode: 'auto_no_show',
          noShowReasonNotes: `Auto no-show after ${grace} minutes`,
        },
      });
      await prisma.appointmentHistory.create({
        data: {
          appointmentId: apt.id,
          action: 'auto_no_show',
          summary: `Auto no-show after ${grace} minutes`,
          changedBy: user?.id || null,
          changedByName: user?.name || 'system',
        },
      });
      await notificationService.notifyAppointmentEvent(apt.id, 'appointment.no_show');
      marked += 1;
    }

    return { marked, graceMinutes: grace };
  },

  async autoOfferWaitlistFromCancellation(appointment, user) {
    const policy = await appointmentPolicyService.getActivePolicy();
    if (!policy.waitlistAutoOffer) return { offered: 0 };
    if (!appointment.providerId) return { offered: 0 };

    const matches = await waitlistService.findMatches({
      providerId: appointment.providerId,
      date: appointment.appointmentDate,
      startTime: appointment.appointmentTime,
      appointmentTypeId: appointment.appointmentTypeId,
      departmentId: appointment.departmentId,
      limit: 1,
    });

    const entry = matches.data?.[0];
    if (!entry) return { offered: 0 };

    const result = await waitlistService.offer(
      entry.id,
      {
        providerId: appointment.providerId,
        slotDate: appointment.appointmentDate,
        slotStart: appointment.appointmentTime,
        slotEnd: appointment.appointmentEndTime,
        notifyPatient: true,
        notes: `Auto-offer from cancelled/no-show ${appointment.encounterNumber}`,
      },
      user,
    );

    await notificationService.notifyAppointmentEvent(appointment.id, 'waitlist.offer', {
      waitlistEntryId: entry.id,
    });

    return { offered: 1, entry: result.entry };
  },

  async getWeekCalendar(query) {
    const start = query.dateFrom ? new Date(query.dateFrom) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = query.dateTo ? new Date(query.dateTo) : addDays(start, 6);
    end.setHours(23, 59, 59, 999);

    const where = {
      appointmentDate: { gte: start, lte: end },
    };
    if (query.providerId) where.providerId = query.providerId;
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.locationId) where.locationId = query.locationId;
    if (query.status) where.status = query.status;
    if (query.appointmentTypeId) where.appointmentTypeId = query.appointmentTypeId;

    const rows = await prisma.appointment.findMany({
      where,
      orderBy: [{ appointmentDate: 'asc' }, { appointmentTime: 'asc' }],
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, mrn: true },
        },
        providerRef: {
          select: { id: true, firstName: true, lastName: true },
        },
        departmentRef: { select: { id: true, departmentName: true } },
        appointmentTypeRef: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
      },
    });

    return {
      dateFrom: start.toISOString().slice(0, 10),
      dateTo: end.toISOString().slice(0, 10),
      data: rows.map((r) => ({
        ...r,
        appointmentType: r.appointmentTypeRef?.name || null,
      })),
    };
  },

  async getPatientAppointmentHistory(patientId) {
    const rows = await prisma.appointment.findMany({
      where: { patientId },
      orderBy: { appointmentDate: 'desc' },
      select: {
        id: true,
        status: true,
        appointmentDate: true,
        appointmentTime: true,
        noShowAt: true,
        cancelledAt: true,
        cancellationFeeAmount: true,
      },
    });

    const total = rows.length;
    const completed = rows.filter((r) => r.status === 'Completed').length;
    const cancelled = rows.filter((r) => r.status === 'Cancelled').length;
    const noShow = rows.filter((r) => r.status === 'No-Show' || r.noShowAt).length;
    const rescheduled = rows.filter((r) => r.status === 'Rescheduled').length;
    const lateCancelled = rows.filter(
      (r) => r.status === 'Cancelled' && Number(r.cancellationFeeAmount || 0) > 0,
    ).length;

    return {
      patientId,
      totals: {
        total,
        completed,
        cancelled,
        lateCancelled,
        noShow,
        rescheduled,
        noShowRate: total ? Math.round((noShow / total) * 1000) / 10 : 0,
      },
      recentNoShows: rows.filter((r) => r.status === 'No-Show' || r.noShowAt).slice(0, 10),
      appointments: rows.slice(0, 50),
    };
  },

  async getReports({ dateFrom, dateTo } = {}) {
    const where = {};
    if (dateFrom || dateTo) {
      where.appointmentDate = {};
      if (dateFrom) where.appointmentDate.gte = new Date(dateFrom);
      if (dateTo) where.appointmentDate.lte = new Date(dateTo);
    }

    const [appointments, waitlist, payments, eligibility] = await Promise.all([
      prisma.appointment.findMany({
        where,
        select: {
          id: true,
          status: true,
          providerId: true,
          duration: true,
          createdAt: true,
          appointmentDate: true,
          rcmStatus: true,
        },
      }),
      prisma.waitlistEntry.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.appointmentPayment.aggregate({
        where: dateFrom || dateTo
          ? {
              collectedAt: {
                ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
                ...(dateTo ? { lte: new Date(dateTo) } : {}),
              },
            }
          : undefined,
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.insuranceEligibility.count({
        where: {
          status: { in: ['Active', 'Eligibility Verified'] },
          ...(dateFrom || dateTo
            ? {
                verifiedAt: {
                  ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
                  ...(dateTo ? { lte: new Date(dateTo) } : {}),
                },
              }
            : {}),
        },
      }),
    ]);

    const total = appointments.length || 1;
    const byStatus = appointments.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {});

    return {
      appointmentVolume: appointments.length,
      completed: byStatus.Completed || 0,
      cancellationRate: Math.round(((byStatus.Cancelled || 0) / total) * 1000) / 10,
      noShowRate: Math.round(((byStatus['No-Show'] || 0) / total) * 1000) / 10,
      rescheduleRate: Math.round(((byStatus.Rescheduled || 0) / total) * 1000) / 10,
      statusBreakdown: byStatus,
      waitlistByStatus: Object.fromEntries(
        waitlist.map((w) => [w.status, w._count._all]),
      ),
      copayCollected: Number(payments._sum.amount || 0),
      copayTransactions: payments._count._all,
      eligibilityVerifications: eligibility,
    };
  },

  async updatePolicy(body, user) {
    const policy = await appointmentPolicyService.getActivePolicy();
    const allowed = [
      'lateCancelHours',
      'lateCancelFee',
      'noShowFee',
      'allowFeeWaive',
      'blockAfterNoShowCount',
      'autoNoShowMinutesPast',
      'notifyPatientOnCancel',
      'notifyPatientOnNoShow',
      'requireDepositAfterNoShows',
      'depositAmount',
      'maxRescheduleCount',
      'reminderHoursBefore',
      'waitlistAutoOffer',
      'confirmationRequired',
      'refundPolicyNotes',
    ];
    const data = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    if (Object.keys(data).length === 0) throw httpError('No policy fields to update');
    return prisma.appointmentPolicy.update({
      where: { id: policy.id },
      data,
    });
  },

  async listRooms() {
    return prisma.room.findMany({
      where: { deletedAt: null, status: 'active' },
      orderBy: { roomNumber: 'asc' },
      select: {
        id: true,
        roomNumber: true,
        displayName: true,
        floor: true,
        unit: true,
        status: true,
      },
    });
  },

  async selfSchedule(body, user) {
    const created = await appointmentService.create(
      {
        ...body,
        status: 'Scheduled',
        notes: [body.notes, 'Self-scheduled'].filter(Boolean).join(' | '),
      },
      user,
    );
    try {
      await notificationService.notifyAppointmentEvent(created.id, 'appointment.confirmation');
    } catch (_) {
      /* ignore */
    }
    return created;
  },
};

module.exports = appointmentOpsService;
