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
    .toUpperCase();
}

function parseDateStart(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDateEnd(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(23, 59, 59, 999);
  return d;
}

const labTestService = {
  async create(data, userId) {
    const code = normalizeCode(data.code);
    const name = String(data.name || '').trim();
    const category = String(data.category || '').trim();
    const specimenType = String(data.specimenType || '').trim();

    if (!name) {
      const err = new Error('Lab name is required');
      err.statusCode = 400;
      throw err;
    }
    if (!code) {
      const err = new Error('Lab code is required');
      err.statusCode = 400;
      throw err;
    }
    if (!category) {
      const err = new Error('Category is required');
      err.statusCode = 400;
      throw err;
    }
    if (!specimenType) {
      const err = new Error('Specimen type is required');
      err.statusCode = 400;
      throw err;
    }

    const row = await prisma.labTest.create({
      data: {
        name,
        code,
        category,
        specimenType,
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

  async findAll({
    page = 1,
    limit = 10,
    name = '',
    code = '',
    category = '',
    specimenType = '',
    isActive,
    createdFrom,
    createdTo,
  }) {
    const take = parseInt(limit, 10) || 10;
    const skip = (parseInt(page, 10) - 1) * take;
    const conditions = [NOT_DELETED];

    if (name) {
      conditions.push({ name: { contains: name, mode: 'insensitive' } });
    }
    if (code) {
      conditions.push({ code: { contains: code, mode: 'insensitive' } });
    }
    if (category) {
      conditions.push({ category: { equals: category, mode: 'insensitive' } });
    }
    if (specimenType) {
      conditions.push({ specimenType: { equals: specimenType, mode: 'insensitive' } });
    }
    if (isActive !== undefined && isActive !== '') {
      conditions.push({ isActive: isActive === 'true' || isActive === true });
    }

    const from = parseDateStart(createdFrom);
    const to = parseDateEnd(createdTo);
    if (from || to) {
      const createdAt = {};
      if (from) createdAt.gte = from;
      if (to) createdAt.lte = to;
      conditions.push({ createdAt });
    }

    const where = { AND: conditions };

    const [rows, total] = await Promise.all([
      prisma.labTest.findMany({
        where,
        skip,
        take,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: auditInclude,
      }),
      prisma.labTest.count({ where }),
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
    return prisma.labTest.findMany({
      where: { ...NOT_DELETED, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        code: true,
        category: true,
        specimenType: true,
        sortOrder: true,
      },
    });
  },

  async findById(id) {
    return prisma.labTest.findFirst({
      where: { id, ...NOT_DELETED },
      include: auditInclude,
    });
  },

  async update(id, data, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Laboratory test not found');
      err.statusCode = 404;
      throw err;
    }

    const payload = { updatedBy: userId };

    if (data.name !== undefined) {
      const name = String(data.name).trim();
      if (!name) {
        const err = new Error('Lab name cannot be empty');
        err.statusCode = 400;
        throw err;
      }
      payload.name = name;
    }
    if (data.code !== undefined) {
      const code = normalizeCode(data.code);
      if (!code) {
        const err = new Error('Lab code cannot be empty');
        err.statusCode = 400;
        throw err;
      }
      payload.code = code;
    }
    if (data.category !== undefined) {
      const category = String(data.category).trim();
      if (!category) {
        const err = new Error('Category cannot be empty');
        err.statusCode = 400;
        throw err;
      }
      payload.category = category;
    }
    if (data.specimenType !== undefined) {
      const specimenType = String(data.specimenType).trim();
      if (!specimenType) {
        const err = new Error('Specimen type cannot be empty');
        err.statusCode = 400;
        throw err;
      }
      payload.specimenType = specimenType;
    }
    if (data.isActive !== undefined) {
      payload.isActive = !!data.isActive;
    }
    if (data.sortOrder !== undefined) {
      payload.sortOrder = parseInt(data.sortOrder, 10);
    }

    return prisma.labTest.update({
      where: { id },
      data: payload,
      include: auditInclude,
    });
  },

  async delete(id, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Laboratory test not found');
      err.statusCode = 404;
      throw err;
    }

    const orderCount = await prisma.order.count({
      where: {
        category: 'Lab',
        procedureCode: { equals: existing.code, mode: 'insensitive' },
      },
    });

    if (orderCount > 0) {
      await prisma.labTest.update({
        where: { id },
        data: {
          isActive: false,
          updatedBy: userId,
        },
      });
      return {
        success: true,
        deactivated: true,
        message:
          'Laboratory test has been used in patient orders and was marked as inactive instead of deleted.',
      };
    }

    await prisma.labTest.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        isActive: false,
        updatedBy: userId,
      },
    });

    return {
      success: true,
      deactivated: false,
      message: 'Laboratory test deleted successfully',
    };
  },
};

module.exports = labTestService;
