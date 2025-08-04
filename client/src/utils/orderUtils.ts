// Utility functions for order-related calculations and display

export interface OrderCoupon {
  code: string;
  discountType?: string;
  discountValue?: number;
}

export interface QuantityDiscount {
  amount: number;
  percentage: number;
  totalQuantity: number;
  tier?: {
    minQuantity: number;
    maxQuantity: number;
    discount: number;
  };
  message?: string;
}

/**
 * Calculate the actual coupon discount amount based on coupon type and order subtotal
 */
export const calculateCouponDiscountAmount = (
  coupon: OrderCoupon | null, 
  subtotal: number
): number => {
  if (!coupon || !coupon.discountValue) return 0;
  
  if (coupon.discountType === 'percentage') {
    // For percentage coupons, calculate the actual discount amount
    return Math.floor((subtotal * coupon.discountValue) / 100);
  } else {
    // For fixed amount coupons, use the discount value directly
    return coupon.discountValue;
  }
};

/**
 * Get the display text for coupon discount based on type
 */
export const getCouponDiscountText = (coupon: OrderCoupon | null): string => {
  if (!coupon) return '';
  
  if (coupon.discountType === 'percentage') {
    return `Coupon Discount (${coupon.code} - ${coupon.discountValue}% off)`;
  } else {
    return `Coupon Discount (${coupon.code})`;
  }
};

/**
 * Calculate total savings from all discount sources
 */
export const calculateTotalSavings = (
  quantityDiscount: QuantityDiscount | null,
  coupon: OrderCoupon | null,
  rewardPointsDiscount: number,
  subtotal: number
): number => {
  const quantitySavings = quantityDiscount?.amount || 0;
  const couponSavings = calculateCouponDiscountAmount(coupon, subtotal);
  const rewardSavings = rewardPointsDiscount || 0;
  
  return quantitySavings + couponSavings + rewardSavings;
};

/**
 * Format price for display with Indian locale
 */
export const formatPrice = (amount: number): string => {
  return amount.toLocaleString('en-IN');
};
