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
  
  // ✅ NEW: AOV/Quantity discount state
  const [quantityDiscount, setQuantityDiscount] = useState<{
    discount: number;
    percentage: number;
    message: string;
  } | null>(null);
  
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

  // ✅ CRITICAL FIX: Reset auto-apply when AOV discount changes
  useEffect(() => {
    if (aovDiscount > 0 && appliedCoupon && autoApplyChecked) {
      console.log(`🔄 AOV discount changed to ₹${aovDiscount}, recalculating auto-applied coupon`);
      setAutoApplyChecked(false); // Reset to trigger recalculation
    }
  }, [aovDiscount]);

  // Check for auto-apply coupons with AOV-discounted calculation
  useEffect(() => {
    if (!autoApplyChecked && subtotal > 0) {
      setAutoApplyChecked(true);
      getBestAutoApplyCoupon(
        subtotal, 
        !isGuest && auth && typeof auth !== 'boolean' ? auth.user._id : null
      )
        .then(data => {
          if (data.coupon) {
            // ✅ CRITICAL FIX: Calculate coupon discount on AOV-discounted amount for auto-apply too
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
            
            console.log(`✅ Auto-apply sequential coupon: ${data.coupon.discountType} discount of ₹${actualDiscount} on ₹${aovDiscountedSubtotal} (AOV: ₹${aovDiscount})`);
            
            const sequentialCoupon = {
              ...data.coupon,
              discount: actualDiscount
            };
            
            setAppliedCoupon(sequentialCoupon);
            setCouponCode(sequentialCoupon.code);
            onDiscountChange({
              coupon: sequentialCoupon,
              rewardPoints: null
            });
          }
        })
        .catch(console.error);
    }
  }, [subtotal, aovDiscount, autoApplyChecked, isGuest, auth, onDiscountChange]);

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
      console.log(`🔍 Coupon validation: Original ₹${subtotal} - AOV ₹${aovDiscount} = ₹${aovDiscountedSubtotal}`);
      
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
        
        console.log(`✅ Sequential coupon: ${result.coupon.discountType} discount of ₹${actualDiscount} on ₹${aovDiscountedSubtotal}`);
        
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
    
    onDiscountChange({
      coupon: null,
      rewardPoints: rewardPointsToRedeem > 0 ? {
        points: rewardPointsToRedeem,
        discount: rewardPointsToRedeem * 0.5
      } : null,
      quantity: quantityDiscount
    });
  }, [onDiscountChange, rewardPointsToRedeem]);

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
    <div className="bg-gray-700/50 rounded-lg p-6 mb-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Tag className="w-5 h-5 text-yellow-400" />
        Discounts & Rewards
      </h3>

      {/* Coupon Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Coupon Code
        </label>
        
        {appliedCoupon ? (
          <div className="bg-green-900/30 border border-green-600 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-400" />
              <div>
                <p className="font-medium text-green-400">{appliedCoupon.code} applied!</p>
                <p className="text-sm text-gray-400">{appliedCoupon.description}</p>
                <p className="text-sm text-green-400">You save ₹{appliedCoupon.discount}</p>
              </div>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-gray-400 hover:text-red-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-400"
                disabled={couponLoading}
              />
              <button
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {couponLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  'Apply'
                )}
              </button>
            </div>
            
            {couponError && (
              <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {couponError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Reward Points Section - Only for authenticated users */}
      {!isGuest && (
        <div className="border-t border-gray-600 pt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Gift className="w-4 h-4 text-purple-400" />
              Reward Points
            </label>
            {rewardLoading ? (
              <Loader className="w-4 h-4 animate-spin text-gray-400" />
            ) : (
              <span className="text-sm text-gray-400">
                Balance: {rewardBalance} points (₹{rewardBalance * 0.5} value)
              </span>
            )}
          </div>

          {rewardBalance > 0 && (
            <>
              {rewardPointsToRedeem > 0 ? (
                <div className="bg-purple-900/30 border border-purple-600 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="font-medium text-purple-400">
                        {rewardPointsToRedeem} points redeemed!
                      </p>
                      <p className="text-sm text-gray-400">
                        You save ₹{rewardPointsToRedeem * 0.5}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveRewardPoints}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <>
                  {showRewardInput ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={rewardPointsToRedeem || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setRewardPointsToRedeem(Math.min(value, actualMaxPoints));
                        }}
                        placeholder={`Max ${actualMaxPoints} points`}
                        min="1"
                        max={actualMaxPoints}
                        className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-400"
                      />
                      <button
                        onClick={handleApplyRewardPoints}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => setShowRewardInput(false)}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowRewardInput(true)}
                      disabled={actualMaxPoints === 0}
                      className="w-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actualMaxPoints > 0 
                        ? `Use Reward Points (Max ${actualMaxPoints} points = ₹${actualMaxPoints * 0.5})`
                        : 'Insufficient points for this order'
                      }
                    </button>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Maximum 50 points can be redeemed per order. 1 point = ₹0.5
                  </p>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Guest message */}
      {isGuest && (
        <div className="border-t border-gray-600 pt-4">
          <p className="text-sm text-gray-400 text-center">
            Sign in to use reward points and save addresses
          </p>
        </div>
      )}
    </div>
  );
};

export default DiscountSection;
