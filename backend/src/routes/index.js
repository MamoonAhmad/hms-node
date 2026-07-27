const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');

// Import route modules
const authRoutes = require('./auth.routes');
const patientRoutes = require('./patient.routes');
const intakeRoutes = require('./intake.routes');
const chronicDiseaseRoutes = require('./chronicDisease.routes');
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
const providerScheduleRoutes = require('./providerSchedule.routes');
const providerBlockHourRoutes = require('./providerBlockHour.routes');
const chiefComplaintRoutes = require('./chiefComplaint.routes');
const consentFormRoutes = require('./consentForm.routes');
const procedureCategoryRoutes = require('./procedureCategory.routes');
const procedureRoutes = require('./procedure.routes');
const hcpcsCodeRoutes = require('./hcpcsCode.routes');
const diagnosisCodeRoutes = require('./diagnosisCode.routes');
const chargeMasterRoutes = require('./chargeMaster.routes');
const roomTypeRoutes = require('./roomType.routes');
const labTestRoutes = require('./labTest.routes');
const roomRoutes = require('./room.routes');
const bedRoutes = require('./bed.routes');
const radiologyStudyRoutes = require('./radiologyStudy.routes');
const vaccineRoutes = require('./vaccine.routes');
const checkoutRoutes = require('./checkout.routes');
const medicationCatalogRoutes = require('./medicationCatalog.routes');
const { patientClaimRouter, claimsRouter } = require('./claim.routes');

// Public routes (no auth required)
router.use('/auth', authRoutes);

// Protected routes (auth required)
router.use('/patients', auth, patientRoutes);
router.use('/patients/:patientId/intake', auth, intakeRoutes);
router.use('/patients/:patientId/chronic-diseases', auth, chronicDiseaseRoutes);
router.use('/patients/:patientId/checkout', auth, checkoutRoutes);
router.use('/patients/:patientId', auth, patientClaimRouter);
router.use('/claims', auth, claimsRouter);
router.use('/appointments', auth, appointmentRoutes);
router.use('/appointment-statuses', auth, appointmentStatusRoutes);
router.use('/appointment-types', auth, appointmentTypeRoutes);
router.use('/provider-schedules', auth, providerScheduleRoutes);
router.use('/provider-block-hours', auth, providerBlockHourRoutes);
router.use('/chief-complaints', auth, chiefComplaintRoutes);
router.use('/consent-forms', auth, consentFormRoutes);
router.use('/procedure-categories', auth, procedureCategoryRoutes);
router.use('/procedures', auth, procedureRoutes);
router.use('/hcpcs-codes', auth, hcpcsCodeRoutes);
router.use('/diagnosis-codes', auth, diagnosisCodeRoutes);
router.use('/charge-master', auth, chargeMasterRoutes);
router.use('/room-types', auth, roomTypeRoutes);
router.use('/lab-tests', auth, labTestRoutes);
router.use('/rooms', auth, roomRoutes);
router.use('/beds', auth, bedRoutes);
router.use('/radiology-studies', auth, radiologyStudyRoutes);
router.use('/vaccines', auth, vaccineRoutes);
router.use('/medication-catalog', auth, medicationCatalogRoutes);
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

