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

// ✅ UNIFIED: Single endpoint for both guest and authenticated users
exports.createUnifiedRazorpayOrder = async (req, res) => {
  try {
    const { 
      cartItems, 
      couponCode, 
      rewardPoints, 
      currency = 'INR', 
      receipt, 
      notes, 
      customerInfo, 
      frontendAmount, 
      shippingCost 
    } = req.body;
    
    if (!cartItems || !Array.isArray(cartItems)) {
      return res.status(400).json({ error: 'Cart items are required' });
    }

    // ✅ AUTO-DETECT USER TYPE
    const isAuthenticated = !!(req.user || req.headers.authorization);
    const userType = isAuthenticated ? 'authenticated' : 'guest';
    
    console.log('🎯 UNIFIED RAZORPAY ORDER:', {
      userType,
      cartItems: cartItems.length,
      couponCode,
      rewardPoints: isAuthenticated ? rewardPoints : null,
      frontendAmount,
      hasUser: !!req.user,
      hasAuth: !!req.headers.authorization,
      customerInfo: customerInfo ? 'provided' : 'none'
    });

    // ✅ LOAD USER IF AUTHENTICATED BUT NOT ALREADY LOADED
    if (isAuthenticated && !req.user) {
      try {
        const User = require('../models/user');
        const userId = req.params.userId;
        if (userId) {
          const user = await User.findById(userId);
          if (user) {
            req.user = user;
            console.log('✅ User loaded:', user._id, 'Reward Points:', user.rewardPoints);
          }
        }
      } catch (error) {
        console.error('❌ Error loading user:', error.message);
      }
    }

    // ✅ GUEST-SPECIFIC VALIDATIONS
    if (!isAuthenticated) {
      if (!customerInfo || !customerInfo.email) {
        return res.status(400).json({ error: 'Customer email is required for guest checkout' });
      }

      // Rate limiting for guest orders
      const guestRateLimit = await checkGuestRateLimit(req.ip, customerInfo.email);
      if (!guestRateLimit.allowed) {
        return res.status(429).json({ 
          error: 'Too many orders. Please try again later.',
          retryAfter: guestRateLimit.retryAfter 
        });
      }
    }

    // ✅ UNIFIED CALCULATION - Same logic for both user types
    const serverAmount = await calculateOrderAmountSecure(
      cartItems, 
      couponCode, 
      isAuthenticated ? rewardPoints : null, // Only authenticated users can use reward points
      req.user || null
    );
    
    if (serverAmount.error) {
      return res.status(400).json({ error: serverAmount.error });
    }
    
    const finalAmount = serverAmount.total;
    
    // ✅ SECURITY: Log frontend vs backend amount comparison
    if (frontendAmount) {
      const difference = Math.abs(finalAmount - frontendAmount);
      console.log(`🔒 ${userType.toUpperCase()} Security check - Server: ₹${finalAmount}, Frontend: ₹${frontendAmount}, Diff: ₹${difference}`);
      
      if (difference > 5) {
        console.warn(`⚠️ Large difference detected for ${userType} - possible manipulation attempt or calculation mismatch`);
      }
    }

    // ✅ DYNAMIC RECEIPT AND NOTES BASED ON USER TYPE
    const dynamicReceipt = isAuthenticated 
      ? receipt || `order_${Date.now()}`
      : receipt || `guest_${Date.now()}`;

    const dynamicNotes = {
      ...notes,
      user_type: userType,
      calculated_amount: finalAmount,
      items_count: cartItems.length,
      frontend_amount: frontendAmount || null,
      security_hash: generateSecurityHash({ total: finalAmount }, req.user),
      // Authenticated user specific notes
      ...(isAuthenticated && {
        user_id: req.user?._id || 'unknown',
        reward_points_used: rewardPoints || 0
      }),
      // Guest user specific notes
      ...(!isAuthenticated && {
        customer_email: customerInfo.email,
        customer_name: customerInfo.name || 'Guest User',
        customer_phone: customerInfo.phone || '',
        guest_checkout: true,
        client_ip: req.ip
      })
    };

    const options = {
      amount: Math.round(finalAmount * 100), // Use validated amount
      currency,
      receipt: dynamicReceipt,
      notes: dynamicNotes,
      payment_capture: 1
    };

    // Get Razorpay instance
    const razorpayInstance = getRazorpayInstance();
    
    // ✅ UNIFIED MOCK MODE HANDLING
    if (!razorpayInstance) {
      console.log(`Using mock Razorpay order for ${userType} (no valid credentials)`);
      return res.json({
        success: true,
        order: {
          id: `order_${userType}_test_${Date.now()}`,
          amount: options.amount,
          currency: options.currency,
          receipt: options.receipt
        },
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
        userType // For debugging
      });
    }
    
    console.log(`Creating ${userType} Razorpay order with options:`, {
      amount: options.amount,
      currency: options.currency,
      receipt: options.receipt,
      user_type: userType
    });
    
    const order = await razorpayInstance.orders.create(options);
    
    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      },
      key_id: process.env.RAZORPAY_KEY_ID,
      userType // For debugging
    });
    
  } catch (error) {
    console.error('Unified Razorpay order creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create payment order',
      details: error.message 
    });
  }
};

