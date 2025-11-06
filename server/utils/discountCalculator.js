/**
 * Universal Discount Calculator for Server-side Operations
 * Ensures consistent discount calculations across invoices, emails, and all backend systems
 * Matches the frontend OrderDiscountBreakdown component logic
 */

class DiscountCalculator {
  /**
   * Calculate all discounts from order data with aggressive detection
   * @param {Object} order - Order object from database
   * @returns {Object} Complete discount breakdown
   */
  static calculateOrderDiscounts(order) {
    console.log('🔍 BACKEND DISCOUNT CALCULATION - Processing order:', order._id);
    
    // ✅ FIXED: Calculate product subtotal ONLY (no shipping)
    let productSubtotal = 0;
    if (order.products && Array.isArray(order.products)) {
      productSubtotal = order.products.reduce((sum, product) => {
        const price = product.price || 0;
        const count = product.count || product.quantity || 1;
        return sum + (price * count);
      }, 0);
    } else {
      // Fallback: work backwards from final amount
      const finalAmount = order.amount || 0;
      const shipping = order.shipping?.shippingCost || 0;
      const quantityDiscount = order.quantityDiscount?.amount || 0;
      const rewardDiscount = order.rewardPointsDiscount || 0;
      const onlineDiscount = order.onlinePaymentDiscount?.amount || 0;
      
      // Estimate coupon discount first (may be stored directly)
      let couponDiscount = 0;
      if (order.coupon?.discountValue) {
        // Use stored discount or fallback to percentage calculation
        couponDiscount = order.coupon.discountType === 'percentage' 
          ? Math.floor((finalAmount * order.coupon.discountValue) / 100)
          : order.coupon.discountValue;
      }
      
      productSubtotal = finalAmount + quantityDiscount + couponDiscount + rewardDiscount + onlineDiscount - shipping;
    }

    // Shipping cost
    const shippingCost = 0;

    // Quantity discount (AOV)
    const quantityDiscount = order.quantityDiscount?.amount || 0;
    const quantityDiscountInfo = order.quantityDiscount;

    // ✅ CRITICAL FIX: Use checkout page calculation logic exactly
    let couponDiscount = 0;
    let couponCode = 'Applied';
    
    if (order.coupon) {
      couponCode = order.coupon.code;
      
      // ✅ Use checkout page logic: calculate discount from the CORRECT base amount
      // Checkout uses progressively discounted amount, so we need to match that
      let couponBaseAmount = productSubtotal;
      couponBaseAmount -= quantityDiscount; // Remove AOV discount first
      
      if (order.coupon.discountType === 'percentage') {
        // It's a percentage - calculate from correct base
        couponDiscount = Math.floor((couponBaseAmount * order.coupon.discountValue) / 100);
      } else if (order.coupon.discountType === 'fixed') {
        // It's a fixed amount
        couponDiscount = order.coupon.discountValue;
      } else {
        // ✅ Missing discountType - assume percentage if value seems like percentage
        const discountValue = order.coupon.discountValue || 0;
        if (discountValue <= 100 && discountValue > 0) {
          // Likely a percentage (e.g., 10 = 10%)
          couponDiscount = Math.floor((couponBaseAmount * discountValue) / 100);
          console.log(`🔄 BACKEND CONSISTENT coupon calc: ${discountValue}% of ₹${couponBaseAmount} = ₹${couponDiscount}`);
        } else {
          // Likely a fixed amount
          couponDiscount = discountValue;
          console.log(`🔄 BACKEND CONSISTENT fixed coupon: ₹${couponDiscount}`);
        }
      }
    }

    // Reward points discount
    const rewardPointsUsed = order.rewardPointsRedeemed || 0;
    const rewardDiscount = order.rewardPointsDiscount || (rewardPointsUsed * 0.5) || 0;

    // ✅ CORRECTED: Use checkout page logic exactly 
    let onlinePaymentDiscount = order.onlinePaymentDiscount?.amount || 0;
    
    // ✅ CHECKOUT LOGIC: Calculate online discount on progressively discounted amount
    if (onlinePaymentDiscount === 0) {
      const paymentMethod = order.paymentMethod || 'unknown';
      
      // If it was an online payment, use checkout calculation exactly
      if (paymentMethod === 'razorpay' || paymentMethod === 'card' || paymentMethod === 'online') {
        let discountedAmount = productSubtotal;
        discountedAmount -= quantityDiscount;
        discountedAmount -= couponDiscount;
        onlinePaymentDiscount = Math.round(discountedAmount * 0.05);
        console.log(`🔄 BACKEND using checkout logic: ₹${onlinePaymentDiscount} (5% of ₹${discountedAmount})`);
      }
    }

    // Final amount
    const finalAmount = order.amount || 0;

    // Item count
    const itemCount = order.products?.length || 0;

    const result = {
      subtotal: Math.max(0, productSubtotal),
      shippingCost,
      quantityDiscount,
      quantityDiscountInfo,
      couponDiscount,
      couponCode,
      rewardPointsUsed,
      rewardDiscount,
      onlinePaymentDiscount,
      finalAmount,
      itemCount,
      totalSavings: quantityDiscount + couponDiscount + rewardDiscount + onlinePaymentDiscount
    };

    console.log('💰 BACKEND DISCOUNT BREAKDOWN - Calculated:', result);
    return result;
  }

