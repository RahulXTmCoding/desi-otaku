const express = require('express');
const router = express.Router();
const {
  createGuestOrder,
  getGuestOrder,
  trackGuestOrder
} = require('../controllers/guestOrder');
const { verifyPayment } = require('../middleware/paymentAuth');

// Create guest order - no auth required
router.post('/create', verifyPayment, createGuestOrder);

// Get guest order by ID - requires email in query
router.get('/:orderId', getGuestOrder);

// Track guest order - requires order ID and email
router.post('/track', trackGuestOrder);

module.exports = router;
