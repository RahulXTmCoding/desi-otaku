const express = require('express');
const router = express.Router();

const { isSignedIn, isAdmin } = require('../controllers/auth');
const {
  getQuantityDiscountTiers,
  getLoyaltyMultiplierTiers,
  getCartIncentives,
  calculateQuantityDiscount,
  calculateShippingProgress,
  calculateLoyaltyMultiplier,
  updateQuantityDiscounts,
  updateFreeShipping,
  updateLoyaltyMultipliers
} = require('../controllers/aov');

// Public routes - get AOV data
router.get('/quantity-discounts', getQuantityDiscountTiers);
router.get('/loyalty-multipliers', getLoyaltyMultiplierTiers);

// Calculate AOV incentives
router.post('/cart-incentives', getCartIncentives);
router.post('/quantity-discount', calculateQuantityDiscount);
router.post('/shipping-progress', calculateShippingProgress);
router.post('/loyalty-multiplier', calculateLoyaltyMultiplier);

// Admin routes - update AOV settings
router.put('/admin/quantity-discounts', isSignedIn, isAdmin, updateQuantityDiscounts);
router.put('/admin/free-shipping', isSignedIn, isAdmin, updateFreeShipping);
router.put('/admin/loyalty-multipliers', isSignedIn, isAdmin, updateLoyaltyMultipliers);

module.exports = router;
