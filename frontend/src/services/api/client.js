export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const TOKEN_KEY = 'hms_token';

export function getAuthHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function handleResponse(response) {
  let data;
  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  if (!response.ok) {
    // Expired/invalid session: clear storage and return to login (not for failed login attempts)
    if (response.status === 401 && !response.url.includes('/auth/login')) {
      const hadSession = !!localStorage.getItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('hms_user');
      if (hadSession && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    const details = Array.isArray(data.errors)
      ? data.errors.filter(Boolean).join('; ')
      : data.errors && typeof data.errors === 'object'
        ? Object.values(data.errors).filter(Boolean).join('; ')
        : '';
    const base = data.message || data.error || 'An error occurred';
    const err = new Error(details ? `${base}: ${details}` : base);
    if (data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
      err.fieldErrors = data.errors;
    }
    throw err;
  }
  return data;
}

