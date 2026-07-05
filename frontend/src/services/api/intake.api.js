import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.appointmentId) searchParams.set('appointmentId', params.appointmentId);
  const q = searchParams.toString();
  return q ? `?${q}` : '';
}

export const intakeApi = {
  async getSections(patientId, params = {}) {
    const response = await fetch(
      `${API_BASE_URL}/intake/${patientId}/sections${buildQuery(params)}`,
      { headers: getAuthHeaders() },
    );
    return handleResponse(response);
  },

  async getSection(patientId, sectionKey, params = {}) {
    const response = await fetch(
      `${API_BASE_URL}/intake/${patientId}/sections/${sectionKey}${buildQuery(params)}`,
      { headers: getAuthHeaders() },
    );
    return handleResponse(response);
  },

  async saveSection(patientId, sectionKey, body) {
    const response = await fetch(`${API_BASE_URL}/intake/${patientId}/sections/${sectionKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  async getScreenings(patientId, params = {}) {
    const response = await fetch(
      `${API_BASE_URL}/intake/${patientId}/screenings${buildQuery(params)}`,
      { headers: getAuthHeaders() },
    );
    return handleResponse(response);
  },

  async saveScreening(patientId, body) {
    const response = await fetch(`${API_BASE_URL}/intake/${patientId}/screenings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  async getCompletion(patientId, params = {}) {
    const response = await fetch(
      `${API_BASE_URL}/intake/${patientId}/completion${buildQuery(params)}`,
      { headers: getAuthHeaders() },
    );
    return handleResponse(response);
  },

  async completeIntake(patientId, body) {
    const response = await fetch(`${API_BASE_URL}/intake/${patientId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },
};