// ✅ LEGACY: Keep old endpoints for backward compatibility
exports.createRazorpayOrder = async (req, res) => {
  console.log('🔄 Legacy authenticated endpoint called, redirecting to unified...');
  return exports.createUnifiedRazorpayOrder(req, res);
};

exports.createGuestRazorpayOrder = async (req, res) => {
  console.log('🔄 Legacy guest endpoint called, redirecting to unified...');
  return exports.createUnifiedRazorpayOrder(req, res);
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

// ✅ NEW: Calculate amounts endpoint for frontend to get AOV discount
exports.calculateAmount = async (req, res) => {
  try {
    const { cartItems, couponCode, rewardPoints, shippingCost } = req.body;
    
    if (!cartItems || !Array.isArray(cartItems)) {
      return res.status(400).json({ error: 'Cart items are required' });
    }

    // Use the same calculation function as payment creation
    const result = await calculateOrderAmountSecure(cartItems, couponCode, rewardPoints, req.user);
    
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    // Return detailed breakdown for frontend
    res.json({
      success: true,
      subtotal: result.subtotal,
      shippingCost: result.shippingCost,
      couponDiscount: result.couponDiscount,
      rewardDiscount: result.rewardDiscount,
      quantityDiscount: result.quantityDiscount, // ✅ AOV discount from AOVService
      total: result.total,
      validatedItems: result.validatedItems.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        size: item.size,
        price: item.price
      }))
    });
  } catch (error) {
    console.error('Calculate amount error:', error);
    res.status(500).json({ 
      error: 'Failed to calculate amount',
      details: error.message 
    });
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

// 🔒 SECURITY HELPER FUNCTIONS

// Secure server-side amount calculation
const calculateOrderAmountSecure = async (cartItems, couponCode, rewardPoints, user) => {
  try {
    const Product = require('../models/product');
    const Design = require('../models/design');
    const Coupon = require('../models/coupon');
    const AOVService = require('../services/aovService');
    
    let subtotal = 0;
    const validatedItems = [];
    
    // Validate each cart item server-side
    for (const item of cartItems) {
      let validatedItem = {
        productId: item.product || item.productId,
        name: item.name,
        quantity: parseInt(item.quantity) || 1,
        size: item.size || 'M'
      };
      
      // Validate product exists and get current price
      if (item.product && item.product !== 'custom') {
        const product = await Product.findById(item.product);
        if (!product || product.isDeleted) {
          return { error: `Product not found: ${item.name}` };
        }
        
        // Use server price, not client price
        validatedItem.price = product.price;
        validatedItem.name = product.name; // Use server name
      } else {
        // Custom product validation
        const basePrice = 549; // Base custom t-shirt price
        let designPrice = 0;
        
        if (item.customization) {
          if (item.customization.frontDesign && item.customization.frontDesign.designId) {
            const frontDesign = await Design.findById(item.customization.frontDesign.designId);
            designPrice += frontDesign ? frontDesign.price : 150;
          }
          if (item.customization.backDesign && item.customization.backDesign.designId) {
            const backDesign = await Design.findById(item.customization.backDesign.designId);
            designPrice += backDesign ? backDesign.price : 150;
          }
        } else {
          designPrice = 110; // Default design fee
        }
        
        validatedItem.price = basePrice + designPrice;
      }
      
      validatedItems.push(validatedItem);
      subtotal += validatedItem.price * validatedItem.quantity;
    }
    
    // Calculate shipping
    let shippingCost = 0;
    if (subtotal < 999) {
      shippingCost = 79;
    }
    
    // ✅ CRITICAL: Use EXACT same calculation logic as frontend
    const baseAmount = subtotal + shippingCost;
    
    // ✅ CRITICAL FIX: Use AOVService instead of hardcoded values
    const totalQuantity = validatedItems.reduce((total, item) => total + item.quantity, 0);
    
    // Calculate AOV discount using AOVService settings
    const aovResult = await AOVService.calculateQuantityDiscount(validatedItems);
    let quantityDiscount = 0;
    
    if (aovResult && aovResult.discount > 0) {
      // AOVService calculates on subtotal, but we need it on baseAmount (subtotal + shipping)
      // So calculate proportionally to match frontend behavior
      const discountPercentage = (aovResult.discount / subtotal) * 100;
      quantityDiscount = Math.floor((baseAmount * discountPercentage) / 100);
      
      console.log(`✅ AOV Quantity Discount Applied in Payment: ₹${quantityDiscount} (${aovResult.percentage}% for ${totalQuantity} items) - Using AOVService`);
    } else {
      console.log(`ℹ️ No AOV discount applicable for ${totalQuantity} items`);
    }
    
    // Apply quantity discount - EXACT frontend logic
    const afterQuantityDiscount = baseAmount - quantityDiscount;
    
    // ✅ Calculate coupon discount using EXACT coupon API logic (on subtotal only)
    let couponDiscount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true
      });
      
      if (coupon && coupon.isValid()) {
        if (subtotal >= coupon.minimumPurchase) {
          // ✅ EXACT API REPLICATION: Calculate on subtotal only (not baseAmount)
          if (coupon.discountType === 'percentage') {
            couponDiscount = Math.floor((subtotal * coupon.discountValue) / 100);
            if (coupon.maxDiscount !== null && couponDiscount > coupon.maxDiscount) {
              couponDiscount = coupon.maxDiscount;
            }
          } else {
            couponDiscount = coupon.discountValue;
          }
          
          // Ensure discount doesn't exceed subtotal
          couponDiscount = Math.min(couponDiscount, subtotal);
        }
      }
    }
    
    // Validate reward points (only for authenticated users)
    let rewardDiscount = 0;
    if (rewardPoints && user && user._id) {
      const User = require('../models/user');
      const userDoc = await User.findById(user._id);
      if (userDoc && userDoc.rewardPoints >= rewardPoints) {
        rewardDiscount = rewardPoints * 0.5; // 1 point = ₹0.5 (consistent with frontend)
      }
    }
    
    // Apply all discounts - EXACT frontend logic
    let total = afterQuantityDiscount - couponDiscount - rewardDiscount;
    
    // ✅ CRITICAL ROUNDING FIX: Use consistent rounding to match frontend exactly
    total = Math.round(total);
    
    // Ensure total is not negative
    if (total < 0) total = 0;
    
    return {
      subtotal,
      shippingCost,
      couponDiscount,
      rewardDiscount,
      quantityDiscount, // ✅ CRITICAL FIX: Return AOV discount calculated by backend
      total,
      validatedItems
    };
    
  } catch (error) {
    console.error('Secure amount calculation error:', error);
    return { error: 'Failed to calculate order amount' };
  }
};

