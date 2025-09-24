import api from './api';

// User management services
export const userService = {
  // Get current user profile
  getProfile: async () => {
    try {
      const response = await api.get('/users/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/users/', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Upload verification document
  uploadVerification: async (formData) => {
    try {
      const response = await api.post('/users/upload-verification', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get family members
  getFamilyMembers: async () => {
    try {
      const response = await api.get('/users/family');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Add family member
  addFamilyMember: async (memberData) => {
    try {
      const response = await api.post('/users/family', memberData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update family member
  updateFamilyMember: async (memberId, memberData) => {
    try {
      const response = await api.put(`/users/family/${memberId}`, memberData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Upload family member verification
  uploadFamilyVerification: async (memberId, formData) => {
    try {
      const response = await api.post(`/users/family/${memberId}/verify`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await api.post('/users/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default userService;