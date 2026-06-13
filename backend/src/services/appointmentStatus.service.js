const prisma = require('../lib/prisma');

function normalizeColor(value) {
  const trimmed = String(value || '').trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed.toLowerCase()}`;
  return null;
}

const NOT_DELETED = { deletedAt: null };

const auditUserSelect = { id: true, name: true, email: true };

const auditInclude = {
  creator: { select: auditUserSelect },
  updater: { select: auditUserSelect },
  deleter: { select: auditUserSelect },
};

async function attachAppointmentCounts(rows) {
  if (!rows.length) return rows;

  const grouped = await prisma.appointment.groupBy({
    by: ['status'],
    _count: { _all: true },
  });
  const countByName = Object.fromEntries(
    grouped.map((g) => [g.status, g._count._all]),
  );

  return rows.map((row) => ({
    ...row,
    _count: { appointments: countByName[row.name] || 0 },
  }));
}

const appointmentStatusService = {
  normalizeColor,

  async create(data, userId) {
    const color = normalizeColor(data.color);
    if (!color) {
      const err = new Error('Color must be a valid hex code (e.g. #3b82f6)');
      err.statusCode = 400;
      throw err;
    }

    return prisma.appointmentStatus.create({
      data: {
        name: String(data.name).trim(),
        color,
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
          { color: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (isActive !== undefined && isActive !== '') {
      conditions.push({ isActive: isActive === 'true' || isActive === true });
    }

    const where = { AND: conditions };

    const [rows, total] = await Promise.all([
      prisma.appointmentStatus.findMany({
        where,
        skip,
        take,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: auditInclude,
      }),
      prisma.appointmentStatus.count({ where }),
    ]);

    const data = await attachAppointmentCounts(rows);

    return {
      data,
      pagination: {
        page: parseInt(page, 10),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  },

  async findAllActive() {
    return prisma.appointmentStatus.findMany({
      where: { ...NOT_DELETED, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, color: true, sortOrder: true },
    });
  },

  async findById(id) {
    const row = await prisma.appointmentStatus.findFirst({
      where: { id, ...NOT_DELETED },
      include: auditInclude,
    });
    if (!row) return null;
    const [withCount] = await attachAppointmentCounts([row]);
    return withCount;
  },

  async findActiveByName(name) {
    if (!name) return null;
    return prisma.appointmentStatus.findFirst({
      where: { name: String(name).trim(), isActive: true, ...NOT_DELETED },
    });
  },

  async assertActiveStatusName(status) {
    const value = status || 'Scheduled';
    const row = await this.findActiveByName(value);
    if (!row) {
      const err = new Error(`Appointment status "${value}" is not valid or inactive`);
      err.statusCode = 400;
      throw err;
    }
    return row.name;
  },

  async update(id, data, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Appointment status not found');
      err.statusCode = 404;
      throw err;
    }

    const payload = { ...data, updatedBy: userId };
    if (data.name !== undefined) payload.name = String(data.name).trim();
    if (data.color !== undefined) {
      const color = normalizeColor(data.color);
      if (!color) {
        const err = new Error('Color must be a valid hex code (e.g. #3b82f6)');
        err.statusCode = 400;
        throw err;
      }
      payload.color = color;
    }
    if (data.sortOrder !== undefined) payload.sortOrder = parseInt(data.sortOrder, 10);

    delete payload.createdBy;
    delete payload.deletedBy;
    delete payload.deletedAt;

    return prisma.appointmentStatus.update({
      where: { id },
      data: payload,
      include: auditInclude,
    });
  },

  /** Soft delete — sets deletedAt, deletedBy, and deactivates. */
  async delete(id, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Appointment status not found');
      err.statusCode = 404;
      throw err;
    }

    return prisma.appointmentStatus.update({
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

  async countAppointmentsByName(name) {
    return prisma.appointment.count({ where: { status: name } });
  },
};

module.exports = appointmentStatusService;
