import axios from 'axios';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

let csrfToken;
let csrfTokenRequest;

const getCsrfToken = async () => {
  if (csrfToken) return csrfToken;

  if (!csrfTokenRequest) {
    csrfTokenRequest = axios
      .get(`${API_BASE_URL}/csrf-token`, { withCredentials: true })
      .then((response) => {
        if (!response.data?.csrfToken) {
          throw new Error('The server did not return a CSRF token');
        }
        csrfToken = response.data.csrfToken;
        return csrfToken;
      })
      .finally(() => {
        csrfTokenRequest = null;
      });
  }

  return csrfTokenRequest;
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cookies/auth
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (!['get', 'head', 'options'].includes(config.method?.toLowerCase() || 'get')) {
      config.headers['x-csrf-token'] = await getCsrfToken();
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const responseMessage =
      typeof error.response?.data === 'string'
        ? error.response.data
        : error.response?.data?.message;
    if (
      error.response?.status === 403 &&
      responseMessage?.includes('invalid csrf token')
    ) {
      csrfToken = null;
      if (!originalRequest._csrfRetry) {
        originalRequest._csrfRetry = true;
        originalRequest.headers['x-csrf-token'] = await getCsrfToken();
        return api(originalRequest);
      }
    }

    if (
      error.response?.status === 401 &&
      localStorage.getItem('accessToken') &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh token
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        
        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;