const prisma = require('../lib/prisma');

const NOT_DELETED = { deletedAt: null };

const auditUserSelect = { id: true, name: true, email: true };

const auditInclude = {
  creator: { select: auditUserSelect },
  updater: { select: auditUserSelect },
  deleter: { select: auditUserSelect },
};

function normalizeName(data) {
  const name = data.name || data.categoryName;
  return String(name || '').trim();
}

const procedureCategoryService = {
  async create(data, userId) {
    const name = normalizeName(data);
    if (!name) {
      const err = new Error('Category name is required');
      err.statusCode = 400;
      throw err;
    }

    return prisma.procedureCategory.create({
      data: {
        name,
        deletedAt: null,
        createdBy: userId,
        updatedBy: userId,
      },
      include: auditInclude,
    });
  },

  async findAll({ page = 1, limit = 10, search = '' }) {
    const take = parseInt(limit, 10) || 10;
    const skip = (parseInt(page, 10) - 1) * take;
    const conditions = [NOT_DELETED];

    if (search) {
      conditions.push({ name: { contains: search, mode: 'insensitive' } });
    }

    const where = { AND: conditions };

    const [rows, total] = await Promise.all([
      prisma.procedureCategory.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: auditInclude,
      }),
      prisma.procedureCategory.count({ where }),
    ]);

    return {
      data: rows.map((row) => ({ ...row, categoryName: row.name })),
      pagination: {
        page: parseInt(page, 10),
        limit: take,
        total,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  },

  async findAllActive() {
    const rows = await prisma.procedureCategory.findMany({
      where: NOT_DELETED,
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    return rows.map((row) => ({ ...row, categoryName: row.name }));
  },

  async findById(id) {
    const row = await prisma.procedureCategory.findFirst({
      where: { id, ...NOT_DELETED },
      include: auditInclude,
    });
    return row ? { ...row, categoryName: row.name } : null;
  },

  async update(id, data, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Procedure category not found');
      err.statusCode = 404;
      throw err;
    }

    const payload = { updatedBy: userId };
    if (data.name !== undefined || data.categoryName !== undefined) {
      const name = normalizeName(data);
      if (!name) {
        const err = new Error('Category name cannot be empty');
        err.statusCode = 400;
        throw err;
      }
      payload.name = name;
    }

    const row = await prisma.procedureCategory.update({
      where: { id },
      data: payload,
      include: auditInclude,
    });
    return { ...row, categoryName: row.name };
  },

  async delete(id, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Procedure category not found');
      err.statusCode = 404;
      throw err;
    }

    return prisma.procedureCategory.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        updatedBy: userId,
      },
      include: auditInclude,
    });
  },
};

module.exports = procedureCategoryService;
