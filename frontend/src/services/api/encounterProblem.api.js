import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

export const encounterProblemApi = {
  async list(patientId, appointmentId) {
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/appointments/${appointmentId}/encounter-problems`,
      { headers: getAuthHeaders() },
    );
    return handleResponse(response);
  },

  async upsert(patientId, appointmentId, problemId, data) {
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/appointments/${appointmentId}/encounter-problems/${problemId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      },
    );
    return handleResponse(response);
  },

  async setPrimary(patientId, appointmentId, problemId) {
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/appointments/${appointmentId}/encounter-problems/${problemId}/primary`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      },
    );
    return handleResponse(response);
  },

  async syncCoding(patientId, appointmentId) {
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/appointments/${appointmentId}/encounter-problems/sync-coding`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      },
    );
    return handleResponse(response);
  },
};
