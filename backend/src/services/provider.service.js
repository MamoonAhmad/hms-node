const prisma = require('../lib/prisma');

const providerInclude = {
  specialty: { select: { id: true, name: true, code: true, isActive: true } },
  subSpecialty: { select: { id: true, name: true, code: true, specialtyId: true } },
  department: {
    select: { id: true, departmentName: true, departmentCode: true, status: true, locationId: true },
  },
  departmentLinks: {
    include: {
      department: {
        select: { id: true, departmentName: true, departmentCode: true, status: true, locationId: true },
      },
    },
  },
};

function formatProvider(row) {
  if (!row) return row;
  const linkedDepartments = (row.departmentLinks || [])
    .map((link) => link.department)
    .filter(Boolean);
  const departmentIds = linkedDepartments.map((d) => d.id);
  if (!departmentIds.length && row.department?.id) {
    departmentIds.push(row.department.id);
  }
  return {
    ...row,
    departmentIds,
    departments: linkedDepartments.length
      ? linkedDepartments
      : row.department
        ? [row.department]
        : [],
  };
}

async function assertDepartmentIds(ids) {
  if (!ids?.length) return [];
  const rows = await prisma.department.findMany({
    where: { id: { in: ids }, status: { not: 'inactive' } },
    select: { id: true },
  });
  if (rows.length !== ids.length) {
    const err = new Error('One or more departments are invalid or inactive');
    err.status = 400;
    throw err;
  }
  return ids;
}

async function syncProviderDepartments(providerId, departmentIds) {
  await prisma.providerDepartment.deleteMany({ where: { providerId } });
  if (!departmentIds?.length) return;
  await prisma.providerDepartment.createMany({
    data: departmentIds.map((departmentId) => ({ providerId, departmentId })),
    skipDuplicates: true,
  });
}

function pickDepartmentIds(payload) {
  if (Object.prototype.hasOwnProperty.call(payload, 'departmentIds')) {
    const ids = Array.isArray(payload.departmentIds)
      ? payload.departmentIds.filter(Boolean)
      : [];
    return ids;
  }
  return undefined;
}

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
  formatProvider,

  async create(data) {
    const clinical = await computeClinicalFks(data, null);

    const departmentIds = pickDepartmentIds(data);
    const legacyDepartmentId = pickDepartmentId(data);
    const resolvedDepartmentIds =
      departmentIds !== undefined
        ? departmentIds
        : legacyDepartmentId
          ? [legacyDepartmentId]
          : [];

    await assertDepartmentIds(resolvedDepartmentIds);

    const { specialtyId: _s, subSpecialtyId: _sub, departmentId: _dep, departmentIds: _deps, ...rest } = data;

    const provider = await prisma.provider.create({
      data: {
        ...rest,
        specialtyId: clinical.specialtyId,
        subSpecialtyId: clinical.subSpecialtyId,
        departmentId: resolvedDepartmentIds[0] || null,
      },
      include: providerInclude,
    });

    await syncProviderDepartments(provider.id, resolvedDepartmentIds);

    return formatProvider(
      await prisma.provider.findUnique({ where: { id: provider.id }, include: providerInclude }),
    );
  },

  async findAll({ page = 1, limit = 10, search = '', isActive, departmentId }) {
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
          {
            departmentLinks: {
              some: {
                department: {
                  OR: [
                    { departmentName: { contains: search, mode: 'insensitive' } },
                    { departmentCode: { contains: search, mode: 'insensitive' } },
                  ],
                },
              },
            },
          },
        ],
      });
    }

    if (isActive !== undefined && isActive !== '') {
      conditions.push({ isActive: isActive === 'true' || isActive === true });
    }

    if (departmentId) {
      conditions.push({
        OR: [
          { departmentId },
          { departmentLinks: { some: { departmentId } } },
        ],
      });
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
      data: providers.map(formatProvider),
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  },

  async findById(id) {
    const provider = await prisma.provider.findUnique({
      where: { id },
      include: providerInclude,
    });
    return formatProvider(provider);
  },

  async update(id, data) {
    const existing = await prisma.provider.findUnique({
      where: { id },
      select: { specialtyId: true, subSpecialtyId: true, departmentId: true },
    });
    if (!existing) return null;

    const clinical = await computeClinicalFks(data, existing);

    const departmentIds = pickDepartmentIds(data);
    const legacyDepartmentId = pickDepartmentId(data);
    let resolvedDepartmentIds;
    if (departmentIds !== undefined) {
      resolvedDepartmentIds = departmentIds;
    } else if (legacyDepartmentId !== undefined) {
      resolvedDepartmentIds = legacyDepartmentId ? [legacyDepartmentId] : [];
    }

    if (resolvedDepartmentIds !== undefined) {
      await assertDepartmentIds(resolvedDepartmentIds);
    }

    const { departmentIds: _deps, ...rest } = data;
    const prismaData = { ...rest };

    const clinicalTouched = Object.prototype.hasOwnProperty.call(data, 'specialtyId') || Object.prototype.hasOwnProperty.call(data, 'subSpecialtyId');
    if (clinicalTouched) {
      prismaData.specialtyId = clinical.specialtyId;
      prismaData.subSpecialtyId = clinical.subSpecialtyId;
    }

    if (legacyDepartmentId !== undefined) {
      prismaData.departmentId = legacyDepartmentId;
    } else if (resolvedDepartmentIds !== undefined) {
      prismaData.departmentId = resolvedDepartmentIds[0] || null;
    }

    await prisma.provider.update({
      where: { id },
      data: prismaData,
    });

    if (resolvedDepartmentIds !== undefined) {
      await syncProviderDepartments(id, resolvedDepartmentIds);
    }

    return formatProvider(
      await prisma.provider.findUnique({ where: { id }, include: providerInclude }),
    );
  },

  async delete(id) {
    return prisma.provider.delete({
      where: { id },
    });
  },
};

module.exports = providerService;
