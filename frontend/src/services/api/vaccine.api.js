import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

export const vaccineApi = {
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, value);
      }
    });

    const response = await fetch(`${API_BASE_URL}/vaccines?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getActiveForOrders(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.limit) searchParams.set('limit', params.limit);

    const response = await fetch(`${API_BASE_URL}/vaccines/active?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/vaccines/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async create(data) {
    const response = await fetch(`${API_BASE_URL}/vaccines`, {
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
    const response = await fetch(`${API_BASE_URL}/vaccines/${id}`, {
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
    const response = await fetch(`${API_BASE_URL}/vaccines/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

export const VACCINE_ROUTE_OPTIONS = [
  'Intramuscular (IM)',
  'Subcutaneous (SC)',
  'Oral',
  'Intranasal',
  'Intradermal',
  'Other',
];
