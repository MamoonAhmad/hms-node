// Re-export all API modules
export { authApi } from './auth.api';
export { patientApi } from './patient.api';
export { appointmentApi } from './appointment.api';
export { insuranceProviderApi } from './insuranceProvider.api';
export { tenantApi } from './tenant.api';
export { locationApi } from './location.api';
export { permissionApi } from './permission.api';
export { roleApi } from './role.api';
export { facilityConfigApi } from './facilityConfig.api';

// Re-export shared utilities
export { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

