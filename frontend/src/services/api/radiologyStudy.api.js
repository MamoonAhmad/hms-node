import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

export const radiologyStudyApi = {
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.name) searchParams.set('name', params.name);
    if (params.code) searchParams.set('code', params.code);
    if (params.modality) searchParams.set('modality', params.modality);
    if (params.bodyPart) searchParams.set('bodyPart', params.bodyPart);
    if (params.isActive !== undefined && params.isActive !== '') {
      searchParams.set('isActive', params.isActive);
    }
    if (params.createdFrom) searchParams.set('createdFrom', params.createdFrom);
    if (params.createdTo) searchParams.set('createdTo', params.createdTo);

    const response = await fetch(`${API_BASE_URL}/radiology-studies?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getActive() {
    const response = await fetch(`${API_BASE_URL}/radiology-studies/active`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/radiology-studies/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async create(data) {
    const response = await fetch(`${API_BASE_URL}/radiology-studies`, {
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
    const response = await fetch(`${API_BASE_URL}/radiology-studies/${id}`, {
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
    const response = await fetch(`${API_BASE_URL}/radiology-studies/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
