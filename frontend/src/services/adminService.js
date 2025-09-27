import api from './api';

const adminService = {
  // Verification Management
  getPendingVerifications: () => {
    return api.get('/admin/verifications/pending');
  },

  getVerifiedUsers: () => {
    return api.get('/admin/verifications/verified');
  },

  getVerificationStats: () => {
    return api.get('/admin/verifications/stats');
  },

  getUserVerification: (userId) => {
    return api.get(`/admin/verifications/user/${userId}`);
  },

  verifyUser: (userId, data) => {
    return api.put(`/admin/verifications/verify/${userId}`, data);
  },

  // Hotel Management (existing functions)
  createHotel: (hotelData) => {
    return api.post('/admin/hotels', hotelData);
  },

  updateHotel: (hotelId, hotelData) => {
    return api.put(`/admin/hotels/${hotelId}`, hotelData);
  },

  deleteHotel: (hotelId) => {
    return api.delete(`/admin/hotels/${hotelId}`);
  },

  getHotels: () => {
    return api.get('/admin/hotels');
  },

  getHotel: (hotelId) => {
    return api.get(`/admin/hotels/${hotelId}`);
  },

  // Room Management (existing functions)
  createRoom: (hotelId, roomData) => {
    return api.post(`/admin/hotels/${hotelId}/rooms`, roomData);
  },

  updateRoom: (hotelId, roomId, roomData) => {
    return api.put(`/admin/hotels/${hotelId}/rooms/${roomId}`, roomData);
  },

  deleteRoom: (hotelId, roomId) => {
    return api.delete(`/admin/hotels/${hotelId}/rooms/${roomId}`);
  },

  getRooms: (hotelId) => {
    return api.get(`/admin/hotels/${hotelId}/rooms`);
  },

  getRoom: (hotelId, roomId) => {
    return api.get(`/admin/hotels/${hotelId}/rooms/${roomId}`);
  },

  // Booking Management (existing functions)
  getHotelBookings: (hotelId) => {
    return api.get(`/admin/hotels/${hotelId}/bookings`);
  },

  updateBookingStatus: (bookingId, status) => {
    return api.put(`/admin/bookings/${bookingId}/status`, { status });
  },

  getBooking: (bookingId) => {
    return api.get(`/admin/bookings/${bookingId}`);
  },

  // Dashboard Stats (existing functions)
  getDashboardStats: () => {
    return api.get('/admin/dashboard/stats');
  },

  getRecentBookings: () => {
    return api.get('/admin/dashboard/recent-bookings');
  },

  getRevenueStats: () => {
    return api.get('/admin/dashboard/revenue');
  }
};

export default adminService;