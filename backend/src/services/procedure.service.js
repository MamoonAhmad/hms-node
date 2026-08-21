const prisma = require('../lib/prisma');
const {
  parseOptionalDate,
  assertDateRange,
  assertAgeRange,
  decimalOrNull,
  intOrNull,
  emptyToNull,
  boolOrDefault,
  isValidCpt,
  isValidHcpcs,
  splitProcedureCode,
} = require('../lib/codeCatalog');

const NOT_DELETED = { deletedAt: null };

const auditUserSelect = { id: true, name: true, email: true };

const auditInclude = {
  creator: { select: auditUserSelect },
  updater: { select: auditUserSelect },
  deleter: { select: auditUserSelect },
};

const categoryInclude = {
  procedureCategory: {
    select: { id: true, name: true },
  },
};

const listInclude = {
  ...auditInclude,
  department: {
    select: { id: true, departmentName: true, departmentCode: true },
  },
  categories: {
    include: categoryInclude,
  },
};

function serializeDecimal(value) {
  return value != null ? Number(value) : null;
}

function serializeProcedure(row) {
  if (!row) return null;
  const categories = (row.categories || []).map((link) => ({
    id: link.procedureCategory.id,
    name: link.procedureCategory.name,
  }));

  return {
    ...row,
    unitPrice: serializeDecimal(row.unitPrice),
    workRvu: serializeDecimal(row.workRvu),
    facilityRvu: serializeDecimal(row.facilityRvu),
    nonFacilityRvu: serializeDecimal(row.nonFacilityRvu),
    cashPrice: serializeDecimal(row.cashPrice),
    cost: serializeDecimal(row.cost),
    discountPercent: serializeDecimal(row.discountPercent),
    defaultUnits: serializeDecimal(row.defaultUnits),
    effectiveDate: row.effectiveDate ? row.effectiveDate.toISOString().slice(0, 10) : '',
    expiryDate: row.expiryDate ? row.expiryDate.toISOString().slice(0, 10) : '',
    priceEffectiveDate: row.priceEffectiveDate ? row.priceEffectiveDate.toISOString().slice(0, 10) : '',
    priceExpiryDate: row.priceExpiryDate ? row.priceExpiryDate.toISOString().slice(0, 10) : '',
    procedureCategoryIds: categories.map((c) => c.id),
    categories,
    category: categories[0] || null,
    categoryName: categories.map((c) => c.name).join(', '),
    procedureDepartment: row.department?.departmentName || null,
    departmentId: row.departmentId || null,
  };
}

async function syncCategories(procedureId, categoryIds) {
  await prisma.procedureCategoryOnProcedure.deleteMany({
    where: { procedureId },
  });

  if (!categoryIds?.length) return;

  await prisma.procedureCategoryOnProcedure.createMany({
    data: categoryIds.map((procedureCategoryId) => ({
      procedureId,
      procedureCategoryId,
    })),
  });
}

function normalizeProcedureCode(code, codeType) {
  const raw = emptyToNull(code);
  if (!raw) return { cptCode: null, codeType: codeType || 'CPT' };
  const split = splitProcedureCode(raw);
  if (codeType && codeType !== 'CUSTOM') {
    if (codeType === 'CPT' && !isValidCpt(raw) && !isValidHcpcs(raw)) {
      const err = new Error('CPT code must be 5 digits');
      err.statusCode = 400;
      throw err;
    }
    if (codeType === 'HCPCS' && !isValidHcpcs(raw) && !isValidCpt(raw)) {
      const err = new Error('HCPCS code must be a letter A–V followed by 4 digits');
      err.statusCode = 400;
      throw err;
    }
    return { cptCode: raw.toUpperCase(), codeType };
  }
  return { cptCode: (split.cptCode || split.hcpcsCode || raw).toUpperCase(), codeType: split.codeType };
}

