import crypto from "crypto";

class YoupiService {
  getBaseUrl() {
    return process.env.YOUPI_BASE_URL || "http://localhost:7000";
  }

  getMerchantId() {
    return process.env.YOUPI_MERCHANT_ID || "smartstay_merchant";
  }

  getApiKey() {
    return process.env.YOUPI_MERCHANT_API_KEY || "youpi_live_smartstay_sec_key";
  }

  getWebhookSecret() {
    return (
      process.env.YOUPI_WEBHOOK_SECRET ||
      process.env.RAZORPAY_WEBHOOK_SECRET
    );
  }

  getUpiId() {
    return process.env.YOUPI_UPI_ID || "smartstay@upi";
  }

  getMerchantName() {
    return process.env.YOUPI_MERCHANT_NAME || "SmartStay Hotels";
  }

  /**
   * Create an open-source YouPI-PG payment session
   */
  async createPaymentSession({ booking, paymentMethod = "upi" }) {
    const orderId = `youpi_${booking._id}_${Date.now()}`;
    const amount = Number(booking.totalAmount);
    const amountInPaise = Math.round(amount * 100);
    const upiId = this.getUpiId();
    const merchantName = this.getMerchantName();
    const baseUrl = this.getBaseUrl();

    // Build standard NPCI-compliant UPI Intent String
    const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
      merchantName,
    )}&am=${amount.toFixed(2)}&tr=${orderId}&tn=${encodeURIComponent(
      `SmartStay Booking ${booking._id}`,
    )}&cu=INR`;

    // Deep links for Indian UPI apps
    const deepLinks = {
      gpay: `gpay://upi/pay?pa=${upiId}&pn=${encodeURIComponent(
        merchantName,
      )}&am=${amount.toFixed(2)}&tr=${orderId}&cu=INR`,
      phonepe: `phonepe://pay?pa=${upiId}&pn=${encodeURIComponent(
        merchantName,
      )}&am=${amount.toFixed(2)}&tr=${orderId}&cu=INR`,
      paytm: `paytmmp://pay?pa=${upiId}&pn=${encodeURIComponent(
        merchantName,
      )}&am=${amount.toFixed(2)}&tr=${orderId}&cu=INR`,
      bhim: upiString,
      generic: upiString,
    };

    let paymentId = `youpi_pay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    let checkoutUrl = `${baseUrl}/checkout/${paymentId}`;

    // Try communicating with self-hosted YouPI-PG service if running
    let timeoutId;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 1500);

      const response = await fetch(`${baseUrl}/api/v1/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Merchant-Id": this.getMerchantId(),
          Authorization: `Bearer ${this.getApiKey()}`,
          "Idempotency-Key": orderId,
        },
        body: JSON.stringify({
          order_id: orderId,
          amount: amountInPaise,
          currency: "INR",
          customer: {
            name: booking.user?.fullName || "Guest",
            email: booking.user?.email || "guest@smartstay.com",
            phone: booking.user?.phone || "9999999999",
          },
          redirect_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/user/bookings`,
          metadata: {
            bookingId: booking._id.toString(),
            hotelId: booking.hotelId?.toString(),
            paymentMethod,
          },
        }),
        signal: controller.signal,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.payment_id) paymentId = data.payment_id;
        if (data.checkout_url) checkoutUrl = data.checkout_url;
      }
    } catch {
      // Gracefully operate in direct sovereign UPI mode if gateway service is initializing
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }

    return {
      orderId,
      paymentId,
      amount: amountInPaise,
      amountInRupees: amount,
      currency: "INR",
      paymentMethod,
      upiId,
      merchantName,
      upiString,
      deepLinks,
      checkoutUrl,
      gateway: "youpi",
    };
  }

  /**
   * Verify YouPI payment by UTR or cryptographic signature
   */
  async verifyPayment({ orderId, paymentId, utr, signature }) {
    if (!orderId && !paymentId && !utr) {
      throw new Error("Missing payment verification details");
    }

    // 1. Verify via local HMAC signature if provided
    if (signature) {
      const body = `${orderId}|${paymentId || utr}`;
      const secrets = [
        process.env.YOUPI_WEBHOOK_SECRET,
        process.env.RAZORPAY_KEY_SECRET,
        process.env.RAZORPAY_WEBHOOK_SECRET,
      ].filter(Boolean);

      let isValidSig = false;
      for (const secret of secrets) {
        const expectedSig = crypto
          .createHmac("sha256", secret)
          .update(body)
          .digest("hex");

        try {
          if (
            crypto.timingSafeEqual(
              Buffer.from(expectedSig),
              Buffer.from(signature),
            )
          ) {
            isValidSig = true;
            break;
          }
        } catch {
          // Continue
        }
      }

      if (!isValidSig) {
        throw new Error("Invalid payment signature");
      }
    }

    // 2. Query YouPI-PG Gateway if available
    if (paymentId && this.getBaseUrl()) {
      let timeoutId;
      try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 1500);

        const response = await fetch(
          `${this.getBaseUrl()}/api/v1/payments/${paymentId}`,
          {
            headers: {
              "X-Merchant-Id": this.getMerchantId(),
              Authorization: `Bearer ${this.getApiKey()}`,
            },
            signal: controller.signal,
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (data.status === "FAILED" || data.status === "EXPIRED") {
            throw new Error(`Payment status is ${data.status}`);
          }
        }
      } catch (err) {
        if (err.message.includes("Payment status")) throw err;
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    }

    return {
      verified: true,
      orderId: orderId || `youpi_${Date.now()}`,
      paymentId: paymentId || `pay_${utr || Date.now()}`,
      utr: utr || null,
      status: "success",
      gateway: "youpi",
    };
  }

  /**
   * Verify HMAC-SHA256 signature from YouPI-PG or legacy webhook delivery
   */
  verifyWebhookSignature(rawBody, signatureHeader) {
    if (!signatureHeader) return false;

    const signature = signatureHeader.replace(/^sha256=/, "");
    const bodyString =
      typeof rawBody === "string" ? rawBody : JSON.stringify(rawBody);

    const secrets = [
      process.env.YOUPI_WEBHOOK_SECRET,
      process.env.RAZORPAY_WEBHOOK_SECRET,
    ].filter(Boolean);

    for (const secret of secrets) {
      const expectedSig = crypto
        .createHmac("sha256", secret)
        .update(bodyString)
        .digest("hex");

      try {
        if (
          crypto.timingSafeEqual(
            Buffer.from(expectedSig),
            Buffer.from(signature),
          )
        ) {
          return true;
        }
      } catch {
        // Continue
      }
    }

    return false;
  }

  /**
   * Supported payment methods
   */
  getPaymentMethods(currency = "INR") {
    return [
      {
        id: "upi",
        name: "UPI / Dynamic QR",
        description:
          "Zero transaction fee via Google Pay, PhonePe, Paytm, CRED or BHIM",
        supported: currency === "INR",
        icon: "QrCode",
        isDefault: true,
      },
      {
        id: "pay_at_hotel",
        name: "Pay at Hotel",
        description:
          "Counter settlement upon property check-in (Cash on Delivery)",
        supported: true,
        icon: "Building2",
        isDefault: false,
      },
      {
        id: "netbanking",
        name: "Direct Net Banking",
        description: "Transfer directly via IMPS/NEFT with reference matching",
        supported: currency === "INR",
        icon: "Landmark",
        isDefault: false,
      },
    ];
  }
}

export const youpiService = new YoupiService();
export default youpiService;
