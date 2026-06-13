import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

function buildSearchParams(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value);
    }
  });
  return searchParams;
}

export const appointmentApi = {
  async getAll(params = {}) {
    const searchParams = buildSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/appointments?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getStatusCounts(params = {}) {
    const searchParams = buildSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/appointments/status-counts?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getAvailableDates(params = {}) {
    const searchParams = buildSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/appointments/availability/dates?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getAvailableSlots(params = {}) {
    const searchParams = buildSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/appointments/availability/slots?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getHistory(id) {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}/history`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getToday() {
    const response = await fetch(`${API_BASE_URL}/appointments/today`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async create(data) {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateStatus(id, status) {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },

  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
