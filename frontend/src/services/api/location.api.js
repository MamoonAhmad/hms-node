import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

export const locationApi = {
  // Get all locations with pagination and filters
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);
    if (params.isActive !== undefined && params.isActive !== '') {
      searchParams.set('isActive', params.isActive);
    }
    if (params.tenantId) searchParams.set('tenantId', params.tenantId);
    
    const response = await fetch(`${API_BASE_URL}/locations?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /** Active locations (for multi-select / dropdowns) */
  async getActive(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.tenantId) searchParams.set('tenantId', params.tenantId);

    const q = searchParams.toString();
    const url =
      q.length > 0 ? `${API_BASE_URL}/locations/active?${q}` : `${API_BASE_URL}/locations/active`;

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get location by ID
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/locations/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Create a new location
  async create(data) {
    const response = await fetch(`${API_BASE_URL}/locations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Update a location
  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/locations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Delete a location
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/locations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

