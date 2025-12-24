// Re-export all API modules
export { authApi } from './auth.api';
export { patientApi } from './patient.api';
export { appointmentApi } from './appointment.api';
export { insuranceProviderApi } from './insuranceProvider.api';

// Re-export shared utilities
export { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

