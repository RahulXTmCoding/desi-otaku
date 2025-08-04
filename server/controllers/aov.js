const AOVService = require('../services/aovService');

// Get quantity discount tiers
exports.getQuantityDiscountTiers = async (req, res) => {
  try {
    const tiers = await AOVService.getQuantityDiscountTiers();
    res.json({
      success: true,
      tiers
    });
  } catch (error) {
    console.error('Get quantity discount tiers error:', error);
    res.status(500).json({
      error: 'Failed to get quantity discount tiers',
      details: error.message
    });
  }
};

// Get loyalty multiplier tiers
exports.getLoyaltyMultiplierTiers = async (req, res) => {
  try {
    const tiers = await AOVService.getLoyaltyMultiplierTiers();
    res.json({
      success: true,
      tiers
    });
  } catch (error) {
    console.error('Get loyalty multiplier tiers error:', error);
    res.status(500).json({
      error: 'Failed to get loyalty multiplier tiers',
      details: error.message
    });
  }
};

// Calculate cart incentives
exports.getCartIncentives = async (req, res) => {
  try {
    const { cartItems, cartTotal } = req.body;
    
    if (!cartItems || !Array.isArray(cartItems)) {
      return res.status(400).json({
        error: 'cartItems is required and must be an array'
      });
    }
    
    if (typeof cartTotal !== 'number') {
      return res.status(400).json({
        error: 'cartTotal is required and must be a number'
      });
    }
    
    const incentives = await AOVService.getCartIncentives(cartItems, cartTotal);
    
    res.json({
      success: true,
      incentives
    });
  } catch (error) {
    console.error('Get cart incentives error:', error);
    res.status(500).json({
      error: 'Failed to calculate cart incentives',
      details: error.message
    });
  }
};

// Calculate quantity discount for specific items
exports.calculateQuantityDiscount = async (req, res) => {
  try {
    const { cartItems } = req.body;
    
    if (!cartItems || !Array.isArray(cartItems)) {
      return res.status(400).json({
        error: 'cartItems is required and must be an array'
      });
    }
    
    const discount = await AOVService.calculateQuantityDiscount(cartItems);
    
    res.json({
      success: true,
      discount
    });
  } catch (error) {
    console.error('Calculate quantity discount error:', error);
    res.status(500).json({
      error: 'Failed to calculate quantity discount',
      details: error.message
    });
  }
};

// Calculate shipping progress
exports.calculateShippingProgress = async (req, res) => {
  try {
    const { cartTotal } = req.body;
    
    if (typeof cartTotal !== 'number') {
      return res.status(400).json({
        error: 'cartTotal is required and must be a number'
      });
    }
    
    const progress = await AOVService.calculateShippingProgress(cartTotal);
    
    res.json({
      success: true,
      progress
    });
  } catch (error) {
    console.error('Calculate shipping progress error:', error);
    res.status(500).json({
      error: 'Failed to calculate shipping progress',
      details: error.message
    });
  }
};

// Calculate loyalty multiplier
exports.calculateLoyaltyMultiplier = async (req, res) => {
  try {
    const { orderAmount } = req.body;
    
    if (typeof orderAmount !== 'number') {
      return res.status(400).json({
        error: 'orderAmount is required and must be a number'
      });
    }
    
    const multiplier = await AOVService.calculateLoyaltyMultiplier(orderAmount);
    
    res.json({
      success: true,
      multiplier
    });
  } catch (error) {
    console.error('Calculate loyalty multiplier error:', error);
    res.status(500).json({
      error: 'Failed to calculate loyalty multiplier',
      details: error.message
    });
  }
};

// Admin routes to update settings
exports.updateQuantityDiscounts = async (req, res) => {
  try {
    const { tiers } = req.body;
    
    if (!tiers || !Array.isArray(tiers)) {
      return res.status(400).json({
        error: 'tiers is required and must be an array'
      });
    }
    
    const settings = await AOVService.updateQuantityDiscounts(tiers);
    
    res.json({
      success: true,
      message: 'Quantity discounts updated successfully',
      settings
    });
  } catch (error) {
    console.error('Update quantity discounts error:', error);
    res.status(500).json({
      error: 'Failed to update quantity discounts',
      details: error.message
    });
  }
};

exports.updateFreeShipping = async (req, res) => {
  try {
    const { threshold, messages } = req.body;
    
    const settings = await AOVService.updateFreeShipping(threshold, messages);
    
    res.json({
      success: true,
      message: 'Free shipping settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Update free shipping error:', error);
    res.status(500).json({
      error: 'Failed to update free shipping settings',
      details: error.message
    });
  }
};

exports.updateLoyaltyMultipliers = async (req, res) => {
  try {
    const { multipliers } = req.body;
    
    if (!multipliers || !Array.isArray(multipliers)) {
      return res.status(400).json({
        error: 'multipliers is required and must be an array'
      });
    }
    
    const settings = await AOVService.updateLoyaltyMultipliers(multipliers);
    
    res.json({
      success: true,
      message: 'Loyalty multipliers updated successfully',
      settings
    });
  } catch (error) {
    console.error('Update loyalty multipliers error:', error);
    res.status(500).json({
      error: 'Failed to update loyalty multipliers',
      details: error.message
    });
  }
};
