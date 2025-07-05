import React, { memo, useMemo } from 'react';
import { CreditCard, Smartphone, AlertCircle, Shield, Loader } from 'lucide-react';
import DropIn from 'braintree-web-drop-in-react';

interface PaymentSectionProps {
  paymentMethod: string;
  isTestMode: boolean;
  razorpayReady: boolean;
  paymentData: any;
  loading: boolean;
  totalAmount: number;
  onPaymentMethodChange: (method: string) => void;
  onPlaceOrder: () => void;
}

const PaymentSection: React.FC<PaymentSectionProps> = memo(({
  paymentMethod,
  isTestMode,
  razorpayReady,
  paymentData,
  loading,
  totalAmount,
  onPaymentMethodChange,
  onPlaceOrder
}) => {
  const paymentMethods = useMemo(() => [
    {
      id: 'razorpay',
      name: 'Razorpay',
      description: 'Cards, UPI, Wallets, NetBanking - All in one',
      icon: <span className="text-sm">₹</span>,
      recommended: true
    },
    {
      id: 'card',
      name: 'International Cards',
      description: 'Visa, Mastercard, Amex (via Braintree)',
      icon: <CreditCard className="w-5 h-5" />,
      recommended: false
    }
  ], []);

  return (
    <>
      <h2 className="text-xl font-bold mb-6">Payment Information</h2>
      
      {/* Payment Method Selection */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Select Payment Method</h3>
        <div className="grid gap-3">
          {paymentMethods.map((method) => (
            <PaymentMethodOption
              key={method.id}
              method={method}
              isSelected={paymentMethod === method.id}
              onChange={() => onPaymentMethodChange(method.id)}
            />
          ))}
        </div>
      </div>

      {/* Payment Form */}
      <PaymentForm
        paymentMethod={paymentMethod}
        isTestMode={isTestMode}
        razorpayReady={razorpayReady}
        paymentData={paymentData}
      />

      {/* Security Note */}
      {isTestMode && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/50 rounded-lg">
          <p className="text-sm text-blue-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Test Mode: No actual payment will be processed
          </p>
        </div>
      )}

      <button
        onClick={onPlaceOrder}
        disabled={loading}
        className="mt-6 w-full bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-600 text-gray-900 disabled:text-gray-400 py-3 rounded-lg font-bold disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Shield className="w-5 h-5" />
            Place Order • ₹{totalAmount}
          </>
        )}
      </button>
    </>
  );
});

// Separate component for payment method options
const PaymentMethodOption = memo(({ method, isSelected, onChange }: any) => {
  return (
    <label className={`flex items-center p-4 rounded-lg cursor-pointer transition-all ${
      isSelected ? 'bg-yellow-400/20 border border-yellow-400' : 'bg-gray-700 hover:bg-gray-600'
    }`}>
      <input
        type="radio"
        name="paymentMethod"
        value={method.id}
        checked={isSelected}
        onChange={onChange}
        className="mr-3"
      />
      <div className="flex items-center gap-2 flex-1">
        <div className="w-5 h-5 flex items-center justify-center">
          {method.icon}
        </div>
        <div>
          <p className="font-medium">{method.name}</p>
          <p className="text-xs text-gray-400">{method.description}</p>
        </div>
      </div>
      {method.recommended && (
        <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
          Recommended
        </span>
      )}
    </label>
  );
});

// Separate component for payment forms
const PaymentForm = memo(({ paymentMethod, isTestMode, razorpayReady, paymentData }: any) => {
  if (paymentMethod === 'razorpay') {
    return (
      <div>
        {isTestMode ? (
          <div className="bg-gray-700 rounded-lg p-6">
            <p className="text-sm text-gray-300 mb-4">Test Mode: Razorpay payment will be simulated</p>
            <div className="space-y-2">
              <p className="text-sm">✅ All payment methods available</p>
              <p className="text-sm">✅ UPI, Cards, Wallets, NetBanking</p>
              <p className="text-sm">✅ No real payment will be processed</p>
            </div>
          </div>
        ) : (
          <div className="bg-gray-700 rounded-lg p-6">
            <div className="text-center">
              <p className="text-sm text-gray-300 mb-2">Click "Place Order" to open Razorpay</p>
              <p className="text-xs text-gray-400">You'll be redirected to secure Razorpay checkout</p>
              <div className="mt-4 flex justify-center gap-4 text-xs">
                <span className="flex items-center gap-1">✅ UPI</span>
                <span className="flex items-center gap-1">✅ Cards</span>
                <span className="flex items-center gap-1">✅ NetBanking</span>
                <span className="flex items-center gap-1">✅ Wallets</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (paymentMethod === 'card') {
    return (
      <div>
        {isTestMode ? (
          <div className="bg-gray-700 rounded-lg p-6">
            <p className="text-sm text-gray-300 mb-4">Test Mode: Card payment will be simulated</p>
            <div className="space-y-2">
              <p className="text-sm">Test Card: 4111 1111 1111 1111</p>
              <p className="text-sm">Expiry: 12/25, CVV: 123</p>
            </div>
          </div>
        ) : (
          <CardPaymentForm paymentData={paymentData} />
        )}
      </div>
    );
  }

  if (paymentMethod === 'upi') {
    return (
      <div className="bg-gray-700 rounded-lg p-6">
        <p className="text-sm text-gray-300 mb-4">UPI payment will be available after placing order</p>
        <p className="text-xs text-gray-400">You'll receive a payment link via SMS/Email</p>
      </div>
    );
  }

  return null;
});

// Separate component for card payment form
const CardPaymentForm = memo(({ paymentData }: any) => {
  return (
    <>
      <div className="bg-gray-700 rounded-lg p-6">
        <div className="mb-4">
          <p className="text-sm text-gray-300 mb-2">Enter Card Details</p>
          <p className="text-xs text-gray-400">Your payment information is secure and encrypted</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Card Number</label>
            <input
              type="text"
              placeholder="4111 1111 1111 1111"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
              maxLength={19}
            />
            <p className="text-xs text-gray-500 mt-1">Use test card: 4111 1111 1111 1111</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Expiry Date</label>
              <input
                type="text"
                placeholder="12/25"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                maxLength={5}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">CVV</label>
              <input
                type="text"
                placeholder="123"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                maxLength={3}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Cardholder Name</label>
            <input
              type="text"
              placeholder="John Doe"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
            />
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/50 rounded-lg">
          <p className="text-xs text-blue-400">
            This is a sandbox environment. Use the test card details provided above.
          </p>
        </div>
      </div>
      
      {/* Original Braintree Drop-in (hidden for now) */}
      {paymentData.clientToken && (
        <div style={{ display: 'none' }}>
          <DropIn
            options={{
              authorization: paymentData.clientToken,
              paypal: {
                flow: 'vault'
              }
            }}
            onInstance={(instance) => paymentData.instance = instance}
          />
        </div>
      )}
    </>
  );
});

PaymentSection.displayName = 'PaymentSection';
PaymentMethodOption.displayName = 'PaymentMethodOption';
PaymentForm.displayName = 'PaymentForm';
CardPaymentForm.displayName = 'CardPaymentForm';

export default PaymentSection;
