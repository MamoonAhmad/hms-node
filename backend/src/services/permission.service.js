const prisma = require('../lib/prisma');

const permissionService = {
  /**
   * Create a new permission
   */
  async create(data) {
    return prisma.permission.create({
      data: {
        name: data.name,
        description: data.description,
        resource: data.resource,
        action: data.action,
      },
    });
  },

  /**
   * Get all permissions with optional pagination and filters
   */
  async findAll({ page = 1, limit = 10, search = '', resource }) {
    const skip = (page - 1) * parseInt(limit);

    // Build where clause
    const where = {};
    const conditions = [];

    // Search filter
    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { resource: { contains: search, mode: 'insensitive' } },
          { action: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    // Resource filter
    if (resource) {
      conditions.push({ resource });
    }

    // Combine conditions with AND
    if (conditions.length > 0) {
      where.AND = conditions;
    }

    const [permissions, total] = await Promise.all([
      prisma.permission.findMany({
        where,
        skip,
        take: parseInt(limit) || 10,
        orderBy: [
          { resource: 'asc' },
          { action: 'asc' },
        ],
      }),
      prisma.permission.count({ where }),
    ]);

    return {
      data: permissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  },

  /**
   * Get a permission by ID
   */
  async findById(id) {
    return prisma.permission.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  },

  /**
   * Update a permission
   */
  async update(id, data) {
    return prisma.permission.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete a permission
   */
  async delete(id) {
    return prisma.permission.delete({
      where: { id },
    });
  },
};

module.exports = permissionService;

