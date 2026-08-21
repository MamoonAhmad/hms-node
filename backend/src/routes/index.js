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
const facilityConfigRoutes = require('./facilityConfig.routes');
const departmentRoutes = require('./department.routes');
const appointmentStatusRoutes = require('./appointmentStatus.routes');
const appointmentTypeRoutes = require('./appointmentType.routes');
const providerScheduleRoutes = require('./providerSchedule.routes');
const providerBlockHourRoutes = require('./providerBlockHour.routes');
const procedureCategoryRoutes = require('./procedureCategory.routes');
const procedureRoutes = require('./procedure.routes');
const hcpcsCodeRoutes = require('./hcpcsCode.routes');
const diagnosisCodeRoutes = require('./diagnosisCode.routes');
const placeOfServiceRoutes = require('./placeOfService.routes');
const billingProviderRoutes = require('./billingProvider.routes');
const encountersWorkListRoutes = require('./encountersWorkList.routes');
const rcmEncounterRoutes = require('./rcmEncounter.routes');
const rcmRoutes = require('./rcm.routes');
const chargeMasterRoutes = require('./chargeMaster.routes');
const waitlistRoutes = require('./waitlist.routes');

// Public routes (no auth required)
router.use('/auth', authRoutes);

// Protected routes (auth required)
router.use('/patients', auth, patientRoutes);
router.use('/appointments', auth, appointmentRoutes);
router.use('/waitlist', auth, waitlistRoutes);
router.use('/appointment-statuses', auth, appointmentStatusRoutes);
router.use('/appointment-types', auth, appointmentTypeRoutes);
router.use('/provider-schedules', auth, providerScheduleRoutes);
router.use('/provider-block-hours', auth, providerBlockHourRoutes);
router.use('/procedure-categories', auth, procedureCategoryRoutes);
router.use('/procedures', auth, procedureRoutes);
router.use('/hcpcs-codes', auth, hcpcsCodeRoutes);
router.use('/diagnosis-codes', auth, diagnosisCodeRoutes);
router.use('/place-of-service', auth, placeOfServiceRoutes);
router.use('/billing-providers', auth, billingProviderRoutes);
router.use('/encounters-work-list', auth, encountersWorkListRoutes);
router.use('/rcm/encounters', auth, rcmEncounterRoutes);
router.use('/rcm', auth, rcmRoutes);
router.use('/charge-master', auth, chargeMasterRoutes);
router.use('/insurance-providers', auth, insuranceProviderRoutes);
router.use('/providers', auth, providerRoutes);
router.use('/specialties', auth, specialtyRoutes);
router.use('/sub-specialties', auth, subSpecialtyRoutes);
router.use('/tenants', auth, tenantRoutes);
router.use('/locations', auth, locationRoutes);
router.use('/departments', auth, departmentRoutes);
router.use('/permissions', auth, permissionRoutes);
router.use('/roles', auth, roleRoutes);
router.use('/facility-config', auth, facilityConfigRoutes);

module.exports = router;
