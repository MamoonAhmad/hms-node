import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

export const roomApi = {
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);
    if (params.status) searchParams.set('status', params.status);

    const response = await fetch(`${API_BASE_URL}/rooms?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getActive(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.departmentId) searchParams.set('departmentId', params.departmentId);
    const qs = searchParams.toString();
    const response = await fetch(`${API_BASE_URL}/rooms/active${qs ? `?${qs}` : ''}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getSummary() {
    const response = await fetch(`${API_BASE_URL}/rooms/summary`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async create(data) {
    const response = await fetch(`${API_BASE_URL}/rooms`, {
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
    const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
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
    const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
