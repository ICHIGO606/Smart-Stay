import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Booking } from "../models/booking.models.js";
import { Hotel } from "../models/hotel.models.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config(
  {
    path:"../.env"
  }
);
// console.log("Loaded RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);
// console.log("Loaded RAZORPAY_KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET);

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: "rzp_test_A7v1Yk3gk3bX4M",
  key_secret: "1fX3Y5eH2b8u3y5z7w9vL0aP",
});

// Create payment order
const createPaymentOrder = asyncHandler(async (req, res) => {
  const { bookingId, paymentMethod } = req.body;
  
  if (!bookingId || !paymentMethod) {
    throw new ApiError(400, "Booking ID and payment method are required");
  }

  const booking = await Booking.findById(bookingId).populate("hotelId");
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (booking.paymentStatus === "Completed") {
    throw new ApiError(400, "Payment already completed for this booking");
  }

  const hotel = await Hotel.findById(booking.hotelId);
  const currency = hotel?.currency || "INR";

  // For pay at hotel, create a dummy order and mark as completed
  if (paymentMethod === "pay_at_hotel") {
    booking.paymentStatus = "Pending";
    booking.bookingStatus = "Pending";
    await booking.save();

    return res.status(200).json(
      new ApiResponse(200, {
        orderId: `pay_at_hotel_${booking._id}`,
        paymentMethod: "pay_at_hotel",
        status: "created"
      }, "Pay at hotel booking created successfully")
    );
  }

  // For online payments, create Razorpay order
  const options = {
    amount: Math.round(booking.totalAmount * 100), // Convert to paise
    currency: currency.toLowerCase(),
    receipt: `booking_${booking._id}`,
    payment_capture: 1,
    notes: {
      bookingId: booking._id.toString(),
      paymentMethod: paymentMethod
    }
  };

  try {
    const order = await razorpay.orders.create(options);
    
    res.status(200).json(
      new ApiResponse(200, {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        paymentMethod: paymentMethod,
        key: process.env.RAZORPAY_KEY_ID
      }, "Payment order created successfully")
    );
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    throw new ApiError(500, "Failed to create payment order");
  }
});

// Verify payment and update booking status
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, "All payment parameters are required");
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Invalid payment signature");
  }

  // Find booking by order ID
  const order = await razorpay.orders.fetch(razorpay_order_id);
  const bookingId = order.notes?.bookingId;

  if (!bookingId) {
    throw new ApiError(404, "Booking not found for this payment");
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  // Update booking status
  booking.paymentStatus = "Completed";
  booking.bookingStatus = "Confirmed";
  await booking.save();

  res.status(200).json(
    new ApiResponse(200, {
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: "success"
    }, "Payment verified successfully")
  );
});

// Get payment methods
const getPaymentMethods = asyncHandler(async (req, res) => {
  const { bookingId } = req.query;
  
  if (!bookingId) {
    throw new ApiError(400, "Booking ID is required");
  }

  const booking = await Booking.findById(bookingId).populate("hotelId");
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  const hotel = await Hotel.findById(booking.hotelId);
  const currency = hotel?.currency || "INR";

  const paymentMethods = [
    {
      id: "upi",
      name: "UPI",
      description: "Pay using UPI apps like Google Pay, PhonePe, Paytm",
      supported: currency === "INR",
      icon: "💳"
    },
    {
      id: "card",
      name: "Credit/Debit Card",
      description: "Pay using Visa, MasterCard, RuPay, or other cards",
      supported: true,
      icon: "💳"
    },
    {
      id: "netbanking",
      name: "Net Banking",
      description: "Pay directly from your bank account",
      supported: currency === "INR",
      icon: "🏦"
    },
    {
      id: "wallet",
      name: "Wallet",
      description: "Pay using mobile wallets",
      supported: currency === "INR",
      icon: "📱"
    },
    {
      id: "pay_at_hotel",
      name: "Pay at Hotel",
      description: "Pay when you arrive at the hotel",
      supported: true,
      icon: "🏨"
    }
  ];

  res.status(200).json(
    new ApiResponse(200, {
      currency: currency,
      amount: booking.totalAmount,
      methods: paymentMethods.filter(method => method.supported)
    }, "Payment methods fetched successfully")
  );
});

export {
  createPaymentOrder,
  verifyPayment,
  getPaymentMethods
};