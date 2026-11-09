import crypto from "crypto";

/**
 * Generates an architectural, printable HTML voucher and structured data for confirmed bookings.
 */
export function generateVoucherData(booking) {
  const hotel = booking.hotelId || {};
  const room = booking.roomId || {};
  const user = booking.user || {};
  const payment = booking.paymentDetails || {};

  const checkIn = new Date(booking.checkInDate);
  const checkOut = new Date(booking.checkOutDate);
  const diffTime = Math.abs(checkOut - checkIn);
  const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Generate deterministic verification token for front-desk scanning
  const verificationPayload = `${booking._id}|${booking.user?._id || user._id}|${booking.checkInDate}`;
  const verificationToken = crypto
    .createHash("sha256")
    .update(verificationPayload)
    .digest("hex")
    .substring(0, 16)
    .toUpperCase();

  const roomNumberStr =
    booking.roomNumbers && booking.roomNumbers.length > 0
      ? booking.roomNumbers.join(", ")
      : "Assigned on arrival";

  return {
    bookingId: booking._id.toString(),
    verificationToken: booking.verificationToken || verificationToken,
    checkInCode:
      booking.checkInCode ||
      `STAY-${booking._id.toString().slice(-6).toUpperCase()}`,
    hotel: {
      id: hotel._id,
      name: hotel.name || "Boutique Property",
      city: hotel.city || "Urban",
      address: hotel.address || "Heritage Boulevard",
      images: hotel.images || [],
    },
    room: {
      type: room.type || "Signature Room",
      assignedNumbers: roomNumberStr,
      pricePerNight: room.pricePerNight || 0,
    },
    guest: {
      name: user.fullName || "Valued Guest",
      email: user.email || "",
      phone: user.phone || "",
      numberOfAdults: booking.numberOfAdults || 1,
      numberOfChildren: booking.numberOfChildren || 0,
      additionalGuests: booking.guests || [],
    },
    dates: {
      checkIn: checkIn.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      checkOut: checkOut.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      nights,
      checkInTime: "14:00 (2:00 PM)",
      checkOutTime: "11:00 (11:00 AM)",
    },
    settlement: {
      totalAmount: booking.totalAmount,
      currency: booking.currency || "INR",
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      paymentMethod: payment.paymentMethod || "YouPI UPI",
      utr: payment.utr || null,
      orderId: payment.orderId || null,
      settlementDate: payment.paymentDate
        ? new Date(payment.paymentDate).toLocaleDateString()
        : "Pending on-site",
    },
    policies: [
      "Government-issued physical photo identification required at arrival.",
      "Check-in begins at 14:00; early arrival subject to floor availability.",
      "Complimentary high-speed acoustic fiber internet included throughout the stay.",
      "Contactless check-in available by presenting this voucher pass or QR code to the concierge.",
    ],
  };
}

/**
 * HTML entity escaping to prevent Stored XSS in dynamic voucher generation
 */
