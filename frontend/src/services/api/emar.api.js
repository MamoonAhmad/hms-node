import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

export const emarApi = {
  async getEntries(patientId, params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value != null && value !== '') searchParams.set(key, String(value));
    });
    const qs = searchParams.toString();
    const url = `${API_BASE_URL}/patients/${patientId}/emar${qs ? `?${qs}` : ''}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  async getTabCounts(patientId, params = {}) {
    const searchParams = new URLSearchParams();
    if (params.appointmentId) searchParams.set('appointmentId', params.appointmentId);
    const qs = searchParams.toString();
    const url = `${API_BASE_URL}/patients/${patientId}/emar/counts${qs ? `?${qs}` : ''}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  async getPatientPanel(patientId, params = {}) {
    const searchParams = new URLSearchParams();
    if (params.appointmentId) searchParams.set('appointmentId', params.appointmentId);
    const qs = searchParams.toString();
    const url = `${API_BASE_URL}/patients/${patientId}/emar/panel${qs ? `?${qs}` : ''}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  async getTimeline(patientId, params = {}) {
    const searchParams = new URLSearchParams();
    if (params.appointmentId) searchParams.set('appointmentId', params.appointmentId);
    const qs = searchParams.toString();
    const url = `${API_BASE_URL}/patients/${patientId}/emar/timeline${qs ? `?${qs}` : ''}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  async getEntry(patientId, marEntryId) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/emar/${marEntryId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getAdministrationHistory(patientId, marEntryId) {
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/emar/${marEntryId}/history`,
      { headers: getAuthHeaders() },
    );
    return handleResponse(response);
  },

  async recordAdministration(patientId, marEntryId, data) {
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/emar/${marEntryId}/administer`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
      },
    );
    return handleResponse(response);
  },

  async discontinue(patientId, marEntryId, data) {
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/emar/${marEntryId}/discontinue`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
      },
    );
    return handleResponse(response);
  },
};
