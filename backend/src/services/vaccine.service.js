const prisma = require('../lib/prisma');

const NOT_DELETED = { deletedAt: null };

const ROUTE_OPTIONS = [
  'Intramuscular (IM)',
  'Subcutaneous (SC)',
  'Oral',
  'Intranasal',
  'Intradermal',
  'Other',
];

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

function startOfDay(dateStr) {
  const d = parseDateInput(dateStr);
  if (!d) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(dateStr) {
  const d = parseDateInput(dateStr);
  if (!d) return null;
  d.setHours(23, 59, 59, 999);
  return d;
}

function serializeRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    vaccineName: row.vaccineName,
    vaccineCode: row.vaccineCode,
    manufacturer: row.manufacturer,
    route: row.route,
    status: row.status,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    createdByName: row.creator?.name || row.creator?.email || '—',
    updatedByName: row.updater?.name || row.updater?.email || '—',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function assertUniqueVaccineCode(vaccineCode, excludeId = null) {
  const code = String(vaccineCode || '').trim();
  if (!code) return;
  const existing = await prisma.vaccine.findFirst({
    where: {
      vaccineCode: { equals: code, mode: 'insensitive' },
      ...NOT_DELETED,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  if (existing) {
    const err = new Error('A vaccine with this code already exists');
    err.statusCode = 409;
    throw err;
  }
}

async function isVaccineUsedInOrders(vaccineCode) {
  const count = await prisma.order.count({
    where: {
      category: 'Immunization',
      procedureCode: vaccineCode,
    },
  });
  return count > 0;
}

const vaccineService = {
  ROUTE_OPTIONS,

  async create(data, userId) {
    const vaccineName = String(data.vaccineName || '').trim();
    const vaccineCode = String(data.vaccineCode || '').trim();

    if (!vaccineName) {
      const err = new Error('Vaccine Name is required');
      err.statusCode = 400;
      throw err;
    }
    if (!vaccineCode) {
      const err = new Error('Vaccine Code is required');
      err.statusCode = 400;
      throw err;
    }

    await assertUniqueVaccineCode(vaccineCode);

    const status = data.status === 'Inactive' ? 'Inactive' : 'Active';
    const route = data.route && ROUTE_OPTIONS.includes(data.route) ? data.route : data.route || null;

    const row = await prisma.vaccine.create({
      data: {
        vaccineName,
        vaccineCode,
        manufacturer: data.manufacturer ? String(data.manufacturer).trim() : null,
        route,
        status,
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
    vaccineName = '',
    vaccineCode = '',
    manufacturer = '',
    route = '',
    status = '',
    createdDateFrom = '',
    createdDateTo = '',
    search = '',
  }) {
    const take = parseInt(limit, 10) || 10;
    const skip = (parseInt(page, 10) - 1) * take;
    const conditions = [NOT_DELETED];

    if (search) {
      conditions.push({
        OR: [
          { vaccineName: { contains: search, mode: 'insensitive' } },
          { vaccineCode: { contains: search, mode: 'insensitive' } },
        ],
      });
    }
    if (vaccineName) {
      conditions.push({ vaccineName: { contains: vaccineName, mode: 'insensitive' } });
    }
    if (vaccineCode) {
      conditions.push({ vaccineCode: { contains: vaccineCode, mode: 'insensitive' } });
    }
    if (manufacturer) {
      conditions.push({ manufacturer: { contains: manufacturer, mode: 'insensitive' } });
    }
    if (route) {
      conditions.push({ route });
    }
    if (status) {
      conditions.push({ status });
    }

    const from = startOfDay(createdDateFrom);
    const to = endOfDay(createdDateTo);
    if (from || to) {
      const createdAt = {};
      if (from) createdAt.gte = from;
      if (to) createdAt.lte = to;
      conditions.push({ createdAt });
    }

    const where = { AND: conditions };

    const [rows, total] = await Promise.all([
      prisma.vaccine.findMany({
        where,
        skip,
        take,
        orderBy: [{ vaccineName: 'asc' }],
        include: auditInclude,
      }),
      prisma.vaccine.count({ where }),
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

  async findActiveForOrders({ search = '', limit = 25 }) {
    const take = Math.min(parseInt(limit, 10) || 25, 100);
    const conditions = [NOT_DELETED, { status: 'Active' }];

    if (search && search.trim()) {
      const q = search.trim();
      conditions.push({
        OR: [
          { vaccineName: { contains: q, mode: 'insensitive' } },
          { vaccineCode: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    const rows = await prisma.vaccine.findMany({
      where: { AND: conditions },
      take,
      orderBy: [{ vaccineName: 'asc' }],
    });

    return rows.map((row) => ({
      id: row.id,
      code: row.vaccineCode,
      name: row.vaccineName,
      category: 'Immunization',
      manufacturer: row.manufacturer,
      route: row.route,
    }));
  },

  async findById(id) {
    const row = await prisma.vaccine.findFirst({
      where: { id, ...NOT_DELETED },
      include: auditInclude,
    });
    return serializeRow(row);
  },

  async update(id, data, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Vaccine not found');
      err.statusCode = 404;
      throw err;
    }

    const payload = { updatedBy: userId };

    if (data.vaccineName !== undefined) {
      const vaccineName = String(data.vaccineName).trim();
      if (!vaccineName) {
        const err = new Error('Vaccine Name cannot be empty');
        err.statusCode = 400;
        throw err;
      }
      payload.vaccineName = vaccineName;
    }
    if (data.vaccineCode !== undefined) {
      const vaccineCode = String(data.vaccineCode).trim();
      if (!vaccineCode) {
        const err = new Error('Vaccine Code cannot be empty');
        err.statusCode = 400;
        throw err;
      }
      await assertUniqueVaccineCode(vaccineCode, id);
      payload.vaccineCode = vaccineCode;
    }
    if (data.manufacturer !== undefined) {
      payload.manufacturer = data.manufacturer ? String(data.manufacturer).trim() : null;
    }
    if (data.route !== undefined) {
      payload.route = data.route && ROUTE_OPTIONS.includes(data.route) ? data.route : data.route || null;
    }
    if (data.status !== undefined) {
      payload.status = data.status === 'Inactive' ? 'Inactive' : 'Active';
    }

    const row = await prisma.vaccine.update({
      where: { id },
      data: payload,
      include: auditInclude,
    });

    return serializeRow(row);
  },

  async delete(id, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Vaccine not found');
      err.statusCode = 404;
      throw err;
    }

    const usedInOrders = await isVaccineUsedInOrders(existing.vaccineCode);

    if (usedInOrders) {
      const row = await prisma.vaccine.update({
        where: { id },
        data: {
          status: 'Inactive',
          updatedBy: userId,
        },
        include: auditInclude,
      });
      return {
        success: true,
        deactivated: true,
        message: 'Vaccine is used in patient orders and has been marked Inactive instead of deleted.',
        data: serializeRow(row),
      };
    }

    await prisma.vaccine.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        updatedBy: userId,
      },
    });

    return {
      success: true,
      deactivated: false,
      message: 'Vaccine deleted successfully',
    };
  },
};

module.exports = vaccineService;
