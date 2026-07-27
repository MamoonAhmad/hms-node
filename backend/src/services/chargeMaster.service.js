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
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toNumberOrNull(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function blankToNull(value) {
  if (value == null) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

function serializeRow(row) {
  if (!row) return null;
  return {
    ...row,
    standardAmount: row.standardAmount != null ? Number(row.standardAmount) : null,
    totalRevenue: row.totalRevenue != null ? Number(row.totalRevenue) : null,
    totalVolume: row.totalVolume != null ? Number(row.totalVolume) : null,
    percentageIncreased:
      row.percentageIncreased != null ? Number(row.percentageIncreased) : null,
    discountPercent: row.discountPercent != null ? Number(row.discountPercent) : null,
    priceEffectiveDate: row.priceEffectiveDate
      ? row.priceEffectiveDate.toISOString().slice(0, 10)
      : '',
    cptEffectiveDate: row.cptEffectiveDate
      ? row.cptEffectiveDate.toISOString().slice(0, 10)
      : '',
    createdByName: row.creator?.name || null,
    updatedByName: row.updater?.name || null,
  };
}

function mapPayload(data) {
  return {
    cptCode: String(data.cptCode || '').trim(),
    description: String(data.description || '').trim(),
    revenueCode: String(data.revenueCode || '').trim(),
    priceEffectiveDate: parseDateInput(data.priceEffectiveDate),
    cptEffectiveDate: parseDateInput(data.cptEffectiveDate),
    standardAmount: toNumberOrNull(data.standardAmount),
    totalRevenue: toNumberOrNull(data.totalRevenue),
    totalVolume: toNumberOrNull(data.totalVolume),
    percentageIncreased: toNumberOrNull(data.percentageIncreased) ?? 0,
    category: blankToNull(data.category),
    genericDepartment: blankToNull(data.genericDepartment),
    discountPercent: toNumberOrNull(data.discountPercent) ?? 0,
    location: String(data.location || '').trim(),
    payer: blankToNull(data.payer),
    isActive: data.isActive !== undefined ? !!data.isActive : true,
  };
}

const chargeMasterService = {
  async create(data, userId) {
    const payload = mapPayload(data);
    if (!payload.cptCode) {
      const err = new Error('CPT Code is required');
      err.statusCode = 400;
      throw err;
    }
    if (!payload.description) {
      const err = new Error('Description is required');
      err.statusCode = 400;
      throw err;
    }
    if (!payload.revenueCode) {
      const err = new Error('Revenue Code is required');
      err.statusCode = 400;
      throw err;
    }
    if (!payload.priceEffectiveDate) {
      const err = new Error('Price Effective Date is required');
      err.statusCode = 400;
      throw err;
    }
    if (payload.standardAmount == null || payload.standardAmount <= 0) {
      const err = new Error('Standard Amount must be greater than 0');
      err.statusCode = 400;
      throw err;
    }
    if (!payload.location) {
      const err = new Error('Location is required');
      err.statusCode = 400;
      throw err;
    }

    const row = await prisma.chargeMaster.create({
      data: {
        ...payload,
        deletedAt: null,
        createdBy: userId,
        updatedBy: userId,
      },
      include: auditInclude,
    });
    return serializeRow(row);
  },

  async findAll({
    page = 1,
    limit = 10,
    search = '',
    location = '',
    category = '',
    payer = '',
    genericDepartment = '',
    isActive,
  } = {}) {
    const take = parseInt(limit, 10) || 10;
    const skip = (parseInt(page, 10) - 1) * take;
    const conditions = [NOT_DELETED];

    if (search) {
      conditions.push({
        OR: [
          { cptCode: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { revenueCode: { contains: search, mode: 'insensitive' } },
          { payer: { contains: search, mode: 'insensitive' } },
        ],
      });
    }
    if (location) {
      conditions.push({ location: { equals: location, mode: 'insensitive' } });
    }
    if (category) {
      conditions.push({ category: { equals: category, mode: 'insensitive' } });
    }
    if (payer) {
      conditions.push({ payer: { equals: payer, mode: 'insensitive' } });
    }
    if (genericDepartment) {
      conditions.push({
        genericDepartment: { equals: genericDepartment, mode: 'insensitive' },
      });
    }
    if (isActive === true || isActive === false) {
      conditions.push({ isActive });
    }

    const where = { AND: conditions };

    const [rows, total, filterRows] = await Promise.all([
      prisma.chargeMaster.findMany({
        where,
        skip,
        take,
        orderBy: [{ cptCode: 'asc' }, { createdAt: 'desc' }],
        include: auditInclude,
      }),
      prisma.chargeMaster.count({ where }),
      prisma.chargeMaster.findMany({
        where: NOT_DELETED,
        select: {
          location: true,
          category: true,
          payer: true,
          genericDepartment: true,
        },
      }),
    ]);

    const uniq = (values) =>
      [...new Set(values.map((v) => (v || '').trim()).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' }),
      );

    return {
      data: rows.map(serializeRow),
      pagination: {
        page: parseInt(page, 10) || 1,
        limit: take,
        total,
        totalPages: Math.ceil(total / take) || 1,
      },
      filters: {
        locations: uniq(filterRows.map((r) => r.location)),
        categories: uniq(filterRows.map((r) => r.category)),
        payers: uniq(filterRows.map((r) => r.payer)),
        departments: uniq(filterRows.map((r) => r.genericDepartment)),
      },
    };
  },

  async findById(id) {
    const row = await prisma.chargeMaster.findFirst({
      where: { id, ...NOT_DELETED },
      include: auditInclude,
    });
    return serializeRow(row);
  },

  async update(id, data, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Charge master not found');
      err.statusCode = 404;
      throw err;
    }

    const mapped = mapPayload({ ...existing, ...data });
    if (data.cptCode !== undefined && !mapped.cptCode) {
      const err = new Error('CPT Code cannot be empty');
      err.statusCode = 400;
      throw err;
    }
    if (data.description !== undefined && !mapped.description) {
      const err = new Error('Description cannot be empty');
      err.statusCode = 400;
      throw err;
    }
    if (data.standardAmount !== undefined && (mapped.standardAmount == null || mapped.standardAmount <= 0)) {
      const err = new Error('Standard Amount must be greater than 0');
      err.statusCode = 400;
      throw err;
    }

    const row = await prisma.chargeMaster.update({
      where: { id },
      data: {
        ...mapped,
        updatedBy: userId,
      },
      include: auditInclude,
    });
    return serializeRow(row);
  },

  async delete(id, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Charge master not found');
      err.statusCode = 404;
      throw err;
    }

    await prisma.chargeMaster.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        updatedBy: userId,
      },
    });
    return true;
  },
};

module.exports = chargeMasterService;
