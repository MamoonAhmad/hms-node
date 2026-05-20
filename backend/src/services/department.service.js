const prisma = require('../lib/prisma');

const deptInclude = {
  location: { select: { id: true, name: true } },
};

/** Keys allowed on department PATCH */
const PATCH_KEYS = [
  'departmentName',
  'departmentCode',
  'departmentType',
  'status',
  'description',
  'facilityName',
  'building',
  'floor',
  'roomNumber',
  'address',
  'city',
  'state',
  'zip',
  'supportsAppointments',
  'supportsWalkIns',
  'defaultAppointmentDuration',
  'operatingDays',
  'startTime',
  'endTime',
  'departmentHead',
  'assignedProviders',
  'assignedNurses',
  'defaultBillingProvider',
  'costCenter',
  'revenueCode',
  'acceptsInsurance',
  'locationId',
];

function blankToNull(val) {
  if (typeof val !== 'string') return val;
  return val.trim() === '' ? null : val;
}

const departmentService = {
  /**
   * @param {Record<string, unknown>} raw
   */
  async create(raw) {
    return prisma.department.create({
      data: {
        departmentName: String(raw.departmentName).trim(),
        departmentCode: String(raw.departmentCode).trim(),
        departmentType: blankToNull(raw.departmentType) ?? null,
        status: raw.status === 'inactive' ? 'inactive' : 'active',
        description: blankToNull(raw.description) ?? null,
        facilityName: blankToNull(raw.facilityName) ?? null,
        building: blankToNull(raw.building) ?? null,
        floor: blankToNull(raw.floor) ?? null,
        roomNumber: blankToNull(raw.roomNumber) ?? null,
        address: blankToNull(raw.address) ?? null,
        city: blankToNull(raw.city) ?? null,
        state: blankToNull(raw.state) ?? null,
        zip: blankToNull(raw.zip) ?? null,
        supportsAppointments: !!raw.supportsAppointments,
        supportsWalkIns: !!raw.supportsWalkIns,
        defaultAppointmentDuration: raw.defaultAppointmentDuration ?? null,
        operatingDays: raw.operatingDays ?? null,
        startTime: blankToNull(raw.startTime) ?? null,
        endTime: blankToNull(raw.endTime) ?? null,
        departmentHead: blankToNull(raw.departmentHead) ?? null,
        assignedProviders: raw.assignedProviders ?? [],
        assignedNurses: raw.assignedNurses ?? [],
        defaultBillingProvider: blankToNull(raw.defaultBillingProvider) ?? null,
        costCenter: blankToNull(raw.costCenter) ?? null,
        revenueCode: blankToNull(raw.revenueCode) ?? null,
        acceptsInsurance: !!raw.acceptsInsurance,
        locationId: raw.locationId ?? null,
      },
      include: deptInclude,
    });
  },

  /** Build patch from Joi-validated update body — only keys present */
  buildPatch(raw) {
    const data = {};
    for (const key of PATCH_KEYS) {
      if (!(key in raw)) continue;
      let v = raw[key];
      if (typeof v === 'string') v = blankToNull(v);
      data[key] = v;
    }
    return data;
  },

  async findAll({ page = 1, limit = 10, search = '', status }) {
    const take = parseInt(limit) || 10;
    const skip = (parseInt(page) - 1) * take;

    const where = {};
    const conditions = [];

    if (search) {
      conditions.push({
        OR: [
          { departmentName: { contains: search, mode: 'insensitive' } },
          { departmentCode: { contains: search, mode: 'insensitive' } },
          { departmentType: { contains: search, mode: 'insensitive' } },
          { facilityName: { contains: search, mode: 'insensitive' } },
          { departmentHead: { contains: search, mode: 'insensitive' } },
          { location: { name: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    if (status) {
      conditions.push({ status });
    }

    if (conditions.length) where.AND = conditions;

    const [rows, total] = await Promise.all([
      prisma.department.findMany({
        where,
        skip,
        take,
        orderBy: { departmentName: 'asc' },
        include: deptInclude,
      }),
      prisma.department.count({ where }),
    ]);

    return {
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  },

  async findAllActive() {
    return prisma.department.findMany({
      where: { status: 'active' },
      orderBy: { departmentName: 'asc' },
      select: { id: true, departmentName: true, departmentCode: true },
    });
  },

  async findById(id) {
    return prisma.department.findUnique({
      where: { id },
      include: deptInclude,
    });
  },

  async update(id, raw) {
    const data = this.buildPatch(raw);
    return prisma.department.update({
      where: { id },
      data,
      include: deptInclude,
    });
  },

  async delete(id) {
    return prisma.department.delete({ where: { id } });
  },
};

module.exports = departmentService;
