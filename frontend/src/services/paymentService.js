import api from "./api";

export const paymentService = {
  // Get available payment methods for a booking
  getPaymentMethods: async (bookingId) => {
    try {
      const response = await api.get(
        `/payments/methods?bookingId=${bookingId}`,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create payment order / YouPI-PG session
  createPaymentOrder: async (bookingId, paymentMethod = "upi") => {
    try {
      const response = await api.post("/payments/create-order", {
        bookingId,
        paymentMethod,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Verify payment by UTR, signature, or session reference
  verifyPayment: async (paymentData) => {
    try {
      const response = await api.post("/payments/verify", paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Load YouPI-PG universal checkout SDK
  loadYoupiSdk: (baseUrl = "https://localhost:7000") => {
    return new Promise((resolve) => {
      if (window.Youpi) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = `${baseUrl}/checkout.js`;
      script.onload = () => resolve();
      script.onerror = () => {
        // Fallback to native UPI vector QR & intent deep links if SDK is not hosted
        resolve();
      };
      document.body.appendChild(script);
    });
  },

  // Legacy loader kept for backward compatibility and unit tests
  loadRazorpayScript: () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => {
        throw new Error("Failed to load Razorpay SDK");
      };
      document.body.appendChild(script);
    });
  },
};

export default paymentService;
