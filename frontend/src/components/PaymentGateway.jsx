import React, { useState, useEffect, useCallback } from "react";
import { paymentService } from "../services/paymentService";
import { generateQRCodePath } from "../utils/qrCode";
import {
  ShieldCheck,
  AlertCircle,
  Check,
  QrCode,
  Smartphone,
  Copy,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Building2,
  Landmark,
} from "lucide-react";

const PaymentGateway = ({ booking, onSuccess, onCancel }) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState("upi");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [paymentInfo, setPaymentInfo] = useState(null);

  // YouPI-PG session state
  const [youpiSession, setYoupiSession] = useState(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes

  const fetchPaymentMethods = useCallback(async () => {
    try {
      setLoading(true);
      const response = await paymentService.getPaymentMethods(booking?._id);
      const methods = response.data.methods || [];
      setPaymentMethods(methods);

      const defaultMethod = methods.find((m) => m.isDefault) || methods[0];
      if (defaultMethod) {
        setSelectedMethod(defaultMethod.id);
      }

      setPaymentInfo({
        currency: response.data.currency || "INR",
        amount: response.data.amount,
        upiId: response.data.upiId,
        merchantName: response.data.merchantName,
      });
    } catch (err) {
      setError(err.message || "Failed to fetch payment channels");
    } finally {
      setLoading(false);
    }
  }, [booking?._id]);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  // Expiration timer for active UPI checkout session
  useEffect(() => {
    if (!youpiSession) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [youpiSession]);

  const handleInitiatePayment = async () => {
    if (!selectedMethod) {
      setError("Please select a settlement option");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Pay at hotel / Cash on delivery
      if (selectedMethod === "pay_at_hotel") {
        const response = await paymentService.createPaymentOrder(
          booking._id,
          "pay_at_hotel",
        );
        if (onSuccess) {
          onSuccess(response.data);
        }
        return;
      }

      // Online payment via YouPI-PG Open-Source Gateway
      const orderResponse = await paymentService.createPaymentOrder(
        booking._id,
        selectedMethod,
      );
      const sessionData = orderResponse.data;

      setYoupiSession(sessionData);
      setTimeRemaining(600); // Reset 10-minute window
    } catch (err) {
      setError(err.message || "Payment initiation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyUTR = async (e) => {
    if (e) e.preventDefault();
    if (!utrNumber || utrNumber.trim().length < 6) {
      setError("Please enter a valid 12-digit UPI Reference Number (UTR)");
      return;
    }

    try {
      setVerifying(true);
      setError("");

      const verification = await paymentService.verifyPayment({
        bookingId: booking._id,
        orderId: youpiSession.orderId,
        paymentId: youpiSession.paymentId,
        utr: utrNumber.trim(),
      });

      if (onSuccess) {
        onSuccess(verification.data);
      }
    } catch (err) {
      setError(
        err.message || "Payment verification failed. Please check your UTR.",
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleCopyUPI = (upiId) => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const formatAmount = (amount) => {
    return `₹${amount ? Math.round(amount).toLocaleString("en-IN") : 0}`;
  };

  // Render QR Code SVG vector
  const qrData = youpiSession
    ? generateQRCodePath(youpiSession.upiString)
    : null;

  if (loading && paymentMethods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-900 border-t-transparent"></div>
        <span className="text-xs font-mono text-ink-muted">
          Connecting payment channels...
        </span>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ACTIVE YOUPI-PG UPI SETTLEMENT VIEW
  // -------------------------------------------------------------
  if (youpiSession) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <button
            type="button"
            onClick={() => setYoupiSession(null)}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-ink-muted hover:text-ink-primary transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Change payment method</span>
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-tag bg-stone-100 text-[11px] font-mono text-ink-secondary">
            <Clock size={12} className="text-terracotta" />
            <span className="tabular-nums font-semibold">
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-tag bg-amber-50 text-amber-800 border border-amber-200/60 text-[10px] font-mono mb-2">
            <span>YOUPI-PG OPEN-SOURCE GATEWAY • 0% FEE</span>
          </div>
          <h2 className="font-serif text-2xl text-ink-primary font-normal">
            Scan & Pay with any UPI app
          </h2>
          <p className="text-xs text-ink-muted mt-1">
            Google Pay, PhonePe, Paytm, BHIM, CRED or your mobile banking app
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-control bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-6 bg-stone-50 rounded-card border border-stone-200/80 max-w-sm mx-auto shadow-subtle">
          <div className="w-56 h-56 bg-white p-3 rounded-card border border-stone-200 shadow-sm flex items-center justify-center">
            {qrData && qrData.path ? (
              <svg
                viewBox={`-2 -2 ${qrData.count + 4} ${qrData.count + 4}`}
                className="w-full h-full"
                shapeRendering="crispEdges"
              >
                <path d={qrData.path} fill="#14171F" />
              </svg>
            ) : (
              <div className="text-xs font-mono text-ink-muted flex flex-col items-center gap-2">
                <QrCode size={36} className="text-ink-muted" />
                <span>Generating dynamic QR...</span>
              </div>
            )}
          </div>

          {/* Amount Badge */}
          <div className="mt-4 text-center">
            <span className="text-[11px] font-mono text-ink-muted block uppercase">
              Payable Total
            </span>
            <span className="text-2xl font-serif font-medium text-ink-primary tabular-nums">
              {formatAmount(
                youpiSession.amountInRupees || youpiSession.amount / 100,
              )}
            </span>
          </div>

          {/* UPI ID Row */}
          <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-control bg-white border border-stone-200 text-xs font-mono">
            <span className="text-ink-muted">UPI VPA:</span>
            <span className="font-semibold text-ink-primary">
              {youpiSession.upiId}
            </span>
            <button
              type="button"
              onClick={() => handleCopyUPI(youpiSession.upiId)}
              className="ml-1 p-1 hover:bg-stone-100 rounded text-ink-secondary transition-colors"
              title="Copy UPI ID"
            >
              {copied ? (
                <Check size={12} className="text-emerald-600" />
              ) : (
                <Copy size={12} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile App Deep Links */}
        <div className="space-y-2 max-w-sm mx-auto">
          <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted block text-center">
            Or launch UPI app directly
          </span>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={youpiSession.deepLinks?.gpay || youpiSession.upiString}
              className="p-2.5 rounded-control border border-stone-200 hover:border-stone-900 bg-white hover:bg-stone-50 transition-colors text-center text-xs font-mono text-ink-primary flex items-center justify-center gap-1.5"
            >
              <Smartphone size={13} className="text-blue-600" />
              <span>Google Pay</span>
            </a>
            <a
              href={youpiSession.deepLinks?.phonepe || youpiSession.upiString}
              className="p-2.5 rounded-control border border-stone-200 hover:border-stone-900 bg-white hover:bg-stone-50 transition-colors text-center text-xs font-mono text-ink-primary flex items-center justify-center gap-1.5"
            >
              <Smartphone size={13} className="text-purple-600" />
              <span>PhonePe</span>
            </a>
            <a
              href={youpiSession.deepLinks?.paytm || youpiSession.upiString}
              className="p-2.5 rounded-control border border-stone-200 hover:border-stone-900 bg-white hover:bg-stone-50 transition-colors text-center text-xs font-mono text-ink-primary flex items-center justify-center gap-1.5"
            >
              <Smartphone size={13} className="text-sky-600" />
              <span>Paytm</span>
            </a>
            <a
              href={youpiSession.deepLinks?.bhim || youpiSession.upiString}
              className="p-2.5 rounded-control border border-stone-200 hover:border-stone-900 bg-white hover:bg-stone-50 transition-colors text-center text-xs font-mono text-ink-primary flex items-center justify-center gap-1.5"
            >
              <Smartphone size={13} className="text-emerald-600" />
              <span>BHIM / CRED</span>
            </a>
          </div>
        </div>

        {/* UTR Verification Input */}
        <form
          onSubmit={handleVerifyUTR}
          className="p-4 rounded-card bg-stone-50 border border-stone-200 max-w-sm mx-auto space-y-3"
        >
          <div>
            <label className="block text-xs font-medium text-ink-primary mb-1">
              Confirm with 12-digit UPI Reference (UTR)
            </label>
            <p className="text-[11px] text-ink-muted mb-2">
              Found under transaction details in your UPI app after completing
              payment.
            </p>
            <input
              type="text"
              placeholder="e.g. 431289104523"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              className="input-base text-sm font-mono tracking-wider"
              maxLength={16}
            />
          </div>

          <button
            type="submit"
            disabled={verifying || !utrNumber.trim()}
            className="btn-primary w-full !text-xs !py-2.5 font-mono uppercase tracking-wider flex items-center justify-center gap-2"
          >
            {verifying ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                <span>Verifying payment...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                <span>Verify & confirm reservation</span>
              </>
            )}
          </button>
        </form>

        {/* Hosted portal link */}
        {youpiSession.checkoutUrl && (
          <div className="text-center pt-1">
            <a
              href={youpiSession.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-mono text-ink-muted hover:text-ink-primary transition-colors underline underline-offset-2"
            >
              <span>Open in YouPI Hosted Checkout Portal</span>
              <ExternalLink size={11} />
            </a>
          </div>
        )}

        <div className="text-center text-[11px] font-mono text-ink-muted flex items-center justify-center gap-1.5 pt-1">
          <ShieldCheck size={13} className="text-ink-secondary" />
          <span>Self-hosted open-source YouPI ledger verification</span>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // METHOD SELECTION VIEW
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      <div className="text-center pb-4 border-b border-stone-100">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-tag bg-stone-100 text-[11px] font-mono text-ink-secondary mb-2">
          <span>SECURE SETTLEMENT</span>
        </div>
        <h2 className="font-serif text-2xl text-ink-primary font-normal">
          Complete reservation payment
        </h2>
        <p className="text-xs text-ink-muted mt-1">
          Stay at {booking.hotelId?.name || "Hotel Property"}
        </p>

        {paymentInfo && (
          <div className="mt-4 p-3 bg-stone-50 rounded-control border border-stone-200/60 inline-block">
            <span className="text-xs font-mono text-ink-muted block uppercase">
              Amount to settle
            </span>
            <span className="text-2xl font-serif font-medium text-ink-primary tabular-nums">
              {formatAmount(paymentInfo.amount)}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-control bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2.5">
        <h3 className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-2">
          Select settlement method
        </h3>

        {paymentMethods.map((method) => {
          const isSelected = selectedMethod === method.id;
          return (
            <div
              key={method.id}
              className={`p-3.5 rounded-control border cursor-pointer transition-colors ${
                isSelected
                  ? "border-stone-900 bg-stone-50/80 shadow-subtle"
                  : "border-stone-200 hover:border-stone-300"
              }`}
              onClick={() => setSelectedMethod(method.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-control bg-stone-100 flex items-center justify-center text-ink-primary">
                    {method.id === "upi" ? (
                      <QrCode size={16} />
                    ) : method.id === "pay_at_hotel" ? (
                      <Building2 size={16} />
                    ) : (
                      <Landmark size={16} />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-ink-primary">
                      {method.name}
                    </h4>
                    <p className="text-[11px] text-ink-muted mt-0.5">
                      {method.description}
                    </p>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isSelected
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-300"
                  }`}
                >
                  {isSelected && <Check size={10} />}
                </div>
              </div>
            </div>
          );
        })}

        {paymentMethods.length === 0 && !loading && (
          <div className="text-center text-xs font-mono text-ink-muted py-6">
            No active payment gateways configured for this reservation.
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-stone-100 flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1 !text-xs !py-2.5"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleInitiatePayment}
          disabled={!selectedMethod || loading}
          className="btn-primary flex-1 !text-xs !py-2.5 font-mono uppercase tracking-wider"
        >
          {loading
            ? "Processing..."
            : selectedMethod === "pay_at_hotel"
              ? "Reserve & Pay at Property"
              : "Proceed to UPI Checkout"}
        </button>
      </div>

      <div className="text-center text-[11px] font-mono text-ink-muted flex items-center justify-center gap-1.5 pt-1">
        <ShieldCheck size={13} className="text-ink-secondary" />
        <span>YouPI-PG Open-Source Sovereign Settlement</span>
      </div>
    </div>
  );
};

export default PaymentGateway;
