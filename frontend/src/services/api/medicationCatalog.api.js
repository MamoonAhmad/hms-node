import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

async function parseError(response) {
  const data = await response.json().catch(() => ({}));
  const error = new Error(data.message || 'Request failed');
  error.status = response.status;
  error.code = data.code;
  error.duplicate = data.duplicate;
  error.errors = data.errors;
  throw error;
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    return parseError(response);
  }
  return handleResponse(response);
}

export const medicationCatalogApi = {
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value));
      }
    });
    return request(`${API_BASE_URL}/medication-catalog?${searchParams}`, {
      headers: getAuthHeaders(),
    });
  },

  async searchActive(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return request(`${API_BASE_URL}/medication-catalog/active${qs ? `?${qs}` : ''}`, {
      headers: getAuthHeaders(),
    });
  },

  async getById(id, { includeHistory = false } = {}) {
    const qs = includeHistory ? '?includeHistory=true' : '';
    return request(`${API_BASE_URL}/medication-catalog/${id}${qs}`, {
      headers: getAuthHeaders(),
    });
  },

  async getHistory(id) {
    return request(`${API_BASE_URL}/medication-catalog/${id}/history`, {
      headers: getAuthHeaders(),
    });
  },

  async create(data) {
    return request(`${API_BASE_URL}/medication-catalog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
  },

  async update(id, data) {
    return request(`${API_BASE_URL}/medication-catalog/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
  },

  async activate(id) {
    return request(`${API_BASE_URL}/medication-catalog/${id}/activate`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
  },

  async deactivate(id) {
    return request(`${API_BASE_URL}/medication-catalog/${id}/deactivate`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
  },

  async delete(id) {
    return request(`${API_BASE_URL}/medication-catalog/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },
};
