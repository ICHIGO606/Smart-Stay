import api  from './api';

const adminHotelService = {
  // Get hotel rooms status for visualization
  getHotelRoomsStatus: (hotelId) =>
    api.get(`/admin/hotels/${hotelId}/rooms-status`),
  // Get all hotels for admin
  getAdminHotels: async () => {
    try {
      const response = await api.get('/admin/hotels');
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { statusCode: 200, data: [], message: 'Hotels fetched successfully', success: true };
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch hotels');
    }
  },

  // Create a new hotel
  createHotel: async (hotelData) => {
    try {
      const formData = new FormData();
      
      // Add basic hotel information
      formData.append('name', hotelData.name);
      formData.append('city', hotelData.city);
      formData.append('description', hotelData.description);
      formData.append('address', hotelData.address);
      
      // Add amenities as array
      hotelData.amenities.forEach(amenity => {
        formData.append('amenities', amenity);
      });
      
      // Add images
      hotelData.images.forEach(image => {
        formData.append('images', image);
      });
      
      const response = await api.post('/admin/hotels', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create hotel');
    }
  },

  // Update a hotel
  updateHotel: async (hotelId, hotelData) => {
    try {
      const formData = new FormData();
      
      // Add basic hotel information
      if (hotelData.name) formData.append('name', hotelData.name);
      if (hotelData.city) formData.append('city', hotelData.city);
      if (hotelData.description) formData.append('description', hotelData.description);
      if (hotelData.address) formData.append('address', hotelData.address);
      
      // Add amenities as array
      if (hotelData.amenities) {
        hotelData.amenities.forEach(amenity => {
          formData.append('amenities', amenity);
        });
      }
      
      // Add new images
      if (hotelData.newImages) {
        hotelData.newImages.forEach(image => {
          formData.append('images', image);
        });
      }
      
      const response = await api.put(`/admin/hotels/${hotelId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update hotel');
    }
  },

  // Delete a hotel
  deleteHotel: async (hotelId) => {
    try {
      const response = await api.delete(`/admin/hotels/${hotelId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete hotel');
    }
  },

  // Create room for a hotel
  createRoom: async (hotelId, roomData) => {
    try {
      const formData = new FormData();
      
      formData.append('type', roomData.type);
      formData.append('pricePerNight', roomData.pricePerNight);
      formData.append('maxOccupancy', roomData.maxOccupancy);
      formData.append('description', roomData.description);
      
      // Add room numbers
      roomData.roomNumbers.forEach(number => {
        formData.append('roomNumbers', number);
      });
      
      // Add amenities
      roomData.amenities.forEach(amenity => {
        formData.append('amenities', amenity);
      });
      
      // Add images
      if (roomData.images) {
        roomData.images.forEach(image => {
          formData.append('images', image);
        });
      }
      
      const response = await api.post(`/admin/hotels/${hotelId}/rooms`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create room');
    }
  },

  // Get rooms for a hotel
  getHotelRooms: async (hotelId) => {
    try {
      const response = await api.get(`/admin/hotels/${hotelId}/rooms-status`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch rooms');
    }
  },

  // Update a room
  updateRoom: async (hotelId, roomId, roomData) => {
    try {
      const response = await api.put(`/admin/hotels/${hotelId}/rooms/${roomId}`, roomData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update room');
    }
  },

  // Delete a room
  deleteRoom: async (hotelId, roomId) => {
    try {
      const response = await api.delete(`/admin/hotels/${hotelId}/rooms/${roomId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete room');
    }
  },

  // Update operational status of a room (Pillar 3)
  updateRoomOperationalStatus: async (hotelId, roomId, statusData) => {
    try {
      const response = await api.patch(`/admin/hotels/${hotelId}/rooms/${roomId}/status`, statusData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update room operational status');
    }
  },

  // Export bookings CSV (Pillar 5)
  exportBookingsCsv: async (hotelId) => {
    try {
      const response = await api.get('/admin/bookings/export-csv', {
        params: hotelId ? { hotelId } : {},
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to export bookings CSV');
    }
  },

  // Get administrative hospitality statistics (Pillar 5)
  getAdminAnalyticsStats: async () => {
    try {
      const response = await api.get('/admin/stats');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch admin stats');
    }
  },

  // Verify guest voucher token at front-desk (Option 1)
  verifyCheckInToken: async (token) => {
    try {
      const response = await api.get(`/bookings/verify-token/${encodeURIComponent(token)}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Invalid or expired check-in token');
    }
  },

  // Process front-desk guest check-in & occupy room (Option 1)
  checkInGuest: async (token, notes = '') => {
    try {
      const response = await api.post('/admin/bookings/check-in', { token, notes });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to complete guest check-in');
    }
  }
};

export default adminHotelService;