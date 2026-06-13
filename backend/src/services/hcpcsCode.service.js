const prisma = require('../lib/prisma');

const NOT_DELETED = { deletedAt: null };

const auditUserSelect = { id: true, name: true, email: true };

const auditInclude = {
  creator: { select: auditUserSelect },
  updater: { select: auditUserSelect },
  deleter: { select: auditUserSelect },
};

function parseDateInput(value) {
  if (value == null || value === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function serializeRow(row) {
  if (!row) return null;
  return {
    ...row,
    effectiveDate: row.effectiveDate ? row.effectiveDate.toISOString().slice(0, 10) : '',
    expiryDate: row.expiryDate ? row.expiryDate.toISOString().slice(0, 10) : '',
  };
}

const hcpcsCodeService = {
  async create(data, userId) {
    const code = String(data.code || '').trim();
    const description = String(data.description || '').trim();

    if (!code) {
      const err = new Error('Code is required');
      err.statusCode = 400;
      throw err;
    }
    if (!description) {
      const err = new Error('Description is required');
      err.statusCode = 400;
      throw err;
    }

    const row = await prisma.hcpcsCode.create({
      data: {
        code,
        description,
        effectiveDate: parseDateInput(data.effectiveDate),
        expiryDate: parseDateInput(data.expiryDate),
        deletedAt: null,
        createdBy: userId,
        updatedBy: userId,
      },
      include: auditInclude,
    });

    return serializeRow(row);
  },

  async findAll({ page = 1, limit = 10, search = '' }) {
    const take = parseInt(limit, 10) || 10;
    const skip = (parseInt(page, 10) - 1) * take;
    const conditions = [NOT_DELETED];

    if (search) {
      conditions.push({
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const where = { AND: conditions };

    const [rows, total] = await Promise.all([
      prisma.hcpcsCode.findMany({
        where,
        skip,
        take,
        orderBy: [{ code: 'asc' }],
        include: auditInclude,
      }),
      prisma.hcpcsCode.count({ where }),
    ]);

    return {
      data: rows.map(serializeRow),
      pagination: {
        page: parseInt(page, 10),
        limit: take,
        total,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  },

  async findById(id) {
    const row = await prisma.hcpcsCode.findFirst({
      where: { id, ...NOT_DELETED },
      include: auditInclude,
    });
    return serializeRow(row);
  },

  async update(id, data, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('HCPCS code not found');
      err.statusCode = 404;
      throw err;
    }

    const payload = { updatedBy: userId };

    if (data.code !== undefined) {
      const code = String(data.code).trim();
      if (!code) {
        const err = new Error('Code cannot be empty');
        err.statusCode = 400;
        throw err;
      }
      payload.code = code;
    }
    if (data.description !== undefined) {
      const description = String(data.description).trim();
      if (!description) {
        const err = new Error('Description cannot be empty');
        err.statusCode = 400;
        throw err;
      }
      payload.description = description;
    }
    if (data.effectiveDate !== undefined) {
      payload.effectiveDate = parseDateInput(data.effectiveDate);
    }
    if (data.expiryDate !== undefined) {
      payload.expiryDate = parseDateInput(data.expiryDate);
    }

    const row = await prisma.hcpcsCode.update({
      where: { id },
      data: payload,
      include: auditInclude,
    });

    return serializeRow(row);
  },

  async delete(id, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('HCPCS code not found');
      err.statusCode = 404;
      throw err;
    }

    await prisma.hcpcsCode.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        updatedBy: userId,
      },
    });

    return { success: true };
  },
};

module.exports = hcpcsCodeService;
