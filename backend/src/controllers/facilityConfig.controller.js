const prisma = require('../lib/prisma');

/**
 * GET /api/facility-config
 * Returns facility (location) configuration for order routing: onsite lab, pharmacy, radiology.
 * Query: locationId (optional) - if omitted, returns first active location's config.
 */
async function getConfig(req, res, next) {
  try {
    const locationId = req.query.locationId;
    let location;

    if (locationId) {
      location = await prisma.location.findFirst({
        where: { id: locationId, isActive: true },
        select: {
          id: true,
          name: true,
          hasOnsiteLab: true,
          hasOnsitePharmacy: true,
          hasOnsiteRadiology: true,
        },
      });
    } else {
      location = await prisma.location.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          name: true,
          hasOnsiteLab: true,
          hasOnsitePharmacy: true,
          hasOnsiteRadiology: true,
        },
      });
    }

    if (!location) {
      return res.status(200).json({
        success: true,
        data: {
          locationId: null,
          locationName: null,
          hasOnsiteLab: true,
          hasOnsitePharmacy: true,
          hasOnsiteRadiology: true,
        },
      });
    }

    res.json({
      success: true,
      data: {
        locationId: location.id,
        locationName: location.name,
        hasOnsiteLab: location.hasOnsiteLab ?? true,
        hasOnsitePharmacy: location.hasOnsitePharmacy ?? true,
        hasOnsiteRadiology: location.hasOnsiteRadiology ?? true,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getConfig };