  /**
   * Calculate coupon discount amount
   * @param {Object} coupon - Coupon object
   * @param {number} subtotal - Subtotal amount
   * @returns {number} Discount amount
   */
  static calculateCouponDiscount(coupon, subtotal) {
    if (!coupon || !coupon.discountValue || !subtotal) return 0;
    
    if (coupon.discountType === 'percentage') {
      return Math.floor((subtotal * coupon.discountValue) / 100);
    } else {
      return coupon.discountValue;
    }
  }

  /**
   * Generate HTML for discount breakdown (for emails)
   * @param {Object} order - Order object
   * @param {Object} options - Display options
   * @returns {string} HTML string
   */
  static generateDiscountHTML(order, options = {}) {
    const discounts = this.calculateOrderDiscounts(order);
    const { showTitle = false, currency = '₹' } = options;
    
    let html = '';
    
    if (showTitle) {
      html += `<h3 style="color: #FCD34D;">Order Summary:</h3>`;
    }
    
    // Subtotal
    html += `
    <tr>
      <td style="padding: 12px; text-align: right; color: #D1D5DB;">Subtotal:</td>
      <td style="padding: 12px; text-align: right; font-weight: bold;">${currency}${discounts.subtotal.toLocaleString('en-IN')}</td>
    </tr>`;
    
    // Shipping
    if (discounts.shippingCost > 0) {
      html += `
    <tr>
      <td style="padding: 12px; text-align: right; color: #D1D5DB;">Shipping:</td>
      <td style="padding: 12px; text-align: right;">${currency}${discounts.shippingCost.toLocaleString('en-IN')}</td>
    </tr>`;
    }
    
    // Quantity Discount (AOV)
    if (discounts.quantityDiscount > 0) {
      const discountText = discounts.quantityDiscountInfo?.percentage 
        ? `Quantity Discount (${discounts.quantityDiscountInfo.percentage}% off for ${discounts.itemCount} items)`
        : 'Quantity Discount';
      html += `
    <tr>
      <td style="padding: 12px; text-align: right; color: #FCD34D;">${discountText}:</td>
      <td style="padding: 12px; text-align: right; color: #FCD34D;">-${currency}${discounts.quantityDiscount.toLocaleString('en-IN')}</td>
    </tr>`;
    }
    
    // Coupon Discount
    if (discounts.couponDiscount > 0) {
      html += `
    <tr>
      <td style="padding: 12px; text-align: right; color: #10B981;">Coupon Discount (${discounts.couponCode}):</td>
      <td style="padding: 12px; text-align: right; color: #10B981;">-${currency}${discounts.couponDiscount.toLocaleString('en-IN')}</td>
    </tr>`;
    }
    
    // Reward Points Discount
    if (discounts.rewardPointsUsed > 0) {
      html += `
    <tr>
      <td style="padding: 12px; text-align: right; color: #8B5CF6;">Reward Points (${discounts.rewardPointsUsed} points):</td>
      <td style="padding: 12px; text-align: right; color: #8B5CF6;">-${currency}${discounts.rewardDiscount.toLocaleString('en-IN')}</td>
    </tr>`;
    }
    
    // ✅ CRITICAL: Online Payment Discount
    if (discounts.onlinePaymentDiscount > 0) {
      html += `
    <tr>
      <td style="padding: 12px; text-align: right; color: #60A5FA;">Online Payment Discount (5%):</td>
      <td style="padding: 12px; text-align: right; color: #60A5FA;">-${currency}${discounts.onlinePaymentDiscount.toLocaleString('en-IN')}</td>
    </tr>`;
    }
    
    // Total Savings
    if (discounts.totalSavings > 0) {
      html += `
    <tr style="border-top: 2px solid #6B7280;">
      <td style="padding: 12px; text-align: right; color: #10B981; font-weight: bold;">Total Savings:</td>
      <td style="padding: 12px; text-align: right; color: #10B981; font-weight: bold;">-${currency}${discounts.totalSavings.toLocaleString('en-IN')}</td>
    </tr>`;
    }
    
    // Final Total
    html += `
    <tr style="background-color: #FCD34D; color: #1F2937;">
      <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px;">Final Total:</td>
      <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px;">${currency}${discounts.finalAmount.toLocaleString('en-IN')}</td>
    </tr>`;
    
    return html;
  }

  /**
   * Generate text summary for discounts (for SMS/simple displays)
   * @param {Object} order - Order object
   * @returns {string} Text summary
   */
  static generateDiscountSummary(order) {
    const discounts = this.calculateOrderDiscounts(order);
    
    let summary = `Order Total: ₹${discounts.finalAmount.toLocaleString('en-IN')}`;
    
    if (discounts.totalSavings > 0) {
      summary += ` (Saved: ₹${discounts.totalSavings.toLocaleString('en-IN')})`;
    }
    
    return summary;
  }
}

module.exports = DiscountCalculator;
