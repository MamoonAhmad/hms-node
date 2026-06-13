const prisma = require('../lib/prisma');

const NOT_DELETED = { deletedAt: null };
const BED_NOT_DELETED = { deletedAt: null };

const VALID_STATUSES = ['active', 'maintenance', 'offline'];

const auditUserSelect = { id: true, name: true, email: true };

const auditInclude = {
  creator: { select: auditUserSelect },
  updater: { select: auditUserSelect },
  deleter: { select: auditUserSelect },
};

const roomTypeInclude = {
  roomType: {
    select: { id: true, code: true, label: true },
  },
};

const listInclude = {
  ...auditInclude,
  roomTypes: {
    include: roomTypeInclude,
    orderBy: { roomType: { sortOrder: 'asc' } },
  },
  _count: {
    select: {
      beds: {
        where: BED_NOT_DELETED,
      },
    },
  },
};

function emptyToNull(value) {
  if (value == null || String(value).trim() === '') return null;
  return String(value).trim();
}

function normalizeStatus(value) {
  const status = String(value || 'active')
    .trim()
    .toLowerCase();
  if (!VALID_STATUSES.includes(status)) {
    const err = new Error('Status must be active, maintenance, or offline');
    err.statusCode = 400;
    throw err;
  }
  return status;
}

function parseLicensedBeds(value, defaultValue = 1) {
  if (value == null || value === '') return defaultValue;
  const num = parseInt(value, 10);
  if (Number.isNaN(num) || num < 0) {
    const err = new Error('Licensed beds must be a number greater than or equal to 0');
    err.statusCode = 400;
    throw err;
  }
  return num;
}

function serializeRoom(row) {
  if (!row) return null;

  const roomTypes = (row.roomTypes || []).map((link) => ({
    id: link.roomType.id,
    code: link.roomType.code,
    label: link.roomType.label,
  }));

  return {
    id: row.id,
    roomNumber: row.roomNumber,
    displayName: row.displayName || '',
    floor: row.floor || '',
    unit: row.unit || '',
    status: row.status,
    licensedBeds: row.licensedBeds,
    notes: row.notes || '',
    roomTypeIds: roomTypes.map((t) => t.id),
    roomTypes,
    roomTypeLabels: roomTypes.map((t) => t.label).join(', '),
    bedCount: row._count?.beds ?? 0,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    deletedBy: row.deletedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    creator: row.creator,
    updater: row.updater,
    deleter: row.deleter,
  };
}

async function syncRoomTypes(roomId, roomTypeIds) {
  await prisma.roomTypeOnRoom.deleteMany({
    where: { roomId },
  });

  if (!roomTypeIds?.length) return;

  await prisma.roomTypeOnRoom.createMany({
    data: roomTypeIds.map((roomTypeId) => ({
      roomId,
      roomTypeId,
    })),
  });
}

async function validateRoomTypeIds(roomTypeIds) {
  if (!roomTypeIds?.length) {
    const err = new Error('At least one room type is required');
    err.statusCode = 400;
    throw err;
  }

  const uniqueIds = [...new Set(roomTypeIds)];
  const count = await prisma.roomType.count({
    where: {
      id: { in: uniqueIds },
      ...NOT_DELETED,
      isActive: true,
    },
  });

  if (count !== uniqueIds.length) {
    const err = new Error('One or more room types are invalid or inactive');
    err.statusCode = 400;
    throw err;
  }

  return uniqueIds;
}

async function getSummary() {
  const [totalRooms, activeRooms, agg] = await Promise.all([
    prisma.room.count({ where: NOT_DELETED }),
    prisma.room.count({ where: { ...NOT_DELETED, status: 'active' } }),
    prisma.room.aggregate({
      where: NOT_DELETED,
      _sum: { licensedBeds: true },
    }),
  ]);

  return {
    totalRooms,
    activeRooms,
    licensedBedsSum: agg._sum.licensedBeds || 0,
  };
}

