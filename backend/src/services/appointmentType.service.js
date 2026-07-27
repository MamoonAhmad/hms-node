const prisma = require('../lib/prisma');

const NOT_DELETED = { deletedAt: null };
const GENERAL_TYPE_NAME = 'General';

const auditUserSelect = { id: true, name: true, email: true };

const auditInclude = {
  creator: { select: auditUserSelect },
  updater: { select: auditUserSelect },
  deleter: { select: auditUserSelect },
};

const FIELD_LABELS = {
  name: 'Appointment Type',
  description: 'Description',
  defaultTime: 'Time',
  isActive: 'Status',
  providerRequired: 'Provider Require',
  isSystem: 'System Type',
  sortOrder: 'Sort Order',
};

function isSystemAppointmentType(row) {
  if (!row) return false;
  if (row.isSystem === true) return true;
  return String(row.name || '').trim().toLowerCase() === GENERAL_TYPE_NAME.toLowerCase();
}

function assertNotSystemType(row, action = 'modify') {
  if (!isSystemAppointmentType(row)) return;
  const err = new Error(
    `The "${GENERAL_TYPE_NAME}" appointment type is system-defined and cannot be ${action}`,
  );
  err.statusCode = 403;
  throw err;
}

function userDisplayName(user) {
  if (!user) return 'System';
  return user.name || user.email || 'System';
}

function formatFieldValue(field, value) {
  if (field === 'isActive') {
    if (value === true || value === 'true') return 'Active';
    if (value === false || value === 'false') return 'Inactive';
  }
  if (field === 'providerRequired') {
    if (value === true || value === 'true') return 'Yes';
    if (value === false || value === 'false') return 'No';
  }
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

function diffFields(before, after, keys) {
  const changes = [];
  keys.forEach((key) => {
    const oldVal = before?.[key];
    const newVal = after?.[key];
    const oldStr = formatFieldValue(key, oldVal);
    const newStr = formatFieldValue(key, newVal);
    if (oldStr !== newStr) {
      changes.push({
        field: key,
        label: FIELD_LABELS[key] || key,
        from: oldStr,
        to: newStr,
      });
    }
  });
  return changes;
}

async function recordHistory(appointmentTypeId, { action, summary, changes, user }) {
  return prisma.appointmentTypeHistory.create({
    data: {
      appointmentTypeId,
      action,
      summary,
      changes: changes?.length ? changes : undefined,
      changedBy: user?.id || null,
      changedByName: userDisplayName(user),
    },
  });
}

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
  async create(data, user) {
    const name = String(data.name).trim();
    if (name.toLowerCase() === GENERAL_TYPE_NAME.toLowerCase()) {
      const err = new Error(
        `"${GENERAL_TYPE_NAME}" is a system appointment type and cannot be created manually`,
      );
      err.statusCode = 400;
      throw err;
    }

    const row = await prisma.appointmentType.create({
      data: {
        name,
        description:
          data.description != null && String(data.description).trim() !== ''
            ? String(data.description).trim()
            : null,
        defaultTime: parseDefaultTime(data.defaultTime),
        isActive: data.isActive !== undefined ? data.isActive : true,
        providerRequired: data.providerRequired !== undefined ? data.providerRequired : false,
        isSystem: false,
        sortOrder: data.sortOrder != null ? parseInt(data.sortOrder, 10) : 0,
        deletedAt: null,
        createdBy: user.id,
        updatedBy: user.id,
      },
      include: auditInclude,
    });

    await recordHistory(row.id, {
      action: 'created',
      summary: 'Created',
      changes: [
        { field: 'name', label: FIELD_LABELS.name, to: formatFieldValue('name', row.name) },
        {
          field: 'description',
          label: FIELD_LABELS.description,
          to: formatFieldValue('description', row.description),
        },
        {
          field: 'defaultTime',
          label: FIELD_LABELS.defaultTime,
          to: formatFieldValue('defaultTime', row.defaultTime),
        },
        {
          field: 'isActive',
          label: FIELD_LABELS.isActive,
          to: formatFieldValue('isActive', row.isActive),
        },
        {
          field: 'providerRequired',
          label: FIELD_LABELS.providerRequired,
          to: formatFieldValue('providerRequired', row.providerRequired),
        },
      ],
      user,
    });

    return row;
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
        orderBy: [{ isSystem: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
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
      orderBy: [{ isSystem: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        defaultTime: true,
        description: true,
        providerRequired: true,
        isSystem: true,
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

  async update(id, data, user) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Appointment type not found');
      err.statusCode = 404;
      throw err;
    }

    assertNotSystemType(existing, 'edited');

    if (data.name !== undefined) {
      const nextName = String(data.name).trim();
      if (nextName.toLowerCase() === GENERAL_TYPE_NAME.toLowerCase()) {
        const err = new Error(
          `"${GENERAL_TYPE_NAME}" is reserved for the system appointment type`,
        );
        err.statusCode = 400;
        throw err;
      }
    }

    const payload = { updatedBy: user.id };
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
    if (data.providerRequired !== undefined) payload.providerRequired = data.providerRequired;
    if (data.sortOrder !== undefined) payload.sortOrder = parseInt(data.sortOrder, 10);

    const trackKeys = ['name', 'description', 'defaultTime', 'isActive', 'providerRequired', 'sortOrder'];
    const changes = diffFields(existing, { ...existing, ...payload }, trackKeys);

    const row = await prisma.appointmentType.update({
      where: { id },
      data: payload,
      include: auditInclude,
    });

    if (changes.length) {
      await recordHistory(id, {
        action: 'updated',
        summary: 'Updated',
        changes,
        user,
      });
    }

    return row;
  },

  /** Soft delete — sets deletedAt, deletedBy, and deactivates. */
  async delete(id, user) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Appointment type not found');
      err.statusCode = 404;
      throw err;
    }

    assertNotSystemType(existing, 'deleted');

    const row = await prisma.appointmentType.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        deletedBy: user.id,
        updatedBy: user.id,
      },
      include: auditInclude,
    });

    await recordHistory(id, {
      action: 'deleted',
      summary: 'Deleted',
      changes: [
        {
          field: 'isActive',
          label: FIELD_LABELS.isActive,
          from: formatFieldValue('isActive', existing.isActive),
          to: 'Inactive',
        },
        {
          field: 'deletedAt',
          label: 'Deleted At',
          from: '—',
          to: formatFieldValue('deletedAt', row.deletedAt),
        },
      ],
      user,
    });

    return row;
  },

  async getHistory(id) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Appointment type not found');
      err.statusCode = 404;
      throw err;
    }

    return prisma.appointmentTypeHistory.findMany({
      where: { appointmentTypeId: id },
      orderBy: { createdAt: 'desc' },
    });
  },
};

module.exports = appointmentTypeService;
