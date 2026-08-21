const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const TOKEN_KEY = 'hms_token';

// Re-export from modular API (so @/services/api resolves to this file)
export { authApi } from './api/auth.api.js';
export { locationApi } from './api/location.api.js';
export { departmentApi } from './api/department.api.js';
export { tenantApi } from './api/tenant.api.js';
export { providerApi } from './api/provider.api.js';
export { patientApi } from './api/patient.api.js';
export { appointmentApi } from './api/appointment.api.js';
export { waitlistApi } from './api/waitlist.api.js';
export { appointmentStatusApi } from './api/appointmentStatus.api.js';
export { appointmentTypeApi } from './api/appointmentType.api.js';
export { providerScheduleApi } from './api/providerSchedule.api.js';
export { providerBlockHourApi } from './api/providerBlockHour.api.js';
export { insuranceProviderApi } from './api/insuranceProvider.api.js';
export { procedureCategoryApi } from './api/procedureCategory.api.js';
export { procedureApi } from './api/procedure.api.js';
export { hcpcsCodeApi } from './api/hcpcsCode.api.js';
export { diagnosisCodeApi } from './api/diagnosisCode.api.js';
export { placeOfServiceApi } from './api/placeOfService.api.js';
export { billingProviderApi } from './api/billingProvider.api.js';
export { encountersWorkListApi } from './api/encountersWorkList.api.js';
export { rcmEncounterApi } from './api/rcmEncounter.api.js';
export { rcmApi } from './api/rcm.api.js';
export { specialtyApi } from './api/specialty.api.js';
export { subSpecialtyApi } from './api/subSpecialty.api.js';
export { facilityConfigApi } from './api/facilityConfig.api.js';
export { roleApi } from './api/role.api.js';
export { permissionApi } from './api/permission.api.js';

function getAuthHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || 'An error occurred');
  }
  return data;
}

export { API_BASE_URL, getAuthHeaders, handleResponse };

// Charge Master API (backed by procedures + unitPrice)
export const chargeMasterApi = {
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value));
      }
    });
    const response = await fetch(`${API_BASE_URL}/charge-master?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  async search(q = '', limit = 25) {
    const searchParams = new URLSearchParams();
    if (q) searchParams.set('q', q);
    searchParams.set('limit', String(limit));
    const response = await fetch(`${API_BASE_URL}/charge-master/search?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/charge-master/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  async create(data) {
    const response = await fetch(`${API_BASE_URL}/charge-master`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/charge-master/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/charge-master/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Users API
export const userApi = {
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);
    const response = await fetch(`${API_BASE_URL}/users?${searchParams}`);
    return handleResponse(response);
  },
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`);
    return handleResponse(response);
  },
  async create(data) {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// Permission Headers API
export const permissionHeaderApi = {
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);
    const response = await fetch(`${API_BASE_URL}/permission-headers?${searchParams}`);
    return handleResponse(response);
  },
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/permission-headers/${id}`);
    return handleResponse(response);
  },
  async getAllWithPermissions() {
    const response = await fetch(`${API_BASE_URL}/permission-headers/with-permissions`);
    return handleResponse(response);
  },
  async create(data) {
    const response = await fetch(`${API_BASE_URL}/permission-headers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/permission-headers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/permission-headers/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};
