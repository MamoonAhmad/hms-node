import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

function buildSearchParams(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value);
    }
  });
  return searchParams;
}

export const encountersWorkListApi = {
  async getAll(params = {}) {
    const searchParams = buildSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/encounters-work-list?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
