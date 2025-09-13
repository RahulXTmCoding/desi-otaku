import React, { memo, useMemo, useState } from 'react';
import { CreditCard, Smartphone, AlertCircle, Shield, Loader, Phone, CheckCircle } from 'lucide-react';
import DropIn from 'braintree-web-drop-in-react';
import { API } from '../../backend';

interface PaymentSectionProps {
  paymentMethod: string;
  isTestMode: boolean;
  razorpayReady: boolean;
  paymentData: any;
  loading: boolean;
  totalAmount: number;
  onPaymentMethodChange: (method: string) => void;
  onPlaceOrder: () => void;
  showCOD?: boolean;
  codVerification?: {
    otpSent: boolean;
    otpVerified: boolean;
    otp: string;
    loading: boolean;
    verificationToken?: string;
    verifiedPhone?: string;
  };
  setCodVerification?: (verification: any) => void;
  customerPhone?: string;
}

const PaymentSection: React.FC<PaymentSectionProps> = memo(({
  paymentMethod,
  isTestMode,
  razorpayReady,
  paymentData,
  loading,
  totalAmount,
  onPaymentMethodChange,
  onPlaceOrder,
  showCOD = false,
  codVerification,
  setCodVerification,
  customerPhone
}) => {
  const paymentMethods = useMemo(() => {
    const methods = [
      {
        id: 'razorpay',
        name: 'Pay Online',
        description: 'Cards, UPI, Wallets, NetBanking - All in one',
        icon: <span className="text-sm">₹</span>,
        recommended: true,
        discount: '5% discount'
      }
      // ,
      // {
      //   id: 'card',
      //   name: 'International Cards',
      //   description: 'Visa, Mastercard, Amex (via Braintree)',
      //   icon: <CreditCard className="w-5 h-5" />,
      //   recommended: false
      // }
    ];

    if (showCOD) {
      methods.push({
        id: 'cod',
        name: 'Cash on Delivery (COD)',
        description: 'Pay when your order is delivered',
        icon: <Smartphone className="w-5 h-5" />,
        recommended: false,
        discount: undefined // Make discount optional for COD
      });
    }

    return methods;
  }, [showCOD]);

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
        codVerification={codVerification}
        setCodVerification={setCodVerification}
        customerPhone={customerPhone}
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
        <div className="flex-1">
          <p className="font-medium">{method.name}</p>
          <p className="text-xs text-gray-400">{method.description}</p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {method.discount && (
          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
            {method.discount}
          </span>
        )}
        {method.recommended && (
          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
            Recommended
          </span>
        )}
      </div>
    </label>
  );
});

