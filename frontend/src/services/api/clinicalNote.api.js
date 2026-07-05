import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.appointmentId) searchParams.set('appointmentId', params.appointmentId);
  if (params.allEncounters) searchParams.set('allEncounters', 'true');
  const q = searchParams.toString();
  return q ? `?${q}` : '';
}

export const clinicalNoteApi = {
  async getChartContext(patientId, params = {}) {
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/clinical-notes/chart-context${buildQuery(params)}`,
      { headers: getAuthHeaders() },
    );
    return handleResponse(response);
  },

  async getAll(patientId, params = {}) {
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/clinical-notes${buildQuery(params)}`,
      { headers: getAuthHeaders() },
    );
    return handleResponse(response);
  },

  async getById(patientId, noteId) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/clinical-notes/${noteId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async create(patientId, body) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/clinical-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  async update(patientId, noteId, body) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/clinical-notes/${noteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  async sign(patientId, noteId) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/clinical-notes/${noteId}/sign`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async addAddendum(patientId, noteId, body) {
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/clinical-notes/${noteId}/addendum`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(body),
      },
    );
    return handleResponse(response);
  },

  async remove(patientId, noteId) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/clinical-notes/${noteId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
