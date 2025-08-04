const express = require('express');
const router = express.Router();
const { isSignedIn, isAuthenticated } = require('../controllers/auth');
const { getUserById } = require('../controllers/user');
const {
  createUnifiedRazorpayOrder,
  createRazorpayOrder,
  createGuestRazorpayOrder,
  verifyRazorpayPayment,
  verifyGuestRazorpayPayment,
  getRazorpayPayment,
  razorpayWebhook,
  createTestOrder,
  calculateAmount
} = require('../controllers/razorpay');

// ✅ NEW: Unified endpoint - auto-detects user type, optional authentication
router.post('/order/create', async (req, res, next) => {
  // Optional authentication - if Authorization header is present, authenticate
  if (req.headers.authorization) {
    try {
      const token = req.headers.authorization.replace('Bearer ', '');
      const jwt = require('jsonwebtoken');
      
      try {
        const decoded = jwt.verify(token, process.env.SECRET);
        req.auth = decoded;
        
        // Get user by ID from token
        const User = require('../models/user');
        const user = await User.findById(decoded._id);
        if (user) {
          req.user = user;
          console.log('✅ Unified endpoint: User authenticated:', user._id);
        }
      } catch (jwtError) {
        console.log('🔄 Unified endpoint: Invalid JWT token, proceeding as guest');
      }
    } catch (authError) {
      console.log('🔄 Unified endpoint: Auth error, proceeding as guest:', authError.message);
    }
  } else {
    console.log('🔄 Unified endpoint: No auth header, proceeding as guest');
  }
  next();
}, createUnifiedRazorpayOrder);

// ✅ LEGACY: Keep old endpoints for backward compatibility
// Create order - requires authentication
router.post('/order/create/:userId', isSignedIn, isAuthenticated, createRazorpayOrder);

// Guest order creation - no auth required
router.post('/order/guest/create', createGuestRazorpayOrder);

// ✅ NEW: Calculate amounts endpoint - optional auth for reward points validation
router.post('/calculate-amount', async (req, res, next) => {
  // Optional authentication - if Authorization header is present, authenticate
  if (req.headers.authorization) {
    try {
      const { isSignedIn, isAuthenticated } = require('../controllers/auth');
      const { getUserById } = require('../controllers/user');
      
      // Extract userId from token or set a dummy userId
      const token = req.headers.authorization.replace('Bearer ', '');
      const jwt = require('jsonwebtoken');
      
      try {
        const decoded = jwt.verify(token, process.env.SECRET);
        req.auth = decoded;
        
        // Get user by ID from token
        const User = require('../models/user');
        const user = await User.findById(decoded._id);
        if (user) {
          req.user = user;
        }
      } catch (jwtError) {
        console.log('Invalid JWT token for calculate-amount, proceeding without auth');
      }
    } catch (authError) {
      console.log('Auth error in calculate-amount, proceeding without auth:', authError.message);
    }
  }
  next();
}, calculateAmount);

// Test mode order creation - no auth required
router.post('/order/test', createTestOrder);

// Verify payment - requires authentication
router.post('/payment/verify/:userId', isSignedIn, isAuthenticated, verifyRazorpayPayment);

// Guest payment verification - no auth required
router.post('/payment/guest/verify', verifyGuestRazorpayPayment);

// Get payment details
router.get('/payment/:paymentId/:userId', isSignedIn, isAuthenticated, getRazorpayPayment);

// Webhook endpoint (no auth required)
router.post('/webhook', razorpayWebhook);

router.param('userId', getUserById);

module.exports = router;
