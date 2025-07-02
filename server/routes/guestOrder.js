const express = require('express');
const router = express.Router();
const {
  createGuestOrder,
  getGuestOrder,
  trackGuestOrder
} = require('../controllers/guestOrder');

// Create guest order - no auth required
router.post('/create', createGuestOrder);

// Get guest order by ID - requires email in query
router.get('/:orderId', getGuestOrder);

// Track guest order - requires order ID and email
router.post('/track', trackGuestOrder);

module.exports = router;
