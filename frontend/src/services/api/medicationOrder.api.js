import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

export const medicationOrderApi = {
  async getOrders(patientId, params = {}) {
    const searchParams = new URLSearchParams();
    if (params.appointmentId) searchParams.set('appointmentId', params.appointmentId);
    if (params.status) searchParams.set('status', params.status);
    const qs = searchParams.toString();
    const url = `${API_BASE_URL}/patients/${patientId}/medication-orders${qs ? `?${qs}` : ''}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  async getStatusCounts(patientId, params = {}) {
    const searchParams = new URLSearchParams();
    if (params.appointmentId) searchParams.set('appointmentId', params.appointmentId);
    const qs = searchParams.toString();
    const url = `${API_BASE_URL}/patients/${patientId}/medication-orders/counts${qs ? `?${qs}` : ''}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  async create(patientId, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/medication-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async bulkSave(patientId, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/medication-orders/bulk-save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async bulkSign(patientId, orderIds) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/medication-orders/bulk-sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ orderIds }),
    });
    return handleResponse(response);
  },

  async updateStatus(patientId, orderId, status, extra = {}) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/medication-orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ status, ...extra }),
    });
    return handleResponse(response);
  },

  async searchCatalog(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    const url = `${API_BASE_URL}/medication-catalog/active${qs ? `?${qs}` : ''}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  },
};
