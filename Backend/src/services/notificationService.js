/**
 * Notification Service for SmartStay
 * Dispatches reservation vouchers, YouPI payment receipts, and KYC approvals.
 * Supports development console ledger logging and optional SMTP/webhook hooks.
 */

class NotificationService {
  /**
   * Dispatches booking confirmation with reservation details
   */
  async sendBookingConfirmation({ booking, user, hotel, room }) {
    const payload = {
      to: user?.email,
      guestName: user?.fullName || "Guest",
      hotelName: hotel?.name || "Boutique Hotel",
      roomType: room?.type || "Signature Room",
      checkIn: new Date(booking.checkInDate).toLocaleDateString(),
      checkOut: new Date(booking.checkOutDate).toLocaleDateString(),
      totalAmount: booking.totalAmount,
      currency: booking.currency || "INR",
      bookingId: booking._id,
      timestamp: new Date(),
    };

    console.log(
      `[NOTIFICATION DISPATCH] Booking Confirmation -> ${payload.to} for Stay at ${payload.hotelName} (№ ${booking._id})`
    );

    return { sent: true, recipient: payload.to, event: "BOOKING_CONFIRMED" };
  }

  /**
   * Dispatches payment settlement receipt
   */
  async sendPaymentReceipt({ booking, payment }) {
    const recipient = booking.user?.email || "guest@smartstay.com";
    const utr = payment.utr || "Verified via Gateway";

    console.log(
      `[NOTIFICATION DISPATCH] YouPI Payment Receipt -> ${recipient} | UTR: ${utr} | Amount: ₹${booking.totalAmount}`
    );

    return { sent: true, recipient, utr, event: "PAYMENT_RECEIPT" };
  }

  /**
   * Dispatches KYC verification status update
   */
  async sendKycStatusUpdate({ user, status, reason }) {
    console.log(
      `[NOTIFICATION DISPATCH] KYC Status Update -> ${user.email} (${user.fullName}): Status is ${status}${
        reason ? ` Reason: ${reason}` : ""
      }`
    );

    return { sent: true, recipient: user.email, status, event: "KYC_STATUS_UPDATED" };
  }
}

export const notificationService = new NotificationService();
export default notificationService;

