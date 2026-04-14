const prisma = require('../lib/prisma');

/**
 * Resolve destination (onsite | external) for an order category based on facility config.
 */
function getDestination(category, config) {
  if (!config) return 'onsite';
  switch (category) {
    case 'Lab':
      return config.hasOnsiteLab ? 'onsite' : 'external';
    case 'Radiology':
      return config.hasOnsiteRadiology ? 'onsite' : 'external';
    case 'Pharmacy':
      return config.hasOnsitePharmacy ? 'onsite' : 'external';
    case 'Procedures':
    default:
      return 'onsite';
  }
}

/**
 * Get facility config for a location (or first active).
 */
async function getFacilityConfig(locationId) {
  if (locationId) {
    const loc = await prisma.location.findFirst({
      where: { id: locationId, isActive: true },
      select: { hasOnsiteLab: true, hasOnsitePharmacy: true, hasOnsiteRadiology: true },
    });
    return loc || { hasOnsiteLab: true, hasOnsitePharmacy: true, hasOnsiteRadiology: true };
  }
  const loc = await prisma.location.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
    select: { hasOnsiteLab: true, hasOnsitePharmacy: true, hasOnsiteRadiology: true },
  });
  return loc || { hasOnsiteLab: true, hasOnsitePharmacy: true, hasOnsiteRadiology: true };
}

const orderService = {
  async createOrders({ patientId, appointmentId, locationId, orders, orderedBy }) {
    const config = await getFacilityConfig(locationId || null);
    const created = [];
    for (const o of orders) {
      const destination = getDestination(o.category, config);
      const order = await prisma.order.create({
        data: {
          patientId,
          appointmentId: appointmentId || null,
          category: o.category,
          procedureCode: o.procedureCode,
          procedureName: o.procedureName,
          status: o.status || 'Scheduled',
          destination,
          orderedBy: orderedBy || null,
        },
      });
      created.push(order);
    }
    return created;
  },

  async findAll(filters = {}) {
    const { patientId, appointmentId, category, destination, page = 1, limit = 50 } = filters;
    const where = {};
    if (patientId) where.patientId = patientId;
    if (appointmentId) where.appointmentId = appointmentId;
    if (category) where.category = category;
    if (destination) where.destination = destination;

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { orderDateTime: 'desc' },
        include: {
          patient: {
            select: { id: true, firstName: true, lastName: true, mrn: true },
          },
          appointment: {
            select: { id: true, appointmentDate: true, appointmentTime: true },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};

module.exports = orderService;
