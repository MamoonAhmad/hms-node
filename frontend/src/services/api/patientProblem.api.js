import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

export const patientProblemApi = {
  async getAll(patientId, params = {}) {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);

    const query = searchParams.toString();
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/problems${query ? `?${query}` : ''}`,
      { headers: getAuthHeaders() },
    );
    return handleResponse(response);
  },

  async getById(patientId, problemId) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/problems/${problemId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async create(patientId, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/problems`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async update(patientId, problemId, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/problems/${problemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async remove(patientId, problemId) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/problems/${problemId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
