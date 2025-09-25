import React, { useState, useEffect } from 'react';
import { paymentService } from '../services/paymentService';

const PaymentGateway = ({ booking, onPaymentSuccess, onPaymentCancel }) => {
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
      setError('Please select a payment method');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // For pay at hotel, no payment processing needed
      if (selectedMethod === 'pay_at_hotel') {
        const response = await paymentService.createPaymentOrder(booking._id, 'pay_at_hotel');
        onPaymentSuccess(response.data);
        return;
      }

      // For online payments, create order and process payment
      const orderResponse = await paymentService.createPaymentOrder(booking._id, selectedMethod);
      
      if (selectedMethod === 'pay_at_hotel') {
        onPaymentSuccess(orderResponse.data);
        return;
      }

      // Load Razorpay SDK and process payment
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
            onPaymentSuccess(verification.data);
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
          color: '#2563eb'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
      razorpay.on('payment.failed', function (response) {
        setError(`Payment failed: ${response.error.description}`);
      });

    } catch (err) {
      setError(err.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount, currency) => {
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      minimumFractionDigits: 2
    });
    return formatter.format(amount);
  };

  if (loading && paymentMethods.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading payment methods...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Complete Your Payment</h2>
        <p className="text-gray-600 mt-2">
          Booking for {booking.hotelId?.name || 'Hotel'}
        </p>
        {paymentInfo && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-lg font-semibold text-blue-800">
              Total Amount: {formatAmount(paymentInfo.amount, paymentInfo.currency)}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Select Payment Method</h3>
        
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedMethod === method.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-300'
            }`}
            onClick={() => setSelectedMethod(method.id)}
          >
            <div className="flex items-center">
              <div className="text-2xl mr-3">{method.icon}</div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-800">{method.name}</h4>
                <p className="text-sm text-gray-600">{method.description}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 ${
                selectedMethod === method.id
                  ? 'bg-blue-500 border-blue-500'
                  : 'border-gray-400'
              }`}>
                {selectedMethod === method.id && (
                  <div className="w-3 h-3 bg-white rounded-full mx-auto mt-0.5"></div>
                )}
              </div>
            </div>
          </div>
        ))}

        {paymentMethods.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-8">
            No payment methods available for this booking.
          </div>
        )}
      </div>

      <div className="mt-6 flex space-x-4">
        <button
          onClick={onPaymentCancel}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          onClick={handlePayment}
          disabled={!selectedMethod || loading}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Processing...' : 'Proceed to Pay'}
        </button>
      </div>

      <div className="mt-4 text-center text-xs text-gray-500">
        Your payment is secure and encrypted
      </div>
    </div>
  );
};

export default PaymentGateway;