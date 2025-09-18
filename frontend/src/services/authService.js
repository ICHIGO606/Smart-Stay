import api from './api';

// Authentication services
export const authService = {
  // User registration
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // User login
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      
      // Store tokens
      if (response.data.data?.accessToken) {
        localStorage.setItem('accessToken', response.data.data.accessToken);
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // User logout
  logout: async () => {
    try {
      const response = await api.post('/users/logout');
      
      // Clear tokens
      localStorage.removeItem('accessToken');
      
      return response.data;
    } catch (error) {
      // Clear tokens even if logout fails
      localStorage.removeItem('accessToken');
      throw error.response?.data || error;
    }
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh');
      
      if (response.data.data?.accessToken) {
        localStorage.setItem('accessToken', response.data.data.accessToken);
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default authService;