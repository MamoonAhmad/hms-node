const prisma = require('../lib/prisma');
const { money, toDateOnly, formatPatientName } = require('./claimEngine.service');

const statementCycleService = {
  async list(query = {}) {
    const where = {};
    if (query.status) where.status = query.status;
    const rows = await prisma.statementCycle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(query.limit) || 50,
    });
    return {
      data: rows.map((r) => ({
        ...r,
        totalBalance: Number(r.totalBalance),
        periodFrom: toDateOnly(r.periodFrom),
        periodTo: toDateOnly(r.periodTo),
      })),
    };
  },

  async getById(id) {
    const cycle = await prisma.statementCycle.findUnique({ where: { id } });
    if (!cycle) {
      const err = new Error('Statement cycle not found');
      err.statusCode = 404;
      throw err;
    }
    return { ...cycle, totalBalance: Number(cycle.totalBalance) };
  },

  /**
   * Create a billing cycle and mark eligible patients' statements as generated.
   * PDF/mail is deferred; delivery flags + snapshot rows are durable.
   */
  async createAndRun(body, user) {
    const minBalance = body.minBalance != null ? money(body.minBalance) : 0.01;
    const deliveryChannel = body.deliveryChannel || 'email';

    const patients = await prisma.patient.findMany({
      where: {
        deletedAt: null,
        accountBalance: { gte: minBalance },
        OR: [
          { collectionStatus: null },
          { collectionStatus: { notIn: ['in_collections', 'closed'] } },
        ],
      },
      select: {
        id: true,
        mrn: true,
        firstName: true,
        middleName: true,
        lastName: true,
        accountBalance: true,
        email: true,
        preferredContactMethod: true,
      },
      take: Number(body.limit) || 500,
    });

    const totalBalance = money(patients.reduce((s, p) => s + Number(p.accountBalance || 0), 0));
    const cycleNumber = body.cycleNumber
      || `STMT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;

    const cycle = await prisma.statementCycle.create({
      data: {
        cycleNumber,
        periodFrom: body.periodFrom ? new Date(body.periodFrom) : new Date(Date.now() - 30 * 86400000),
        periodTo: body.periodTo ? new Date(body.periodTo) : new Date(),
        status: 'running',
        statementCount: 0,
        totalBalance,
        deliveryChannel,
        notes: body.notes || null,
        createdBy: user?.id || null,
        startedAt: new Date(),
      },
    });

    const statements = [];
    for (const patient of patients) {
      const balance = Number(patient.accountBalance || 0);
      if (balance < minBalance) continue;

      const statementNumber = `${cycle.cycleNumber}-${patient.mrn || patient.id.slice(0, 8)}`;
      let statementRow = null;
      try {
        statementRow = await prisma.patientStatement.create({
          data: {
            patientId: patient.id,
            statementNumber,
            periodFrom: cycle.periodFrom,
            periodTo: cycle.periodTo,
            balance,
            status: body.markSent ? 'sent' : 'generated',
            deliveryChannel,
            sentAt: body.markSent ? new Date() : null,
            snapshot: {
              cycleId: cycle.id,
              cycleNumber: cycle.cycleNumber,
              patientName: formatPatientName(patient),
            },
            generatedBy: user?.id || null,
          },
        });
      } catch {
        statementRow = null;
      }

      await prisma.patient.update({
        where: { id: patient.id },
        data: { lastStatementAt: new Date(), updatedBy: user?.id || null },
      });

      statements.push({
        patientId: patient.id,
        patientName: formatPatientName(patient),
        mrn: patient.mrn,
        balance,
        statementId: statementRow?.id || null,
        channel: deliveryChannel,
      });
    }

    const updated = await prisma.statementCycle.update({
      where: { id: cycle.id },
      data: {
        status: 'completed',
        statementCount: statements.length,
        totalBalance: money(statements.reduce((s, row) => s + row.balance, 0)),
        completedAt: new Date(),
        notes: JSON.stringify({ preview: statements.slice(0, 25), count: statements.length }),
      },
    });

    return {
      cycle: {
        ...updated,
        totalBalance: Number(updated.totalBalance),
        periodFrom: toDateOnly(updated.periodFrom),
        periodTo: toDateOnly(updated.periodTo),
      },
      statements,
    };
  },

  async markSent(id, user) {
    const cycle = await prisma.statementCycle.findUnique({ where: { id } });
    if (!cycle) {
      const err = new Error('Statement cycle not found');
      err.statusCode = 404;
      throw err;
    }
    return prisma.statementCycle.update({
      where: { id },
      data: {
        status: 'sent',
        notes: [cycle.notes, `Marked sent by ${user?.email || user?.id || 'user'} at ${new Date().toISOString()}`]
          .filter(Boolean)
          .join('\n'),
      },
    });
  },
};

module.exports = statementCycleService;
