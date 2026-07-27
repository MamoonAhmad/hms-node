import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

export const chronicDiseaseApi = {
  async getTemplates(patientId) {
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/chronic-diseases/templates`,
      { headers: getAuthHeaders() },
    );
    return handleResponse(response);
  },

  async list(patientId, params = {}) {
    const searchParams = new URLSearchParams();
    if (params.encounterId) searchParams.set('encounterId', params.encounterId);
    const qs = searchParams.toString();
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/chronic-diseases${qs ? `?${qs}` : ''}`,
      { headers: getAuthHeaders() },
    );
    return handleResponse(response);
  },

  async create(patientId, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/chronic-diseases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async update(patientId, recordId, data) {
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/chronic-diseases/${recordId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
      },
    );
    return handleResponse(response);
  },

  async remove(patientId, recordId) {
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/chronic-diseases/${recordId}`,
      { method: 'DELETE', headers: getAuthHeaders() },
    );
    return handleResponse(response);
  },
};
