const prisma = require('../lib/prisma');

const tenantService = {
  /**
   * Create a new tenant
   */
  async create(data, userId) {
    return prisma.tenant.create({
      data: {
        name: data.name,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
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
   * Get all tenants with optional pagination and filters
   */
  async findAll({ page = 1, limit = 10, search = '', isActive }) {
    const skip = (page - 1) * parseInt(limit);

    // Build where clause
    const where = {};
    const conditions = [];

    // Search filter
    if (search) {
      conditions.push({
        name: { contains: search, mode: 'insensitive' },
      });
    }

    // Active status filter
    if (isActive !== undefined && isActive !== '') {
      conditions.push({ isActive: isActive === 'true' || isActive === true });
    }

    // Combine conditions with AND
    if (conditions.length > 0) {
      where.AND = conditions;
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take: parseInt(limit) || 10,
        orderBy: { createdAt: 'desc' },
        include: {
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
      prisma.tenant.count({ where }),
    ]);

    return {
      data: tenants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  },

  /**
   * Get a tenant by ID
   */
  async findById(id) {
    return prisma.tenant.findUnique({
      where: { id },
      include: {
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
   * Update a tenant
   */
  async update(id, data, userId) {
    const updateData = {
      ...data,
      updatedBy: userId,
    };

    return prisma.tenant.update({
      where: { id },
      data: updateData,
      include: {
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
   * Delete a tenant
   */
  async delete(id) {
    return prisma.tenant.delete({
      where: { id },
    });
  },
};

module.exports = tenantService;