const roomService = {
  async create(data, userId) {
    const roomNumber = String(data.roomNumber || '').trim();
    if (!roomNumber) {
      const err = new Error('Room number is required');
      err.statusCode = 400;
      throw err;
    }

    const roomTypeIds = await validateRoomTypeIds(data.roomTypeIds);

    const row = await prisma.room.create({
      data: {
        roomNumber,
        displayName: emptyToNull(data.displayName),
        floor: emptyToNull(data.floor),
        unit: emptyToNull(data.unit),
        status: normalizeStatus(data.status),
        licensedBeds: parseLicensedBeds(data.licensedBeds),
        notes: emptyToNull(data.notes),
        deletedAt: null,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    await syncRoomTypes(row.id, roomTypeIds);

    const full = await prisma.room.findUnique({
      where: { id: row.id },
      include: listInclude,
    });

    return serializeRoom(full);
  },

  async findAll({ page = 1, limit = 10, search = '', status = '' }) {
    const take = parseInt(limit, 10) || 10;
    const skip = (parseInt(page, 10) - 1) * take;
    const conditions = [NOT_DELETED];

    if (search) {
      conditions.push({
        OR: [
          { roomNumber: { contains: search, mode: 'insensitive' } },
          { displayName: { contains: search, mode: 'insensitive' } },
          { floor: { contains: search, mode: 'insensitive' } },
          { unit: { contains: search, mode: 'insensitive' } },
          { status: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
          {
            roomTypes: {
              some: {
                roomType: {
                  OR: [
                    { code: { contains: search, mode: 'insensitive' } },
                    { label: { contains: search, mode: 'insensitive' } },
                  ],
                },
              },
            },
          },
        ],
      });
    }

    if (status) {
      conditions.push({ status: normalizeStatus(status) });
    }

    const where = { AND: conditions };

    const [rows, total, summary] = await Promise.all([
      prisma.room.findMany({
        where,
        skip,
        take,
        orderBy: [{ roomNumber: 'asc' }],
        include: listInclude,
      }),
      prisma.room.count({ where }),
      getSummary(),
    ]);

    return {
      data: rows.map(serializeRoom),
      pagination: {
        page: parseInt(page, 10),
        limit: take,
        total,
        totalPages: Math.ceil(total / take) || 1,
      },
      summary,
    };
  },

  async findAllActive() {
    const rows = await prisma.room.findMany({
      where: { ...NOT_DELETED, status: 'active' },
      orderBy: [{ roomNumber: 'asc' }],
      select: {
        id: true,
        roomNumber: true,
        displayName: true,
      },
    });

    return rows.map((row) => ({
      ...row,
      displayName: row.displayName || '',
    }));
  },

  async findById(id) {
    const row = await prisma.room.findFirst({
      where: { id, ...NOT_DELETED },
      include: listInclude,
    });
    return serializeRoom(row);
  },

  async update(id, data, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Room not found');
      err.statusCode = 404;
      throw err;
    }

    const payload = { updatedBy: userId };

    if (data.roomNumber !== undefined) {
      const roomNumber = String(data.roomNumber).trim();
      if (!roomNumber) {
        const err = new Error('Room number cannot be empty');
        err.statusCode = 400;
        throw err;
      }
      payload.roomNumber = roomNumber;
    }
    if (data.displayName !== undefined) payload.displayName = emptyToNull(data.displayName);
    if (data.floor !== undefined) payload.floor = emptyToNull(data.floor);
    if (data.unit !== undefined) payload.unit = emptyToNull(data.unit);
    if (data.status !== undefined) payload.status = normalizeStatus(data.status);
    if (data.licensedBeds !== undefined) payload.licensedBeds = parseLicensedBeds(data.licensedBeds, existing.licensedBeds);
    if (data.notes !== undefined) payload.notes = emptyToNull(data.notes);

    await prisma.room.update({
      where: { id },
      data: payload,
    });

    if (data.roomTypeIds !== undefined) {
      const roomTypeIds = await validateRoomTypeIds(data.roomTypeIds);
      await syncRoomTypes(id, roomTypeIds);
    }

    const full = await prisma.room.findUnique({
      where: { id },
      include: listInclude,
    });

    return serializeRoom(full);
  },

  async delete(id, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Room not found');
      err.statusCode = 404;
      throw err;
    }

    await prisma.$transaction(async (tx) => {
      await tx.bed.deleteMany({ where: { roomId: id } });
      await tx.roomTypeOnRoom.deleteMany({ where: { roomId: id } });
      await tx.room.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: userId,
          updatedBy: userId,
        },
      });
    });

    return { success: true };
  },

  getSummary,
};

module.exports = roomService;
