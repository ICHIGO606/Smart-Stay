import api from './api';

export const bookingService = {
  // Create a new booking
  createBooking: async (bookingData) => {
    try {
      const response = await api.post('/bookings', bookingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get all bookings for the current user
  getUserBookings: async () => {
    try {
      const response = await api.get('/bookings/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get booking by ID
  getBookingById: async (bookingId) => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update booking status (Admin only)
  updateBookingStatus: async (bookingId, statusData) => {
    try {
      const response = await api.put(`/bookings/${bookingId}`, statusData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Cancel booking
  cancelBooking: async (bookingId) => {
    try {
      const response = await api.delete(`/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get all bookings (Admin only)
  getAllBookings: async () => {
    try {
      const response = await api.get('/bookings');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default bookingService;