import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

export const insuranceProviderApi = {
  // Get all insurance providers with pagination and filters
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);
    if (params.isActive !== undefined) searchParams.set('isActive', params.isActive);

    const response = await fetch(`${API_BASE_URL}/insurance-providers?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get all active insurance providers (for dropdowns)
  async getActive() {
    const response = await fetch(`${API_BASE_URL}/insurance-providers/active`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get insurance provider by ID
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/insurance-providers/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Create a new insurance provider
  async create(data) {
    const response = await fetch(`${API_BASE_URL}/insurance-providers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Update an insurance provider
  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/insurance-providers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Delete an insurance provider
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/insurance-providers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

