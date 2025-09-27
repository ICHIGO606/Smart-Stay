import crypto from 'crypto';
import {Booking} from '../models/booking.models.js';

// Verify Razorpay webhook signature
const verifyWebhookSignature = (body, signature, secret) => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');
  
  return expectedSignature === signature;
};

export const handlePaymentWebhook = async (req, res) => {
  try {
    const razorpaySignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!razorpaySignature || !webhookSecret) {
      return res.status(400).json({
        success: false,
        message: 'Missing webhook signature or secret'
      });
    }

    // Verify webhook signature
    const isValidSignature = verifyWebhookSignature(
      req.body,
      razorpaySignature,
      webhookSecret
    );

    if (!isValidSignature) {
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    const { event, payload } = req.body;

    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload.payment.entity);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(payload.payment.entity);
        break;
      
      case 'refund.processed':
        await handleRefundProcessed(payload.refund.entity);
        break;
      
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const handlePaymentCaptured = async (payment) => {
  try {
    const booking = await Booking.findOne({ 
      'paymentDetails.razorpayOrderId': payment.order_id 
    });

    if (booking) {
      booking.paymentStatus = 'Completed';
      booking.bookingStatus = 'Confirmed';
      booking.paymentDetails = {
        ...booking.paymentDetails,
        razorpayPaymentId: payment.id,
        paymentDate: new Date(),
        paymentMethod: payment.method,
        paymentStatus: 'Completed'
      };
      
      await booking.save();
      console.log(`Payment captured for booking: ${booking._id}`);
    }
  } catch (error) {
    console.error('Error handling payment captured:', error);
  }
};

const handlePaymentFailed = async (payment) => {
  try {
    const booking = await Booking.findOne({ 
      'paymentDetails.razorpayOrderId': payment.order_id 
    });

    if (booking) {
      booking.paymentStatus = 'Failed';
      booking.paymentDetails = {
        ...booking.paymentDetails,
        razorpayPaymentId: payment.id,
        paymentDate: new Date(),
        paymentMethod: payment.method,
        paymentStatus: 'Failed',
        errorDescription: payment.error_description
      };
      
      await booking.save();
      console.log(`Payment failed for booking: ${booking._id}`);
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
};

const handleRefundProcessed = async (refund) => {
  try {
    const booking = await Booking.findOne({ 
      'paymentDetails.razorpayPaymentId': refund.payment_id 
    });

    if (booking) {
      booking.paymentStatus = 'Refunded';
      booking.paymentDetails.refunds = booking.paymentDetails.refunds || [];
      booking.paymentDetails.refunds.push({
        refundId: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
        processedAt: new Date()
      });
      
      await booking.save();
      console.log(`Refund processed for booking: ${booking._id}`);
    }
  } catch (error) {
    console.error('Error handling refund processed:', error);
  }
};

export default {
  handlePaymentWebhook
};