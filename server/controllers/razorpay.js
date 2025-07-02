const crypto = require('crypto');

// Lazy load Razorpay to ensure environment variables are loaded
let razorpay = null;

const getRazorpayInstance = () => {
  if (!razorpay && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    console.log('Initializing Razorpay with:', {
      key_id: process.env.RAZORPAY_KEY_ID,
      has_secret: !!process.env.RAZORPAY_KEY_SECRET
    });
    
    const Razorpay = require('razorpay');
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  return razorpay;
};

// Create order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || {},
      payment_capture: 1 // Auto capture payment
    };

    // Get Razorpay instance
    const razorpayInstance = getRazorpayInstance();
    
    // In test mode or if Razorpay not configured, return mock order
    if (!razorpayInstance) {
      console.log('Using mock Razorpay order (no valid credentials)');
      return res.json({
        success: true,
        order: {
          id: `order_test_${Date.now()}`,
          amount: options.amount,
          currency: options.currency,
          receipt: options.receipt
        },
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy'
      });
    }
    
    console.log('Creating Razorpay order with options:', options);
    const order = await razorpayInstance.orders.create(options);
    
    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      },
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy'
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create payment order',
      details: error.message 
    });
  }
};

// Create order for guest users (no authentication required)
exports.createGuestRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes, customerInfo } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    if (!customerInfo || !customerInfo.email) {
      return res.status(400).json({ error: 'Customer email is required for guest checkout' });
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency,
      receipt: receipt || `guest_${Date.now()}`,
      notes: {
        ...notes,
        customer_email: customerInfo.email,
        customer_name: customerInfo.name || 'Guest User',
        customer_phone: customerInfo.phone || '',
        guest_checkout: true
      },
      payment_capture: 1 // Auto capture payment
    };

    // Get Razorpay instance
    const razorpayInstance = getRazorpayInstance();
    
    // In test mode or if Razorpay not configured, return mock order
    if (!razorpayInstance) {
      console.log('Using mock Razorpay order for guest (no valid credentials)');
      return res.json({
        success: true,
        order: {
          id: `order_guest_test_${Date.now()}`,
          amount: options.amount,
          currency: options.currency,
          receipt: options.receipt
        },
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy'
      });
    }
    
    console.log('Creating guest Razorpay order with options:', options);
    const order = await razorpayInstance.orders.create(options);
    
    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      },
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Guest Razorpay order creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create guest payment order',
      details: error.message 
    });
  }
};

// Verify payment signature
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        error: 'Missing payment verification details' 
      });
    }

    console.log('Verifying payment:', {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      has_signature: !!razorpay_signature,
      secret_available: !!process.env.RAZORPAY_KEY_SECRET
    });

    // Create signature hash
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;
    
    console.log('Signature verification:', {
      isAuthentic,
      expected: expectedSignature.substring(0, 10) + '...',
      received: razorpay_signature.substring(0, 10) + '...'
    });

    if (isAuthentic) {
      // Fetch payment details if Razorpay is configured
      let payment = null;
      const razorpayInstance = getRazorpayInstance();
      
      if (razorpayInstance) {
        payment = await razorpayInstance.payments.fetch(razorpay_payment_id);
      } else {
        // Mock payment for test mode
        payment = {
          id: razorpay_payment_id,
          amount: 100000, // Default test amount
          currency: 'INR',
          status: 'captured',
          method: 'card',
          order_id: razorpay_order_id,
          created_at: Date.now()
        };
      }
      
      res.json({
        success: true,
        verified: true,
        payment: {
          id: payment.id,
          amount: payment.amount / 100, // Convert back to rupees
          currency: payment.currency,
          status: payment.status,
          method: payment.method,
          order_id: payment.order_id,
          email: payment.email,
          contact: payment.contact,
          bank: payment.bank,
          wallet: payment.wallet,
          vpa: payment.vpa, // UPI ID if UPI payment
          card_id: payment.card_id,
          international: payment.international,
          created_at: payment.created_at
        }
      });
    } else {
      res.status(400).json({
        success: false,
        verified: false,
        error: 'Invalid payment signature'
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      error: 'Failed to verify payment',
      details: error.message 
    });
  }
};

