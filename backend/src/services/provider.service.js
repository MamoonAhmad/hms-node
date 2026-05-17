const prisma = require('../lib/prisma');

const providerInclude = {
  specialty: { select: { id: true, name: true, code: true, isActive: true } },
  subSpecialty: { select: { id: true, name: true, code: true, specialtyId: true } },
  department: {
    select: { id: true, departmentName: true, departmentCode: true, status: true, locationId: true },
  },
};

function fkOrUndefined(v) {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  return v;
}

/** @returns {{ specialtyId: string|null, subSpecialtyId: string|null }} */
async function computeClinicalFks(payload, existing) {
  const specialtyTouched = Object.prototype.hasOwnProperty.call(payload, 'specialtyId');
  const subTouched = Object.prototype.hasOwnProperty.call(payload, 'subSpecialtyId');

  let specialtyId = specialtyTouched ? fkOrUndefined(payload.specialtyId) : (existing?.specialtyId ?? null);
  let subSpecialtyId = subTouched ? fkOrUndefined(payload.subSpecialtyId) : (existing?.subSpecialtyId ?? null);

  if (!subSpecialtyId) {
    return { specialtyId: specialtyId ?? null, subSpecialtyId: null };
  }

  const subRow = await prisma.subSpecialty.findUnique({
    where: { id: subSpecialtyId },
    select: { specialtyId: true },
  });

  if (!subRow) {
    const err = new Error('Invalid sub-specialty reference');
    err.status = 400;
    throw err;
  }

  if (specialtyTouched && specialtyId && specialtyId !== subRow.specialtyId) {
    const err = new Error('Sub-specialty does not belong to the selected specialty');
    err.status = 400;
    throw err;
  }

  specialtyId = subRow.specialtyId;

  return { specialtyId, subSpecialtyId };
}

function pickDepartmentId(payload) {
  if (!Object.prototype.hasOwnProperty.call(payload, 'departmentId')) return undefined;
  return fkOrUndefined(payload.departmentId);
}

const providerService = {
  providerInclude,

  async create(data) {
    const clinical = await computeClinicalFks(data, null);

    const departmentId = pickDepartmentId(data);

    const { specialtyId: _s, subSpecialtyId: _sub, departmentId: _dep, ...rest } = data;

    return prisma.provider.create({
      data: {
        ...rest,
        specialtyId: clinical.specialtyId,
        subSpecialtyId: clinical.subSpecialtyId,
        ...(departmentId !== undefined ? { departmentId } : {}),
      },
      include: providerInclude,
    });
  },

  async findAll({ page = 1, limit = 10, search = '', isActive }) {
    const take = parseInt(limit) || 10;
    const skip = (parseInt(page) - 1) * take;

    const where = {};
    const conditions = [];

    if (search) {
      conditions.push({
        OR: [
          { npi: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { mobileNumber: { contains: search, mode: 'insensitive' } },
          {
            specialty: {
              OR: [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }],
            },
          },
          {
            subSpecialty: {
              OR: [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }],
            },
          },
          {
            department: {
              OR: [
                { departmentName: { contains: search, mode: 'insensitive' } },
                { departmentCode: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        ],
      });
    }

    if (isActive !== undefined && isActive !== '') {
      conditions.push({ isActive: isActive === 'true' || isActive === true });
    }

    if (conditions.length > 0) {
      where.AND = conditions;
    }

    const [providers, total] = await Promise.all([
      prisma.provider.findMany({
        where,
        skip,
        take,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        include: providerInclude,
      }),
      prisma.provider.count({ where }),
    ]);

    return {
      data: providers,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  },

  async findById(id) {
    return prisma.provider.findUnique({
      where: { id },
      include: providerInclude,
    });
  },

  async update(id, data) {
    const existing = await prisma.provider.findUnique({
      where: { id },
      select: { specialtyId: true, subSpecialtyId: true },
    });
    if (!existing) return null;

    const clinical = await computeClinicalFks(data, existing);

    const departmentId = pickDepartmentId(data);

    const prismaData = { ...data };

    const clinicalTouched = Object.prototype.hasOwnProperty.call(data, 'specialtyId') || Object.prototype.hasOwnProperty.call(data, 'subSpecialtyId');
    if (clinicalTouched) {
      prismaData.specialtyId = clinical.specialtyId;
      prismaData.subSpecialtyId = clinical.subSpecialtyId;
    }

    if (departmentId !== undefined) {
      prismaData.departmentId = departmentId;
    }

    return prisma.provider.update({
      where: { id },
      data: prismaData,
      include: providerInclude,
    });
  },

  async delete(id) {
    return prisma.provider.delete({
      where: { id },
    });
  },
};

module.exports = providerService;
