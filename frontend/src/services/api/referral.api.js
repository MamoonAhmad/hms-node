import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

export const referralApi = {
  async getTypes(patientId) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/referrals/types`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getSummary(patientId, params = {}) {
    const searchParams = new URLSearchParams();
    if (params.appointmentId) searchParams.set('appointmentId', params.appointmentId);
    const qs = searchParams.toString();
    const url = `${API_BASE_URL}/patients/${patientId}/referrals/summary${qs ? `?${qs}` : ''}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  async getPanel(patientId, params = {}) {
    const searchParams = new URLSearchParams();
    if (params.appointmentId) searchParams.set('appointmentId', params.appointmentId);
    const qs = searchParams.toString();
    const url = `${API_BASE_URL}/patients/${patientId}/referrals/panel${qs ? `?${qs}` : ''}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  async getEncounterDefaults(patientId, appointmentId) {
    const url = `${API_BASE_URL}/patients/${patientId}/referrals/encounter-defaults?appointmentId=${appointmentId}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  async getAll(patientId, params = {}) {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.priority) searchParams.set('priority', params.priority);
    if (params.appointmentId) searchParams.set('appointmentId', params.appointmentId);
    const qs = searchParams.toString();
    const url = `${API_BASE_URL}/patients/${patientId}/referrals${qs ? `?${qs}` : ''}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  async getById(patientId, referralId) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/referrals/${referralId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async create(patientId, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/referrals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async update(patientId, referralId, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/referrals/${referralId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateStatus(patientId, referralId, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/referrals/${referralId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async send(patientId, referralId, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/referrals/${referralId}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async addNote(patientId, referralId, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/referrals/${referralId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async getTimeline(patientId, referralId) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/referrals/${referralId}/timeline`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getAuditLogs(patientId, referralId) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/referrals/${referralId}/audit`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async cancel(patientId, referralId, notes) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/referrals/${referralId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ notes }),
    });
    return handleResponse(response);
  },

  async close(patientId, referralId, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/referrals/${referralId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async delete(patientId, referralId) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/referrals/${referralId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