export function escapeHtml(str) {
  return String(str || "").replace(
    /[&<>'"]/g,
    (tag) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[tag] || tag,
  );
}

/**
 * Returns a printable, editorial HTML pass rendered with SmartStay design tokens
 */
export function generateVoucherHtml(voucherData) {
  const safeCheckInCode = escapeHtml(voucherData.checkInCode);
  const safeHotelName = escapeHtml(voucherData.hotel.name);
  const safeHotelAddress = escapeHtml(voucherData.hotel.address);
  const safeHotelCity = escapeHtml(voucherData.hotel.city);
  const safeCheckIn = escapeHtml(voucherData.dates.checkIn);
  const safeCheckInTime = escapeHtml(voucherData.dates.checkInTime);
  const safeCheckOut = escapeHtml(voucherData.dates.checkOut);
  const safeCheckOutTime = escapeHtml(voucherData.dates.checkOutTime);
  const safeRoomType = escapeHtml(voucherData.room.type);
  const safeAssignedNumbers = escapeHtml(voucherData.room.assignedNumbers);
  const safeGuestName = escapeHtml(voucherData.guest.name);
  const safeToken = escapeHtml(voucherData.verificationToken);
  const safeBookingStatus = escapeHtml(voucherData.settlement.bookingStatus);
  const safePaymentMethod = escapeHtml(voucherData.settlement.paymentMethod);
  const safeUtr = voucherData.settlement.utr ? escapeHtml(voucherData.settlement.utr) : null;
  const safeCurrency = escapeHtml(voucherData.settlement.currency);
  const safeBookingId = escapeHtml(voucherData.bookingId);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>SmartStay Reservation Voucher • ${safeCheckInCode}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=JetBrains+Mono:wght@400;500&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background-color: #FBF9F5;
      color: #14171F;
      padding: 40px 20px;
      line-height: 1.5;
    }
    .voucher-card {
      max-width: 680px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 1px solid #E7E5E0;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(20, 23, 31, 0.04);
      overflow: hidden;
    }
    .header {
      padding: 32px 36px 24px;
      border-bottom: 1px solid #F0EEE9;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand { font-family: 'Newsreader', serif; font-size: 24px; font-weight: 400; letter-spacing: -0.02em; }
    .badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      background: #F4F1EA;
      color: #4A4D57;
      padding: 4px 10px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .body { padding: 32px 36px; }
    .section-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #7A7E89;
      margin-bottom: 8px;
    }
    .hotel-name { font-family: 'Newsreader', serif; font-size: 28px; font-weight: 400; margin-bottom: 4px; }
    .hotel-address { font-size: 13px; color: #7A7E89; margin-bottom: 24px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
    .info-box { background: #FAF9F6; border: 1px solid #EFECE6; border-radius: 8px; padding: 14px 16px; }
    .info-label { font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #7A7E89; margin-bottom: 4px; text-transform: uppercase; }
    .info-value { font-size: 14px; font-weight: 600; color: #14171F; }
    .info-sub { font-size: 12px; color: #7A7E89; margin-top: 2px; }
    .qr-banner {
      background: #14171F;
      color: #FFFFFF;
      border-radius: 8px;
      padding: 20px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 28px;
    }
    .qr-text h4 { font-family: 'Newsreader', serif; font-size: 18px; font-weight: 400; margin-bottom: 4px; }
    .qr-text p { font-size: 12px; color: #9A9EAA; }
    .qr-code-pill {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.1em;
      background: rgba(255,255,255,0.1);
      padding: 8px 14px;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.15);
    }
    .settlement-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
    .settlement-table td { padding: 10px 0; border-bottom: 1px solid #F0EEE9; }
    .settlement-table tr:last-child td { border-bottom: none; font-weight: 600; font-size: 15px; }
    .policies { background: #FAF9F6; border-radius: 8px; padding: 16px 20px; font-size: 12px; color: #4A4D57; margin-bottom: 24px; }
    .policies li { margin-left: 16px; margin-bottom: 6px; }
    .footer {
      padding: 20px 36px;
      background: #FAF9F6;
      border-top: 1px solid #F0EEE9;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      color: #7A7E89;
    }
    .print-btn {
      display: inline-block;
      background: #14171F;
      color: #FFFFFF;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      cursor: pointer;
      text-decoration: none;
      margin-top: 20px;
    }
    @media print {
      body { background: white; padding: 0; }
      .voucher-card { border: none; box-shadow: none; max-width: 100%; }
      .print-btn, .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div style="text-align: center; margin-bottom: 20px;" class="no-print">
    <button onclick="window.print()" class="print-btn">🖨️ Print / Save as PDF</button>
  </div>

  <div class="voucher-card">
    <div class="header">
      <div>
        <div class="brand">SmartStay</div>
        <div style="font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #7A7E89; margin-top: 2px;">
          Boutique Accommodation Pass
        </div>
      </div>
      <div class="badge">${safeCheckInCode}</div>
    </div>

    <div class="body">
      <div class="section-title">Property Dossier</div>
      <div class="hotel-name">${safeHotelName}</div>
      <div class="hotel-address">📍 ${safeHotelAddress}, ${safeHotelCity}</div>

      <div class="grid-2">
        <div class="info-box">
          <div class="info-label">Check-in Date</div>
          <div class="info-value">${safeCheckIn}</div>
          <div class="info-sub">From ${safeCheckInTime}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Check-out Date</div>
          <div class="info-value">${safeCheckOut}</div>
          <div class="info-sub">Until ${safeCheckOutTime} (${voucherData.dates.nights} Nights)</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="info-box">
          <div class="info-label">Signature Room</div>
          <div class="info-value">${safeRoomType}</div>
          <div class="info-sub">Room № ${safeAssignedNumbers}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Primary Guest</div>
          <div class="info-value">${safeGuestName}</div>
          <div class="info-sub">${voucherData.guest.numberOfAdults} Adults${voucherData.guest.numberOfChildren > 0 ? `, ${voucherData.guest.numberOfChildren} Children` : ""}</div>
        </div>
      </div>

      <div class="qr-banner">
        <div class="qr-text">
          <h4>Front-Desk Check-In Pass</h4>
          <p>Present token or pass to the concierge for instant key handover.</p>
        </div>
        <div class="qr-code-pill">${safeToken}</div>
      </div>

      <div class="section-title">Settlement Summary</div>
      <table class="settlement-table">
        <tr>
          <td>Status & Method</td>
          <td style="text-align: right; font-family: 'JetBrains Mono', monospace;">
            ${safeBookingStatus} (${safePaymentMethod})
          </td>
        </tr>
        ${
          safeUtr
            ? `
        <tr>
          <td>UPI Settlement Reference (UTR)</td>
          <td style="text-align: right; font-family: 'JetBrains Mono', monospace;">
            ${safeUtr}
          </td>
        </tr>`
            : ""
        }
        <tr>
          <td>Total Tariff Paid</td>
          <td style="text-align: right; font-family: 'JetBrains Mono', monospace;">
            ${safeCurrency} ${Number(voucherData.settlement.totalAmount).toLocaleString()}
          </td>
        </tr>
      </table>

      <div class="section-title">Arrival Guidelines</div>
      <ul class="policies">
        ${voucherData.policies.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}
      </ul>
    </div>

    <div class="footer">
      <span>SMARTSTAY PLATFORM • VERIFIED DOSSIER</span>
      <span>${safeBookingId}</span>
    </div>
  </div>
</body>
</html>`;
}