function buildPayload(data) {
  const payload = {};

  if (data.procedureDescription !== undefined) {
    const procedureDescription = String(data.procedureDescription).trim();
    if (!procedureDescription) {
      const err = new Error('Procedure description cannot be empty');
      err.statusCode = 400;
      throw err;
    }
    payload.procedureDescription = procedureDescription;
  }
  if (data.genericDescription !== undefined) payload.genericDescription = emptyToNull(data.genericDescription);
  if (data.departmentId !== undefined) payload.departmentId = data.departmentId || null;
  if (data.cptCode !== undefined || data.codeType !== undefined) {
    const normalized = normalizeProcedureCode(data.cptCode, data.codeType);
    if (data.cptCode !== undefined) payload.cptCode = normalized.cptCode;
    if (data.codeType !== undefined || data.cptCode !== undefined) payload.codeType = data.codeType || normalized.codeType;
  }
  if (data.revenueCode !== undefined) payload.revenueCode = emptyToNull(data.revenueCode);
  if (data.mod1 !== undefined) payload.mod1 = emptyToNull(data.mod1);
  if (data.mod2 !== undefined) payload.mod2 = emptyToNull(data.mod2);
  if (data.mod3 !== undefined) payload.mod3 = emptyToNull(data.mod3);
  if (data.mod4 !== undefined) payload.mod4 = emptyToNull(data.mod4);
  if (data.unitPrice !== undefined) payload.unitPrice = decimalOrNull(data.unitPrice);
  if (data.placeOfService !== undefined) payload.placeOfService = emptyToNull(data.placeOfService) || '11';
  if (data.isBillable !== undefined) payload.isBillable = boolOrDefault(data.isBillable, true);
  if (data.isActive !== undefined) payload.isActive = boolOrDefault(data.isActive, true);
  if (data.globalPeriod !== undefined) payload.globalPeriod = emptyToNull(data.globalPeriod);
  if (data.workRvu !== undefined) payload.workRvu = decimalOrNull(data.workRvu);
  if (data.facilityRvu !== undefined) payload.facilityRvu = decimalOrNull(data.facilityRvu);
  if (data.nonFacilityRvu !== undefined) payload.nonFacilityRvu = decimalOrNull(data.nonFacilityRvu);
  if (data.isAddOn !== undefined) payload.isAddOn = !!data.isAddOn;
  if (data.bilateralIndicator !== undefined) payload.bilateralIndicator = !!data.bilateralIndicator;
  if (data.genderRestriction !== undefined) payload.genderRestriction = emptyToNull(data.genderRestriction);
  if (data.ageMin !== undefined) payload.ageMin = intOrNull(data.ageMin);
  if (data.ageMax !== undefined) payload.ageMax = intOrNull(data.ageMax);
  if (data.effectiveDate !== undefined) payload.effectiveDate = parseOptionalDate(data.effectiveDate);
  if (data.expiryDate !== undefined) payload.expiryDate = parseOptionalDate(data.expiryDate);
  if (data.codingNotes !== undefined) payload.codingNotes = emptyToNull(data.codingNotes);
  if (data.chargeCode !== undefined) payload.chargeCode = emptyToNull(data.chargeCode);
  if (data.cashPrice !== undefined) payload.cashPrice = decimalOrNull(data.cashPrice);
  if (data.cost !== undefined) payload.cost = decimalOrNull(data.cost);
  if (data.discountPercent !== undefined) payload.discountPercent = decimalOrNull(data.discountPercent);
  if (data.priceEffectiveDate !== undefined) payload.priceEffectiveDate = parseOptionalDate(data.priceEffectiveDate);
  if (data.priceExpiryDate !== undefined) payload.priceExpiryDate = parseOptionalDate(data.priceExpiryDate);
  if (data.defaultUnits !== undefined) payload.defaultUnits = decimalOrNull(data.defaultUnits);
  if (data.ndcCode !== undefined) payload.ndcCode = emptyToNull(data.ndcCode);
  if (data.taxable !== undefined) payload.taxable = !!data.taxable;
  if (data.location !== undefined) payload.location = emptyToNull(data.location);
  if (data.payerName !== undefined) payload.payerName = emptyToNull(data.payerName);

  assertDateRange(payload.effectiveDate, payload.expiryDate);
  assertDateRange(payload.priceEffectiveDate, payload.priceExpiryDate, {
    effective: 'price effective date',
    expiry: 'price expiry date',
  });
  assertAgeRange(payload.ageMin, payload.ageMax);
  return payload;
}

