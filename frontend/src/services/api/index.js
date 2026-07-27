// Re-export all API modules
export { authApi } from './auth.api';
export { patientApi } from './patient.api';
export { patientProblemApi } from './patientProblem.api';
export { appointmentApi } from './appointment.api';
export { appointmentStatusApi } from './appointmentStatus.api';
export { appointmentTypeApi } from './appointmentType.api';
export { insuranceProviderApi } from './insuranceProvider.api';
export { tenantApi } from './tenant.api';
export { locationApi } from './location.api';
export { permissionApi } from './permission.api';
export { roleApi } from './role.api';
export { facilityConfigApi } from './facilityConfig.api';
export { specialtyApi } from './specialty.api';
export { subSpecialtyApi } from './subSpecialty.api';
export { departmentApi } from './department.api';
export { providerApi } from './provider.api';
export { providerScheduleApi } from './providerSchedule.api';
export { providerBlockHourApi } from './providerBlockHour.api';
export { intakeApi } from './intake.api.js';
export { medicationOrderApi } from './medicationOrder.api.js';
export { emarApi } from './emar.api.js';
export { referralApi } from './referral.api.js';
export { checkoutApi } from './checkout.api.js';
export { claimApi } from './claim.api.js';
export { chiefComplaintApi } from './chiefComplaint.api';
export { consentFormApi } from './consentForm.api';
export { procedureCategoryApi } from './procedureCategory.api';
export { procedureApi } from './procedure.api';
export { hcpcsCodeApi } from './hcpcsCode.api';
export { diagnosisCodeApi } from './diagnosisCode.api';
export { chargeMasterApi } from './chargeMaster.api';
export { roomTypeApi } from './roomType.api';
export { labTestApi } from './labTest.api';
export { radiologyStudyApi } from './radiologyStudy.api';
export { roomApi } from './room.api';
export { bedApi } from './bed.api';
export { vaccineApi, VACCINE_ROUTE_OPTIONS } from './vaccine.api';
export { medicationCatalogApi } from './medicationCatalog.api';

// Re-export shared utilities
export { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

