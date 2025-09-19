import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Gift, AlertCircle, Check, X, Loader } from 'lucide-react';
import { isAutheticated } from '../../auth/helper';
import { validateCoupon, getBestAutoApplyCoupon } from '../../core/helper/couponHelper';
import { getRewardBalance } from '../../core/helper/rewardHelper';

interface DiscountSectionProps {
  subtotal: number;
  shippingCost: number;
  onDiscountChange: (discount: {
    coupon: { code: string; discount: number; description: string } | null;
    rewardPoints: { points: number; discount: number } | null;
    quantity?: { discount: number; percentage: number; message: string } | null;
  }) => void;
  isTestMode?: boolean;
  aovDiscount?: number; // ✅ NEW: Pass AOV discount for sequential calculation
}

const DiscountSection: React.FC<DiscountSectionProps> = ({
  subtotal,
  shippingCost,
  onDiscountChange,
  isTestMode = false,
  aovDiscount = 0 // ✅ NEW: Pass AOV discount for sequential calculation
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [autoApplyChecked, setAutoApplyChecked] = useState(false);
  
  const [rewardBalance, setRewardBalance] = useState(0);
  const [rewardPointsToRedeem, setRewardPointsToRedeem] = useState(0);
  const [rewardLoading, setRewardLoading] = useState(false);
  const [showRewardInput, setShowRewardInput] = useState(false);
  const [rewardBalanceLoaded, setRewardBalanceLoaded] = useState(false);
  
  // ✅ FIXED: AOV discount should be derived from props, not state
  const quantityDiscount = aovDiscount > 0 ? {
    discount: aovDiscount,
    percentage: Math.round((aovDiscount / subtotal) * 100), // ✅ Calculate actual percentage
    message: `${Math.round((aovDiscount / subtotal) * 100)}% off for bulk order`
  } : null;
  
  const auth = isAutheticated();
  const isGuest = !auth || typeof auth === 'boolean' || !auth.user;

  // Load reward balance for authenticated users (with protection against infinite calls)
  useEffect(() => {
    if (!isGuest && auth && typeof auth !== 'boolean' && !rewardBalanceLoaded) {
      setRewardLoading(true);
      setRewardBalanceLoaded(true);
      getRewardBalance(auth.user._id, auth.token)
        .then(data => {
          if (!data.error) {
            setRewardBalance(data.balance || 0);
          }
        })
        .catch(console.error)
        .finally(() => setRewardLoading(false));
    }
  }, [isGuest, rewardBalanceLoaded, auth && typeof auth !== 'boolean' ? auth.user._id : null]);

  // ✅ FIXED: Debounce auto-apply to prevent excessive calls
  useEffect(() => {
    if (!autoApplyChecked && subtotal > 0) {
      const timeoutId = setTimeout(() => {
        setAutoApplyChecked(true);
        getBestAutoApplyCoupon(
          subtotal, 
          !isGuest && auth && typeof auth !== 'boolean' ? auth.user._id : null
        )
          .then(data => {
            if (data.coupon) {
              const aovDiscountedSubtotal = subtotal - aovDiscount;
              let actualDiscount = data.coupon.discount;
              
              if (data.coupon.discountType === 'percentage') {
                actualDiscount = Math.floor((aovDiscountedSubtotal * data.coupon.discountValue) / 100);
                if (data.coupon.maxDiscount && actualDiscount > data.coupon.maxDiscount) {
                  actualDiscount = data.coupon.maxDiscount;
                }
              } else {
                actualDiscount = Math.min(data.coupon.discountValue, aovDiscountedSubtotal);
              }
              
              const sequentialCoupon = {
                ...data.coupon,
                discount: actualDiscount
              };
              
              setAppliedCoupon(sequentialCoupon);
              setCouponCode(sequentialCoupon.code);
              onDiscountChange({
                coupon: sequentialCoupon,
                rewardPoints: null,
                quantity: quantityDiscount
              });
            }
          })
          .catch(console.error);
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [subtotal, aovDiscount, autoApplyChecked, isGuest, auth && typeof auth !== 'boolean' ? auth.user._id : null]);

  // Validate coupon
  const handleApplyCoupon = useCallback(async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const token = !isGuest && auth && typeof auth !== 'boolean' ? auth.token : undefined;
      
      // ✅ CRITICAL FIX: Use AOV-discounted subtotal for sequential calculation
      const aovDiscountedSubtotal = subtotal - aovDiscount;
      
      const result = await validateCoupon(couponCode, subtotal, token); // Still validate against original for minimum purchase
      
      if (result.error) {
        setCouponError(result.error);
        setAppliedCoupon(null);
      } else if (result.valid) {
        // ✅ CRITICAL FIX: Calculate discount on AOV-discounted amount
        let actualDiscount = result.coupon.discount;
        
        if (result.coupon.discountType === 'percentage') {
          // Apply percentage to AOV-discounted subtotal
          actualDiscount = Math.floor((aovDiscountedSubtotal * result.coupon.discountValue) / 100);
          if (result.coupon.maxDiscount && actualDiscount > result.coupon.maxDiscount) {
            actualDiscount = result.coupon.maxDiscount;
          }
        } else {
          // Fixed amount - ensure it doesn't exceed AOV-discounted subtotal
          actualDiscount = Math.min(result.coupon.discountValue, aovDiscountedSubtotal);
        }
        
        
        const sequentialCoupon = {
          ...result.coupon,
          discount: actualDiscount
        };
        
        setAppliedCoupon(sequentialCoupon);
        setCouponError('');
        
        // Update parent with sequential discount info
        onDiscountChange({
          coupon: sequentialCoupon,
          rewardPoints: rewardPointsToRedeem > 0 ? {
            points: rewardPointsToRedeem,
            discount: rewardPointsToRedeem * 0.5
          } : null,
          quantity: quantityDiscount
        });
      }
    } catch (error) {
      setCouponError('Failed to validate coupon');
    } finally {
      setCouponLoading(false);
    }
  }, [couponCode, subtotal, aovDiscount, isGuest, auth, onDiscountChange, rewardPointsToRedeem, quantityDiscount]);

  // Remove coupon
  const handleRemoveCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    
    // ✅ CRITICAL FIX: Always preserve AOV discount when removing coupon
    const preservedQuantityDiscount = aovDiscount > 0 ? {
      discount: aovDiscount,
      percentage: 0,
      message: 'AOV Discount Applied'
    } : null;
    
    onDiscountChange({
      coupon: null,
      rewardPoints: rewardPointsToRedeem > 0 ? {
        points: rewardPointsToRedeem,
        discount: rewardPointsToRedeem * 0.5
      } : null,
      quantity: preservedQuantityDiscount
    });
  }, [onDiscountChange, rewardPointsToRedeem, aovDiscount]);

  // Apply reward points
  const handleApplyRewardPoints = useCallback(() => {
    const maxRedeemable = Math.min(rewardBalance, 50); // Max 50 points per order
    const maxDiscount = maxRedeemable * 0.5; // 1 point = ₹0.5
    const orderTotal = subtotal + shippingCost - (appliedCoupon?.discount || 0);
    
    // Can't discount more than order total
    const maxPointsForOrder = Math.floor(orderTotal / 0.5);
    const pointsToApply = Math.min(rewardPointsToRedeem || maxRedeemable, maxPointsForOrder, maxRedeemable);
    
    setRewardPointsToRedeem(pointsToApply);
    
    onDiscountChange({
      coupon: appliedCoupon,
      rewardPoints: {
        points: pointsToApply,
        discount: pointsToApply * 0.5
      },
      quantity: quantityDiscount
    });
    
    setShowRewardInput(false);
  }, [rewardBalance, rewardPointsToRedeem, subtotal, shippingCost, appliedCoupon, onDiscountChange]);

  // Remove reward points
  const handleRemoveRewardPoints = useCallback(() => {
    setRewardPointsToRedeem(0);
    setShowRewardInput(false);
    
    onDiscountChange({
      coupon: appliedCoupon,
      rewardPoints: null,
      quantity: quantityDiscount
    });
  }, [appliedCoupon, onDiscountChange]);

  const maxRedeemablePoints = Math.min(rewardBalance, 50);
  const orderTotalAfterCoupon = subtotal + shippingCost - (appliedCoupon?.discount || 0);
  const maxPointsForOrder = Math.floor(orderTotalAfterCoupon / 0.5);
  const actualMaxPoints = Math.min(maxRedeemablePoints, maxPointsForOrder);

  return (
    <div className="space-y-3">
      {/* Compact Coupon Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          placeholder="Enter coupon code"
          className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
          disabled={couponLoading}
        />
        <button
          onClick={handleApplyCoupon}
          disabled={couponLoading || !couponCode.trim()}
          className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
        >
          {couponLoading ? (
            <Loader className="w-3 h-3 animate-spin" />
          ) : (
            'Apply'
          )}
        </button>
      </div>

      {/* Coupon Error */}
      {couponError && (
        <p className="text-red-400 text-xs flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {couponError}
        </p>
      )}

      {/* Applied Discounts - Compact */}
      <div className="space-y-1">
        {appliedCoupon && (
          <div className="flex items-center justify-between text-sm bg-green-900/20 border border-green-600/30 rounded px-2 py-1">
            <span className="text-green-400 flex items-center gap-1">
              <Check className="w-3 h-3" />
              {appliedCoupon.code} applied
            </span>
            <button
              onClick={handleRemoveCoupon}
              className="text-gray-400 hover:text-red-400 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {rewardPointsToRedeem > 0 && (
          <div className="flex items-center justify-between text-sm bg-purple-900/20 border border-purple-600/30 rounded px-2 py-1">
            <span className="text-purple-400 flex items-center gap-1">
              <Gift className="w-3 h-3" />
              {rewardPointsToRedeem} points used
            </span>
            <button
              onClick={handleRemoveRewardPoints}
              className="text-gray-400 hover:text-red-400 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Compact Reward Points - Only for authenticated users */}
      {!isGuest && rewardBalance > 0 && rewardPointsToRedeem === 0 && (
        <div>
          {showRewardInput ? (
            <div className="flex gap-2">
              <input
                type="number"
                value={rewardPointsToRedeem || ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  setRewardPointsToRedeem(Math.min(value, actualMaxPoints));
                }}
                placeholder={`Max ${actualMaxPoints}`}
                min="1"
                max={actualMaxPoints}
                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
              />
              <button
                onClick={handleApplyRewardPoints}
                className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Use
              </button>
              <button
                onClick={() => setShowRewardInput(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowRewardInput(true)}
              disabled={actualMaxPoints === 0}
              className="w-full bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              <Gift className="w-3 h-3" />
              Use {rewardBalance} reward points
            </button>
          )}
        </div>
      )}

      {/* Guest Sign-in Message */}
      {isGuest && (
        <div className="p-2 bg-gray-700/30 border border-gray-600/50 rounded-lg text-center">
          <p className="text-xs text-gray-400">
            <span className="text-purple-400 font-medium">Sign in</span> to use reward points and save addresses
          </p>
        </div>
      )}
    </div>
  );
};

export default DiscountSection;
