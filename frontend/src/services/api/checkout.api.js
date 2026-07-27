import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

export const checkoutApi = {
  async getBundle(patientId, encounterId) {
    const qs = new URLSearchParams({ encounterId });
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/checkout?${qs}`,
      { headers: getAuthHeaders() },
    );
    return handleResponse(response);
  },

  async update(patientId, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/checkout`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async saveInstruction(patientId, data, instructionId = null) {
    const url = instructionId
      ? `${API_BASE_URL}/patients/${patientId}/checkout/instructions/${instructionId}`
      : `${API_BASE_URL}/patients/${patientId}/checkout/instructions`;
    const response = await fetch(url, {
      method: instructionId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteInstruction(patientId, instructionId, encounterId) {
    const qs = new URLSearchParams({ encounterId });
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/checkout/instructions/${instructionId}?${qs}`,
      { method: 'DELETE', headers: getAuthHeaders() },
    );
    return handleResponse(response);
  },

  async addNote(patientId, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/checkout/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async addTask(patientId, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/checkout/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async recordPayment(patientId, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/checkout/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async complete(patientId, encounterId) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/checkout/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ encounterId }),
    });
    const payload = await response.json();
    if (!response.ok) {
      const err = new Error(payload.message || 'Checkout failed');
      err.blockers = payload.blockers;
      throw err;
    }
    return payload;
  },

  async reopen(patientId, encounterId, reason) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/checkout/reopen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ encounterId, reason }),
    });
    return handleResponse(response);
  },

  async previewAvs(patientId, encounterId) {
    const qs = new URLSearchParams({ encounterId });
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/checkout/avs-preview?${qs}`,
      { headers: getAuthHeaders() },
    );
    return handleResponse(response);
  },
};
