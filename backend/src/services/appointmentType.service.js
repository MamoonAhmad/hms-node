const prisma = require('../lib/prisma');

const NOT_DELETED = { deletedAt: null };

const auditUserSelect = { id: true, name: true, email: true };

const auditInclude = {
  creator: { select: auditUserSelect },
  updater: { select: auditUserSelect },
  deleter: { select: auditUserSelect },
};

function parseDefaultTime(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (Number.isNaN(num)) {
    const err = new Error('Time must be a valid number');
    err.statusCode = 400;
    throw err;
  }
  return num;
}

const appointmentTypeService = {
  async create(data, userId) {
    return prisma.appointmentType.create({
      data: {
        name: String(data.name).trim(),
        description:
          data.description != null && String(data.description).trim() !== ''
            ? String(data.description).trim()
            : null,
        defaultTime: parseDefaultTime(data.defaultTime),
        isActive: data.isActive !== undefined ? data.isActive : true,
        sortOrder: data.sortOrder != null ? parseInt(data.sortOrder, 10) : 0,
        deletedAt: null,
        createdBy: userId,
        updatedBy: userId,
      },
      include: auditInclude,
    });
  },

  async findAll({ page = 1, limit = 10, search = '', isActive }) {
    const take = parseInt(limit, 10) || 10;
    const skip = (parseInt(page, 10) - 1) * take;

    const conditions = [NOT_DELETED];

    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (isActive !== undefined && isActive !== '') {
      conditions.push({ isActive: isActive === 'true' || isActive === true });
    }

    const where = { AND: conditions };

    const [rows, total] = await Promise.all([
      prisma.appointmentType.findMany({
        where,
        skip,
        take,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: auditInclude,
      }),
      prisma.appointmentType.count({ where }),
    ]);

    return {
      data: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  },

  async findAllActive() {
    return prisma.appointmentType.findMany({
      where: { ...NOT_DELETED, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        defaultTime: true,
        description: true,
        sortOrder: true,
      },
    });
  },

  async findById(id) {
    return prisma.appointmentType.findFirst({
      where: { id, ...NOT_DELETED },
      include: auditInclude,
    });
  },

  async update(id, data, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Appointment type not found');
      err.statusCode = 404;
      throw err;
    }

    const payload = { updatedBy: userId };
    if (data.name !== undefined) payload.name = String(data.name).trim();
    if (data.description !== undefined) {
      payload.description =
        data.description === '' || data.description == null
          ? null
          : String(data.description).trim();
    }
    if (data.defaultTime !== undefined) {
      payload.defaultTime = parseDefaultTime(data.defaultTime);
    }
    if (data.isActive !== undefined) payload.isActive = data.isActive;
    if (data.sortOrder !== undefined) payload.sortOrder = parseInt(data.sortOrder, 10);

    return prisma.appointmentType.update({
      where: { id },
      data: payload,
      include: auditInclude,
    });
  },

  /** Soft delete — sets deletedAt, deletedBy, and deactivates. */
  async delete(id, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Appointment type not found');
      err.statusCode = 404;
      throw err;
    }

    return prisma.appointmentType.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        deletedBy: userId,
        updatedBy: userId,
      },
      include: auditInclude,
    });
  },
};

module.exports = appointmentTypeService;
