const Settings = require('../models/settings');

class AOVService {
  // Initialize default AOV settings
  static async initializeAOVSettings() {
    try {
      // ✅ UPDATED: Match original hardcoded values from razorpay.js
      await Settings.setSetting('quantity_discounts', {
        enabled: true,
        tiers: [
          { minQuantity: 3, discount: 10, label: '10% off on 3+ items' },
          { minQuantity: 5, discount: 15, label: '10% off on 5-7 items' },
          { minQuantity: 8, discount: 20, label: '15% off on 8+ items' }
        ]
      }, 'Quantity-based discount configuration');

      // Free shipping settings
      await Settings.setSetting('free_shipping', {
        enabled: true,
        threshold: 999,
        progressMessages: {
          far: 'Add ₹{amount} more for FREE shipping!',
          close: 'Only ₹{amount} away from FREE shipping!',
          achieved: 'Congratulations! You qualify for FREE shipping!'
        }
      }, 'Free shipping configuration');

      // Loyalty multiplier settings
      await Settings.setSetting('loyalty_multipliers', {
        enabled: true,
        basePointsPerRupee: 1, // 1 point per ₹10 spent
        multipliers: [
          { minAmount: 3000, multiplier: 2, label: '2X points on orders ₹3000+' },
          { minAmount: 5000, multiplier: 3, label: '3X points on orders ₹5000+' }
          // { minAmount: 5000, multiplier: 5, label: '5X points on orders ₹5000+' }
        ]
      }, 'Loyalty points multiplier configuration');

      console.log('✅ AOV settings initialized');
    } catch (error) {
      console.error('Failed to initialize AOV settings:', error);
    }
  }

  // Calculate quantity-based discounts
  static async calculateQuantityDiscount(cartItems) {
    try {
      const settings = await Settings.getSetting('quantity_discounts');
      
      if (!settings || !settings.enabled) {
        return { discount: 0, percentage: 0, tier: null };
      }

      const totalQuantity = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
      
      // Find the highest applicable discount tier
      let applicableTier = null;
      for (const tier of settings.tiers.sort((a, b) => b.minQuantity - a.minQuantity)) {
        if (totalQuantity >= tier.minQuantity) {
          applicableTier = tier;
          break;
        }
      }

      if (!applicableTier) {
        return { discount: 0, percentage: 0, tier: null };
      }

      // Calculate discount on subtotal
      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discountAmount = Math.round((subtotal * applicableTier.discount) / 100);

      return {
        discount: discountAmount,
        percentage: applicableTier.discount,
        tier: applicableTier,
        totalQuantity,
        message: `${applicableTier.discount}% off for buying ${totalQuantity} items!`
      };
    } catch (error) {
      console.error('Error calculating quantity discount:', error);
      return { discount: 0, percentage: 0, tier: null };
    }
  }

  // Get quantity discount tiers for display
  static async getQuantityDiscountTiers() {
    try {
      const settings = await Settings.getSetting('quantity_discounts');
      return settings && settings.enabled ? settings.tiers : [];
    } catch (error) {
      console.error('Error getting quantity discount tiers:', error);
      return [];
    }
  }

  // Calculate free shipping progress
  static async calculateShippingProgress(cartTotal) {
    try {
      const settings = await Settings.getSetting('free_shipping');
      
      if (!settings || !settings.enabled) {
        return { qualified: false, remaining: 0, progress: 0, message: '' };
      }

      const threshold = settings.threshold;
      const remaining = Math.max(0, threshold - cartTotal);
      const progress = Math.min(100, (cartTotal / threshold) * 100);
      const qualified = cartTotal >= threshold;

      let message = '';
      if (qualified) {
        message = settings.progressMessages.achieved;
      } else if (remaining <= 200) {
        message = settings.progressMessages.close.replace('{amount}', remaining);
      } else {
        message = settings.progressMessages.far.replace('{amount}', remaining);
      }

      return {
        qualified,
        remaining,
        progress: Math.round(progress),
        message,
        threshold
      };
    } catch (error) {
      console.error('Error calculating shipping progress:', error);
      return { qualified: false, remaining: 0, progress: 0, message: '' };
    }
  }

