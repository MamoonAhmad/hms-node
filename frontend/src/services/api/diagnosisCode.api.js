import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

export const diagnosisCodeApi = {
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);

    const response = await fetch(`${API_BASE_URL}/diagnosis-codes?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/diagnosis-codes/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async create(data) {
    const response = await fetch(`${API_BASE_URL}/diagnosis-codes`, {
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
    const response = await fetch(`${API_BASE_URL}/diagnosis-codes/${id}`, {
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
    const response = await fetch(`${API_BASE_URL}/diagnosis-codes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
