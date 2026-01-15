const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');

// Import route modules
const authRoutes = require('./auth.routes');
const patientRoutes = require('./patient.routes');
const appointmentRoutes = require('./appointment.routes');
const insuranceProviderRoutes = require('./insuranceProvider.routes');
const tenantRoutes = require('./tenant.routes');
const locationRoutes = require('./location.routes');

// Public routes (no auth required)
router.use('/auth', authRoutes);

// Protected routes (auth required)
router.use('/patients', auth, patientRoutes);
router.use('/appointments', auth, appointmentRoutes);
router.use('/insurance-providers', auth, insuranceProviderRoutes);
router.use('/tenants', auth, tenantRoutes);
router.use('/locations', auth, locationRoutes);

module.exports = router;

