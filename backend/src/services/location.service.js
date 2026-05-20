const prisma = require('../lib/prisma');

const locationService = {
  /**
   * Create a new location
   */
  async create(data, userId) {
    return prisma.location.create({
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        phone: data.phone,
        isActive: data.isActive !== undefined ? data.isActive : true,
        hasOnsiteLab: data.hasOnsiteLab !== undefined ? data.hasOnsiteLab : true,
        hasOnsitePharmacy: data.hasOnsitePharmacy !== undefined ? data.hasOnsitePharmacy : true,
        hasOnsiteRadiology: data.hasOnsiteRadiology !== undefined ? data.hasOnsiteRadiology : true,
        tenantId: data.tenantId,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updater: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  },

  /**
   * Get all locations with optional pagination and filters
   */
  async findAll({ page = 1, limit = 10, search = '', isActive, tenantId }) {
    const skip = (page - 1) * parseInt(limit);

    // Build where clause
    const where = {};
    const conditions = [];

    // Search filter
    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { state: { contains: search, mode: 'insensitive' } },
          { country: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    // Active status filter
    if (isActive !== undefined && isActive !== '') {
      conditions.push({ isActive: isActive === 'true' || isActive === true });
    }

    // Tenant filter
    if (tenantId) {
      conditions.push({ tenantId });
    }

    // Combine conditions with AND
    if (conditions.length > 0) {
      where.AND = conditions;
    }

    const [locations, total] = await Promise.all([
      prisma.location.findMany({
        where,
        skip,
        take: parseInt(limit) || 10,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          updater: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.location.count({ where }),
    ]);

    return {
      data: locations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  },

  /**
   * Active locations for dropdowns (compact; includes tenant for labels)
   * @param {{ tenantId?: string }} filters
   */
  async findAllActive({ tenantId } = {}) {
    const where = { isActive: true };
    if (tenantId) {
      where.tenantId = tenantId;
    }
    return prisma.location.findMany({
      where,
      orderBy: [{ tenant: { name: 'asc' } }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        tenantId: true,
        tenant: { select: { id: true, name: true } },
      },
    });
  },

  /**
   * Get a location by ID
   */
  async findById(id) {
    return prisma.location.findUnique({
      where: { id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updater: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  },

  /**
   * Update a location
   */
  async update(id, data, userId) {
    const updateData = {
      ...data,
      updatedBy: userId,
    };

    return prisma.location.update({
      where: { id },
      data: updateData,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updater: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  },

  /**
   * Delete a location
   */
  async delete(id) {
    return prisma.location.delete({
      where: { id },
    });
  },
};

module.exports = locationService;

