import { Booking } from "../models/booking.models.js";
import youpiService from "../services/youpiService.js";

export const handlePaymentWebhook = async (req, res) => {
  try {
    const signature =
      req.headers["x-gateway-signature"] ||
      req.headers["x-youpi-signature"] ||
      req.headers["x-razorpay-signature"];

    const hasConfiguredSecret =
      Boolean(process.env.YOUPI_WEBHOOK_SECRET) ||
      Boolean(process.env.RAZORPAY_WEBHOOK_SECRET);

    if (!signature || !hasConfiguredSecret) {
      return res.status(400).json({
        success: false,
        message: "Missing webhook signature or secret",
      });
    }

    // Verify webhook HMAC signature
    const isValidSignature = youpiService.verifyWebhookSignature(
      req.body,
      signature
    );

    if (!isValidSignature) {
      return res.status(401).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    // Determine event type (supports YouPI X-Gateway-Event and payload event)
    const event =
      req.headers["x-gateway-event"] ||
      req.body?.event ||
      req.body?.status;

    const payload = req.body?.payload || req.body;

    switch (event) {
      case "OBSERVED_SUCCESS":
      case "RECONCILED":
      case "SUCCESS":
        await handlePaymentCaptured(payload?.payment?.entity || payload);
        break;

      case "payment.captured":
        if (!payload?.payment?.entity) {
          throw new Error("Malformed payment.captured payload");
        }
        await handlePaymentCaptured(payload.payment.entity);
        break;

      case "FAILED":
      case "EXPIRED":
      case "CANCELLED":
        await handlePaymentFailed(payload?.payment?.entity || payload);
        break;

      case "payment.failed":
        if (!payload?.payment?.entity) {
          throw new Error("Malformed payment.failed payload");
        }
        await handlePaymentFailed(payload.payment.entity);
        break;

      case "refund.processed":
        if (!payload?.refund?.entity) {
          throw new Error("Malformed refund.processed payload");
        }
        await handleRefundProcessed(payload.refund.entity);
        break;

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    return res.status(200).json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const handlePaymentCaptured = async (payment) => {
  try {
    const safeOrderId = String(payment.order_id || payment.orderId || "");
    const safePaymentId = String(payment.id || payment.payment_id || payment.paymentId || "");

    const isRazorpayEvent = payment.order_id && String(payment.order_id).startsWith("order-");
    const query = isRazorpayEvent
      ? { "paymentDetails.razorpayOrderId": safeOrderId }
      : {
          $or: [
            { "paymentDetails.orderId": safeOrderId },
            { "paymentDetails.razorpayOrderId": safeOrderId },
            { "paymentDetails.paymentId": safePaymentId },
            { "paymentDetails.razorpayPaymentId": safePaymentId },
          ],
        };

    const booking = await Booking.findOne(query);

    if (booking) {
      booking.paymentStatus = "Completed";
      booking.bookingStatus = "Confirmed";
      booking.paymentDetails = {
        ...booking.paymentDetails,
        gateway: payment.gateway || "youpi",
        orderId: safeOrderId || booking.paymentDetails?.orderId,
        paymentId: safePaymentId,
        razorpayPaymentId: safePaymentId,
        razorpayOrderId: safeOrderId,
        utr: payment.utr || null,
        paymentDate: new Date(),
        paymentMethod: payment.method || "upi",
        paymentStatus: "Completed",
      };

      await booking.save();
      console.log(`Payment captured for booking: ${booking._id}`);
    } else {
      console.log(`Booking not found for order: ${safeOrderId}`);
    }
  } catch (error) {
    console.error("Error updating booking payment status:", error);
  }
};

const handlePaymentFailed = async (payment) => {
  try {
    const safeOrderId = String(payment.order_id || payment.orderId || "");

    const isRazorpayEvent = payment.order_id && String(payment.order_id).startsWith("order-");
    const query = isRazorpayEvent
      ? { "paymentDetails.razorpayOrderId": safeOrderId }
      : {
          $or: [
            { "paymentDetails.orderId": safeOrderId },
            { "paymentDetails.razorpayOrderId": safeOrderId },
          ],
        };

    const booking = await Booking.findOne(query);

    if (booking) {
      booking.paymentStatus = "Failed";
      booking.paymentDetails = {
        ...booking.paymentDetails,
        gateway: payment.gateway || "youpi",
        errorDescription: payment.error_description || payment.reason || "Payment declined/failed",
        paymentDate: new Date(),
        paymentStatus: "Failed",
      };

      await booking.save();
      console.log(`Payment marked failed for booking: ${booking._id}`);
    }
  } catch (error) {
    console.error("Error updating booking payment failure status:", error);
  }
};

const handleRefundProcessed = async (refund) => {
  try {
    const safePaymentId = String(refund.payment_id || refund.paymentId || refund.id || "");

    const isRazorpayEvent = refund.payment_id && String(refund.payment_id).startsWith("payment-");
    const query = isRazorpayEvent
      ? { "paymentDetails.razorpayPaymentId": safePaymentId }
      : {
          $or: [
            { "paymentDetails.paymentId": safePaymentId },
            { "paymentDetails.razorpayPaymentId": safePaymentId },
          ],
        };

    const booking = await Booking.findOne(query);

    if (booking) {
      booking.paymentStatus = "Refunded";
      if (!booking.paymentDetails) booking.paymentDetails = {};
      if (!Array.isArray(booking.paymentDetails.refunds)) {
        booking.paymentDetails.refunds = [];
      }

      booking.paymentDetails.refunds.push({
        refundId: refund.id || refund.refundId,
        amount: (refund.amount || 0) / 100,
        currency: refund.currency || "INR",
        status: refund.status || "processed",
        refundDate: new Date(),
      });

      await booking.save();
      console.log(`Refund processed for booking: ${booking._id}`);
    }
  } catch (error) {
    console.error("Error updating refund status:", error);
  }
};
