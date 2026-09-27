import { beforeEach, describe, expect, jest, test } from '@jest/globals';

process.env.RAZORPAY_KEY_ID = 'rzp_test_ci';
process.env.RAZORPAY_KEY_SECRET = 'ci_test_secret';

const mockFindBookingById = jest.fn();
const mockFindHotelById = jest.fn();
const mockCreateOrder = jest.fn();

await jest.unstable_mockModule('../models/booking.models.js', () => ({
  Booking: { findById: mockFindBookingById },
}));

await jest.unstable_mockModule('../models/hotel.models.js', () => ({
  Hotel: { findById: mockFindHotelById },
}));

await jest.unstable_mockModule('razorpay', () => ({
  default: jest.fn().mockImplementation(() => ({
    orders: { create: mockCreateOrder },
  })),
}));

const { createPaymentOrder, verifyPayment } = await import(
  '../controllers/payment.controllers.js'
);

const makeBooking = () => ({
  _id: 'booking-id',
  hotelId: 'hotel-id',
  totalAmount: 5000,
  paymentStatus: 'Pending',
  bookingStatus: 'Pending',
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

describe('Payment controller', () => {
  let booking;

  beforeEach(() => {
    jest.clearAllMocks();
    booking = makeBooking();
    mockFindBookingById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(booking),
    });
    mockFindHotelById.mockResolvedValue({ currency: 'INR' });
    mockCreateOrder.mockResolvedValue({
      id: 'order_test_123',
      amount: 500000,
      currency: 'INR',
    });
  });

  test('creates a payment order', async () => {
    const { response, payload } = await invokeController(createPaymentOrder, {
      bookingId: 'booking-id',
      paymentMethod: 'upi',
    });

    expect(response.status).toHaveBeenCalledWith(200);
    expect(payload.data).toMatchObject({
      amount: 500000,
      currency: 'INR',
      orderId: 'order_test_123',
    });
    expect(mockCreateOrder).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 500000, currency: 'inr' }),
    );
  });

  test('creates a pay-at-hotel booking without an online order', async () => {
    const { response, payload } = await invokeController(createPaymentOrder, {
      bookingId: 'booking-id',
      paymentMethod: 'pay_at_hotel',
    });

    expect(response.status).toHaveBeenCalledWith(200);
    expect(payload.data).toMatchObject({
      paymentMethod: 'pay_at_hotel',
      status: 'created',
    });
    expect(booking.save).toHaveBeenCalled();
    expect(mockCreateOrder).not.toHaveBeenCalled();
  });

  test('forwards an invalid booking ID error', async () => {
    mockFindBookingById.mockImplementation(() => {
      throw new Error('Invalid booking ID');
    });

    const { error } = await invokeController(createPaymentOrder, {
      bookingId: 'invalid-id',
      paymentMethod: 'upi',
    });

    expect(error).toHaveProperty('message', 'Invalid booking ID');
  });

  test('returns a not-found error when the booking does not exist', async () => {
    mockFindBookingById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const { error } = await invokeController(createPaymentOrder, {
      bookingId: 'missing-booking-id',
      paymentMethod: 'upi',
    });

    expect(error).toHaveProperty('statusCode', 404);
    expect(error).toHaveProperty('message', 'Booking not found');
  });

  test('rejects an invalid payment signature', async () => {
    const { error } = await invokeController(verifyPayment, {
      razorpay_order_id: 'test_order_id',
      razorpay_payment_id: 'test_payment_id',
      razorpay_signature: 'test_signature',
    });

    expect(error).toHaveProperty('statusCode', 400);
    expect(error).toHaveProperty('message', 'Invalid payment signature');
  });
});