import { API } from '../../backend';

// Load Razorpay script dynamically
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    // Lazily inject preconnect/dns-prefetch only when Razorpay is actually needed.
    // Doing this here (instead of <head>) avoids an idle TCP+TLS handshake on every page.
    const injectHint = (rel: string, href: string, crossorigin?: boolean) => {
      if (document.querySelector(`link[href="${href}"]`)) return; // already added
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      if (crossorigin) link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    };
    injectHint('preconnect', 'https://checkout.razorpay.com', true);
    injectHint('dns-prefetch', 'https://checkout.razorpay.com');
    injectHint('dns-prefetch', 'https://api.razorpay.com');

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
        onError({ error: 'Payment cancelled by user' });
      },
      ...modal
    },
    handler: function(response: any) {
      // ✅ CRITICAL: Add debugging for payment success
      
      try {
        onSuccess(response);
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


  try {
    const razorpay = new (window as any).Razorpay(razorpayOptions);
    
    razorpay.on('payment.failed', function(response: any) {
      onError({
        error: response.error.description,
        code: response.error.code,
        source: response.error.source,
        step: response.error.step,
        reason: response.error.reason
      });
    });

    razorpay.open();
    
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
