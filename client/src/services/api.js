import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor (supports Bearer token fallback if stored in localStorage)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('trippilot_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || 'Something went wrong. Please try again.';
    const errors = error.response?.data?.errors || [];
    return Promise.reject({
      ...error,
      customMessage: message,
      errors,
      statusCode: error.response?.status,
    });
  }
);

export const checkHealth = () => api.get('/health');

export default api;
