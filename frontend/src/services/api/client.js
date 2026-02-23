export const API_BASE_URL = 'http://localhost:5000/api';

const TOKEN_KEY = 'hms_token';

export function getAuthHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    // Handle 401 Unauthorized - redirect to login
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('hms_user');
      window.location.href = '/login';
    }
    throw new Error(data.message || data.error || 'An error occurred');
  }
  return data;
}

