const prisma = require('../lib/prisma');

const NOT_DELETED = { deletedAt: null };

const auditUserSelect = { id: true, name: true, email: true };

const auditInclude = {
  creator: { select: auditUserSelect },
  updater: { select: auditUserSelect },
  deleter: { select: auditUserSelect },
};

function normalizeCode(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

const roomTypeService = {
  async create(data, userId) {
    const code = normalizeCode(data.code);
    const label = String(data.label || '').trim();

    if (!code) {
      const err = new Error('Room type code is required');
      err.statusCode = 400;
      throw err;
    }
    if (!label) {
      const err = new Error('Display name is required');
      err.statusCode = 400;
      throw err;
    }

    const row = await prisma.roomType.create({
      data: {
        code,
        label,
        isActive: data.isActive !== false,
        sortOrder: data.sortOrder != null ? parseInt(data.sortOrder, 10) : 0,
        deletedAt: null,
        createdBy: userId,
        updatedBy: userId,
      },
      include: auditInclude,
    });

    return row;
  },

  async findAll({ page = 1, limit = 10, search = '', isActive }) {
    const take = parseInt(limit, 10) || 10;
    const skip = (parseInt(page, 10) - 1) * take;
    const conditions = [NOT_DELETED];

    if (search) {
      conditions.push({
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { label: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (isActive !== undefined && isActive !== '') {
      conditions.push({ isActive: isActive === 'true' || isActive === true });
    }

    const where = { AND: conditions };

    const [rows, total] = await Promise.all([
      prisma.roomType.findMany({
        where,
        skip,
        take,
        orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
        include: auditInclude,
      }),
      prisma.roomType.count({ where }),
    ]);

    return {
      data: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: take,
        total,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  },

  async findAllActive() {
    return prisma.roomType.findMany({
      where: { ...NOT_DELETED, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
      select: {
        id: true,
        code: true,
        label: true,
        sortOrder: true,
      },
    });
  },

  async findById(id) {
    return prisma.roomType.findFirst({
      where: { id, ...NOT_DELETED },
      include: auditInclude,
    });
  },

  async update(id, data, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Room type not found');
      err.statusCode = 404;
      throw err;
    }

    const payload = { updatedBy: userId };

    if (data.code !== undefined) {
      const code = normalizeCode(data.code);
      if (!code) {
        const err = new Error('Room type code cannot be empty');
        err.statusCode = 400;
        throw err;
      }
      payload.code = code;
    }
    if (data.label !== undefined) {
      const label = String(data.label).trim();
      if (!label) {
        const err = new Error('Display name cannot be empty');
        err.statusCode = 400;
        throw err;
      }
      payload.label = label;
    }
    if (data.isActive !== undefined) {
      payload.isActive = !!data.isActive;
    }
    if (data.sortOrder !== undefined) {
      payload.sortOrder = parseInt(data.sortOrder, 10);
    }

    return prisma.roomType.update({
      where: { id },
      data: payload,
      include: auditInclude,
    });
  },

  async delete(id, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Room type not found');
      err.statusCode = 404;
      throw err;
    }

    await prisma.roomType.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        isActive: false,
        updatedBy: userId,
      },
    });

    return { success: true };
  },
};

module.exports = roomTypeService;
