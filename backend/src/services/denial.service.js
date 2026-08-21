const prisma = require('../lib/prisma');
const { toDateOnly, formatPatientName, money } = require('./claimEngine.service');

const denialService = {
  async listDenials(query = {}) {
    const where = {};
    if (query.status && query.status !== 'all') where.status = query.status;
    if (query.patientId) where.patientId = query.patientId;
    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { denialCode: { contains: term, mode: 'insensitive' } },
        { denialReason: { contains: term, mode: 'insensitive' } },
        { claim: { claimNumber: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
    const [total, rows] = await Promise.all([
      prisma.denialCase.count({ where }),
      prisma.denialCase.findMany({
        where,
        include: {
          claim: {
            include: {
              patient: { select: { id: true, mrn: true, firstName: true, middleName: true, lastName: true } },
              appointment: { select: { appointmentDate: true } },
            },
          },
          appeals: { orderBy: { appealLevel: 'desc' }, take: 1 },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: rows.map((d) => ({
        id: d.id,
        claimId: d.claimId,
        claimNumber: d.claim?.claimNumber,
        patientId: d.patientId,
        patientName: formatPatientName(d.claim?.patient),
        patientMrn: d.claim?.patient?.mrn,
        dos: toDateOnly(d.claim?.appointment?.appointmentDate),
        denialCode: d.denialCode,
        denialReason: d.denialReason,
        carcCode: d.carcCode,
        rarcCode: d.rarcCode,
        status: d.status,
        deniedAmount: d.deniedAmount != null ? Number(d.deniedAmount) : null,
        assignedTo: d.assignedTo,
        dueDate: toDateOnly(d.dueDate),
        latestAppeal: d.appeals?.[0] || null,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    };
  },

  async createDenial(body, user) {
    const claim = await prisma.patientClaim.findUnique({ where: { id: body.claimId } });
    if (!claim) {
      const err = new Error('Claim not found');
      err.statusCode = 404;
      throw err;
    }

    const denial = await prisma.denialCase.create({
      data: {
        claimId: claim.id,
        patientId: claim.patientId,
        denialCode: body.denialCode || null,
        denialReason: body.denialReason || null,
        carcCode: body.carcCode || body.denialCode || null,
        rarcCode: body.rarcCode || null,
        status: 'open',
        deniedAmount: body.deniedAmount != null ? money(body.deniedAmount) : Number(claim.billedAmount || 0),
        assignedTo: body.assignedTo || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : new Date(Date.now() + 7 * 86400000),
        notes: body.notes || null,
        createdBy: user?.id || null,
      },
    });

    await prisma.patientClaim.update({
      where: { id: claim.id },
      data: {
        claimStatus: 'denied',
        denialCode: denial.denialCode,
        denialReason: denial.denialReason,
      },
    });

    await prisma.followUpTask.create({
      data: {
        claimId: claim.id,
        patientId: claim.patientId,
        taskType: 'denial_follow_up',
        status: 'open',
        priority: 'high',
        summary: `Denial: ${denial.denialCode || 'review'} — ${claim.claimNumber}`,
        notes: denial.denialReason,
        assignee: body.assignedTo || null,
        dueDate: denial.dueDate,
        createdBy: user?.id || null,
      },
    });

    await prisma.claimEvent.create({
      data: {
        claimId: claim.id,
        eventType: 'denied',
        fromStatus: claim.claimStatus,
        toStatus: 'denied',
        summary: 'Denial case opened',
        details: { denialId: denial.id },
        createdBy: user?.id || null,
      },
    });

    return denial;
  },

  async updateDenial(id, body, user) {
    const denial = await prisma.denialCase.update({
      where: { id },
      data: {
        status: body.status || undefined,
        assignedTo: body.assignedTo !== undefined ? body.assignedTo : undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
        denialReason: body.denialReason !== undefined ? body.denialReason : undefined,
      },
    });
    return denial;
  },

  async createAppeal(denialId, body, user) {
    const denial = await prisma.denialCase.findUnique({
      where: { id: denialId },
      include: { appeals: true },
    });
    if (!denial) {
      const err = new Error('Denial not found');
      err.statusCode = 404;
      throw err;
    }

    const level = body.appealLevel || (denial.appeals.length + 1);
    const appeal = await prisma.appealCase.create({
      data: {
        denialId,
        claimId: denial.claimId,
        status: body.submit ? 'submitted' : 'draft',
        appealLevel: level,
        reason: body.reason || null,
        notes: body.notes || null,
        submittedAt: body.submit ? new Date() : null,
        createdBy: user?.id || null,
      },
    });

    await prisma.denialCase.update({
      where: { id: denialId },
      data: { status: 'appealing' },
    });

    await prisma.patientClaim.update({
      where: { id: denial.claimId },
      data: { claimStatus: 'appealing' },
    });

    await prisma.claimEvent.create({
      data: {
        claimId: denial.claimId,
        eventType: 'appeal_created',
        fromStatus: 'denied',
        toStatus: 'appealing',
        summary: `Appeal level ${level} ${appeal.status}`,
        details: { appealId: appeal.id },
        createdBy: user?.id || null,
      },
    });

    await prisma.followUpTask.create({
      data: {
        claimId: denial.claimId,
        patientId: denial.patientId,
        taskType: 'appeal_follow_up',
        status: 'open',
        priority: 'normal',
        summary: `Appeal L${level} for claim`,
        notes: body.reason || null,
        dueDate: new Date(Date.now() + 14 * 86400000),
        createdBy: user?.id || null,
      },
    });

    return appeal;
  },

  async decideAppeal(appealId, body, user) {
    const appeal = await prisma.appealCase.findUnique({ where: { id: appealId } });
    if (!appeal) {
      const err = new Error('Appeal not found');
      err.statusCode = 404;
      throw err;
    }

    const decision = body.decision === 'upheld' ? 'upheld' : 'overturned';
    const updated = await prisma.appealCase.update({
      where: { id: appealId },
      data: {
        status: decision,
        decision,
        decisionAt: new Date(),
        notes: body.notes || appeal.notes,
      },
    });

    if (decision === 'overturned') {
      await prisma.denialCase.update({
        where: { id: appeal.denialId },
        data: { status: 'resolved' },
      });
      await prisma.patientClaim.update({
        where: { id: appeal.claimId },
        data: { claimStatus: body.claimStatus || 'accepted', denialReason: null },
      });
    } else {
      await prisma.denialCase.update({
        where: { id: appeal.denialId },
        data: { status: 'closed' },
      });
      await prisma.patientClaim.update({
        where: { id: appeal.claimId },
        data: { claimStatus: 'denied' },
      });
    }

    await prisma.claimEvent.create({
      data: {
        claimId: appeal.claimId,
        eventType: 'appeal_decision',
        toStatus: decision === 'overturned' ? 'accepted' : 'denied',
        summary: `Appeal ${decision}`,
        details: { appealId, decision },
        createdBy: user?.id || null,
      },
    });

    return updated;
  },

  async listFollowUps(query = {}) {
    const where = {};
    if (query.status && query.status !== 'all') where.status = query.status;
    else if (!query.includeClosed) where.status = { in: ['open', 'in_progress'] };
    if (query.taskType) where.taskType = query.taskType;
    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { summary: { contains: term, mode: 'insensitive' } },
        { notes: { contains: term, mode: 'insensitive' } },
        { claim: { claimNumber: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
    const [total, rows] = await Promise.all([
      prisma.followUpTask.count({ where }),
      prisma.followUpTask.findMany({
        where,
        include: {
          claim: {
            include: {
              patient: { select: { id: true, mrn: true, firstName: true, middleName: true, lastName: true } },
              appointment: { select: { appointmentDate: true } },
              denials: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
          },
        },
        orderBy: [{ dueDate: 'asc' }, { updatedAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: rows.map((t) => {
        const claim = t.claim;
        const billed = Number(claim?.billedAmount || 0);
        const paid = Number(claim?.paidAmount || 0);
        const adj = Number(claim?.adjustmentAmount || 0);
        const balance = money(billed - paid - Math.abs(adj));
        return {
          id: t.id,
          claimId: t.claimId,
          claimNumber: claim?.claimNumber || '',
          patientName: formatPatientName(claim?.patient),
          patientId: t.patientId || claim?.patientId,
          dos: toDateOnly(claim?.appointment?.appointmentDate),
          currentPayer: claim?.payerName || '',
          lastBilledDate: toDateOnly(claim?.submittedAt),
          balance: balance < 0 ? 0 : balance,
          claimFollowUpDate: toDateOnly(t.dueDate),
          lastNote: t.notes || t.summary || '',
          lastNoteDate: toDateOnly(t.updatedAt),
          lastNoteUser: t.assignee || t.createdBy || '',
          status: String(claim?.claimStatus || t.status || '').toUpperCase(),
          claimType: claim?.formType === 'UB-04' ? 'Institutional' : 'Professional',
          firstBilledDate: toDateOnly(claim?.submittedAt),
          lastClaimStatus: claim?.claimStatus || '',
          taskDueDate: toDateOnly(t.dueDate),
          hasAlert: t.priority === 'high' || Boolean(claim?.denials?.length),
          taskType: t.taskType,
          taskStatus: t.status,
          priority: t.priority,
        };
      }),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    };
  },

  async createFollowUp(body, user) {
    return prisma.followUpTask.create({
      data: {
        claimId: body.claimId || null,
        patientId: body.patientId || null,
        appointmentId: body.appointmentId || null,
        taskType: body.taskType || 'follow_up',
        status: 'open',
        priority: body.priority || 'normal',
        summary: body.summary || null,
        notes: body.notes || null,
        assignee: body.assignee || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        createdBy: user?.id || null,
      },
    });
  },

  async completeFollowUp(id, user) {
    return prisma.followUpTask.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });
  },
};

module.exports = denialService;
