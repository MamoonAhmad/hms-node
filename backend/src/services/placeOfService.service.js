const prisma = require('../lib/prisma');
const {
  parseOptionalDate,
  assertDateRange,
  emptyToNull,
  boolOrDefault,
  isCurrentlyValid,
} = require('../lib/codeCatalog');
const { normalizePosCode, isValidPosCode } = require('../lib/placeOfService');

const NOT_DELETED = { deletedAt: null };

const auditUserSelect = { id: true, name: true, email: true };

const auditInclude = {
  creator: { select: auditUserSelect },
  updater: { select: auditUserSelect },
  deleter: { select: auditUserSelect },
};

function serializeRow(row) {
  if (!row) return null;
  return {
    ...row,
    effectiveDate: row.effectiveDate ? row.effectiveDate.toISOString().slice(0, 10) : '',
    expiryDate: row.expiryDate ? row.expiryDate.toISOString().slice(0, 10) : '',
    label: `${row.code} — ${row.name}`,
  };
}

async function assertUniqueCode(code, excludeId = null) {
  const existing = await prisma.placeOfServiceCode.findFirst({
    where: {
      ...NOT_DELETED,
      code,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });
  if (existing) {
    const err = new Error('A place of service with this code already exists');
    err.statusCode = 409;
    throw err;
  }
}

async function clearOtherDefaults(excludeId = null) {
  await prisma.placeOfServiceCode.updateMany({
    where: {
      ...NOT_DELETED,
      isDefault: true,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    data: { isDefault: false },
  });
}

function buildPayload(data, { requireCode = false, lockCode = false } = {}) {
  const payload = {};

  if (!lockCode && (data.code !== undefined || requireCode)) {
    const code = normalizePosCode(data.code);
    if (!code) {
      const err = new Error('POS code is required');
      err.statusCode = 400;
      throw err;
    }
    if (!isValidPosCode(code)) {
      const err = new Error('Use a 2-digit CMS place of service code (01–99)');
      err.statusCode = 400;
      throw err;
    }
    payload.code = code;
  }

  if (data.name !== undefined || requireCode) {
    const name = String(data.name || '').trim();
    if (!name) {
      const err = new Error('Name is required');
      err.statusCode = 400;
      throw err;
    }
    payload.name = name;
  }

  if (data.description !== undefined || requireCode) {
    const description = String(data.description || '').trim();
    if (!description) {
      const err = new Error('Description is required');
      err.statusCode = 400;
      throw err;
    }
    payload.description = description;
  }

  if (data.category !== undefined) payload.category = emptyToNull(data.category);
  if (data.cmsStandard !== undefined) payload.cmsStandard = !!data.cmsStandard;
  if (data.isActive !== undefined) payload.isActive = boolOrDefault(data.isActive, true);
  if (data.isBillable !== undefined) payload.isBillable = boolOrDefault(data.isBillable, true);
  if (data.isDefault !== undefined) payload.isDefault = !!data.isDefault;
  if (data.effectiveDate !== undefined) payload.effectiveDate = parseOptionalDate(data.effectiveDate);
  if (data.expiryDate !== undefined) payload.expiryDate = parseOptionalDate(data.expiryDate);
  if (data.sortOrder !== undefined) {
    payload.sortOrder = data.sortOrder === '' || data.sortOrder == null
      ? null
      : parseInt(data.sortOrder, 10);
  }
  if (data.codingNotes !== undefined) payload.codingNotes = emptyToNull(data.codingNotes);

  assertDateRange(payload.effectiveDate, payload.expiryDate);
  return payload;
}

function applyCatalogFilters(conditions, query = {}) {
  const lookup = query.lookup === true || query.lookup === 'true';
  const status = query.status || (query.isActive === true ? 'active' : query.isActive === false ? 'inactive' : 'all');

  if (lookup || status === 'active' || query.isActive === true) {
    conditions.push({ isActive: true });
  } else if (status === 'inactive' || query.isActive === false) {
    conditions.push({ isActive: false });
  }

  if (lookup || query.isBillable === true) {
    conditions.push({ isBillable: true });
  } else if (query.isBillable === false) {
    conditions.push({ isBillable: false });
  }

  if (query.category) conditions.push({ category: query.category });

  if (query.cmsStandard === true || query.cmsStandard === 'true') {
    conditions.push({ cmsStandard: true });
  } else if (query.cmsStandard === false || query.cmsStandard === 'false') {
    conditions.push({ cmsStandard: false });
  }

  if (query.search) {
    conditions.push({
      OR: [
        { code: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { codingNotes: { contains: query.search, mode: 'insensitive' } },
      ],
    });
  }

  const validOn = query.validOn || (lookup ? new Date() : null);
  if (validOn) {
    const on = parseOptionalDate(validOn) || new Date();
    conditions.push({
      AND: [
        { OR: [{ effectiveDate: null }, { effectiveDate: { lte: on } }] },
        { OR: [{ expiryDate: null }, { expiryDate: { gte: on } }] },
      ],
    });
  }
}

const placeOfServiceService = {
  async create(data, userId) {
    const payload = buildPayload(data, { requireCode: true });
    await assertUniqueCode(payload.code);

    if (payload.isDefault) {
      await clearOtherDefaults();
    }

    const row = await prisma.placeOfServiceCode.create({
      data: {
        ...payload,
        cmsStandard: payload.cmsStandard === true,
        isActive: payload.isActive !== false,
        isBillable: payload.isBillable !== false,
        isDefault: !!payload.isDefault,
        deletedAt: null,
        createdBy: userId,
        updatedBy: userId,
      },
      include: auditInclude,
    });
    return serializeRow(row);
  },

  async findAll(query = {}) {
    const take = parseInt(query.limit, 10) || 10;
    const skip = (parseInt(query.page, 10) - 1) * take;
    const conditions = [NOT_DELETED];
    applyCatalogFilters(conditions, query);

    const where = { AND: conditions };
    const [rows, total] = await Promise.all([
      prisma.placeOfServiceCode.findMany({
        where,
        skip,
        take,
        orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
        include: auditInclude,
      }),
      prisma.placeOfServiceCode.count({ where }),
    ]);

    return {
      data: rows.map(serializeRow),
      pagination: {
        page: parseInt(query.page, 10) || 1,
        limit: take,
        total,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  },

  async lookup(query = {}) {
    const result = await this.findAll({
      ...query,
      lookup: true,
      page: 1,
      limit: parseInt(query.limit, 10) || 200,
    });
    return { data: result.data };
  },

  async findById(id) {
    const row = await prisma.placeOfServiceCode.findFirst({
      where: { id, ...NOT_DELETED },
      include: auditInclude,
    });
    return serializeRow(row);
  },

  async findByCode(code) {
    const normalized = normalizePosCode(code);
    if (!normalized) return null;
    const row = await prisma.placeOfServiceCode.findFirst({
      where: { ...NOT_DELETED, code: normalized },
    });
    return serializeRow(row);
  },

  async getDefault() {
    const row = await prisma.placeOfServiceCode.findFirst({
      where: { ...NOT_DELETED, isDefault: true, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return serializeRow(row);
  },

  async update(id, data, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Place of service not found');
      err.statusCode = 404;
      throw err;
    }

    const lockCode = existing.cmsStandard === true;
    const payload = buildPayload(data, { lockCode });

    if (payload.code && payload.code !== existing.code) {
      await assertUniqueCode(payload.code, id);
    }

    if (payload.isDefault === false && existing.isDefault) {
      const err = new Error('Cannot remove facility default — set another default first');
      err.statusCode = 400;
      throw err;
    }

    if (payload.isActive === false && existing.isDefault) {
      const err = new Error('Cannot deactivate the facility default — set another default first');
      err.statusCode = 400;
      throw err;
    }

    assertDateRange(
      payload.effectiveDate !== undefined ? payload.effectiveDate : existing.effectiveDate,
      payload.expiryDate !== undefined ? payload.expiryDate : existing.expiryDate,
    );

    if (payload.isDefault) {
      await clearOtherDefaults(id);
    }

    const row = await prisma.placeOfServiceCode.update({
      where: { id },
      data: { ...payload, updatedBy: userId },
      include: auditInclude,
    });
    return serializeRow(row);
  },

  async delete(id, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Place of service not found');
      err.statusCode = 404;
      throw err;
    }

    if (existing.isDefault) {
      const err = new Error('Cannot delete the facility default place of service');
      err.statusCode = 400;
      throw err;
    }

    await prisma.placeOfServiceCode.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        isActive: false,
        isDefault: false,
        updatedBy: userId,
      },
    });

    return { success: true };
  },

  isUsable(row) {
    return isCurrentlyValid(row) && row?.isBillable !== false;
  },
};

module.exports = placeOfServiceService;
