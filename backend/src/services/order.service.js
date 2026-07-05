const prisma = require('../lib/prisma');
const {
  ALLOW_DUPLICATE_ORDERS,
  SITE_REQUIRED,
  ORDER_SITES,
  SOURCE_TYPES,
  mapProcedureCategoryToOrderCategory,
  isOrderEditable,
} = require('../constants/order.constants');

const auditUserSelect = { id: true, name: true, email: true };

const orderInclude = {
  patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
  appointment: { select: { id: true, appointmentDate: true, appointmentTime: true } },
  creator: { select: auditUserSelect },
  updater: { select: auditUserSelect },
};

function getDestination(category, config) {
  if (!config) return 'onsite';
  const cat = category?.toLowerCase() || '';
  if (cat.includes('lab')) return config.hasOnsiteLab ? 'onsite' : 'external';
  if (cat.includes('imaging') || cat.includes('radiolog')) {
    return config.hasOnsiteRadiology ? 'onsite' : 'external';
  }
  if (cat.includes('medication') || cat.includes('pharm')) {
    return config.hasOnsitePharmacy ? 'onsite' : 'external';
  }
  return 'onsite';
}

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

function resolveSite(siteId, siteName) {
  if (siteName) return { siteId: siteId || null, siteName, site: siteName };
  if (siteId) {
    const match = ORDER_SITES.find((s) => s.id === siteId);
    if (match) return { siteId: match.id, siteName: match.name, site: match.name };
  }
  return { siteId: siteId || null, siteName: siteName || null, site: siteName || siteId || null };
}

function serializeOrder(row) {
  if (!row) return null;
  return {
    ...row,
    orderDateTime: row.orderDateTime?.toISOString?.() || row.orderDateTime,
    createdAt: row.createdAt?.toISOString?.() || row.createdAt,
    updatedAt: row.updatedAt?.toISOString?.() || row.updatedAt,
    createdByName: row.creator?.name || row.creator?.email || null,
    updatedByName: row.updater?.name || row.updater?.email || null,
  };
}

async function getPatientMrn(patientId) {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, deletedAt: null },
    select: { mrn: true },
  });
  return patient?.mrn || null;
}

function orderKey(o) {
  return `${o.procedureCode}::${o.procedureName}`.toLowerCase();
}

