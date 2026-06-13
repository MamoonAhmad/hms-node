const prisma = require('../lib/prisma');

const NOT_DELETED = { deletedAt: null };

const VALID_STATUSES = ['available', 'occupied', 'reserved', 'cleaning', 'blocked'];
const NO_PATIENT_STATUSES = ['cleaning', 'blocked'];

const listInclude = {
  room: {
    select: {
      id: true,
      roomNumber: true,
      displayName: true,
      status: true,
    },
  },
  patient: {
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      mrn: true,
    },
  },
};

function emptyToNull(value) {
  if (value == null || String(value).trim() === '') return null;
  return String(value).trim();
}

function normalizeStatus(value) {
  const status = String(value || 'available')
    .trim()
    .toLowerCase();
  if (!VALID_STATUSES.includes(status)) {
    const err = new Error('Status must be available, occupied, reserved, cleaning, or blocked');
    err.statusCode = 400;
    throw err;
  }
  return status;
}

function formatPatientName(patient) {
  if (!patient) return '';
  const parts = [patient.firstName, patient.middleName, patient.lastName].filter(Boolean);
  return parts.join(' ').trim() || patient.mrn || '';
}

function formatRoomLabel(room) {
  if (!room) return '';
  return room.displayName ? `${room.roomNumber} — ${room.displayName}` : room.roomNumber;
}

function serializeBed(row) {
  if (!row) return null;

  return {
    id: row.id,
    bedLabel: row.bedLabel,
    roomId: row.roomId,
    status: row.status,
    patientId: row.patientId || null,
    patientName: formatPatientName(row.patient),
    service: row.service || '',
    notes: row.notes || '',
    room: row.room
      ? {
          id: row.room.id,
          roomNumber: row.room.roomNumber,
          displayName: row.room.displayName || '',
          status: row.room.status,
        }
      : null,
    roomLabel: formatRoomLabel(row.room),
    patient: row.patient
      ? {
          id: row.patient.id,
          firstName: row.patient.firstName,
          middleName: row.patient.middleName,
          lastName: row.patient.lastName,
          mrn: row.patient.mrn,
          name: formatPatientName(row.patient),
        }
      : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function validateRoomId(roomId) {
  if (!roomId) {
    const err = new Error('Room is required');
    err.statusCode = 400;
    throw err;
  }

  const room = await prisma.room.findFirst({
    where: { id: roomId, ...NOT_DELETED },
    select: { id: true },
  });

  if (!room) {
    const err = new Error('Selected room does not exist');
    err.statusCode = 400;
    throw err;
  }
}

async function validatePatientId(patientId) {
  if (!patientId) return null;

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true },
  });

  if (!patient) {
    const err = new Error('Selected patient does not exist');
    err.statusCode = 400;
    throw err;
  }

  return patientId;
}

function resolvePatientId(status, patientId, existingPatientId) {
  if (NO_PATIENT_STATUSES.includes(status)) {
    return null;
  }

  if (status === 'occupied') {
    const resolved = patientId !== undefined ? patientId : existingPatientId;
    if (!resolved) {
      const err = new Error('Occupied beds must have a linked patient');
      err.statusCode = 400;
      throw err;
    }
    return resolved;
  }

  if (patientId === undefined) {
    return existingPatientId ?? null;
  }

  return patientId || null;
}

async function getSummary(where = NOT_DELETED) {
  const [total, available, occupied, unavailable] = await Promise.all([
    prisma.bed.count({ where }),
    prisma.bed.count({ where: { ...where, status: 'available' } }),
    prisma.bed.count({ where: { ...where, status: 'occupied' } }),
    prisma.bed.count({
      where: {
        ...where,
        status: { in: ['cleaning', 'blocked'] },
      },
    }),
  ]);

  return { total, available, occupied, unavailable };
}

