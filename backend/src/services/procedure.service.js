const prisma = require('../lib/prisma');

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

function emptyToNull(value) {
  if (value == null || String(value).trim() === '') return null;
  return String(value).trim();
}

function serializeProcedure(row) {
  if (!row) return null;
  const categories = (row.categories || []).map((link) => ({
    id: link.procedureCategory.id,
    name: link.procedureCategory.name,
  }));

  return {
    ...row,
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

    const row = await prisma.procedure.create({
      data: {
        procedureDescription,
        genericDescription: emptyToNull(data.genericDescription),
        departmentId: data.departmentId || null,
        cptCode: emptyToNull(data.cptCode),
        revenueCode: emptyToNull(data.revenueCode),
        mod1: emptyToNull(data.mod1),
        mod2: emptyToNull(data.mod2),
        mod3: emptyToNull(data.mod3),
        mod4: emptyToNull(data.mod4),
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

  async findAll({ page = 1, limit = 10, search = '', categoryId }) {
    const take = parseInt(limit, 10) || 10;
    const skip = (parseInt(page, 10) - 1) * take;
    const conditions = [NOT_DELETED];

    if (search) {
      conditions.push({
        OR: [
          { procedureDescription: { contains: search, mode: 'insensitive' } },
          { genericDescription: { contains: search, mode: 'insensitive' } },
          { cptCode: { contains: search, mode: 'insensitive' } },
          { revenueCode: { contains: search, mode: 'insensitive' } },
          { mod1: { contains: search, mode: 'insensitive' } },
          { mod2: { contains: search, mode: 'insensitive' } },
          { mod3: { contains: search, mode: 'insensitive' } },
          { mod4: { contains: search, mode: 'insensitive' } },
          { department: { departmentName: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    if (categoryId) {
      conditions.push({
        categories: {
          some: { procedureCategoryId: categoryId },
        },
      });
    }

    const where = { AND: conditions };

    const [rows, total] = await Promise.all([
      prisma.procedure.findMany({
        where,
        skip,
        take,
        orderBy: { procedureDescription: 'asc' },
        include: listInclude,
      }),
      prisma.procedure.count({ where }),
    ]);

    return {
      data: rows.map(serializeProcedure),
      pagination: {
        page: parseInt(page, 10),
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

  async update(id, data, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Procedure not found');
      err.statusCode = 404;
      throw err;
    }

    const payload = { updatedBy: userId };

    if (data.procedureDescription !== undefined) {
      const procedureDescription = String(data.procedureDescription).trim();
      if (!procedureDescription) {
        const err = new Error('Procedure description cannot be empty');
        err.statusCode = 400;
        throw err;
      }
      payload.procedureDescription = procedureDescription;
    }
    if (data.genericDescription !== undefined) {
      payload.genericDescription = emptyToNull(data.genericDescription);
    }
    if (data.departmentId !== undefined) {
      payload.departmentId = data.departmentId || null;
    }
    if (data.cptCode !== undefined) payload.cptCode = emptyToNull(data.cptCode);
    if (data.revenueCode !== undefined) payload.revenueCode = emptyToNull(data.revenueCode);
    if (data.mod1 !== undefined) payload.mod1 = emptyToNull(data.mod1);
    if (data.mod2 !== undefined) payload.mod2 = emptyToNull(data.mod2);
    if (data.mod3 !== undefined) payload.mod3 = emptyToNull(data.mod3);
    if (data.mod4 !== undefined) payload.mod4 = emptyToNull(data.mod4);

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
      },
    });

    return { success: true };
  },
};

module.exports = procedureService;