const procedureService = {
  async create(data, userId) {
    const procedureDescription = String(data.procedureDescription || '').trim();
    if (!procedureDescription) {
      const err = new Error('Procedure description is required');
      err.statusCode = 400;
      throw err;
    }

    const categoryIds = data.procedureCategoryIds || [];
    if (!categoryIds.length) {
      const err = new Error('At least one procedure category is required');
      err.statusCode = 400;
      throw err;
    }

    const payload = buildPayload({ ...data, procedureDescription });

    const row = await prisma.procedure.create({
      data: {
        ...payload,
        procedureDescription,
        isActive: payload.isActive !== false,
        isBillable: payload.isBillable !== false,
        isAddOn: !!payload.isAddOn,
        bilateralIndicator: !!payload.bilateralIndicator,
        taxable: !!payload.taxable,
        codeType: payload.codeType || 'CPT',
        placeOfService: payload.placeOfService || '11',
        deletedAt: null,
        createdBy: userId,
        updatedBy: userId,
      },
      include: listInclude,
    });

    await syncCategories(row.id, categoryIds);

    const full = await prisma.procedure.findUnique({
      where: { id: row.id },
      include: listInclude,
    });

    return serializeProcedure(full);
  },

  async findAll(query = {}) {
    const take = parseInt(query.limit, 10) || 10;
    const skip = (parseInt(query.page, 10) - 1) * take;
    const conditions = [NOT_DELETED];
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

    if (query.search) {
      conditions.push({
        OR: [
          { procedureDescription: { contains: query.search, mode: 'insensitive' } },
          { genericDescription: { contains: query.search, mode: 'insensitive' } },
          { cptCode: { contains: query.search, mode: 'insensitive' } },
          { chargeCode: { contains: query.search, mode: 'insensitive' } },
          { revenueCode: { contains: query.search, mode: 'insensitive' } },
          { location: { contains: query.search, mode: 'insensitive' } },
          { mod1: { contains: query.search, mode: 'insensitive' } },
          { mod2: { contains: query.search, mode: 'insensitive' } },
          { mod3: { contains: query.search, mode: 'insensitive' } },
          { mod4: { contains: query.search, mode: 'insensitive' } },
          { department: { departmentName: { contains: query.search, mode: 'insensitive' } } },
        ],
      });
    }

    if (query.categoryId) {
      conditions.push({
        categories: {
          some: { procedureCategoryId: query.categoryId },
        },
      });
    }
    if (query.departmentId) conditions.push({ departmentId: query.departmentId });
    if (query.codeType) conditions.push({ codeType: query.codeType });

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

    const where = { AND: conditions };

    const [rows, total] = await Promise.all([
      prisma.procedure.findMany({
        where,
        skip,
        take,
        orderBy: [{ cptCode: 'asc' }, { procedureDescription: 'asc' }],
        include: listInclude,
      }),
      prisma.procedure.count({ where }),
    ]);

    return {
      data: rows.map(serializeProcedure),
      pagination: {
        page: parseInt(query.page, 10) || 1,
        limit: take,
        total,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  },

  async findById(id) {
    const row = await prisma.procedure.findFirst({
      where: { id, ...NOT_DELETED },
      include: listInclude,
    });
    return serializeProcedure(row);
  },

  async findByCpt(code) {
    const raw = emptyToNull(code);
    if (!raw) return null;
    const row = await prisma.procedure.findFirst({
      where: {
        ...NOT_DELETED,
        isActive: true,
        cptCode: { equals: raw, mode: 'insensitive' },
      },
      include: listInclude,
      orderBy: { updatedAt: 'desc' },
    });
    return serializeProcedure(row);
  },

  async update(id, data, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Procedure not found');
      err.statusCode = 404;
      throw err;
    }

    const payload = buildPayload(data);
    payload.updatedBy = userId;

    if (data.procedureCategoryIds !== undefined) {
      if (!data.procedureCategoryIds.length) {
        const err = new Error('At least one procedure category is required');
        err.statusCode = 400;
        throw err;
      }
      await syncCategories(id, data.procedureCategoryIds);
    }

    await prisma.procedure.update({
      where: { id },
      data: payload,
    });

    return this.findById(id);
  },

  async delete(id, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Procedure not found');
      err.statusCode = 404;
      throw err;
    }

    await prisma.procedure.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        updatedBy: userId,
        isActive: false,
        isBillable: false,
      },
    });

    return { success: true };
  },
};

module.exports = procedureService;