// Generate security hash for verification
const generateSecurityHash = (amountData, user) => {
  const hashInput = [
    amountData.total,
    amountData.subtotal,
    amountData.shippingCost,
    user?._id || 'guest',
    Date.now()
  ].join('|');
  
  return crypto.createHash('sha256').update(hashInput).digest('hex').substring(0, 16);
};

// Rate limiting for guest orders
const guestRateLimitStore = new Map();

const checkGuestRateLimit = async (ip, email) => {
  const key = `${ip}:${email}`;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxAttempts = 10; // ✅ INCREASED: Max 10 orders per hour per IP+email (better for testing)
  
  const attempts = guestRateLimitStore.get(key) || [];
  
  // Remove old attempts
  const validAttempts = attempts.filter(time => now - time < windowMs);
  
  if (validAttempts.length >= maxAttempts) {
    return {
      allowed: false,
      retryAfter: Math.ceil((validAttempts[0] + windowMs - now) / 1000)
    };
  }
  
  // Add current attempt
  validAttempts.push(now);
  guestRateLimitStore.set(key, validAttempts);
  
  return { allowed: true };
};

// Export security functions for use in other modules
module.exports = {
  ...module.exports,
  calculateOrderAmountSecure,
  generateSecurityHash,
  checkGuestRateLimit
};