// Verify payment for guest users (no authentication required)
exports.verifyGuestRazorpayPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        error: 'Missing payment verification details' 
      });
    }

    console.log('Verifying guest payment:', {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      has_signature: !!razorpay_signature
    });

    // Create signature hash
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;
    
    if (isAuthentic) {
      // Fetch payment details if Razorpay is configured
      let payment = null;
      const razorpayInstance = getRazorpayInstance();
      
      if (razorpayInstance) {
        payment = await razorpayInstance.payments.fetch(razorpay_payment_id);
      } else {
        // Mock payment for test mode
        payment = {
          id: razorpay_payment_id,
          amount: 100000, // Default test amount
          currency: 'INR',
          status: 'captured',
          method: 'card',
          order_id: razorpay_order_id,
          created_at: Date.now(),
          email: 'guest@example.com'
        };
      }
      
      res.json({
        success: true,
        verified: true,
        payment: {
          id: payment.id,
          amount: payment.amount / 100, // Convert back to rupees
          currency: payment.currency,
          status: payment.status,
          method: payment.method,
          order_id: payment.order_id,
          email: payment.email,
          contact: payment.contact,
          created_at: payment.created_at
        }
      });
    } else {
      res.status(400).json({
        success: false,
        verified: false,
        error: 'Invalid payment signature'
      });
    }
  } catch (error) {
    console.error('Guest payment verification error:', error);
    res.status(500).json({ 
      error: 'Failed to verify guest payment',
      details: error.message 
    });
  }
};

// Get payment details
exports.getRazorpayPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    // Get Razorpay instance
    const razorpayInstance = getRazorpayInstance();
    
    // Mock payment if Razorpay not configured
    if (!razorpayInstance) {
      return res.json({
        success: true,
        payment: {
          id: paymentId,
          amount: 1000,
          currency: 'INR',
          status: 'captured',
          method: 'card',
          captured: true,
          created_at: Date.now()
        }
      });
    }
    
    const payment = await razorpayInstance.payments.fetch(paymentId);
    
    res.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        captured: payment.captured,
        description: payment.description,
        bank: payment.bank,
        wallet: payment.wallet,
        vpa: payment.vpa,
        email: payment.email,
        contact: payment.contact,
        fee: payment.fee ? payment.fee / 100 : null,
        tax: payment.tax ? payment.tax / 100 : null,
        created_at: payment.created_at
      }
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payment details',
      details: error.message 
    });
  }
};

// Webhook handler for payment events
exports.razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (webhookSecret) {
      // Verify webhook signature
      const shasum = crypto.createHmac('sha256', webhookSecret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest('hex');
      
      if (digest !== req.headers['x-razorpay-signature']) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }
    
    const { event, payload } = req.body;
    
    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        console.log('Payment captured:', payload.payment.entity.id);
        // Update order status in database
        break;
        
      case 'payment.failed':
        console.log('Payment failed:', payload.payment.entity.id);
        // Handle failed payment
        break;
        
      case 'order.paid':
        console.log('Order paid:', payload.order.entity.id);
        // Mark order as paid
        break;
        
      default:
        console.log('Unhandled webhook event:', event);
    }
    
    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Test mode simulation
exports.createTestOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    
    // Simulate Razorpay order
    const testOrder = {
      id: `order_test_${Date.now()}`,
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `receipt_test_${Date.now()}`,
      status: 'created',
      attempts: 0,
      notes: {},
      created_at: Math.floor(Date.now() / 1000)
    };
    
    res.json({
      success: true,
      order: testOrder,
      key_id: 'rzp_test_dummy'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create test order' });
  }
};
