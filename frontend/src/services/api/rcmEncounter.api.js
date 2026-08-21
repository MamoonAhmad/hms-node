import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

export const rcmEncounterApi = {
  async getById(encounterId) {
    const response = await fetch(`${API_BASE_URL}/rcm/encounters/${encounterId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async updateBillingStatus(encounterId, billingStatus) {
    const response = await fetch(`${API_BASE_URL}/rcm/encounters/${encounterId}/billing-status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ billingStatus }),
    });
    return handleResponse(response);
  },

  async updateDiagnoses(encounterId, diagnoses) {
    const response = await fetch(`${API_BASE_URL}/rcm/encounters/${encounterId}/diagnoses`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ diagnoses }),
    });
    return handleResponse(response);
  },

  async updateCharges(encounterId, charges) {
    const response = await fetch(`${API_BASE_URL}/rcm/encounters/${encounterId}/charges`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ charges }),
    });
    return handleResponse(response);
  },

  async addPayment(encounterId, payload) {
    const response = await fetch(`${API_BASE_URL}/rcm/encounters/${encounterId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  async addFollowUpNote(encounterId, payload) {
    const response = await fetch(`${API_BASE_URL}/rcm/encounters/${encounterId}/follow-up-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  async verifyEligibility(encounterId) {
    const response = await fetch(`${API_BASE_URL}/rcm/encounters/${encounterId}/eligibility/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
