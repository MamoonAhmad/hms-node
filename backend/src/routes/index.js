const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');

// Import route modules
const authRoutes = require('./auth.routes');
const patientRoutes = require('./patient.routes');
const appointmentRoutes = require('./appointment.routes');
const insuranceProviderRoutes = require('./insuranceProvider.routes');
const providerRoutes = require('./provider.routes');
const specialtyRoutes = require('./specialty.routes');
const subSpecialtyRoutes = require('./subSpecialty.routes');
const tenantRoutes = require('./tenant.routes');
const locationRoutes = require('./location.routes');
const permissionRoutes = require('./permission.routes');
const roleRoutes = require('./role.routes');
const orderRoutes = require('./order.routes');
const facilityConfigRoutes = require('./facilityConfig.routes');
const departmentRoutes = require('./department.routes');
const appointmentStatusRoutes = require('./appointmentStatus.routes');
const appointmentTypeRoutes = require('./appointmentType.routes');

// Public routes (no auth required)
router.use('/auth', authRoutes);

// Protected routes (auth required)
router.use('/patients', auth, patientRoutes);
router.use('/appointments', auth, appointmentRoutes);
router.use('/appointment-statuses', auth, appointmentStatusRoutes);
router.use('/appointment-types', auth, appointmentTypeRoutes);
router.use('/insurance-providers', auth, insuranceProviderRoutes);
router.use('/providers', auth, providerRoutes);
router.use('/specialties', auth, specialtyRoutes);
router.use('/sub-specialties', auth, subSpecialtyRoutes);
router.use('/tenants', auth, tenantRoutes);
router.use('/locations', auth, locationRoutes);
router.use('/departments', auth, departmentRoutes);
router.use('/permissions', auth, permissionRoutes);
router.use('/roles', auth, roleRoutes);
router.use('/orders', auth, orderRoutes);
router.use('/facility-config', auth, facilityConfigRoutes);

module.exports = router;

