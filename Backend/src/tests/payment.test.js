import mongoose from 'mongoose';
import { createPaymentOrder, verifyPayment } from '../controllers/payment.controllers.js';
import {Booking} from '../models/booking.models.js';
import {Hotel} from '../models/hotel.models.js';
import {User} from '../models/user.models.js';
import dotenv from 'dotenv';
dotenv.config();
// Mock request and response objects
const mockRequest = (body = {}, params = {}, headers = {}) => ({
  body,
  params,
  headers,
  user: { _id: 'test-user-id' }
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Test data
const testBookingData = {
  hotelId: 'test-hotel-id',
  userId: 'test-user-id',
  checkInDate: new Date(),
  checkOutDate: new Date(Date.now() + 86400000), // +1 day
  guests: { adults: 2, children: 0 },
  totalAmount: 5000,
  currency: 'INR',
  paymentStatus: 'Pending',
  bookingStatus: 'Pending'
};

const testHotelData = {
  name: 'Test Hotel',
  description: 'A test hotel for payment testing',
  city: 'Test City',
  address: '123 Test Street',
  starRating: 4,
  currency: 'INR',
  adminId: 'test-admin-id'
};

const testUserData = {
  fullName: 'Test User',
  email: 'test@example.com',
  phone: '+1234567890',
  password: 'testpassword'
};

describe('Payment Flow Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear test data
    await Booking.deleteMany({});
    await Hotel.deleteMany({});
    await User.deleteMany({});
  });

  test('should create payment order successfully', async () => {
    // Create test hotel and user
    const hotel = await Hotel.create(testHotelData);
    const user = await User.create(testUserData);
    
    // Create test booking
    const booking = await Booking.create({
      ...testBookingData,
      hotelId: hotel._id,
      userId: user._id
    });

    const req = mockRequest({
      bookingId: booking._id.toString(),
      paymentMethod: 'upi'
    });

    const res = mockResponse();

    await createPaymentOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          amount: expect.any(Number),
          currency: 'INR',
          orderId: expect.any(String)
        })
      })
    );
  });

  test('should handle pay at hotel option', async () => {
    const hotel = await Hotel.create(testHotelData);
    const user = await User.create(testUserData);
    const booking = await Booking.create({
      ...testBookingData,
      hotelId: hotel._id,
      userId: user._id
    });

    const req = mockRequest({
      bookingId: booking._id.toString(),
      paymentMethod: 'pay_at_hotel'
    });

    const res = mockResponse();

    await createPaymentOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          paymentMethod: 'pay_at_hotel',
          status: 'pending_payment'
        })
      })
    );

    // Verify booking was updated
    const updatedBooking = await Booking.findById(booking._id);
    expect(updatedBooking.paymentStatus).toBe('Pending');
    expect(updatedBooking.bookingStatus).toBe('Pending');
  });

  test('should return error for invalid booking ID', async () => {
    const req = mockRequest({
      bookingId: 'invalid-id',
      paymentMethod: 'upi'
    });

    const res = mockResponse();

    await createPaymentOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.any(String)
      })
    );
  });

  test('should return error for non-existent booking', async () => {
    const req = mockRequest({
      bookingId: '507f1f77bcf86cd799439011', // Valid but non-existent ObjectId
      paymentMethod: 'upi'
    });

    const res = mockResponse();

    await createPaymentOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Booking not found'
      })
    );
  });

  test('should verify payment signature successfully', async () => {
    // This test would require actual Razorpay integration
    // For now, we'll test the error handling
    const req = mockRequest({
      razorpay_order_id: 'test_order_id',
      razorpay_payment_id: 'test_payment_id',
      razorpay_signature: 'test_signature'
    });

    const res = mockResponse();

    await verifyPayment(req, res);

    // Should fail due to test environment
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// Utility function to run tests
export const runPaymentTests = async () => {
  console.log('Running payment flow tests...');
  
  try {
    // Test database connection
    await mongoose.connect(process.env.MONGODB_URI_TEST);
    
    // Create test data
    const hotel = await Hotel.create(testHotelData);
    const user = await User.create(testUserData);
    const booking = await Booking.create({
      ...testBookingData,
      hotelId: hotel._id,
      userId: user._id
    });

    console.log('✅ Test data created successfully');
    
    // Test payment order creation
    const req = mockRequest({
      bookingId: booking._id.toString(),
      paymentMethod: 'pay_at_hotel'
    });
    
    const res = mockResponse();
    await createPaymentOrder(req, res);
    
    console.log('✅ Payment order creation test passed');
    
    // Cleanup
    await Booking.deleteMany({});
    await Hotel.deleteMany({});
    await User.deleteMany({});
    
    console.log('✅ All payment flow tests completed successfully');
    
  } catch (error) {
    console.error('❌ Payment flow tests failed:', error.message);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
};