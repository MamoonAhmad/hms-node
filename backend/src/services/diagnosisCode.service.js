const prisma = require('../lib/prisma');
const {
  normalizeIcd10,
  isValidIcd10,
  deriveIcdChapter,
  parseOptionalDate,
  assertDateRange,
  assertAgeRange,
  intOrNull,
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
    effectiveDate: row.effectiveDate ? row.effectiveDate.toISOString().slice(0, 10) : '',
    expiryDate: row.expiryDate ? row.expiryDate.toISOString().slice(0, 10) : '',
  };
}

function buildPayload(data, { requireCode = false } = {}) {
  const payload = {};

  if (data.code !== undefined || requireCode) {
    const code = normalizeIcd10(data.code);
    if (!code) {
      const err = new Error('ICD code is required');
      err.statusCode = 400;
      throw err;
    }
    if (!isValidIcd10(code)) {
      const err = new Error('ICD-10-CM code format is invalid');
      err.statusCode = 400;
      throw err;
    }
    payload.code = code;
    if (data.chapter === undefined) {
      payload.chapter = deriveIcdChapter(code);
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
  if (data.chapter !== undefined) payload.chapter = emptyToNull(data.chapter) || payload.chapter || null;
  if (data.isBillable !== undefined) payload.isBillable = boolOrDefault(data.isBillable, true);
  if (data.laterality !== undefined) payload.laterality = emptyToNull(data.laterality);
  if (data.genderRestriction !== undefined) payload.genderRestriction = emptyToNull(data.genderRestriction);
  if (data.ageMin !== undefined) payload.ageMin = intOrNull(data.ageMin);
  if (data.ageMax !== undefined) payload.ageMax = intOrNull(data.ageMax);
  if (data.hccCategory !== undefined) payload.hccCategory = emptyToNull(data.hccCategory);
  if (data.isUnspecified !== undefined) payload.isUnspecified = !!data.isUnspecified;
  if (data.effectiveDate !== undefined) payload.effectiveDate = parseOptionalDate(data.effectiveDate);
  if (data.expiryDate !== undefined) payload.expiryDate = parseOptionalDate(data.expiryDate);
  if (data.isActive !== undefined) payload.isActive = boolOrDefault(data.isActive, true);
  if (data.codingNotes !== undefined) payload.codingNotes = emptyToNull(data.codingNotes);

  assertDateRange(payload.effectiveDate, payload.expiryDate);
  assertAgeRange(payload.ageMin, payload.ageMax);
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

  if (query.chapter) conditions.push({ chapter: query.chapter });
  if (query.laterality) conditions.push({ laterality: query.laterality });

  if (query.search) {
    conditions.push({
      OR: [
        { code: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { shortDescription: { contains: query.search, mode: 'insensitive' } },
        { codingNotes: { contains: query.search, mode: 'insensitive' } },
        { hccCategory: { contains: query.search, mode: 'insensitive' } },
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

const diagnosisCodeService = {
  async create(data, userId) {
    const payload = buildPayload(data, { requireCode: true });
    const row = await prisma.diagnosisCode.create({
      data: {
        ...payload,
        isActive: payload.isActive !== false,
        isBillable: payload.isBillable !== false,
        isUnspecified: !!payload.isUnspecified,
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
      prisma.diagnosisCode.findMany({
        where,
        skip,
        take,
        orderBy: [{ code: 'asc' }],
        include: auditInclude,
      }),
      prisma.diagnosisCode.count({ where }),
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
    const row = await prisma.diagnosisCode.findFirst({
      where: { id, ...NOT_DELETED },
      include: auditInclude,
    });
    return serializeRow(row);
  },

  async findByCode(code) {
    const normalized = normalizeIcd10(code);
    if (!normalized) return null;
    const row = await prisma.diagnosisCode.findFirst({
      where: {
        ...NOT_DELETED,
        OR: [
          { code: { equals: normalized, mode: 'insensitive' } },
          { code: { equals: normalized.replace('.', ''), mode: 'insensitive' } },
        ],
      },
    });
    return serializeRow(row);
  },

  async update(id, data, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Diagnosis code not found');
      err.statusCode = 404;
      throw err;
    }

    const payload = buildPayload(data);
    assertDateRange(
      payload.effectiveDate !== undefined ? payload.effectiveDate : existing.effectiveDate,
      payload.expiryDate !== undefined ? payload.expiryDate : existing.expiryDate,
    );
    assertAgeRange(
      payload.ageMin !== undefined ? payload.ageMin : existing.ageMin,
      payload.ageMax !== undefined ? payload.ageMax : existing.ageMax,
    );

    const row = await prisma.diagnosisCode.update({
      where: { id },
      data: { ...payload, updatedBy: userId },
      include: auditInclude,
    });
    return serializeRow(row);
  },

  async delete(id, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Diagnosis code not found');
      err.statusCode = 404;
      throw err;
    }

    await prisma.diagnosisCode.update({
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

  isUsable(row) {
    return isCurrentlyValid(row) && row?.isBillable !== false;
  },
};

module.exports = diagnosisCodeService;
