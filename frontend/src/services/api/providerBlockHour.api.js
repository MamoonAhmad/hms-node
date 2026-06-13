import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

export const providerBlockHourApi = {
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);
    if (params.providerId) searchParams.set('providerId', params.providerId);
    if (params.status) searchParams.set('status', params.status);

    if (params.days?.length) {
      params.days.forEach((day) => searchParams.append('days', day));
    }

    const response = await fetch(`${API_BASE_URL}/provider-block-hours?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/provider-block-hours/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async checkOverlap(params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, item));
      } else {
        searchParams.set(key, value);
      }
    });

    const response = await fetch(
      `${API_BASE_URL}/provider-block-hours/check-overlap?${searchParams}`,
      { headers: getAuthHeaders() },
    );
    return handleResponse(response);
  },

  async validateWithinSchedule(params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, item));
      } else {
        searchParams.set(key, value);
      }
    });

    const response = await fetch(
      `${API_BASE_URL}/provider-block-hours/validate-within-schedule?${searchParams}`,
      { headers: getAuthHeaders() },
    );
    return handleResponse(response);
  },

  async create(data) {
    const response = await fetch(`${API_BASE_URL}/provider-block-hours`, {
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
    const response = await fetch(`${API_BASE_URL}/provider-block-hours/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async toggleStatus(id) {
    const response = await fetch(`${API_BASE_URL}/provider-block-hours/${id}/toggle-status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/provider-block-hours/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
