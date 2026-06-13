const prisma = require('../lib/prisma');

const NOT_DELETED = { deletedAt: null };

const auditUserSelect = { id: true, name: true, email: true };

const auditInclude = {
  creator: { select: auditUserSelect },
  updater: { select: auditUserSelect },
  deleter: { select: auditUserSelect },
};

async function getFavouriteIds(userId, complaintIds) {
  if (!userId || !complaintIds.length) return new Set();
  const rows = await prisma.userChiefComplaintFavourite.findMany({
    where: { userId, chiefComplaintId: { in: complaintIds } },
    select: { chiefComplaintId: true },
  });
  return new Set(rows.map((r) => r.chiefComplaintId));
}

async function attachFavouriteFlag(rows, userId) {
  if (!rows.length) return rows;
  const favIds = await getFavouriteIds(
    userId,
    rows.map((r) => r.id),
  );
  return rows.map((row) => ({ ...row, isFavourite: favIds.has(row.id) }));
}

async function setFavourite(userId, chiefComplaintId, isFavourite) {
  if (isFavourite) {
    await prisma.userChiefComplaintFavourite.upsert({
      where: {
        userId_chiefComplaintId: { userId, chiefComplaintId },
      },
      create: { userId, chiefComplaintId },
      update: {},
    });
    return;
  }

  await prisma.userChiefComplaintFavourite.deleteMany({
    where: { userId, chiefComplaintId },
  });
}

function normalizeCode(code) {
  if (code == null || String(code).trim() === '') return null;
  return String(code).trim().toUpperCase();
}

const chiefComplaintService = {
  async create(data, userId) {
    const row = await prisma.chiefComplaint.create({
      data: {
        name: String(data.name).trim(),
        code: normalizeCode(data.code),
        isActive: data.isActive !== undefined ? data.isActive : true,
        sortOrder: data.sortOrder != null ? parseInt(data.sortOrder, 10) : 0,
        deletedAt: null,
        createdBy: userId,
        updatedBy: userId,
      },
      include: auditInclude,
    });

    if (data.isFavourite) {
      await setFavourite(userId, row.id, true);
    }

    return { ...row, isFavourite: !!data.isFavourite };
  },

  async findAll({ page = 1, limit = 10, search = '' }, userId) {
    const take = parseInt(limit, 10) || 10;
    const skip = (parseInt(page, 10) - 1) * take;

    const conditions = [NOT_DELETED];

    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const where = { AND: conditions };

    const [rows, total] = await Promise.all([
      prisma.chiefComplaint.findMany({
        where,
        skip,
        take,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: auditInclude,
      }),
      prisma.chiefComplaint.count({ where }),
    ]);

    const data = await attachFavouriteFlag(rows, userId);

    return {
      data,
      pagination: {
        page: parseInt(page, 10),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  },

  async findAllActive(userId) {
    const rows = await prisma.chiefComplaint.findMany({
      where: { ...NOT_DELETED, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        code: true,
        sortOrder: true,
      },
    });

    const withFav = await attachFavouriteFlag(rows, userId);
    return withFav.sort((a, b) => {
      if (a.isFavourite !== b.isFavourite) return a.isFavourite ? -1 : 1;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name);
    });
  },

  async findById(id, userId) {
    const row = await prisma.chiefComplaint.findFirst({
      where: { id, ...NOT_DELETED },
      include: auditInclude,
    });
    if (!row) return null;
    const [withFav] = await attachFavouriteFlag([row], userId);
    return withFav;
  },

  async update(id, data, userId) {
    const existing = await this.findById(id, userId);
    if (!existing) {
      const err = new Error('Chief complaint not found');
      err.statusCode = 404;
      throw err;
    }

    const payload = { updatedBy: userId };
    if (data.name !== undefined) payload.name = String(data.name).trim();
    if (data.code !== undefined) payload.code = normalizeCode(data.code);
    if (data.isActive !== undefined) payload.isActive = data.isActive;
    if (data.sortOrder !== undefined) payload.sortOrder = parseInt(data.sortOrder, 10);

    const row = await prisma.chiefComplaint.update({
      where: { id },
      data: payload,
      include: auditInclude,
    });

    if (data.isFavourite !== undefined) {
      await setFavourite(userId, id, !!data.isFavourite);
    }

    const isFavourite =
      data.isFavourite !== undefined ? !!data.isFavourite : existing.isFavourite;

    return { ...row, isFavourite };
  },

  async toggleFavourite(id, userId) {
    const existing = await this.findById(id, userId);
    if (!existing) {
      const err = new Error('Chief complaint not found');
      err.statusCode = 404;
      throw err;
    }

    const next = !existing.isFavourite;
    await setFavourite(userId, id, next);
    return { id, isFavourite: next };
  },

  async delete(id, userId) {
    const existing = await this.findById(id, userId);
    if (!existing) {
      const err = new Error('Chief complaint not found');
      err.statusCode = 404;
      throw err;
    }

    return prisma.chiefComplaint.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        isActive: false,
        updatedBy: userId,
      },
      include: auditInclude,
    });
  },
};

module.exports = chiefComplaintService;