// Separate component for payment forms
const PaymentForm = memo(({ paymentMethod, isTestMode, razorpayReady, paymentData, codVerification, setCodVerification, customerPhone }: any) => {
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

  if (paymentMethod === 'cod') {
    return (
      <CodVerificationForm 
        codVerification={codVerification}
        setCodVerification={setCodVerification}
        customerPhone={customerPhone}
        isTestMode={isTestMode}
      />
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

// COD Verification Form Component
const CodVerificationForm = memo(({ codVerification, setCodVerification, customerPhone, isTestMode }: any) => {
  const [bypassStatus, setBypassStatus] = useState<{ bypassEnabled: boolean; checked: boolean }>({
    bypassEnabled: false,
    checked: false
  });

  // Check bypass status on component mount
  React.useEffect(() => {
    const checkBypassStatus = async () => {
      if (bypassStatus.checked) return;
      
      try {
        const response = await fetch(`${API}/cod/bypass-status`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json' 
          }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          console.log('🔍 COD Bypass Status:', data.bypassEnabled ? 'ENABLED' : 'DISABLED');
          setBypassStatus({ bypassEnabled: data.bypassEnabled, checked: true });
          
          // If bypass is enabled, auto-verify immediately
          if (data.bypassEnabled && customerPhone && !codVerification?.otpVerified) {
            console.log('🔓 Auto-triggering bypass verification for', customerPhone);
            handleBypassVerification();
          }
        } else {
          console.warn('Failed to check bypass status:', data.error);
          setBypassStatus({ bypassEnabled: false, checked: true });
        }
      } catch (error) {
        console.error('Error checking bypass status:', error);
        setBypassStatus({ bypassEnabled: false, checked: true });
      }
    };

    if (!isTestMode) {
      checkBypassStatus();
    } else {
      setBypassStatus({ bypassEnabled: false, checked: true });
    }
  }, [customerPhone, codVerification?.otpVerified, isTestMode]);

  const handleBypassVerification = async () => {
    if (!customerPhone) {
      alert('Please enter your phone number in the address section first');
      return;
    }

    setCodVerification({ ...codVerification, loading: true });

    try {
      // Call verify-otp with bypass mode (any OTP will work)
      const response = await fetch(`${API}/cod/verify-otp`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json' 
        },
        body: JSON.stringify({ 
          phone: customerPhone,
          otp: '000000' // Dummy OTP for bypass mode
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success && data.verified) {
        setCodVerification({
          ...codVerification,
          otpSent: true,
          otpVerified: true,
          loading: false,
          verificationToken: data.verificationToken,
          verifiedPhone: customerPhone,
          bypassed: true
        });
        
        console.log('✅ COD verification bypassed successfully:', {
          token: data.verificationToken,
          phone: customerPhone,
          bypassed: true
        });
      } else {
        throw new Error(data.error || 'Bypass verification failed');
      }
    } catch (error: any) {
      console.error('Bypass verification failed:', error);
      setCodVerification({ ...codVerification, loading: false });
      alert(error.message || 'Verification failed. Please try again.');
    }
  };

  const handleSendOtp = async () => {
    if (!customerPhone) {
      alert('Please enter your phone number in the address section first');
      return;
    }

    setCodVerification({ ...codVerification, loading: true });

    try {
      if (isTestMode) {
        // Test mode - simulate OTP sending
        setTimeout(() => {
          setCodVerification({
            ...codVerification,
            otpSent: true,
            loading: false
          });
          alert('Test OTP sent: 123456');
        }, 1000);
        } else {
          // ✅ REAL MODE - Call actual backend API
          const response = await fetch(`${API}/cod/send-otp`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json' 
            },
            body: JSON.stringify({ phone: customerPhone })
          });
          
          const data = await response.json();
          
          if (response.ok && data.success) {
            setCodVerification({
              ...codVerification,
              otpSent: true,
              loading: false
            });
            
            // Show OTP in development mode
            if (data.developmentOtp) {
              alert(`Development OTP sent: ${data.developmentOtp}`);
            } else {
              alert('OTP sent to your phone number');
            }
          } else {
            throw new Error(data.error || 'Failed to send OTP');
          }
        }
    } catch (error: any) {
      console.error('Failed to send OTP:', error);
      setCodVerification({ ...codVerification, loading: false });
      alert(error.message || 'Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async () => {
    if (!codVerification.otp) {
      alert('Please enter the OTP');
      return;
    }

    setCodVerification({ ...codVerification, loading: true });

    try {
      if (isTestMode) {
        // Test mode - accept any OTP
        setTimeout(() => {
          setCodVerification({
            ...codVerification,
            otpVerified: true,
            loading: false
          });
        }, 500);
      } else {
        // ✅ REAL MODE - Call actual backend API
        const response = await fetch(`${API}/cod/verify-otp`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json' 
          },
          body: JSON.stringify({ 
            phone: customerPhone,
            otp: codVerification.otp
          })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success && data.verified) {
          // ✅ CRITICAL: Store the verification token and verified phone
          setCodVerification({
            ...codVerification,
            otpVerified: true,
            loading: false,
            verificationToken: data.verificationToken,
            verifiedPhone: customerPhone
          });
          
          console.log('✅ COD verification successful:', {
            token: data.verificationToken,
            phone: customerPhone,
            expiresIn: data.expiresIn
          });
          
          alert('Phone number verified successfully!');
        } else {
          throw new Error(data.error || 'Invalid OTP');
        }
      }
    } catch (error: any) {
      console.error('OTP verification failed:', error);
      setCodVerification({ ...codVerification, loading: false });
      alert(error.message || 'Invalid OTP. Please try again.');
    }
  };

  const handleOtpChange = (value: string) => {
    setCodVerification({
      ...codVerification,
      otp: value.replace(/\D/g, '').slice(0, 6)
    });
  };

  // Show different UI based on bypass status
  if (bypassStatus.bypassEnabled && bypassStatus.checked) {
    // BYPASS MODE: Simplified UI without OTP steps
    return (
      
      
        <div className="space-y-4">
          {!codVerification?.otpVerified ? (
            <div className="flex items-center gap-2 text-orange-400 bg-orange-500/10 border border-orange-500/50 rounded-lg p-4">
              <Shield className="w-5 h-5" />
              <div>
                <p className="font-medium">Manual verification</p>
                <p className="text-xs text-orange-300">Phone verification will be handled manually - ready to place order</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/50 rounded-lg p-4">
              <CheckCircle className="w-5 h-5" />
              <div>
                <p className="font-medium">Phone number verified!</p>
                <p className="text-xs text-green-300">You can now place your COD order</p>
              </div>
            </div>
          )}
        </div>

    );
  }

  // NORMAL MODE: Full OTP verification flow
  return (
    <div className="bg-gray-700 rounded-lg p-6">
      <div className="mb-4">
        <p className="text-sm text-gray-300 mb-2">Cash on Delivery (COD)</p>
        <p className="text-xs text-gray-400">Verify your phone number to place COD orders</p>
      </div>

      {!codVerification?.otpVerified ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Phone className="w-4 h-4" />
            <span>Phone: {customerPhone || 'Please add phone number in address section'}</span>
          </div>

          {!codVerification?.otpSent ? (
            <button
              onClick={handleSendOtp}
              disabled={!customerPhone || codVerification?.loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {codVerification?.loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4" />
                  Send OTP
                </>
              )}
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Enter OTP sent to {customerPhone}
                </label>
                <input
                  type="text"
                  value={codVerification.otp || ''}
                  onChange={(e) => handleOtpChange(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-center text-lg tracking-widest"
                  maxLength={6}
                />
                {isTestMode && (
                  <p className="text-xs text-blue-400 mt-1">Test mode: Use any 6-digit number or 123456</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleVerifyOtp}
                  disabled={!codVerification.otp || codVerification.otp.length !== 6 || codVerification.loading}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-medium disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {codVerification.loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Verify OTP
                    </>
                  )}
                </button>

                <button
                  onClick={() => setCodVerification({ otpSent: false, otpVerified: false, otp: '', loading: false })}
                  className="px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium"
                >
                  Resend
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/50 rounded-lg p-4">
          <CheckCircle className="w-5 h-5" />
          <div>
            <p className="font-medium">Phone number verified!</p>
            <p className="text-xs text-green-300">You can now place your COD order</p>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
        <p className="text-xs text-yellow-400">
          📱 COD orders require phone verification for security and delivery confirmation
        </p>
      </div>
    </div>
  );
});

PaymentSection.displayName = 'PaymentSection';
PaymentMethodOption.displayName = 'PaymentMethodOption';
PaymentForm.displayName = 'PaymentForm';
CardPaymentForm.displayName = 'CardPaymentForm';
CodVerificationForm.displayName = 'CodVerificationForm';

export default PaymentSection;
