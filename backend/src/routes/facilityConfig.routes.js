const express = require('express');
const router = express.Router();
const facilityConfigController = require('../controllers/facilityConfig.controller');

/**
 * GET /api/facility-config?locationId=uuid
 * Returns { hasOnsiteLab, hasOnsitePharmacy, hasOnsiteRadiology } for the facility.
 */
router.get('/', facilityConfigController.getConfig);

module.exports = router;
