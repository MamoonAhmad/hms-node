const prisma = require('../lib/prisma');

const auditUserSelect = { id: true, name: true, email: true };

const listInclude = {
  creator: { select: auditUserSelect },
  updater: { select: auditUserSelect },
  department: { select: { id: true, departmentName: true, departmentCode: true } },
  items: {
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  },
  _count: { select: { items: true } },
};

const detailInclude = {
  ...listInclude,
  items: {
    orderBy: { sortOrder: 'asc' },
  },
};

function serializeItem(item) {
  if (!item) return null;
  return {
    id: item.id,
    procedureId: item.procedureId,
    procedureCode: item.procedureCode,
    procedureName: item.procedureName,
    category: item.category,
    sortOrder: item.sortOrder,
    isActive: item.isActive,
  };
}

function serializeOrderSet(row, { includeInactiveItems = false } = {}) {
  if (!row) return null;
  const items = (row.items || [])
    .filter((i) => includeInactiveItems || i.isActive)
    .map(serializeItem);
  const createdByName = row.creator?.name || row.creator?.email || null;
  const updatedByName = row.updater?.name || row.updater?.email || null;
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    category: row.category,
    departmentId: row.departmentId,
    departmentName: row.department?.departmentName || null,
    visibility: row.visibility,
    status: row.status,
    ownerUserId: row.ownerUserId,
    orderCount: row._count?.items ?? items.length,
    items,
    orders: items,
    createdBy: row.createdBy,
    createdByName,
    updatedBy: row.updatedBy,
    updatedByName,
    createdAt: row.createdAt?.toISOString() || null,
    updatedAt: row.updatedAt?.toISOString() || null,
  };
}

function buildVisibilityFilter(userId, departmentId) {
  const or = [{ visibility: 'global' }, { createdBy: userId }, { ownerUserId: userId }];
  if (departmentId) {
    or.push({ visibility: 'department', departmentId });
  }
  return or;
}

const customOrderSetService = {
  async findAll({ page = 1, limit = 50, status = 'active' } = {}) {
    const take = parseInt(limit, 10) || 50;
    const skip = (parseInt(page, 10) - 1) * take;
    const where = { isDeleted: false };
    if (status) where.status = status;

    const [rows, total] = await Promise.all([
      prisma.customOrderSet.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: listInclude,
      }),
      prisma.customOrderSet.count({ where }),
    ]);

    return {
      data: rows.map((r) => serializeOrderSet(r)),
      pagination: {
        page: parseInt(page, 10) || 1,
        limit: take,
        total,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  },

  async search({ q, userId, departmentId, locationId }) {
    if (!q || q.trim().length < 2) return [];
    const keyword = q.trim();
    const where = {
      isDeleted: false,
      status: 'active',
      OR: [
        { name: { contains: keyword, mode: 'insensitive' } },
        { code: { contains: keyword, mode: 'insensitive' } },
        { category: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { department: { departmentName: { contains: keyword, mode: 'insensitive' } } },
      ],
      AND: [{ OR: buildVisibilityFilter(userId, departmentId) }],
    };

    const rows = await prisma.customOrderSet.findMany({
      where,
      take: 25,
      orderBy: { name: 'asc' },
      include: listInclude,
    });

    return rows.map((r) => serializeOrderSet(r));
  },

  async findById(id) {
    const row = await prisma.customOrderSet.findFirst({
      where: { id, isDeleted: false },
      include: detailInclude,
    });
    return serializeOrderSet(row, { includeInactiveItems: true });
  },

  async create(data, userId) {
    const name = String(data.name || '').trim();
    if (!name) {
      const err = new Error('Order set name is required');
      err.statusCode = 400;
      throw err;
    }

    const items = data.items || data.orders || [];
    const row = await prisma.customOrderSet.create({
      data: {
        name,
        code: data.code?.trim() || null,
        description: data.description?.trim() || null,
        category: data.category?.trim() || null,
        departmentId: data.departmentId || null,
        visibility: data.visibility || 'global',
        status: data.status || 'active',
        ownerUserId: data.ownerUserId || userId,
        createdBy: userId,
        updatedBy: userId,
        items: {
          create: items.map((item, index) => ({
            procedureId: item.procedureId || item.id || null,
            procedureCode: item.procedureCode || item.code || null,
            procedureName: item.procedureName || item.name,
            category: item.category || 'Other',
            sortOrder: index,
            isActive: item.isActive !== false,
          })),
        },
      },
      include: detailInclude,
    });

    return serializeOrderSet(row, { includeInactiveItems: true });
  },

  async update(id, data, userId) {
    const existing = await prisma.customOrderSet.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) {
      const err = new Error('Custom order set not found');
      err.statusCode = 404;
      throw err;
    }

    const payload = { updatedBy: userId };
    if (data.name !== undefined) payload.name = String(data.name).trim();
    if (data.code !== undefined) payload.code = data.code?.trim() || null;
    if (data.description !== undefined) payload.description = data.description?.trim() || null;
    if (data.category !== undefined) payload.category = data.category?.trim() || null;
    if (data.departmentId !== undefined) payload.departmentId = data.departmentId || null;
    if (data.visibility !== undefined) payload.visibility = data.visibility;
    if (data.status !== undefined) payload.status = data.status;
    if (data.ownerUserId !== undefined) payload.ownerUserId = data.ownerUserId || null;

    await prisma.customOrderSet.update({ where: { id }, data: payload });

    if (data.items !== undefined || data.orders !== undefined) {
      const items = data.items || data.orders || [];
      await prisma.customOrderSetItem.deleteMany({ where: { orderSetId: id } });
      if (items.length) {
        await prisma.customOrderSetItem.createMany({
          data: items.map((item, index) => ({
            orderSetId: id,
            procedureId: item.procedureId || item.id || null,
            procedureCode: item.procedureCode || item.code || null,
            procedureName: item.procedureName || item.name,
            category: item.category || 'Other',
            sortOrder: index,
            isActive: item.isActive !== false,
          })),
        });
      }
    }

    return this.findById(id);
  },

  async delete(id, userId) {
    const existing = await prisma.customOrderSet.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) {
      const err = new Error('Custom order set not found');
      err.statusCode = 404;
      throw err;
    }

    await prisma.customOrderSet.update({
      where: { id },
      data: {
        isDeleted: true,
        status: 'inactive',
        deletedBy: userId,
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return { id };
  },
};

module.exports = customOrderSetService;
