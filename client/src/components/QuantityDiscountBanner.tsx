import React from 'react';
import { useCart } from '../context/CartContext';
import { useAOV } from '../context/AOVContext';
import { Package, Gift, Plus, TrendingUp, Target } from 'lucide-react';

interface QuantityDiscountBannerProps {
  currentQuantity?: number;
}

const QuantityDiscountBanner: React.FC<QuantityDiscountBannerProps> = ({ 
  currentQuantity = 1 
}) => {
  const { getItemCount, getTotal } = useCart();
  const { quantityTiers } = useAOV();
  
  // Safe check for quantityTiers
  if (!quantityTiers) {
    console.warn('QuantityDiscountBanner: quantityTiers is undefined');
    return null;
  }
  
  const itemCount = getItemCount();
  const currentTotal = getTotal();
  
  // Include current product quantity in calculation
  const totalQuantityWithCurrent = itemCount + currentQuantity;
  
  // Calculate discount info based on total quantity (cart + current product)
  const getDiscountInfo = () => {
    if (!quantityTiers || !quantityTiers.length) {
      return { 
        discount: 0, 
        percentage: 0, 
        nextTier: null
      };
    }
    
    // Sort tiers by minQuantity ascending
    const sortedTiers = [...quantityTiers].sort((a, b) => a.minQuantity - b.minQuantity);
    
    let currentTier = null;
    let nextTier = null;
    
    // Find current applicable tier
    for (let i = sortedTiers.length - 1; i >= 0; i--) {
      if (totalQuantityWithCurrent >= sortedTiers[i].minQuantity) {
        currentTier = sortedTiers[i];
        break;
      }
    }
    
    // Find next tier
    for (const tier of sortedTiers) {
      if (tier.minQuantity > totalQuantityWithCurrent) {
        nextTier = tier;
        break;
      }
    }
    
    if (currentTier) {
      return {
        discount: Math.round((currentTotal * currentTier.discount) / 100),
        percentage: currentTier.discount,
        nextTier: nextTier ? { quantity: nextTier.minQuantity, discount: nextTier.discount } : null
      };
    }
    
    return {
      discount: 0,
      percentage: 0,
      nextTier: nextTier ? { quantity: nextTier.minQuantity, discount: nextTier.discount } : null
    };
  };
  
  const { discount, percentage, nextTier } = getDiscountInfo();
  
  // Calculate how many more items needed for next tier
  const itemsNeededForNext = nextTier ? nextTier.quantity - totalQuantityWithCurrent : 0;
  
  // Calculate potential savings for next tier
  const potentialSavings = nextTier 
    ? Math.round((currentTotal * nextTier.discount) / 100)
    : 0;
    
  // Only show banner when there's at least one item in cart
  if (itemCount === 0) return null;
  
  return (
    <div className="rounded-lg overflow-hidden shadow-lg">
      {nextTier && (
        // User can get discount by adding more items - PROMINENT PURPLE BANNER
        <div 
          className="p-4"
          style={{ 
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            color: 'white'
          }}
        >
          {/* Header with Icon and Main Message */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 rounded-lg p-1.5">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-base leading-tight">
                  Add {itemsNeededForNext} more for {nextTier.discount}% OFF!
                </p>
              </div>
            </div>
          </div>
          
          {/* Progress bar towards next tier */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-purple-100 mb-1.5">
              <span className="font-medium">{itemCount} items</span>
              <span className="font-medium">{nextTier.quantity} items for {nextTier.discount}% off</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-white h-full rounded-full transition-all duration-500 shadow-lg" 
                style={{ width: `${Math.min(100, (itemCount / nextTier.quantity) * 100)}%` }}
              />
            </div>
          </div>
          
          {/* CTA Section */}

        </div>
      )}
      
      {percentage > 0 && (
        // User has active discount - GREEN SUCCESS BANNER
        <div 
          className="p-4"
          style={{ 
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 rounded-lg p-1.5">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-base">🎉 {percentage}% OFF Applied!</p>
                <p className="text-green-100 text-xs">
                  Saving ₹{discount.toLocaleString('en-IN')} on this order
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-green-100">Cart Value</p>
              <p className="font-bold text-lg">₹{currentTotal.toLocaleString('en-IN')}</p>
            </div>
          </div>
          
          {/* Show next tier if available */}
          {nextTier && (
            <div className="bg-white/10 rounded-lg px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-medium">
                    Add {itemsNeededForNext} more for {nextTier.discount}% OFF
                  </span>
                </div>
                <span className="text-xs text-green-100 font-bold">
                  +₹{Math.round((currentTotal * (nextTier.discount - percentage)) / 100).toLocaleString('en-IN')} savings
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuantityDiscountBanner;
