import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

export const claimApi = {
  async getChargeCapture(patientId, encounterId) {
    const qs = new URLSearchParams({ encounterId });
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/charge-capture?${qs}`,
      { headers: getAuthHeaders() },
    );
    return handleResponse(response);
  },

  async saveChargeCapture(patientId, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/charge-capture`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async lockChargeCapture(patientId, encounterId) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/charge-capture/lock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ encounterId }),
    });
    return handleResponse(response);
  },

  async unlockChargeCapture(patientId, encounterId) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/charge-capture/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ encounterId }),
    });
    return handleResponse(response);
  },

  async generateClaim(patientId, encounterId) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/claims/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ encounterId }),
    });
    return handleResponse(response);
  },

  async listClaims(params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value != null && value !== '' && value !== 'all') {
        searchParams.set(key, value);
      }
    });
    const response = await fetch(`${API_BASE_URL}/claims?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getClaim(claimId) {
    const response = await fetch(`${API_BASE_URL}/claims/${claimId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async updateClaimStatus(claimId, status, notes) {
    const response = await fetch(`${API_BASE_URL}/claims/${claimId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ status, notes }),
    });
    return handleResponse(response);
  },

  async listWorklist(params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value != null && value !== '' && value !== 'all') {
        searchParams.set(key, value);
      }
    });
    const response = await fetch(`${API_BASE_URL}/claims/worklist?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async updateWorklistItem(checkoutId, data) {
    const response = await fetch(`${API_BASE_URL}/claims/worklist/${checkoutId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async removeFromWorklist(checkoutId) {
    const response = await fetch(`${API_BASE_URL}/claims/worklist/${checkoutId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
