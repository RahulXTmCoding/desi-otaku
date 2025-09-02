import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, Package, Home } from 'lucide-react';

const CheckoutFallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [orderData, setOrderData] = useState<any>(null);

  const orderId = searchParams.get('order_id');
  const paymentStatus = searchParams.get('payment_status');
  const shiprocketOrderId = searchParams.get('shiprocket_order_id');

  useEffect(() => {
    // Simulate checking order status
    // In a real implementation, you might call your backend to verify the order
    setTimeout(() => {
      if (paymentStatus === 'success' || paymentStatus === 'completed') {
        setStatus('success');
        setOrderData({
          orderId: orderId || shiprocketOrderId,
          message: 'Your order has been placed successfully!'
        });
      } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
        setStatus('failed');
      } else {
        // Default to success if we have an order ID
        setStatus(orderId || shiprocketOrderId ? 'success' : 'failed');
        if (orderId || shiprocketOrderId) {
          setOrderData({
            orderId: orderId || shiprocketOrderId,
            message: 'Thank you for your order! You will receive a confirmation email shortly.'
          });
        }
      }
    }, 2000);
  }, [orderId, paymentStatus, shiprocketOrderId]);

  const LoadingView = () => (
    <div className="text-center">
      <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6">
        <Loader className="w-8 h-8 text-gray-900 animate-spin" />
      </div>
      <h1 className="text-2xl font-bold mb-4">Processing Your Order</h1>
      <p className="text-gray-400 mb-6">Please wait while we confirm your payment...</p>
      <div className="flex justify-center">
        <div className="animate-pulse flex space-x-2">
          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
        </div>
      </div>
    </div>
  );

  const SuccessView = () => (
    <div className="text-center">
      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-3xl font-bold mb-4 text-green-400">Order Confirmed!</h1>
      <p className="text-gray-300 mb-6">
        {orderData?.message || 'Your order has been placed successfully.'}
      </p>
      {orderData?.orderId && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-400 mb-2">Order ID</p>
          <p className="font-mono text-yellow-400 text-lg">{orderData.orderId}</p>
        </div>
      )}
      <div className="space-y-3">
        <p className="text-sm text-gray-400">
          📧 Confirmation email sent to your email address
        </p>
        <p className="text-sm text-gray-400">
          📱 SMS updates will be sent to your phone number
        </p>
        <p className="text-sm text-gray-400">
          🚚 You can track your order from your dashboard
        </p>
      </div>
    </div>
  );

  const FailedView = () => (
    <div className="text-center">
      <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <XCircle className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-3xl font-bold mb-4 text-red-400">Payment Failed</h1>
      <p className="text-gray-300 mb-6">
        Your payment could not be processed. Please try again.
      </p>
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-400">
          Don't worry! Your cart items are still saved. You can try placing the order again.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-gray-800 rounded-2xl p-8">
          {status === 'loading' && <LoadingView />}
          {status === 'success' && <SuccessView />}
          {status === 'failed' && <FailedView />}

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            {status === 'success' && (
              <>
                <button
                  onClick={() => navigate('/user/dashboard')}
                  className="flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  <Package className="w-5 h-5" />
                  Track Order
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  <Home className="w-5 h-5" />
                  Continue Shopping
                </button>
              </>
            )}
            
            {status === 'failed' && (
              <>
                <button
                  onClick={() => navigate('/cart')}
                  className="flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  <Home className="w-5 h-5" />
                  Back to Home
                </button>
              </>
            )}
          </div>

          {/* Help Section */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-center text-sm text-gray-400">
              Need help? Contact us at{' '}
              <a href="mailto:support@attars.club" className="text-yellow-400 hover:text-yellow-300">
                support@attars.club
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutFallback;
