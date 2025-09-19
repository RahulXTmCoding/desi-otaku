import React from 'react';

interface DiscountBreakdownProps {
  order: any;
  orderStateData?: any;
  className?: string;
  showTitle?: boolean;
  variant?: 'summary' | 'detailed';
}

const OrderDiscountBreakdown: React.FC<DiscountBreakdownProps> = ({
  order,
  orderStateData,
  className = '',
  showTitle = true,
  variant = 'detailed'
}) => {
  // ✅ FIXED: Use exact same logic as backend calculator
  const extractDiscountData = () => {
      order: !!order,
      orderStateData: !!orderStateData,
      orderKeys: order ? Object.keys(order) : [],
      stateKeys: orderStateData ? Object.keys(orderStateData) : []
    });

    // ✅ FIXED: Calculate product subtotal ONLY (no shipping) - matches backend
    let productSubtotal = 0;
    if (order?.products && Array.isArray(order.products)) {
      productSubtotal = order.products.reduce((sum, product) => {
        const price = product.price || 0;
        const count = product.count || product.quantity || 1;
        return sum + (price * count);
      }, 0);
    } else {
      // Fallback: work backwards from final amount
      const finalAmount = orderStateData?.finalAmount || order?.amount || 0;
      const shipping = orderStateData?.shippingCost || order?.shipping?.shippingCost || 0;
      const quantityDiscount = orderStateData?.quantityDiscount || order?.quantityDiscount?.amount || 0;
      const rewardDiscount = orderStateData?.rewardDiscount || order?.rewardPointsDiscount || 0;
      const onlineDiscount = orderStateData?.onlinePaymentDiscount || order?.onlinePaymentDiscount?.amount || 0;
      
      // Estimate coupon discount first (may be stored directly)
      let couponDiscount = 0;
      const coupon = order?.coupon || orderStateData?.appliedCoupon;
      if (coupon?.discountValue) {
        couponDiscount = coupon.discountType === 'percentage' 
          ? Math.floor((finalAmount * coupon.discountValue) / 100)
          : coupon.discountValue;
      }
      
      productSubtotal = finalAmount + quantityDiscount + couponDiscount + rewardDiscount + onlineDiscount - shipping;
    }

    // Shipping cost
    const shippingCost = orderStateData?.shippingCost || order?.shipping?.shippingCost || 0;

    // Quantity discount (AOV)
    const quantityDiscount = orderStateData?.quantityDiscount || order?.quantityDiscount?.amount || 0;
    const quantityDiscountInfo = order?.quantityDiscount || orderStateData?.aovDiscount;

    // ✅ CRITICAL FIX: Always use checkout page calculation logic for consistency
    let couponDiscount = 0;
    let couponCode = 'Applied';
    
    // ✅ ALWAYS recalculate to ensure consistency (don't trust stored values)
    if (order?.coupon && order.coupon.discountValue) {
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
        } else {
          // Likely a fixed amount
          couponDiscount = discountValue;
        }
      }
    }

    // Reward points discount
    const rewardPointsUsed = orderStateData?.rewardPointsUsed || order?.rewardPointsRedeemed || 0;
    const rewardDiscount = orderStateData?.rewardDiscount || 
                          order?.rewardPointsDiscount || 
                          (rewardPointsUsed * 0.5) || 0;

    // ✅ CORRECTED: Use checkout page calculation logic exactly
    let onlinePaymentDiscount = orderStateData?.onlinePaymentDiscount || 
                               order?.onlinePaymentDiscount?.amount || 
                               0;
    
    // ✅ CHECKOUT LOGIC: Calculate online discount on progressively discounted amount
    if (onlinePaymentDiscount === 0) {
      const paymentMethod = orderStateData?.paymentMethod || 
                           order?.paymentMethod || 
                           orderStateData?.orderDetails?.paymentMethod ||
                           'unknown';
      
      // If it was an online payment, use checkout calculation exactly
      if (paymentMethod === 'razorpay' || paymentMethod === 'card' || paymentMethod === 'online') {
        let discountedAmount = productSubtotal;
        discountedAmount -= quantityDiscount;
        discountedAmount -= couponDiscount;
        onlinePaymentDiscount = Math.round(discountedAmount * 0.05);
      }
    }

    // Final amount
    const finalAmount = orderStateData?.finalAmount || order?.amount || 0;

    // Item count
    const itemCount = orderStateData?.itemCount || 
                     order?.products?.length || 
                     orderStateData?.orderDetails?.products?.length || 
                     0;

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

    return result;
  };

  const data = extractDiscountData();

  if (variant === 'summary') {
    return (
      <div className={className}>
        {showTitle && <h3 className="text-lg font-semibold text-white mb-4">Order Summary</h3>}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Total Paid:</span>
            <span className="text-yellow-400 font-bold">₹{data.finalAmount.toLocaleString('en-IN')}</span>
          </div>
          {data.totalSavings > 0 && (
            <div className="flex justify-between text-green-400">
              <span>Total Savings:</span>
              <span>-₹{data.totalSavings.toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {showTitle && <h3 className="text-lg font-semibold text-white mb-4">Order Summary</h3>}
      <div className="space-y-2 text-sm">
        {/* Items */}
        {data.itemCount > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-400">Items:</span>
            <span>{data.itemCount} T-shirt{data.itemCount > 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Subtotal */}
        <div className="flex justify-between">
          <span className="text-gray-400">Subtotal:</span>
          <span>₹{data.subtotal.toLocaleString('en-IN')}</span>
        </div>

        {/* Shipping */}
        {data.shippingCost > 0 ? (
          <div className="flex justify-between">
            <span className="text-gray-400">Shipping:</span>
            <span>₹{data.shippingCost.toLocaleString('en-IN')}</span>
          </div>
        ) : (
          <div className="flex justify-between">
            <span className="text-gray-400">Shipping:</span>
            <span className="text-green-400">FREE</span>
          </div>
        )}

        {/* Quantity Discount (AOV) */}
        {data.quantityDiscount > 0 && (
          <div className="flex justify-between text-yellow-400">
            <span className="flex-1 text-left">
              Quantity Discount
              {data.quantityDiscountInfo?.percentage && ` (${data.quantityDiscountInfo.percentage}% off for ${data.itemCount} items)`}:
            </span>
            <span className="ml-2">-₹{data.quantityDiscount.toLocaleString('en-IN')}</span>
          </div>
        )}

        {/* Coupon Discount */}
        {data.couponDiscount > 0 && (
          <div className="flex justify-between text-green-400">
            <span className="flex-1 text-left">Coupon Discount ({data.couponCode}):</span>
            <span className="ml-2">-₹{data.couponDiscount.toLocaleString('en-IN')}</span>
          </div>
        )}

        {/* Reward Points Discount */}
        {data.rewardPointsUsed > 0 && (
          <div className="flex justify-between text-purple-400">
            <span className="flex-1 text-left">Reward Points ({data.rewardPointsUsed} points):</span>
            <span className="ml-2">-₹{data.rewardDiscount.toLocaleString('en-IN')}</span>
          </div>
        )}

        {/* ✅ CRITICAL: Online Payment Discount */}
        {data.onlinePaymentDiscount > 0 && (
          <div className="flex justify-between text-blue-400">
            <span className="flex-1 text-left">Online Payment Discount (5%):</span>
            <span className="ml-2">-₹{data.onlinePaymentDiscount.toLocaleString('en-IN')}</span>
          </div>
        )}

        {/* Total Savings */}
        {data.totalSavings > 0 && (
          <div className="flex justify-between text-green-400 font-semibold pt-1 border-t border-gray-600">
            <span>Total Savings:</span>
            <span>-₹{data.totalSavings.toLocaleString('en-IN')}</span>
          </div>
        )}

        {/* Tax */}
        <div className="flex justify-between">
          <span className="text-gray-400">Tax:</span>
          <span>₹0</span>
        </div>

        {/* Final Total */}
        <hr className="border-gray-600 my-2" />
        <div className="flex justify-between font-bold text-base">
          <span>Total Paid:</span>
          <span className="text-yellow-400">₹{data.finalAmount.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderDiscountBreakdown;
