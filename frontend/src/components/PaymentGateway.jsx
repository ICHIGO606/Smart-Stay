import React, { useState, useEffect } from 'react';
import { paymentService } from '../services/paymentService';
import { ShieldCheck, AlertCircle, Check } from 'lucide-react';

const PaymentGateway = ({ booking, onSuccess, onCancel }) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentInfo, setPaymentInfo] = useState(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, [booking]);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getPaymentMethods(booking._id);
      setPaymentMethods(response.data.methods);
      setPaymentInfo({
        currency: response.data.currency,
        amount: response.data.amount
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError('Please select a payment option');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (selectedMethod === 'pay_at_hotel') {
        try {
          const response = await paymentService.createPaymentOrder(booking._id, 'pay_at_hotel');
          if (onSuccess) {
            onSuccess(response.data);
          } else {
            setError('Payment completed but navigation failed. Please check your bookings.');
          }
        } catch (err) {
          setError(err.message || 'Failed to process on-site settlement');
        }
        return;
      }

      const orderResponse = await paymentService.createPaymentOrder(booking._id, selectedMethod);
      await paymentService.loadRazorpayScript();

      const options = {
        key: orderResponse.data.key,
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        name: 'SmartStay Hotel Booking',
        description: `Booking for ${booking.hotelId?.name || 'Hotel'}`, 
        order_id: orderResponse.data.orderId,
        handler: async function (response) {
          try {
            const verification = await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            onSuccess(verification.data);
          } catch (err) {
            setError('Payment verification failed: ' + err.message);
          }
        },
        prefill: {
          name: booking.user?.fullName || '',
          email: booking.user?.email || '',
          contact: booking.user?.phone || ''
        },
        theme: {
          color: '#14171F'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
      razorpay.on('payment.failed', function (response) {
        setError(`Payment settlement failed: ${response.error.description}`);
      });

    } catch (err) {
      setError(err.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return `$${amount ? Math.round(amount).toLocaleString() : 0}`;
  };

  if (loading && paymentMethods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-900 border-t-transparent"></div>
        <span className="text-xs font-mono text-ink-muted">Connecting payment channels...</span>
      </div>
    );
  }

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
          Stay at {booking.hotelId?.name || 'Hotel Property'}
        </p>

        {paymentInfo && (
          <div className="mt-4 p-3 bg-stone-50 rounded-control border border-stone-200/60 inline-block">
            <span className="text-xs font-mono text-ink-muted block uppercase">Amount to settle</span>
            <span className="text-2xl font-semibold text-ink-primary tabular-nums">
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
                  ? 'border-stone-900 bg-stone-50/80 shadow-subtle'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
              onClick={() => setSelectedMethod(method.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-medium text-ink-primary">{method.name}</h4>
                  <p className="text-[11px] text-ink-muted mt-0.5">{method.description}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  isSelected ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300'
                }`}>
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
          onClick={onCancel}
          className="btn-secondary flex-1 !text-xs !py-2.5"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          onClick={handlePayment}
          disabled={!selectedMethod || loading}
          className="btn-primary flex-1 !text-xs !py-2.5 font-mono uppercase tracking-wider"
        >
          {loading ? 'Processing...' : 'Confirm settlement'}
        </button>
      </div>

      <div className="text-center text-[11px] font-mono text-ink-muted flex items-center justify-center gap-1.5 pt-1">
        <ShieldCheck size={13} className="text-ink-secondary" />
        <span>256-bit encrypted ledger verification</span>
      </div>
    </div>
  );
};

export default PaymentGateway;