  // Calculate loyalty point multipliers
  static async calculateLoyaltyMultiplier(orderAmount) {
    try {
      const settings = await Settings.getSetting('loyalty_multipliers');
      
      if (!settings || !settings.enabled) {
        return { multiplier: 1, bonus: 0, tier: null, basePoints: Math.floor(orderAmount / 10) };
      }

      const basePoints = Math.floor(orderAmount / 10); // 1 point per ₹10
      
      // Find the highest applicable multiplier tier
      let applicableTier = null;
      for (const tier of settings.multipliers.sort((a, b) => b.minAmount - a.minAmount)) {
        if (orderAmount >= tier.minAmount) {
          applicableTier = tier;
          break;
        }
      }

      if (!applicableTier) {
        return { 
          multiplier: 1, 
          bonus: 0, 
          tier: null, 
          basePoints,
          totalPoints: basePoints 
        };
      }

      const totalPoints = basePoints * applicableTier.multiplier;
      const bonusPoints = totalPoints - basePoints;

      return {
        multiplier: applicableTier.multiplier,
        bonus: bonusPoints,
        tier: applicableTier,
        basePoints,
        totalPoints,
        message: `${applicableTier.multiplier}X points earned! (+${bonusPoints} bonus points)`
      };
    } catch (error) {
      console.error('Error calculating loyalty multiplier:', error);
      return { multiplier: 1, bonus: 0, tier: null, basePoints: Math.floor(orderAmount / 10) };
    }
  }

  // Get loyalty multiplier tiers for display
  static async getLoyaltyMultiplierTiers() {
    try {
      const settings = await Settings.getSetting('loyalty_multipliers');
      return settings && settings.enabled ? settings.multipliers : [];
    } catch (error) {
      console.error('Error getting loyalty multiplier tiers:', error);
      return [];
    }
  }

  // Get all AOV incentives for a cart
  static async getCartIncentives(cartItems, cartTotal) {
    try {
      const [quantityDiscount, shippingProgress, loyaltyMultiplier] = await Promise.all([
        this.calculateQuantityDiscount(cartItems),
        this.calculateShippingProgress(cartTotal),
        this.calculateLoyaltyMultiplier(cartTotal)
      ]);

      return {
        quantityDiscount,
        shippingProgress,
        loyaltyMultiplier,
        totalSavings: quantityDiscount.discount,
        finalAmount: cartTotal - quantityDiscount.discount
      };
    } catch (error) {
      console.error('Error getting cart incentives:', error);
      return {
        quantityDiscount: { discount: 0, percentage: 0, tier: null },
        shippingProgress: { qualified: false, remaining: 0, progress: 0, message: '' },
        loyaltyMultiplier: { multiplier: 1, bonus: 0, tier: null },
        totalSavings: 0,
        finalAmount: cartTotal
      };
    }
  }

  // Admin methods to update settings
  static async updateQuantityDiscounts(tiers) {
    const settings = await Settings.getSetting('quantity_discounts', { enabled: true, tiers: [] });
    settings.tiers = tiers;
    await Settings.setSetting('quantity_discounts', settings);
    return settings;
  }

  static async updateFreeShipping(threshold, messages) {
    const settings = await Settings.getSetting('free_shipping', { enabled: true, threshold: 999 });
    if (threshold) settings.threshold = threshold;
    if (messages) settings.progressMessages = messages;
    await Settings.setSetting('free_shipping', settings);
    return settings;
  }

  static async updateLoyaltyMultipliers(multipliers) {
    const settings = await Settings.getSetting('loyalty_multipliers', { enabled: true, multipliers: [] });
    settings.multipliers = multipliers;
    await Settings.setSetting('loyalty_multipliers', settings);
    return settings;
  }
}

module.exports = AOVService;
