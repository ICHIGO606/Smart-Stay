import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Booking } from "../models/booking.models.js";
import { Hotel } from "../models/hotel.models.js";
import youpiService from "../services/youpiService.js";
import { notificationService } from "../services/notificationService.js";
import { sseService } from "../services/sseService.js";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config({
  path: "../.env",
});

// Create payment session/order via YouPI-PG
const createPaymentOrder = asyncHandler(async (req, res) => {
  const { bookingId, paymentMethod = "upi" } = req.body;

  if (!bookingId || !paymentMethod) {
    throw new ApiError(400, "Booking ID and payment method are required");
  }

  // CodeQL Fix: Sanitize user input to prevent NoSQL Injection
  const safeBookingId = String(bookingId);

  const booking = await Booking.findById(safeBookingId).populate("hotelId");
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (booking.paymentStatus === "Completed") {
    throw new ApiError(400, "Payment already completed for this booking");
  }

  const hotel = await Hotel.findById(booking.hotelId);
  const currency = hotel?.currency || "INR";

  // For pay at hotel / cash on delivery (COD)
  if (paymentMethod === "pay_at_hotel") {
    booking.paymentStatus = "Pending";
    booking.bookingStatus = "Pending";
    booking.paymentDetails = {
      gateway: "youpi",
      paymentMethod: "pay_at_hotel",
      orderId: `pay_at_hotel_${booking._id}`,
      paymentStatus: "Pending",
    };
    await booking.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          orderId: `pay_at_hotel_${booking._id}`,
          paymentMethod: "pay_at_hotel",
          status: "created",
          currency,
          amount: booking.totalAmount,
        },
        "Pay at hotel booking created successfully"
      )
    );
  }

  // Create YouPI-PG UPI & sovereign payment session
  try {
    const session = await youpiService.createPaymentSession({
      booking,
      paymentMethod,
    });

    booking.paymentDetails = {
      gateway: "youpi",
      orderId: session.orderId,
      paymentId: session.paymentId,
      amount: session.amountInRupees,
      currency: session.currency,
      paymentMethod,
      paymentStatus: "Pending",
    };
    await booking.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          orderId: session.orderId,
          paymentId: session.paymentId,
          amount: session.amount, // in paise
          amountInRupees: session.amountInRupees,
          currency: session.currency,
          paymentMethod,
          upiId: session.upiId,
          merchantName: session.merchantName,
          upiString: session.upiString,
          deepLinks: session.deepLinks,
          checkoutUrl: session.checkoutUrl,
          gateway: "youpi",
          key: youpiService.merchantId || process.env.YOUPI_MERCHANT_ID || process.env.RAZORPAY_KEY_ID,
        },
        "Payment order created successfully"
      )
    );
  } catch (error) {
    console.error("YouPI order creation error:", error);
    throw new ApiError(500, "Failed to create payment order");
  }
});

// Verify payment and update booking status
const verifyPayment = asyncHandler(async (req, res) => {
  const {
    orderId,
    paymentId,
    utr,
    signature,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  const effectiveOrderId = orderId || razorpay_order_id;
  const effectivePaymentId = paymentId || razorpay_payment_id || utr;
  const effectiveSignature = signature || razorpay_signature;

  if (!effectiveOrderId && !effectivePaymentId && !utr) {
    throw new ApiError(400, "All payment parameters are required");
  }

  // Verify HMAC signature if provided
  if (effectiveSignature) {
    const body = `${effectiveOrderId}|${effectivePaymentId}`;
    const secret =
      process.env.YOUPI_WEBHOOK_SECRET ||
      process.env.RAZORPAY_KEY_SECRET ||
      "youpi_webhook_super_secret_key";

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    const isValidSignature = (() => {
      try {
        return crypto.timingSafeEqual(
          Buffer.from(expectedSignature),
          Buffer.from(effectiveSignature)
        );
      } catch {
        return false;
      }
    })();

    if (!isValidSignature) {
      throw new ApiError(400, "Invalid payment signature");
    }
  }

  // Find booking by order ID, booking ID, or payment ID
  const safeOrderId = String(effectiveOrderId || "");
  let booking = await Booking.findOne({
    $or: [
      { "paymentDetails.orderId": safeOrderId },
      { "paymentDetails.razorpayOrderId": safeOrderId },
      { "paymentDetails.paymentId": effectivePaymentId },
      { "paymentDetails.razorpayPaymentId": effectivePaymentId },
    ],
  });

  if (!booking && safeOrderId) {
    // If orderId contains booking id: youpi_<bookingId>_<timestamp>
    const parts = safeOrderId.split("_");
    const possibleBookingId = parts[1] || parts[0];
    if (possibleBookingId && /^[0-9a-fA-F]{24}$/.test(possibleBookingId)) {
      booking = await Booking.findById(possibleBookingId);
    }
  }

  if (!booking && req.body.bookingId) {
    booking = await Booking.findById(String(req.body.bookingId));
  }

  if (!booking) {
    throw new ApiError(404, "Booking not found for this payment");
  }

  // Update booking status
  booking.paymentStatus = "Completed";
  booking.bookingStatus = "Confirmed";
  booking.paymentDetails = {
    ...booking.paymentDetails,
    gateway: "youpi",
    paymentId: effectivePaymentId,
    orderId: effectiveOrderId,
    utr: utr || null,
    paymentDate: new Date(),
    paymentStatus: "Completed",
  };
  await booking.save();

  // Dispatch payment notification & live SSE event
  notificationService.sendPaymentReceipt({
    booking,
    payment: { utr: utr || effectivePaymentId },
  }).catch((err) => console.error("Notification dispatch error:", err));

  if (booking.hotelId) {
    sseService.broadcast(booking.hotelId, "payment_confirmed", {
      bookingId: booking._id,
      paymentStatus: "Completed",
      bookingStatus: "Confirmed",
    });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        paymentId: effectivePaymentId,
        orderId: effectiveOrderId,
        utr: utr || null,
        status: "success",
        gateway: "youpi",
      },
      "Payment verified successfully"
    )
  );
});

// Get payment methods
const getPaymentMethods = asyncHandler(async (req, res) => {
  const { bookingId } = req.query;

  if (!bookingId) {
    throw new ApiError(400, "Booking ID is required");
  }

  // CodeQL Fix: Sanitize user input to prevent NoSQL Injection
  const safeBookingId = String(bookingId);

  const booking = await Booking.findById(safeBookingId).populate("hotelId");
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  const hotel = await Hotel.findById(booking.hotelId);
  const currency = hotel?.currency || "INR";

  const paymentMethods = youpiService.getPaymentMethods(currency);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        currency,
        amount: booking.totalAmount,
        gateway: "youpi",
        upiId: youpiService.upiId,
        merchantName: youpiService.merchantName,
        methods: paymentMethods.filter((method) => method.supported),
      },
      "Payment methods fetched successfully"
    )
  );
});

export { createPaymentOrder, verifyPayment, getPaymentMethods };