const bedService = {
  async create(data) {
    const bedLabel = String(data.bedLabel || '').trim();
    if (!bedLabel) {
      const err = new Error('Bed label is required');
      err.statusCode = 400;
      throw err;
    }

    const status = normalizeStatus(data.status);
    await validateRoomId(data.roomId);

    let patientId = resolvePatientId(status, data.patientId ?? null, null);
    if (patientId) {
      patientId = await validatePatientId(patientId);
    }

    const row = await prisma.bed.create({
      data: {
        bedLabel,
        roomId: data.roomId,
        status,
        patientId,
        service: emptyToNull(data.service),
        notes: emptyToNull(data.notes),
      },
      include: listInclude,
    });

    return serializeBed(row);
  },

  async findAll({ page = 1, limit = 10, search = '', status = '', listTab = '' }) {
    const take = parseInt(limit, 10) || 10;
    const skip = (parseInt(page, 10) - 1) * take;
    const conditions = [NOT_DELETED];

    if (search) {
      conditions.push({
        OR: [
          { bedLabel: { contains: search, mode: 'insensitive' } },
          { status: { contains: search, mode: 'insensitive' } },
          { service: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
          { room: { roomNumber: { contains: search, mode: 'insensitive' } } },
          { room: { displayName: { contains: search, mode: 'insensitive' } } },
          { patient: { firstName: { contains: search, mode: 'insensitive' } } },
          { patient: { lastName: { contains: search, mode: 'insensitive' } } },
          { patient: { mrn: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    if (status) {
      conditions.push({ status: normalizeStatus(status) });
    } else if (listTab === 'available') {
      conditions.push({ status: 'available' });
    } else if (listTab === 'occupied') {
      conditions.push({ status: 'occupied' });
    } else if (listTab === 'reserved') {
      conditions.push({ status: 'reserved' });
    } else if (listTab === 'unavailable') {
      conditions.push({ status: { in: ['cleaning', 'blocked'] } });
    }

    const where = { AND: conditions };

    const [rows, total, summary] = await Promise.all([
      prisma.bed.findMany({
        where,
        skip,
        take,
        orderBy: [{ bedLabel: 'asc' }],
        include: listInclude,
      }),
      prisma.bed.count({ where }),
      getSummary(),
    ]);

    return {
      data: rows.map(serializeBed),
      pagination: {
        page: parseInt(page, 10),
        limit: take,
        total,
        totalPages: Math.ceil(total / take) || 1,
      },
      summary,
    };
  },

  async findById(id) {
    const row = await prisma.bed.findFirst({
      where: { id, ...NOT_DELETED },
      include: listInclude,
    });
    return serializeBed(row);
  },

  async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Bed not found');
      err.statusCode = 404;
      throw err;
    }

    const payload = {};

    if (data.bedLabel !== undefined) {
      const bedLabel = String(data.bedLabel).trim();
      if (!bedLabel) {
        const err = new Error('Bed label cannot be empty');
        err.statusCode = 400;
        throw err;
      }
      payload.bedLabel = bedLabel;
    }

    if (data.roomId !== undefined) {
      await validateRoomId(data.roomId);
      payload.roomId = data.roomId;
    }

    const nextStatus = data.status !== undefined ? normalizeStatus(data.status) : existing.status;

    if (data.status !== undefined) {
      payload.status = nextStatus;
    }

    let nextPatientId = existing.patientId;

    if (NO_PATIENT_STATUSES.includes(nextStatus)) {
      nextPatientId = null;
    } else if (nextStatus === 'occupied') {
      if (existing.status === 'occupied') {
        nextPatientId = existing.patientId;
      } else {
        nextPatientId =
          data.patientId !== undefined && data.patientId !== null
            ? data.patientId
            : existing.patientId;
      }
      if (!nextPatientId) {
        const err = new Error('Occupied beds must have a linked patient');
        err.statusCode = 400;
        throw err;
      }
      nextPatientId = await validatePatientId(nextPatientId);
    } else if (data.patientId !== undefined) {
      nextPatientId = data.patientId ? await validatePatientId(data.patientId) : null;
    }

    if (
      nextPatientId !== existing.patientId ||
      data.patientId !== undefined ||
      data.status !== undefined
    ) {
      payload.patientId = nextPatientId;
    }

    if (data.service !== undefined) payload.service = emptyToNull(data.service);
    if (data.notes !== undefined) payload.notes = emptyToNull(data.notes);

    const row = await prisma.bed.update({
      where: { id },
      data: payload,
      include: listInclude,
    });

    return serializeBed(row);
  },

  async delete(id) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Bed not found');
      err.statusCode = 404;
      throw err;
    }

    await prisma.bed.delete({ where: { id } });
    return { success: true };
  },

  getSummary,
};

module.exports = bedService;
