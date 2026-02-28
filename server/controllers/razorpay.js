const crypto = require('crypto');
const Product = require('../models/product');
const Design = require('../models/design');
const Coupon = require('../models/coupon');
const AOVService = require('../services/aovService');
const User = require('../models/user');

// Lazy load Razorpay to ensure environment variables are loaded
let razorpay = null;

const getRazorpayInstance = () => {
  if (!razorpay && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
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

    // ✅ LOAD USER IF AUTHENTICATED BUT NOT ALREADY LOADED
    if (isAuthenticated && !req.user) {
      try {
        const userId = req.params.userId;
        if (userId) {
          const user = await User.findById(userId);
          if (user) {
            req.user = user;
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
    // Use the actual payment method from request body
    const serverAmount = await calculateOrderAmountSecure(
      cartItems, 
      couponCode, 
      isAuthenticated ? rewardPoints : null, // Only authenticated users can use reward points
      req.user || null,
      req.body.paymentMethod || 'razorpay' // ✅ CRITICAL FIX: Use actual payment method from frontend
    );
    
    if (serverAmount.error) {
      console.error('❌ Server amount calculation error:', serverAmount.error);
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


// Shared payment signature verification helper
const _verifyPaymentSignature = async (req, res, isGuest = false) => {
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

    // Create and verify HMAC sha256 signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      let payment = null;
      const razorpayInstance = getRazorpayInstance();

      if (razorpayInstance) {
        payment = await razorpayInstance.payments.fetch(razorpay_payment_id);
      } else {
        // Mock payment for test mode
        payment = {
          id: razorpay_payment_id,
          amount: 100000,
          currency: 'INR',
          status: 'captured',
          method: 'card',
          order_id: razorpay_order_id,
          created_at: Date.now(),
          ...(isGuest && { email: 'guest@example.com' })
        };
      }

      res.json({
        success: true,
        verified: true,
        payment: {
          id: payment.id,
          amount: payment.amount / 100,
          currency: payment.currency,
          status: payment.status,
          method: payment.method,
          order_id: payment.order_id,
          email: payment.email,
          contact: payment.contact,
          bank: payment.bank,
          wallet: payment.wallet,
          vpa: payment.vpa,
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
    console.error(`${isGuest ? 'Guest p' : 'P'}ayment verification error:`, error);
    res.status(500).json({ 
      error: `Failed to verify ${isGuest ? 'guest ' : ''}payment`,
      details: error.message 
    });
  }
};

// Verify payment signature
exports.verifyRazorpayPayment = (req, res) => _verifyPaymentSignature(req, res, false);

// Verify payment for guest users (no authentication required)
exports.verifyGuestRazorpayPayment = (req, res) => _verifyPaymentSignature(req, res, true);

// ✅ NEW: Create database order after successful payment verification using createUnifiedOrder
exports.createRazorpayDatabaseOrder = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
      customerInfo
    } = req.body;

    // ✅ STEP 1: Verify payment first
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        error: 'Missing payment verification details' 
      });
    }

    // Verify payment signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;
    
    if (!isAuthentic) {
      return res.status(400).json({
        error: 'Invalid payment signature - order creation blocked for security'
      });
    }

    // ✅ STEP 2: Fetch payment details for verification
    let paymentDetails = null;
    const razorpayInstance = getRazorpayInstance();
    
    if (razorpayInstance) {
      try {
        paymentDetails = await razorpayInstance.payments.fetch(razorpay_payment_id);
      } catch (fetchError) {
        console.error('❌ Failed to fetch payment details:', fetchError);
        // Continue with mock payment for development
        paymentDetails = {
          id: razorpay_payment_id,
          amount: orderData.amount * 100,
          status: 'captured',
          method: 'card'
        };
      }
    } else {
      // Mock payment for development
      paymentDetails = {
        id: razorpay_payment_id,
        amount: orderData.amount * 100,
        status: 'captured',
        method: 'card'
      };
    }

    // ✅ STEP 3: Determine user type and prepare user profile
    const isAuthenticated = !!(req.user || req.headers.authorization);
    let userProfile = null;

    if (isAuthenticated) {
      userProfile = req.user;
      // If not loaded, try to load from userId in orderData
      if (!userProfile && orderData.userId) {
        try {
          const User = require('../models/user');
          userProfile = await User.findById(orderData.userId);
        } catch (userError) {
          console.error('❌ Failed to load user:', userError);
        }
      }
    }

    // For guest orders, create a user profile-like object
    if (!isAuthenticated && customerInfo) {
      userProfile = {
        email: customerInfo.email,
        name: customerInfo.name,
        phone: customerInfo.phone
      };
    }

    // ✅ STEP 4: Prepare order data for unified creation
    const unifiedOrderData = {
      ...orderData,
      paymentMethod: 'razorpay',
      paymentStatus: paymentDetails?.status === 'captured' ? 'Paid' : 'Pending',
      transaction_id: razorpay_payment_id,
      razorpay_order_id: razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id,
      razorpay_signature: razorpay_signature,
      status: "Received"
    };

    // Add guest info if not authenticated
    if (!isAuthenticated && customerInfo) {
      unifiedOrderData.guestInfo = {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone
      };
    }

    // ✅ STEP 5: Create payment verification object
    const paymentVerification = {
      type: 'razorpay',
      payment: {
        id: razorpay_payment_id,
        status: paymentDetails?.status || 'captured',
        amount: paymentDetails?.amount,
        method: paymentDetails?.method
      },
      signature: razorpay_signature,
      order_id: razorpay_order_id
    };

    // ✅ STEP 6: Use unified order creation (same as COD flow)
    const { createUnifiedOrder } = require('./order');
    
    const result = await createUnifiedOrder(
      unifiedOrderData,
      userProfile,
      paymentVerification
    );

    if (!result.success) {
      throw new Error('Unified order creation failed');
    }

    console.log('✅ RAZORPAY ORDER CREATED VIA UNIFIED SYSTEM:', result.order._id);

    // ✅ STEP 7: Return success response
    res.json({
      success: true,
      order: result.order,
      trackingInfo: result.trackingInfo,
      message: 'Order created successfully after payment verification using unified system',
      userType: isAuthenticated ? 'authenticated' : 'guest'
    });

  } catch (error) {
    console.error('❌ Razorpay database order creation failed:', error);
    res.status(500).json({
      error: 'Failed to create order in database',
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
    const { cartItems, couponCode, rewardPoints, shippingCost, paymentMethod = 'cod' } = req.body;
    
    if (!cartItems || !Array.isArray(cartItems)) {
      return res.status(400).json({ error: 'Cart items are required' });
    }

    // ✅ CRITICAL FIX: Pass payment method to include online payment discount
    const result = await calculateOrderAmountSecure(cartItems, couponCode, rewardPoints, req.user, paymentMethod);
    
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
      onlinePaymentDiscount: result.onlinePaymentDiscount, // ✅ NEW: Online payment discount
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
const calculateOrderAmountSecure = async (cartItems, couponCode, rewardPoints, user, paymentMethod = 'cod') => {
  try {
    let subtotal = 0;
    const validatedItems = [];
    
    // Validate each cart item server-side
    for (const item of cartItems) {
      // ✅ CRITICAL FIX: Handle different product ID formats from frontend
      let productId = item.product || item.productId;
      
      // Handle case where product is an object (extract _id)
      if (typeof productId === 'object' && productId !== null) {
        productId = productId._id || productId.id || null;
      }
      
      let validatedItem = {
        productId: productId,
        name: item.name,
        quantity: parseInt(item.quantity) || parseInt(item.count) || 1,
        size: item.size || 'M'
      };
      
      // ✅ CRITICAL FIX: Use EXACT same logic as working createUnifiedOrder
      const isTemporaryId = !productId || 
                           productId === 'custom' || 
                           typeof productId === 'string' && (
                             productId.startsWith('temp_') || 
                             productId.startsWith('custom') ||
                             productId.length < 12 ||
                             !/^[0-9a-fA-F]{24}$/.test(productId)
                           );
      
      // ✅ MISSING PIECE: Check item.isCustom flag like createUnifiedOrder does!
      if (isTemporaryId || item.isCustom) {
        // Handle custom products - skip database query
      } else {
        // Validate product exists and get current price (only for real products)
        try {
          const product = await Product.findById(productId);
          if (!product || product.isDeleted) {
            return { error: `Product not found: ${item.name}` };
          }
          
          // Use server price, not client price
          validatedItem.price = product.price;
          validatedItem.name = product.name;
        } catch (dbError) {
          console.error(`Database error for product ${productId}:`, dbError.message);
        }
      }
      
      // Handle custom products, temporary products, or DB query failures
      if (isTemporaryId || !validatedItem.price) {
        const basePrice = 499; // Fixed base t-shirt price
        let designPrice = 0;
        
        if (item.customization) {
          if (item.customization.frontDesign && item.customization.frontDesign.designId) {
            const frontDesign = await Design.findById(item.customization.frontDesign.designId);
            const frontPrice = frontDesign ? frontDesign.price : 150;
            designPrice += frontPrice;
          }
          if (item.customization.backDesign && item.customization.backDesign.designId) {
            const backDesign = await Design.findById(item.customization.backDesign.designId);
            const backPrice = backDesign ? backDesign.price : 150;
            designPrice += backPrice;
          }
        } else {
          designPrice = 110; // Default design fee
        }
        
        validatedItem.price = basePrice + designPrice;
      }
      
      const itemTotal = validatedItem.price * validatedItem.quantity;
      
      validatedItems.push(validatedItem);
      subtotal += itemTotal;
    }
    
    // ✅ INDUSTRY STANDARD DISCOUNT CALCULATION
    // Apply discounts to SUBTOTAL ONLY, then add shipping at the end
    let discountedSubtotal = subtotal;
    
    const totalQuantity = validatedItems.reduce((total, item) => total + item.quantity, 0);
    
    // 1️⃣ FIRST: Apply AOV discount to subtotal
    const aovResult = await AOVService.calculateQuantityDiscount(validatedItems);
    let quantityDiscount = 0;
    
    if (aovResult && aovResult.discount > 0) {
      quantityDiscount = Math.round((discountedSubtotal * aovResult.percentage) / 100);
      discountedSubtotal = discountedSubtotal - quantityDiscount;
    }
    
    // 2️⃣ SECOND: Apply coupon discount to discounted subtotal
    let couponDiscount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true
      });
      
      if (coupon && coupon.isValid()) {
        if (subtotal >= coupon.minimumPurchase) {
          // ✅ SEQUENTIAL: Apply coupon discount to current discounted subtotal
          if (coupon.discountType === 'percentage') {
            couponDiscount = Math.floor((discountedSubtotal * coupon.discountValue) / 100);
            if (coupon.maxDiscount !== null && couponDiscount > coupon.maxDiscount) {
              couponDiscount = coupon.maxDiscount;
            }
          } else {
            // Fixed amount discount - ensure it doesn't exceed discounted subtotal
            couponDiscount = Math.min(coupon.discountValue, discountedSubtotal);
          }
          
          discountedSubtotal = discountedSubtotal - couponDiscount;
          
        } else {
          // Minimum purchase not met - couponDiscount stays 0
        }
      }
    }
    
    // 3️⃣ THIRD: Apply online payment discount to discounted subtotal
    let onlinePaymentDiscount = 0;
    if (paymentMethod === 'razorpay' || paymentMethod === 'card') {
      onlinePaymentDiscount = Math.round(discountedSubtotal * 0.05);
      discountedSubtotal = discountedSubtotal - onlinePaymentDiscount;
    }
    
    // 4️⃣ FOURTH: Apply reward points redemption (like cash payment)
    let rewardDiscount = 0;
    if (rewardPoints && user && user._id) {
      const userDoc = await User.findById(user._id);
      if (userDoc && userDoc.rewardPoints >= rewardPoints) {
        rewardDiscount = Math.min(rewardPoints * 0.5, discountedSubtotal);
        discountedSubtotal = discountedSubtotal - rewardDiscount;
      }
    }
    
    // 5️⃣ FIFTH: Add shipping charges to final discounted subtotal
    let shippingCost = 0; // Free shipping for all orders
    
    const total = Math.round(Math.max(0, discountedSubtotal + shippingCost));
    
    // Ensure total is not negative
    if (total < 0) total = 0;
    
    return {
      subtotal,
      shippingCost,
      couponDiscount,
      rewardDiscount,
      quantityDiscount, // ✅ CRITICAL FIX: Return AOV discount calculated by backend
      onlinePaymentDiscount, // ✅ NEW: Return online payment discount
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
