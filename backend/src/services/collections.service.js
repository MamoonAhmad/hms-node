const prisma = require('../lib/prisma');
const patientLedgerService = require('./patientLedger.service');
const { formatPatientName, money, toDateOnly } = require('./claimEngine.service');

const collectionsService = {
  async list(query = {}) {
    const where = {};
    if (query.status && query.status !== 'all') where.status = query.status;
    if (query.patientId) where.patientId = query.patientId;

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
    const [total, rows] = await Promise.all([
      prisma.collectionAccount.count({ where }),
      prisma.collectionAccount.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const patientIds = [...new Set(rows.map((r) => r.patientId))];
    const patients = await prisma.patient.findMany({
      where: { id: { in: patientIds } },
      select: { id: true, mrn: true, firstName: true, middleName: true, lastName: true, accountBalance: true, collectionStatus: true },
    });
    const byId = Object.fromEntries(patients.map((p) => [p.id, p]));

    return {
      data: rows.map((r) => ({
        ...r,
        balanceAtPlacement: Number(r.balanceAtPlacement),
        currentBalance: Number(r.currentBalance),
        nextActionDate: toDateOnly(r.nextActionDate),
        placedAt: r.placedAt,
        patient: byId[r.patientId] || null,
        patientName: formatPatientName(byId[r.patientId]),
        patientMrn: byId[r.patientId]?.mrn || null,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    };
  },

  async place(body, user) {
    const patient = await prisma.patient.findUnique({ where: { id: body.patientId } });
    if (!patient) {
      const err = new Error('Patient not found');
      err.statusCode = 404;
      throw err;
    }

    const aging = await patientLedgerService.getAging(patient.id);
    const balance = body.balanceAtPlacement != null ? money(body.balanceAtPlacement) : aging.total;

    const account = await prisma.collectionAccount.create({
      data: {
        patientId: patient.id,
        status: 'active',
        agencyName: body.agencyName || 'Internal Collections',
        balanceAtPlacement: balance,
        currentBalance: balance,
        dunningLevel: body.dunningLevel || 1,
        nextActionDate: body.nextActionDate ? new Date(body.nextActionDate) : new Date(Date.now() + 14 * 86400000),
        notes: body.notes || null,
        createdBy: user?.id || null,
      },
    });

    await prisma.patient.update({
      where: { id: patient.id },
      data: { collectionStatus: 'in_collections' },
    });

    await prisma.followUpTask.create({
      data: {
        patientId: patient.id,
        taskType: 'collections',
        status: 'open',
        priority: 'high',
        summary: `Collections placement — ${account.agencyName}`,
        notes: body.notes || null,
        dueDate: account.nextActionDate,
        createdBy: user?.id || null,
      },
    });

    return account;
  },

  async update(id, body, user) {
    const data = {
      status: body.status || undefined,
      agencyName: body.agencyName !== undefined ? body.agencyName : undefined,
      currentBalance: body.currentBalance != null ? money(body.currentBalance) : undefined,
      dunningLevel: body.dunningLevel != null ? Number(body.dunningLevel) : undefined,
      nextActionDate: body.nextActionDate ? new Date(body.nextActionDate) : undefined,
      notes: body.notes !== undefined ? body.notes : undefined,
      closedAt: body.status === 'closed' || body.status === 'paid' ? new Date() : undefined,
    };

    const account = await prisma.collectionAccount.update({ where: { id }, data });

    if (body.status === 'closed' || body.status === 'paid' || body.status === 'recalled') {
      await prisma.patient.update({
        where: { id: account.patientId },
        data: {
          collectionStatus: body.status === 'paid' ? 'paid' : body.status === 'recalled' ? 'active' : 'closed',
        },
      });
    }

    return account;
  },

  async advanceDunning(id, user) {
    const account = await prisma.collectionAccount.findUnique({ where: { id } });
    if (!account) {
      const err = new Error('Collection account not found');
      err.statusCode = 404;
      throw err;
    }
    const level = Math.min(5, (account.dunningLevel || 1) + 1);
    return prisma.collectionAccount.update({
      where: { id },
      data: {
        dunningLevel: level,
        nextActionDate: new Date(Date.now() + 14 * 86400000),
        notes: [account.notes, `Dunning advanced to level ${level}`].filter(Boolean).join('\n'),
      },
    });
  },
};

module.exports = collectionsService;
