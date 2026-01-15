import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

export const tenantApi = {
  // Get all tenants with pagination and filters
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);
    if (params.isActive !== undefined && params.isActive !== '') {
      searchParams.set('isActive', params.isActive);
    }
    
    const response = await fetch(`${API_BASE_URL}/tenants?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get tenant by ID
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/tenants/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Create a new tenant
  async create(data) {
    const response = await fetch(`${API_BASE_URL}/tenants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Update a tenant
  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/tenants/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Delete a tenant
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/tenants/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
