# YouPI-PG Open-Source Payment Gateway Integration Guide

SmartStay is migrated from Razorpay to **[YouPI-PG](https://github.com/youpi-pg/YouPI-PG.git)**, the open-source, self-hosted sovereign UPI & Cash-on-Delivery payment gateway with 0% transaction fees.

---

## Why YouPI-PG?

- **Zero Verification / KYC Delays**: Razorpay requires commercial merchant approvals, banking audits, and KYC documentation before activation. YouPI-PG routes UPI payments directly to your personal or business UPI ID (VPA) with 0% platform cuts.
- **Universal NPCI UPI Intent & Dynamic QR**: Customers can scan the dynamic vector SVG QR code with Google Pay, PhonePe, Paytm, CRED, BHIM, or any UPI app.
- **Bank Reference Matching (UTR)**: Automatic observer reconciliation or instant 12-digit UPI UTR confirmation.
- **Pay at Hotel / Cash on Delivery (COD)**: Fully supported for travelers paying at check-in.

---

## Quick Setup

### 1. Environment Variables (`Backend/.env`)

Add or customize the following variables:

```env
# YouPI-PG Open-Source Payment Gateway Configuration
# Repository: https://github.com/youpi-pg/YouPI-PG.git
YOUPI_BASE_URL=http://localhost:7000
YOUPI_MERCHANT_ID=smartstay_merchant_01
YOUPI_MERCHANT_API_KEY=youpi_live_smartstay_sec_key
YOUPI_WEBHOOK_SECRET=youpi_webhook_super_secret_key
YOUPI_UPI_ID=smartstay@upi
YOUPI_MERCHANT_NAME=SmartStay Hotels
```

### 2. Running YouPI-PG Locally (Optional Self-Hosted Service)

To run the full YouPI-PG observation mesh and hosted portal:

```bash
# Clone YouPI-PG
git clone https://github.com/youpi-pg/YouPI-PG.git
cd YouPI-PG

# Install and start
npm install
npm run dev
```

By default, YouPI-PG runs:
- **Checkout Portal / Proxy**: `http://localhost:7000`
- **Payment Core API**: `http://localhost:6100`

> **Note**: Even if the YouPI-PG local server is not running, SmartStay operates in **Sovereign Direct-UPI mode**, generating NPCI-compliant dynamic vector QR codes and intent deep-links directly in the browser and validating via UTR or cryptographic signatures!

---

## API Endpoints

### 1. Create Payment Session
- **URL**: `POST /api/v1/payments/create-order`
- **Auth**: `Bearer <User JWT>`
- **Body**:
  ```json
  {
    "bookingId": "651234abcd...",
    "paymentMethod": "upi"
  }
  ```
- **Response**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "orderId": "youpi_651234abcd_1794082554964",
      "paymentId": "youpi_pay_1794082554964_abc123",
      "amount": 500000,
      "amountInRupees": 5000,
      "currency": "INR",
      "upiId": "smartstay@upi",
      "merchantName": "SmartStay Hotels",
      "upiString": "upi://pay?pa=smartstay@upi&pn=SmartStay%20Hotels&am=5000.00&tr=youpi_651234abcd_1794082554964&tn=SmartStay%20Booking&cu=INR",
      "deepLinks": {
        "gpay": "gpay://upi/pay?...",
        "phonepe": "phonepe://pay?...",
        "paytm": "paytmmp://pay?...",
        "bhim": "upi://pay?..."
      },
      "checkoutUrl": "http://localhost:7000/checkout/...",
      "gateway": "youpi"
    }
  }
  ```

### 2. Verify Payment
- **URL**: `POST /api/v1/payments/verify`
- **Auth**: `Bearer <User JWT>` (caller must be the booking owner or an admin)
- **Body**:
  ```json
  {
    "orderId": "youpi_651234abcd_1794082554964",
    "paymentId": "youpi_pay_1794082554964_abc123",
    "utr": "431289104523",
    "signature": "hmac_sha256_hex_signature"
  }
  ```
- **Security & Authorization Rules**:
  - The endpoint verifies booking ownership (`booking.userId === req.user._id`); requests for other users' bookings return `403 Forbidden`.
  - When a `signature` is provided, it is validated using constant-time HMAC-SHA256 (`crypto.timingSafeEqual`) against the configured webhook secret.
  - Server-side settlement is finalized only upon valid signature verification or confirmed webhook callback from YouPI.
- **Response**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "orderId": "youpi_651234abcd_1794082554964",
      "paymentId": "youpi_pay_1794082554964_abc123",
      "utr": "431289104523",
      "status": "success",
      "gateway": "youpi"
    }
  }
  ```

### 3. Webhook Delivery
- **URL**: `POST /webhooks/payment-webhook`
- **Headers**:
  - `X-Gateway-Signature`: `sha256=<hmac_sha256>`
  - `X-Gateway-Event`: `OBSERVED_SUCCESS` | `RECONCILED` | `FAILED`
- **Body**:
  ```json
  {
    "event": "OBSERVED_SUCCESS",
    "order_id": "youpi_651234abcd_1794082554964",
    "payment_id": "youpi_pay_1794082554964_abc123",
    "amount": 500000,
    "utr": "431289104523",
    "status": "OBSERVED_SUCCESS"
  }
  ```

