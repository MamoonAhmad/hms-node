const prisma = require('../lib/prisma');
const {
  deriveHcpcsCategory,
  normalizeHcpcs,
  isValidHcpcs,
  parseOptionalDate,
  assertDateRange,
  decimalOrNull,
  emptyToNull,
  boolOrDefault,
  isCurrentlyValid,
} = require('../lib/codeCatalog');

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
    unitPrice: row.unitPrice != null ? Number(row.unitPrice) : null,
    effectiveDate: row.effectiveDate ? row.effectiveDate.toISOString().slice(0, 10) : '',
    expiryDate: row.expiryDate ? row.expiryDate.toISOString().slice(0, 10) : '',
  };
}

function buildPayload(data, { requireCode = false } = {}) {
  const payload = {};

  if (data.code !== undefined || requireCode) {
    const code = normalizeHcpcs(data.code);
    if (!code) {
      const err = new Error('Code is required');
      err.statusCode = 400;
      throw err;
    }
    if (!isValidHcpcs(code)) {
      const err = new Error('HCPCS code must be a Level II code (letter A–V followed by 4 digits)');
      err.statusCode = 400;
      throw err;
    }
    payload.code = code;
    if (data.category === undefined) {
      payload.category = deriveHcpcsCategory(code);
    }
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

  if (data.shortDescription !== undefined) payload.shortDescription = emptyToNull(data.shortDescription);
  if (data.category !== undefined) payload.category = emptyToNull(data.category) || payload.category || null;
  if (data.isActive !== undefined) payload.isActive = boolOrDefault(data.isActive, true);
  if (data.isBillable !== undefined) payload.isBillable = boolOrDefault(data.isBillable, true);
  if (data.coverageStatus !== undefined) payload.coverageStatus = data.coverageStatus || 'covered';
  if (data.ndcRequired !== undefined) payload.ndcRequired = !!data.ndcRequired;
  if (data.defaultModifier !== undefined) payload.defaultModifier = emptyToNull(data.defaultModifier);
  if (data.revenueCode !== undefined) payload.revenueCode = emptyToNull(data.revenueCode);
  if (data.unitPrice !== undefined) payload.unitPrice = decimalOrNull(data.unitPrice);
  if (data.unitType !== undefined) payload.unitType = emptyToNull(data.unitType);
  if (data.placeOfService !== undefined) payload.placeOfService = emptyToNull(data.placeOfService);
  if (data.codingNotes !== undefined) payload.codingNotes = emptyToNull(data.codingNotes);
  if (data.effectiveDate !== undefined) payload.effectiveDate = parseOptionalDate(data.effectiveDate);
  if (data.expiryDate !== undefined) payload.expiryDate = parseOptionalDate(data.expiryDate);

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
  if (query.coverageStatus) conditions.push({ coverageStatus: query.coverageStatus });

  if (query.search) {
    conditions.push({
      OR: [
        { code: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { shortDescription: { contains: query.search, mode: 'insensitive' } },
        { codingNotes: { contains: query.search, mode: 'insensitive' } },
        { revenueCode: { contains: query.search, mode: 'insensitive' } },
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

const hcpcsCodeService = {
  async create(data, userId) {
    const payload = buildPayload(data, { requireCode: true });
    const row = await prisma.hcpcsCode.create({
      data: {
        ...payload,
        isActive: payload.isActive !== false,
        isBillable: payload.isBillable !== false,
        coverageStatus: payload.coverageStatus || 'covered',
        ndcRequired: !!payload.ndcRequired,
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
        page: parseInt(query.page, 10) || 1,
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

  async findByCode(code) {
    const normalized = normalizeHcpcs(code);
    if (!normalized) return null;
    const row = await prisma.hcpcsCode.findFirst({
      where: { code: { equals: normalized, mode: 'insensitive' }, ...NOT_DELETED },
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

    const payload = buildPayload(data);
    assertDateRange(
      payload.effectiveDate !== undefined ? payload.effectiveDate : existing.effectiveDate,
      payload.expiryDate !== undefined ? payload.expiryDate : existing.expiryDate,
    );

    const row = await prisma.hcpcsCode.update({
      where: { id },
      data: { ...payload, updatedBy: userId },
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
        isActive: false,
      },
    });

    return { success: true };
  },

  isUsable(row) {
    return isCurrentlyValid(row) && row?.isBillable !== false;
  },
};

module.exports = hcpcsCodeService;
