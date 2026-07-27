import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

export const chargeMasterApi = {
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);
    if (params.location) searchParams.set('location', params.location);
    if (params.category) searchParams.set('category', params.category);
    if (params.payer) searchParams.set('payer', params.payer);
    if (params.genericDepartment) searchParams.set('genericDepartment', params.genericDepartment);
    if (params.isActive !== undefined && params.isActive !== '' && params.isActive !== 'all') {
      searchParams.set('isActive', params.isActive);
    }

    const response = await fetch(`${API_BASE_URL}/charge-master?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/charge-master/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async create(data) {
    const response = await fetch(`${API_BASE_URL}/charge-master`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/charge-master/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/charge-master/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
