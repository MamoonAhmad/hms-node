// Re-export all API modules
export { authApi } from './auth.api';
export { patientApi } from './patient.api';
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

// Re-export shared utilities
export { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

