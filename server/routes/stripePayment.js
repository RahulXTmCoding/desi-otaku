const express = require('express');
const router = express.Router();
const { isSignedIn, isAuthenticated } = require('../controllers/auth');
const { 
  createPaymentIntent, 
  confirmPayment, 
  webhookHandler,
  getPaymentMethods 
} = require('../controllers/stripePayment');

// Get available payment methods
router.get('/payment/methods', getPaymentMethods);

// Create payment intent
router.post('/payment/create-intent', isSignedIn, isAuthenticated, createPaymentIntent);

// Confirm payment
router.post('/payment/confirm', isSignedIn, isAuthenticated, confirmPayment);

// Stripe webhook endpoint (no auth required)
router.post('/payment/webhook', express.raw({ type: 'application/json' }), webhookHandler);

module.exports = router;
