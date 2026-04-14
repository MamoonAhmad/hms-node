import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

export const facilityConfigApi = {
  async getConfig(locationId) {
    const params = locationId ? `?locationId=${encodeURIComponent(locationId)}` : '';
    const response = await fetch(`${API_BASE_URL}/facility-config${params}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