const orderService = {
  getSites() {
    return ORDER_SITES;
  },

  async searchProcedures({ q, category }) {
    if (!q || q.trim().length < 2) return [];
    const keyword = q.trim();
    const where = {
      deletedAt: null,
      OR: [
        { procedureDescription: { contains: keyword, mode: 'insensitive' } },
        { genericDescription: { contains: keyword, mode: 'insensitive' } },
        { cptCode: { contains: keyword, mode: 'insensitive' } },
      ],
    };

    const rows = await prisma.procedure.findMany({
      where,
      take: 25,
      orderBy: { procedureDescription: 'asc' },
      include: {
        categories: {
          include: { procedureCategory: { select: { id: true, name: true } } },
        },
      },
    });

    return rows
      .map((row) => {
        const catName = row.categories?.[0]?.procedureCategory?.name || null;
        const orderCategory = mapProcedureCategoryToOrderCategory(catName);
        if (category && orderCategory !== category && catName !== category) return null;
        return {
          id: row.id,
          code: row.cptCode || row.id.slice(0, 8),
          name: row.procedureDescription,
          cptCode: row.cptCode,
          procedureCode: row.cptCode || row.id.slice(0, 8),
          procedureName: row.procedureDescription,
          category: orderCategory,
          orderType: catName || orderCategory,
          status: 'active',
        };
      })
      .filter(Boolean);
  },

  async createOrders({
    patientId,
    appointmentId,
    locationId,
    orders,
    orderedBy,
    orderedByUserId,
    orderedByUserName,
    userId,
  }) {
    if (!orders?.length) {
      const err = new Error('At least one order is required');
      err.statusCode = 400;
      throw err;
    }

    const config = await getFacilityConfig(locationId || null);
    const mrn = await getPatientMrn(patientId);
    const encounterId = appointmentId || null;
    const displayName = orderedByUserName || orderedBy || null;

    for (const o of orders) {
      if (!o.procedureName && !o.procedureCode) {
        const err = new Error('Each order must have a procedure name');
        err.statusCode = 400;
        throw err;
      }
      if (!o.status) {
        const err = new Error('Order status is required for each order');
        err.statusCode = 400;
        throw err;
      }
      if (SITE_REQUIRED) {
        const siteResolved = resolveSite(o.siteId, o.siteName || o.site);
        if (!siteResolved.siteName && !siteResolved.siteId) {
          const err = new Error(`Site is required for order: ${o.procedureName}`);
          err.statusCode = 400;
          throw err;
        }
      }
    }

    if (!ALLOW_DUPLICATE_ORDERS) {
      const existing = await prisma.order.findMany({
        where: { patientId, appointmentId: appointmentId || undefined, isDeleted: false },
        select: { procedureCode: true, procedureName: true },
      });
      const existingKeys = new Set(existing.map(orderKey));
      const dup = orders.find((o) => existingKeys.has(orderKey(o)));
      if (dup) {
        const err = new Error('This order already exists in the current order list.');
        err.statusCode = 409;
        throw err;
      }
    }

    const created = [];
    for (const o of orders) {
      const destination = getDestination(o.category, config);
      const siteResolved = resolveSite(o.siteId, o.siteName || o.site);
      const orderDateTime = o.orderDateTime ? new Date(o.orderDateTime) : new Date();

      const order = await prisma.order.create({
        data: {
          patientId,
          appointmentId: appointmentId || null,
          mrn,
          encounterId,
          category: o.category,
          procedureCode: o.procedureCode,
          procedureName: o.procedureName,
          orderType: o.orderType || o.category,
          status: o.status || 'Scheduled',
          destination,
          site: siteResolved.site,
          siteId: siteResolved.siteId,
          siteName: siteResolved.siteName,
          orderedBy: displayName,
          orderedByUserId: orderedByUserId || userId || null,
          orderedByUserName: displayName,
          orderDateTime,
          sourceType: o.sourceType || SOURCE_TYPES.INDIVIDUAL,
          customOrderSetId: o.customOrderSetId || null,
          customOrderSetName: o.customOrderSetName || null,
          createdBy: userId || null,
          updatedBy: userId || null,
        },
        include: orderInclude,
      });

      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          previousStatus: null,
          newStatus: order.status,
          changedBy: userId || null,
          changedByName: displayName,
        },
      });

      created.push(serializeOrder(order));
    }
    return created;
  },

  async updateOrder(id, data, userId, userName) {
    const existing = await prisma.order.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }
    if (!isOrderEditable(existing.status)) {
      const err = new Error('This order cannot be edited in its current status');
      err.statusCode = 403;
      throw err;
    }

    const payload = { updatedBy: userId };
    if (data.status !== undefined) payload.status = data.status;
    if (data.orderDateTime !== undefined) payload.orderDateTime = new Date(data.orderDateTime);
    if (data.siteId !== undefined || data.siteName !== undefined || data.site !== undefined) {
      const siteResolved = resolveSite(
        data.siteId ?? existing.siteId,
        data.siteName ?? data.site ?? existing.siteName ?? existing.site,
      );
      payload.siteId = siteResolved.siteId;
      payload.siteName = siteResolved.siteName;
      payload.site = siteResolved.site;
    }

    const updated = await prisma.order.update({
      where: { id },
      data: payload,
      include: orderInclude,
    });

    if (data.status !== undefined && data.status !== existing.status) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: id,
          previousStatus: existing.status,
          newStatus: data.status,
          changedBy: userId || null,
          changedByName: userName || null,
        },
      });
    }

    return serializeOrder(updated);
  },

  async updateOrders(updates, userId, userName) {
    const results = [];
    for (const item of updates) {
      const result = await this.updateOrder(item.id, item, userId, userName);
      results.push(result);
    }
    return results;
  },

  async deleteOrder(id, userId, userName) {
    const existing = await prisma.order.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }

    await prisma.order.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedBy: userId,
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    if (existing.status !== 'Cancelled') {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: id,
          previousStatus: existing.status,
          newStatus: 'Cancelled',
          changedBy: userId || null,
          changedByName: userName || null,
        },
      });
    }

    return { id };
  },

  async findAll(filters = {}) {
    const { patientId, appointmentId, category, destination } = filters;
    const page = parseInt(filters.page, 10) || 1;
    const limit = parseInt(filters.limit, 10) || 50;
    const where = { isDeleted: false };
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
        include: orderInclude,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data: data.map(serializeOrder),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },
};

module.exports = orderService;
