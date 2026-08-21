const prisma = require('../lib/prisma');
const { emptyToNull, boolOrDefault } = require('../lib/codeCatalog');

const NOT_DELETED = { deletedAt: null };

const auditUserSelect = { id: true, name: true, email: true };

const auditInclude = {
  creator: { select: auditUserSelect },
  updater: { select: auditUserSelect },
  deleter: { select: auditUserSelect },
};

function buildPayload(data, { requireName = false } = {}) {
  const payload = {};

  if (data.name !== undefined || requireName) {
    const name = String(data.name || '').trim();
    if (!name) {
      const err = new Error('Name is required');
      err.statusCode = 400;
      throw err;
    }
    payload.name = name;
  }

  if (data.code !== undefined) payload.code = emptyToNull(data.code);
  if (data.npi !== undefined) payload.npi = emptyToNull(data.npi);
  if (data.taxId !== undefined) payload.taxId = emptyToNull(data.taxId);
  if (data.address !== undefined) payload.address = emptyToNull(data.address);
  if (data.isActive !== undefined) payload.isActive = boolOrDefault(data.isActive, true);

  return payload;
}

function applyFilters(conditions, query = {}) {
  const lookup = query.lookup === true || query.lookup === 'true';
  const status = query.status || (query.isActive === true ? 'active' : query.isActive === false ? 'inactive' : 'all');

  if (lookup || status === 'active' || query.isActive === true) {
    conditions.push({ isActive: true });
  } else if (status === 'inactive' || query.isActive === false) {
    conditions.push({ isActive: false });
  }

  if (query.search) {
    conditions.push({
      OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { npi: { contains: query.search, mode: 'insensitive' } },
        { taxId: { contains: query.search, mode: 'insensitive' } },
        { address: { contains: query.search, mode: 'insensitive' } },
      ],
    });
  }
}

const billingProviderService = {
  async create(data, userId) {
    const payload = buildPayload(data, { requireName: true });
    const row = await prisma.billingProvider.create({
      data: {
        ...payload,
        isActive: payload.isActive !== false,
        deletedAt: null,
        createdBy: userId,
        updatedBy: userId,
      },
      include: auditInclude,
    });
    return row;
  },

  async findAll(query = {}) {
    const take = parseInt(query.limit, 10) || 10;
    const skip = (parseInt(query.page, 10) - 1) * take;
    const conditions = [NOT_DELETED];
    applyFilters(conditions, query);

    const where = { AND: conditions };
    const [rows, total] = await Promise.all([
      prisma.billingProvider.findMany({
        where,
        skip,
        take,
        orderBy: [{ name: 'asc' }],
        include: auditInclude,
      }),
      prisma.billingProvider.count({ where }),
    ]);

    return {
      data: rows,
      pagination: {
        page: parseInt(query.page, 10) || 1,
        limit: take,
        total,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  },

  async findById(id) {
    return prisma.billingProvider.findFirst({
      where: { id, ...NOT_DELETED },
      include: auditInclude,
    });
  },

  async update(id, data, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Billing provider not found');
      err.statusCode = 404;
      throw err;
    }

    const payload = buildPayload(data);
    return prisma.billingProvider.update({
      where: { id },
      data: { ...payload, updatedBy: userId },
      include: auditInclude,
    });
  },

  async delete(id, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Billing provider not found');
      err.statusCode = 404;
      throw err;
    }

    await prisma.billingProvider.update({
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

module.exports = billingProviderService;
