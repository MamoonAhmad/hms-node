import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

export const intakeApi = {
  async getBundle(patientId, params = {}) {
    const searchParams = new URLSearchParams();
    if (params.encounterId) searchParams.set('encounterId', params.encounterId);
    if (params.sectionType) searchParams.set('sectionType', params.sectionType);
    const qs = searchParams.toString();
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/intake${qs ? `?${qs}` : ''}`,
      { headers: getAuthHeaders() },
    );
    return handleResponse(response);
  },

  async createRecord(patientId, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/intake/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateRecord(patientId, recordId, data) {
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/intake/records/${recordId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
      },
    );
    return handleResponse(response);
  },

  async addAddendum(patientId, recordId, data) {
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/intake/records/${recordId}/addendum`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
      },
    );
    return handleResponse(response);
  },

  async deleteRecord(patientId, recordId) {
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/intake/records/${recordId}`,
      { method: 'DELETE', headers: getAuthHeaders() },
    );
    return handleResponse(response);
  },

  async certify(patientId, data = {}) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/intake/certify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async complete(patientId, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/intake/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async getAllergies(patientId) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/intake/allergies`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async createAllergy(patientId, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/intake/allergies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateAllergy(patientId, allergyId, data) {
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/intake/allergies/${allergyId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
      },
    );
    return handleResponse(response);
  },

  async deleteAllergy(patientId, allergyId) {
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/intake/allergies/${allergyId}`,
      { method: 'DELETE', headers: getAuthHeaders() },
    );
    return handleResponse(response);
  },

  async setNkda(patientId, noKnownDrugAllergies) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/intake/allergies/nkda`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ noKnownDrugAllergies }),
    });
    return handleResponse(response);
  },
};
