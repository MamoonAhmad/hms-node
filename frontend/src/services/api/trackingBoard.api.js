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

export const trackingBoardApi = {
  async getAll(params = {}) {
    const searchParams = buildSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/tracking-board?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async assignRoom(appointmentId, roomId) {
    const response = await fetch(`${API_BASE_URL}/tracking-board/${appointmentId}/assign-room`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ roomId }),
    });
    return handleResponse(response);
  },
};
