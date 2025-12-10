const express = require('express');
const router = express.Router();
const { submitReturnExchangeRequest, getReturnPolicy } = require('../controllers/returnExchange');
const { isSignedIn } = require('../controllers/auth'); // Optional: for logged-in users

/**
 * @route   POST /api/return-exchange/submit
 * @desc    Submit a return or exchange request
 * @access  Public (both logged-in and guest users)
 */
router.post('/submit', submitReturnExchangeRequest);

/**
 * @route   GET /api/return-exchange/policy
 * @desc    Get return/exchange policy information
 * @access  Public
 */
router.get('/policy', getReturnPolicy);

module.exports = router;
