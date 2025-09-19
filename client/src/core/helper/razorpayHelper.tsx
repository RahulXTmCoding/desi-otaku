import { API } from '../../backend';

// Load Razorpay script dynamically
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

// Create Razorpay order
export const createRazorpayOrder = (userId: string, token: string, orderData: any) => {
  return fetch(`${API}/razorpay/order/create/${userId}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
  })
    .then(response => response.json())
    .catch(err => {
      console.log('Razorpay order creation error:', err);
      return { error: 'Failed to create payment order' };
    });
};

// Verify payment
export const verifyRazorpayPayment = (userId: string, token: string, paymentData: any) => {
  return fetch(`${API}/razorpay/payment/verify/${userId}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(paymentData)
  })
    .then(response => response.json())
    .catch(err => {
      console.log('Payment verification error:', err);
      return { error: 'Failed to verify payment' };
    });
};

// Mock Razorpay for test mode
export const mockRazorpayPayment = (amount: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        razorpay_payment_id: `mock_pay_${Date.now()}`,
        razorpay_order_id: `mock_order_${Date.now()}`,
        razorpay_signature: 'mock_signature'
      });
    }, 1500);
  });
};

// Initialize Razorpay checkout
export const initializeRazorpayCheckout = (options: any, onSuccess: Function, onError: Function) => {
  console.log('🎯 initializeRazorpayCheckout called with options:', options);
  
  // Check if Razorpay script is loaded
  if (typeof (window as any).Razorpay === 'undefined') {
    console.error('❌ Razorpay script not loaded!');
    onError({ error: 'Razorpay script not loaded. Please refresh and try again.' });
    return;
  }
  
  const {
    order_id,
    amount,
    currency,
    key_id,
    name,
    description,
    prefill,
    theme,
    modal
  } = options;

  const razorpayOptions = {
    key: key_id,
    amount: amount,
    currency: currency || 'INR',
    name: name || 'Attars',
    description: description || 'Order Payment',
    order_id: order_id,
    prefill: {
      name: prefill?.name || '',
      email: prefill?.email || '',
      contact: prefill?.phone || ''
    },
    theme: {
      color: theme?.color || '#FBBF24' // Yellow theme
    },
    modal: {
      ondismiss: () => {
        console.log('🎯 Razorpay modal dismissed by user');
        onError({ error: 'Payment cancelled by user' });
      },
      ...modal
    },
    handler: function(response: any) {
      // ✅ CRITICAL: Add debugging for payment success
      console.log('🎯🎯🎯 RAZORPAY SUCCESS HANDLER TRIGGERED 🎯🎯🎯');
      console.log('🎯 PAYMENT RESPONSE:', JSON.stringify(response, null, 2));
      console.log('🎯 About to call onSuccess callback...');
      console.log('🎯 onSuccess function type:', typeof onSuccess);
      
      try {
        console.log('🎯 Calling onSuccess now...');
        onSuccess(response);
        console.log('✅ onSuccess callback completed successfully');
      } catch (error) {
        console.error('❌ CRITICAL ERROR in onSuccess callback:', error);
        console.error('❌ Error stack:', error.stack);
        alert(`CRITICAL ERROR in success callback: ${error.message}`);
        
        // Try to force navigation as fallback
        try {
          window.location.href = '/order-confirmation-enhanced';
        } catch (navError) {
          console.error('❌ Even fallback navigation failed:', navError);
        }
      }
    }
  };

  console.log('🎯 Creating Razorpay instance with options:', razorpayOptions);

  try {
    const razorpay = new (window as any).Razorpay(razorpayOptions);
    
    razorpay.on('payment.failed', function(response: any) {
      console.log('🎯 Payment failed:', response);
      onError({
        error: response.error.description,
        code: response.error.code,
        source: response.error.source,
        step: response.error.step,
        reason: response.error.reason
      });
    });

    console.log('🎯 Opening Razorpay checkout...');
    razorpay.open();
    console.log('✅ Razorpay checkout opened successfully');
    
  } catch (error) {
    console.error('❌ Error creating/opening Razorpay:', error);
    onError({ error: `Razorpay initialization failed: ${error.message}` });
  }
};

// Payment method icons mapper
export const getPaymentMethodIcon = (method: string) => {
  const icons: { [key: string]: string } = {
    card: '💳',
    upi: '📱',
    netbanking: '🏦',
    wallet: '👛',
    emi: '💰'
  };
  return icons[method] || '💵';
};

// Format amount for display
export const formatAmount = (amount: number, currency: string = 'INR') => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  return formatter.format(amount);
};
