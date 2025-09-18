import api from './api';

// Hotel and booking services
export const hotelService = {
  // Get location suggestions
  getLocationSuggestions: async (query) => {
    try {
      const response = await api.get(`/hotels/locations/suggestions?query=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Search hotels by city
  searchHotels: async (city) => {
    try {
      const response = await api.get(`/hotels/hotels?city=${encodeURIComponent(city)}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get hotel rooms
  getHotelRooms: async (hotelId) => {
    try {
      const response = await api.get(`/hotels/hotels/${hotelId}/rooms`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Book a room
  bookRoom: async (hotelId, roomId, bookingData) => {
    try {
      const response = await api.post(`/hotels/hotels/${hotelId}/rooms/${roomId}/book`, bookingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get user bookings
  getUserBookings: async () => {
    try {
      const response = await api.get('/bookings');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get booking details
  getBookingDetails: async (bookingId) => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
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

  // Get hotel reviews
  getHotelReviews: async (hotelId) => {
    try {
      const response = await api.get(`/reviews/hotel/${hotelId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get hotel details by ID
  getHotelDetails: async (hotelId) => {
    try {
      const response = await api.get(`/hotels/hotels/${hotelId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Add review
  addReview: async (hotelId, reviewData) => {
    try {
      const response = await api.post(`/reviews/hotel/${hotelId}`, reviewData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update review
  updateReview: async (reviewId, reviewData) => {
    try {
      const response = await api.put(`/reviews/${reviewId}`, reviewData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete review
  deleteReview: async (reviewId) => {
    try {
      const response = await api.delete(`/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default hotelService;