import api from './api';

export const paymentService = {
  // Get available payment methods for a booking
  getPaymentMethods: async (bookingId) => {
    try {
      const response = await api.get(`/payments/methods?bookingId=${bookingId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create payment order
  createPaymentOrder: async (bookingId, paymentMethod) => {
    try {
      const response = await api.post('/payments/create-order', {
        bookingId,
        paymentMethod
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Verify payment
  verifyPayment: async (paymentData) => {
    try {
      const response = await api.post('/payments/verify', paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Load Razorpay script dynamically
  loadRazorpayScript: () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => {
        throw new Error('Failed to load Razorpay SDK');
      };
      document.body.appendChild(script);
    });
  }
};

export default paymentService;