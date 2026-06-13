import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

export const appointmentStatusApi = {
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);
    if (params.isActive !== undefined && params.isActive !== '') {
      searchParams.set('isActive', params.isActive);
    }

    const response = await fetch(`${API_BASE_URL}/appointment-statuses?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getActive() {
    const response = await fetch(`${API_BASE_URL}/appointment-statuses/active`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/appointment-statuses/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async create(data) {
    const response = await fetch(`${API_BASE_URL}/appointment-statuses`, {
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
    const response = await fetch(`${API_BASE_URL}/appointment-statuses/${id}`, {
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
    const response = await fetch(`${API_BASE_URL}/appointment-statuses/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
