import { beforeEach, describe, expect, jest, test } from "@jest/globals";

process.env.YOUPI_BASE_URL = "http://localhost:7000";
process.env.YOUPI_MERCHANT_ID = "smartstay_merchant";
process.env.YOUPI_MERCHANT_API_KEY = "test_api_key";
process.env.YOUPI_WEBHOOK_SECRET = "ci_test_secret";
process.env.RAZORPAY_KEY_SECRET = "ci_test_secret";

const mockFindBookingById = jest.fn();
const mockFindHotelById = jest.fn();

await jest.unstable_mockModule("../models/booking.models.js", () => ({
  Booking: {
    findById: mockFindBookingById,
    findOne: jest.fn().mockImplementation((query) => {
      const b = makeBooking();
      return Promise.resolve(b);
    }),
  },
}));

await jest.unstable_mockModule("../models/hotel.models.js", () => ({
  Hotel: { findById: mockFindHotelById },
}));

const { createPaymentOrder, verifyPayment } =
  await import("../controllers/payment.controllers.js");

const makeBooking = () => ({
  _id: "booking-id",
  hotelId: "hotel-id",
  totalAmount: 5000,
  paymentStatus: "Pending",
  bookingStatus: "Pending",
  paymentDetails: {},
  save: jest.fn().mockResolvedValue(undefined),
});

const invokeController = (controller, body) => {
  let finish;
  const result = new Promise((resolve) => {
    finish = resolve;
  });
  const response = {
    status: jest.fn().mockImplementation((statusCode) => {
      response.statusCode = statusCode;
      return response;
    }),
    json: jest.fn().mockImplementation((payload) => {
      finish({ response, payload });
      return response;
    }),
  };

  controller({ body }, response, (error) => finish({ response, error }));
  return result;
};

describe("Payment controller", () => {
  let booking;

  beforeEach(() => {
    jest.clearAllMocks();
    booking = makeBooking();
    mockFindBookingById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(booking),
    });
    mockFindHotelById.mockResolvedValue({ currency: "INR" });
  });

  test("creates a YouPI payment order", async () => {
    const { response, payload } = await invokeController(createPaymentOrder, {
      bookingId: "booking-id",
      paymentMethod: "upi",
    });

    expect(response.status).toHaveBeenCalledWith(200);
    expect(payload.data).toMatchObject({
      amount: 500000,
      amountInRupees: 5000,
      currency: "INR",
      gateway: "youpi",
      paymentMethod: "upi",
    });
    expect(payload.data.orderId).toContain("youpi_booking-id");
    expect(payload.data.upiString).toContain("upi://pay?");
    expect(payload.data.deepLinks).toHaveProperty("gpay");
    expect(payload.data.deepLinks).toHaveProperty("phonepe");
  });

  test("creates a pay-at-hotel booking without an online order", async () => {
    const { response, payload } = await invokeController(createPaymentOrder, {
      bookingId: "booking-id",
      paymentMethod: "pay_at_hotel",
    });

    expect(response.status).toHaveBeenCalledWith(200);
    expect(payload.data).toMatchObject({
      paymentMethod: "pay_at_hotel",
      status: "created",
      amount: 5000,
    });
    expect(booking.save).toHaveBeenCalled();
  });

  test("forwards an invalid booking ID error", async () => {
    mockFindBookingById.mockImplementation(() => {
      throw new Error("Invalid booking ID");
    });

    const { error } = await invokeController(createPaymentOrder, {
      bookingId: "invalid-id",
      paymentMethod: "upi",
    });

    expect(error).toHaveProperty("message", "Invalid booking ID");
  });

  test("returns a not-found error when the booking does not exist", async () => {
    mockFindBookingById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const { error } = await invokeController(createPaymentOrder, {
      bookingId: "missing-booking-id",
      paymentMethod: "upi",
    });

    expect(error).toHaveProperty("statusCode", 404);
    expect(error).toHaveProperty("message", "Booking not found");
  });

  test("verifies a valid YouPI payment by UTR", async () => {
    mockFindBookingById.mockResolvedValue(booking);
    const { response, payload } = await invokeController(verifyPayment, {
      orderId: "youpi_booking-id_123",
      paymentId: "pay_123",
      utr: "123456789012",
      bookingId: "booking-id",
    });

    expect(response.status).toHaveBeenCalledWith(200);
    expect(payload.data).toMatchObject({
      status: "success",
      gateway: "youpi",
      utr: "123456789012",
    });
  });

  test("rejects an invalid payment signature", async () => {
    const { error } = await invokeController(verifyPayment, {
      orderId: "test_order_id",
      paymentId: "test_payment_id",
      signature: "test_invalid_signature",
    });

    expect(error).toHaveProperty("statusCode", 400);
    expect(error).toHaveProperty("message", "Invalid payment signature");
  });
});
