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

export const waitlistApi = {
  async getAll(params = {}) {
    const searchParams = buildSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/waitlist?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getStatusCounts(params = {}) {
    const searchParams = buildSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/waitlist/status-counts?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getMatches(params = {}) {
    const searchParams = buildSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/waitlist/matches?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/waitlist/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getEvents(id) {
    const response = await fetch(`${API_BASE_URL}/waitlist/${id}/events`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async create(data) {
    const response = await fetch(`${API_BASE_URL}/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/waitlist/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async offer(id, body) {
    const response = await fetch(`${API_BASE_URL}/waitlist/${id}/offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  async acceptOffer(id, body = {}) {
    const response = await fetch(`${API_BASE_URL}/waitlist/${id}/accept-offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  async declineOffer(id, body = {}) {
    const response = await fetch(`${API_BASE_URL}/waitlist/${id}/decline-offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  async book(id, body) {
    const response = await fetch(`${API_BASE_URL}/waitlist/${id}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  async cancel(id, body = {}) {
    const response = await fetch(`${API_BASE_URL}/waitlist/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  async remove(id, body = {}) {
    const response = await fetch(`${API_BASE_URL}/waitlist/${id}/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  async expireStale() {
    const response = await fetch(`${API_BASE_URL}/waitlist/expire-stale`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
