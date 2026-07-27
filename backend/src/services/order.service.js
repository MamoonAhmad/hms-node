const prisma = require('../lib/prisma');
const { ensureEmarFromPharmacyOrder } = require('./emarMar.helper');

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
    case 'Immunization':
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

const OPEN_RESULT_STATUSES = new Set(['Scheduled', 'Pending', 'In Progress', 'Collected']);
const RESULT_ORDER_CATEGORIES = new Set(['Lab', 'Radiology']);

/**
 * If result documents exist for lab/radiology orders (tagged order:{id}),
 * promote those orders from open statuses to Resulted so dashboard badges clear.
 */
async function reconcileOrdersWithUploadedResults(patientId, orders) {
  if (!patientId || !Array.isArray(orders) || !orders.length) return orders;

  const openOrders = orders.filter(
    (o) => RESULT_ORDER_CATEGORIES.has(o.category) && OPEN_RESULT_STATUSES.has(o.status),
  );
  if (!openOrders.length) return orders;

  const docs = await prisma.patientDocument.findMany({
    where: {
      patientId,
      OR: [
        { category: { in: ['Lab', 'Imaging'] } },
        { source: 'Lab / Imaging' },
        { documentType: { in: ['Lab Report', 'Imaging Report'] } },
      ],
    },
    select: { tags: true },
  });

  const resultedIds = new Set();
  for (const doc of docs) {
    const tags = Array.isArray(doc.tags) ? doc.tags : [];
    for (const tag of tags) {
      if (typeof tag === 'string' && tag.startsWith('order:')) {
        resultedIds.add(tag.slice('order:'.length));
      }
    }
  }

  const idsToUpdate = openOrders.map((o) => o.id).filter((id) => resultedIds.has(id));
  if (!idsToUpdate.length) return orders;

  await prisma.order.updateMany({
    where: { id: { in: idsToUpdate } },
    data: { status: 'Resulted' },
  });

  return orders.map((o) =>
    idsToUpdate.includes(o.id) ? { ...o, status: 'Resulted' } : o,
  );
}

const orderService = {
  async createOrders({ patientId, appointmentId, locationId, orders, orderedBy, user = null }) {
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
          site: o.site || null,
          orderedBy: orderedBy || null,
        },
      });
      if (o.category === 'Pharmacy') {
        await ensureEmarFromPharmacyOrder(order, user);
      }
      created.push(order);
    }
    return created;
  },

  async findAll(filters = {}) {
    const { patientId, appointmentId, category, destination } = filters;
    const page = Math.max(1, parseInt(filters.page, 10) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(filters.limit, 10) || 50));
    const where = {};
    if (patientId) where.patientId = patientId;
    if (appointmentId) where.appointmentId = appointmentId;
    if (category) where.category = category;
    if (destination) where.destination = destination;

    const [rows, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { orderDateTime: 'desc' },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              mrn: true,
              dateOfBirth: true,
              gender: true,
            },
          },
          appointment: {
            select: { id: true, appointmentDate: true, appointmentTime: true },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    const data = patientId
      ? await reconcileOrdersWithUploadedResults(patientId, rows)
      : rows;

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

  async findById(id) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            mrn: true,
            dateOfBirth: true,
            gender: true,
          },
        },
        appointment: {
          select: { id: true, appointmentDate: true, appointmentTime: true },
        },
      },
    });
    if (!order) {
      const err = new Error('Order not found');
      err.status = 404;
      throw err;
    }
    return order;
  },

  async updateStatus(id, status) {
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      const err = new Error('Order not found');
      err.status = 404;
      throw err;
    }
    return prisma.order.update({
      where: { id },
      data: { status },
    });
  },

  async updateSpecimenCollection(id, data) {
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      const err = new Error('Order not found');
      err.status = 404;
      throw err;
    }
    const emptyToNull = (v) => (v === undefined || v === '' ? null : v);
    return prisma.order.update({
      where: { id },
      data: {
        status: data.status,
        collectionSite: emptyToNull(data.collectionSite),
        specimenType: emptyToNull(data.specimenType),
        collectedBy: emptyToNull(data.collectedBy),
        collectionDateTime: data.collectionDateTime
          ? new Date(data.collectionDateTime)
          : null,
        collectionNotes: emptyToNull(data.collectionNotes),
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            mrn: true,
            dateOfBirth: true,
            gender: true,
          },
        },
      },
    });
  },
};

module.exports = orderService;
