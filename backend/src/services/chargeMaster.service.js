const prisma = require('../lib/prisma');
const {
  parseOptionalDate,
  assertDateRange,
  decimalOrNull,
  emptyToNull,
  boolOrDefault,
  splitProcedureCode,
} = require('../lib/codeCatalog');

function money(n) {
  if (n == null || n === '') return null;
  return Math.round(Number(n) * 100) / 100;
}

function toChargeMaster(row) {
  if (!row) return null;
  const categories = (row.categories || []).map((link) => link.procedureCategory?.name).filter(Boolean);
  return {
    id: row.id,
    chargeCode: row.chargeCode,
    cptCode: row.cptCode,
    codeType: row.codeType || 'CPT',
    description: row.procedureDescription,
    genericDescription: row.genericDescription,
    revenueCode: row.revenueCode,
    standardAmount: row.unitPrice != null ? Number(row.unitPrice) : null,
    unitPrice: row.unitPrice != null ? Number(row.unitPrice) : null,
    cashPrice: row.cashPrice != null ? Number(row.cashPrice) : null,
    cost: row.cost != null ? Number(row.cost) : null,
    discountPercent: row.discountPercent != null ? Number(row.discountPercent) : 0,
    placeOfService: row.placeOfService || '11',
    isBillable: row.isBillable !== false,
    isActive: row.isActive !== false,
    location: row.location || row.department?.departmentName || null,
    departmentId: row.departmentId,
    category: categories[0] || null,
    genericDepartment: row.department?.departmentName || null,
    payer: row.payerName || null,
    payerName: row.payerName || null,
    mod1: row.mod1,
    mod2: row.mod2,
    mod3: row.mod3,
    mod4: row.mod4,
    defaultUnits: row.defaultUnits != null ? Number(row.defaultUnits) : 1,
    ndcCode: row.ndcCode,
    taxable: !!row.taxable,
    priceEffectiveDate: row.priceEffectiveDate
      ? row.priceEffectiveDate.toISOString().slice(0, 10)
      : '',
    priceExpiryDate: row.priceExpiryDate ? row.priceExpiryDate.toISOString().slice(0, 10) : '',
    cptEffectiveDate: row.effectiveDate ? row.effectiveDate.toISOString().slice(0, 10) : '',
    effectiveDate: row.effectiveDate ? row.effectiveDate.toISOString().slice(0, 10) : '',
    expiryDate: row.expiryDate ? row.expiryDate.toISOString().slice(0, 10) : '',
    totalRevenue: null,
    totalVolume: null,
    percentageIncreased: 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function includeForCharge() {
  return {
    department: { select: { id: true, departmentName: true } },
    categories: { include: { procedureCategory: { select: { id: true, name: true } } } },
  };
}

function buildChargeData(body, existing = {}) {
  const description = emptyToNull(body.description || body.procedureDescription) || existing.procedureDescription;
  if (!description) {
    const err = new Error('Description is required');
    err.statusCode = 400;
    throw err;
  }

  const code = emptyToNull(body.cptCode) || existing.cptCode;
  const split = splitProcedureCode(code);
  const standardAmount = money(body.standardAmount ?? body.unitPrice);
  if (body.standardAmount != null && Number(body.standardAmount) <= 0) {
    const err = new Error('Standard amount must be greater than 0');
    err.statusCode = 400;
    throw err;
  }

  const priceEffectiveDate = parseOptionalDate(body.priceEffectiveDate);
  const priceExpiryDate = parseOptionalDate(body.priceExpiryDate);
  const effectiveDate = parseOptionalDate(body.cptEffectiveDate || body.effectiveDate);
  const expiryDate = parseOptionalDate(body.expiryDate);
  assertDateRange(priceEffectiveDate, priceExpiryDate, {
    effective: 'price effective date',
    expiry: 'price expiry date',
  });
  assertDateRange(effectiveDate, expiryDate);

  return {
    procedureDescription: description,
    genericDescription:
      body.genericDescription !== undefined ? emptyToNull(body.genericDescription) : existing.genericDescription,
    cptCode: code,
    codeType: body.codeType || split.codeType || existing.codeType || 'CPT',
    revenueCode: body.revenueCode !== undefined ? emptyToNull(body.revenueCode) : existing.revenueCode,
    unitPrice: standardAmount != null ? standardAmount : existing.unitPrice,
    cashPrice: body.cashPrice !== undefined ? decimalOrNull(body.cashPrice) : existing.cashPrice,
    cost: body.cost !== undefined ? decimalOrNull(body.cost) : existing.cost,
    discountPercent: body.discountPercent !== undefined ? decimalOrNull(body.discountPercent) : existing.discountPercent,
    placeOfService: body.placeOfService || existing.placeOfService || '11',
    isBillable: body.isBillable !== undefined ? boolOrDefault(body.isBillable, true) : existing.isBillable !== false,
    isActive: body.isActive !== undefined ? boolOrDefault(body.isActive, true) : existing.isActive !== false,
    departmentId: body.departmentId !== undefined ? body.departmentId || null : existing.departmentId,
    location: body.location !== undefined ? emptyToNull(body.location) : existing.location,
    payerName: body.payerName !== undefined || body.payer !== undefined
      ? emptyToNull(body.payerName || body.payer)
      : existing.payerName,
    chargeCode: body.chargeCode !== undefined ? emptyToNull(body.chargeCode) : existing.chargeCode,
    defaultUnits: body.defaultUnits !== undefined ? decimalOrNull(body.defaultUnits) : existing.defaultUnits,
    ndcCode: body.ndcCode !== undefined ? emptyToNull(body.ndcCode) : existing.ndcCode,
    taxable: body.taxable !== undefined ? !!body.taxable : !!existing.taxable,
    mod1: body.mod1 !== undefined ? emptyToNull(body.mod1) : existing.mod1,
    mod2: body.mod2 !== undefined ? emptyToNull(body.mod2) : existing.mod2,
    mod3: body.mod3 !== undefined ? emptyToNull(body.mod3) : existing.mod3,
    mod4: body.mod4 !== undefined ? emptyToNull(body.mod4) : existing.mod4,
    priceEffectiveDate: body.priceEffectiveDate !== undefined ? priceEffectiveDate : existing.priceEffectiveDate,
    priceExpiryDate: body.priceExpiryDate !== undefined ? priceExpiryDate : existing.priceExpiryDate,
    effectiveDate: body.cptEffectiveDate !== undefined || body.effectiveDate !== undefined
      ? effectiveDate
      : existing.effectiveDate,
    expiryDate: body.expiryDate !== undefined ? expiryDate : existing.expiryDate,
  };
}

const chargeMasterService = {
  async list(query = {}) {
    const where = { deletedAt: null };
    const status = query.status || 'all';
    if (status === 'active' || query.isActive === true) where.isActive = true;
    if (status === 'inactive' || query.isActive === false) where.isActive = false;
    if (query.includeNonBillable !== 'true' && query.isBillable !== false) {
      where.isBillable = true;
    }
    if (query.isBillable === false) where.isBillable = false;
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.codeType) where.codeType = query.codeType;
    if (query.location) {
      where.OR = [
        ...(where.OR || []),
        { location: { contains: query.location, mode: 'insensitive' } },
        { department: { departmentName: { contains: query.location, mode: 'insensitive' } } },
      ];
    }
    if (query.payer) {
      where.payerName = { contains: query.payer, mode: 'insensitive' };
    }
    if (query.search) {
      const term = query.search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { cptCode: { contains: term, mode: 'insensitive' } },
            { chargeCode: { contains: term, mode: 'insensitive' } },
            { procedureDescription: { contains: term, mode: 'insensitive' } },
            { revenueCode: { contains: term, mode: 'insensitive' } },
            { location: { contains: term, mode: 'insensitive' } },
            { payerName: { contains: term, mode: 'insensitive' } },
          ],
        },
      ];
    }
    if (query.category) {
      where.categories = {
        some: { procedureCategory: { name: { contains: query.category, mode: 'insensitive' } } },
      };
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(query.limit) || 25));
    const [total, rows] = await Promise.all([
      prisma.procedure.count({ where }),
      prisma.procedure.findMany({
        where,
        include: includeForCharge(),
        orderBy: [{ cptCode: 'asc' }, { procedureDescription: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: rows.map(toChargeMaster),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1, pages: Math.ceil(total / limit) || 1 },
    };
  },

  async getById(id) {
    const row = await prisma.procedure.findFirst({
      where: { id, deletedAt: null },
      include: includeForCharge(),
    });
    if (!row) {
      const err = new Error('Charge master entry not found');
      err.statusCode = 404;
      throw err;
    }
    return toChargeMaster(row);
  },

  async create(body, user) {
    if (!user?.id) {
      const err = new Error('Authenticated user required');
      err.statusCode = 401;
      throw err;
    }
    const data = buildChargeData(body);
    const row = await prisma.procedure.create({
      data: {
        ...data,
        createdBy: user.id,
        updatedBy: user.id,
      },
      include: includeForCharge(),
    });
    return toChargeMaster(row);
  },

  async update(id, body, user) {
    const existing = await prisma.procedure.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      const err = new Error('Charge master entry not found');
      err.statusCode = 404;
      throw err;
    }

    const data = buildChargeData(body, existing);
    const row = await prisma.procedure.update({
      where: { id },
      data: {
        ...data,
        updatedBy: user?.id || existing.updatedBy,
      },
      include: includeForCharge(),
    });
    return toChargeMaster(row);
  },

  async remove(id, user) {
    const existing = await prisma.procedure.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      const err = new Error('Charge master entry not found');
      err.statusCode = 404;
      throw err;
    }
    await prisma.procedure.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: user?.id || null,
        isBillable: false,
        isActive: false,
      },
    });
    return { id, deleted: true };
  },

  async searchForCapture(term, limit = 25) {
    const q = String(term || '').trim();
    const take = Math.min(50, Math.max(1, Number(limit) || 25));
    const procedureWhere = {
      deletedAt: null,
      isBillable: true,
      isActive: true,
    };
    if (q) {
      procedureWhere.OR = [
        { cptCode: { contains: q, mode: 'insensitive' } },
        { chargeCode: { contains: q, mode: 'insensitive' } },
        { procedureDescription: { contains: q, mode: 'insensitive' } },
        { revenueCode: { contains: q, mode: 'insensitive' } },
      ];
    }

    const hcpcsWhere = {
      deletedAt: null,
      isActive: true,
      isBillable: true,
    };
    if (q) {
      hcpcsWhere.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { shortDescription: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [procedures, hcpcs] = await Promise.all([
      prisma.procedure.findMany({
        where: procedureWhere,
        take,
        orderBy: { cptCode: 'asc' },
      }),
      prisma.hcpcsCode.findMany({
        where: hcpcsWhere,
        take,
        orderBy: { code: 'asc' },
      }),
    ]);

    const fromProcedures = procedures.map((r) => {
      const split = splitProcedureCode(r.cptCode);
      return {
        id: r.id,
        source: 'charge-master',
        code: r.cptCode,
        cptCode: split.cptCode || (r.codeType === 'CPT' ? r.cptCode : null),
        hcpcsCode: split.hcpcsCode || (r.codeType === 'HCPCS' ? r.cptCode : null),
        codeType: r.codeType || split.codeType,
        description: r.procedureDescription,
        unitCharge: r.unitPrice != null ? Number(r.unitPrice) : 0,
        placeOfService: r.placeOfService || '11',
        revenueCode: r.revenueCode,
        modifiers: [r.mod1, r.mod2, r.mod3, r.mod4].filter(Boolean).join(','),
        defaultUnits: r.defaultUnits != null ? Number(r.defaultUnits) : 1,
        ndcCode: r.ndcCode,
      };
    });

    const fromHcpcs = hcpcs.map((r) => ({
      id: r.id,
      source: 'hcpcs',
      code: r.code,
      cptCode: null,
      hcpcsCode: r.code,
      codeType: 'HCPCS',
      description: r.description,
      unitCharge: r.unitPrice != null ? Number(r.unitPrice) : 0,
      placeOfService: r.placeOfService || '11',
      revenueCode: r.revenueCode,
      modifiers: r.defaultModifier || '',
      defaultUnits: 1,
      ndcCode: null,
    }));

    return [...fromProcedures, ...fromHcpcs]
      .sort((a, b) => String(a.code || '').localeCompare(String(b.code || '')))
      .slice(0, take);
  },
};

module.exports = chargeMasterService;
