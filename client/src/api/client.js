import axios from 'axios';

const TOKEN_KEY = 'clouddesk-token';

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable (private mode) - session stays in memory only */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* no-op */
    }
  },
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Callback registered by AuthContext so a 401 can clear the session globally.
let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401 && tokenStore.get()) {
      tokenStore.clear();
      if (onUnauthorized) onUnauthorized();
    }

    // Normalise every failure into a predictable shape for the UI.
    const normalised = new Error(
      error.response?.data?.message ||
        (error.code === 'ECONNABORTED'
          ? 'The request timed out. Please try again.'
          : error.request && !error.response
            ? 'Cannot reach the CloudDesk API. Is the backend running on port 5000?'
            : 'Something went wrong. Please try again.')
    );
    normalised.status = status;
    normalised.details = error.response?.data?.details;
    return Promise.reject(normalised);
  }
);

export default api;
