const express = require('express');
const router = express.Router();
const { isSignedIn, isAuthenticated } = require('../controllers/auth');
const { getUserById } = require('../controllers/user');
const {
  createRazorpayOrder,
  createGuestRazorpayOrder,
  verifyRazorpayPayment,
  verifyGuestRazorpayPayment,
  getRazorpayPayment,
  razorpayWebhook,
  createTestOrder,
  calculateAmount
} = require('../controllers/razorpay');

// Create order - requires authentication
router.post('/order/create/:userId', isSignedIn, isAuthenticated, createRazorpayOrder);

// Guest order creation - no auth required
router.post('/order/guest/create', createGuestRazorpayOrder);

// ✅ NEW: Calculate amounts endpoint - no auth required for public access
router.post('/calculate-amount', calculateAmount);

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
