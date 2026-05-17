import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

export const providerApi = {
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);
    if (params.isActive !== undefined && params.isActive !== '')
      searchParams.set('isActive', params.isActive);

    const response = await fetch(`${API_BASE_URL}/providers?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/providers/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async lookupByNpi(npi) {
    const response = await fetch(`${API_BASE_URL}/providers/npi/${encodeURIComponent(npi)}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async create(data) {
    const response = await fetch(`${API_BASE_URL}/providers`, {
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
    const response = await fetch(`${API_BASE_URL}/providers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/providers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
