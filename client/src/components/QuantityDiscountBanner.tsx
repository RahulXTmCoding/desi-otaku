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
  const itemCount = getItemCount();
  const currentTotal = getTotal();
  
  // Include current product quantity in calculation
  const totalQuantityWithCurrent = itemCount + currentQuantity;
  
  // Calculate discount info based on total quantity (cart + current product)
  const getDiscountInfo = () => {
    if (!quantityTiers.length) {
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
    <div className="rounded-lg overflow-hidden mb-4 border" style={{ borderColor: 'var(--color-border)' }}>
      {percentage > 0 ? (
        // User has active discount
        <div 
          className="p-4"
          style={{ 
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-lg">🎉 {percentage}% OFF Applied!</p>
                <p className="text-green-100 text-sm">
                  You're saving ₹{discount.toLocaleString('en-IN')} on this order
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-100">Cart Value</p>
              <p className="font-bold text-xl">₹{currentTotal.toLocaleString('en-IN')}</p>
            </div>
          </div>
          
          {/* Show next tier if available */}
          {nextTier && (
            <div className="mt-3 bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">
                  Add {nextTier.quantity - itemCount} more items for <strong>{nextTier.discount}% OFF</strong>
                </span>
              </div>
              <p className="text-xs text-green-100 mt-1">
                Potential additional savings: ₹{Math.round((currentTotal * (nextTier.discount - percentage)) / 100).toLocaleString('en-IN')}
              </p>
            </div>
          )}
        </div>
      ) : nextTier ? (
        // User can get discount by adding more items
        <div 
          className="p-4"
          style={{ 
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            color: 'white'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-lg">
                  Add {nextTier.quantity - itemCount} more for {nextTier.discount}% OFF!
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-purple-100">Current Cart</p>
              <p className="font-bold text-xl">₹{currentTotal.toLocaleString('en-IN')}</p>
            </div>
          </div>
          
          {/* Progress bar towards next tier */}
          <div className="mt-3">
            <div className="flex justify-between text-sm text-purple-100 mb-1">
              <span>{itemCount} items</span>
              <span>{nextTier.quantity} items for {nextTier.discount}% off</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (itemCount / nextTier.quantity) * 100)}%` }}
              />
            </div>
          </div>
          
          {/* CTA Section */}
          <div className="mt-3 flex items-center justify-between bg-white/10 rounded-lg p-2">
            <span className="text-sm font-medium">Keep shopping to unlock savings!</span>
            <div className="flex items-center gap-1 text-yellow-300">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-bold">{nextTier.quantity - itemCount} more</span>
            </div>
          </div>
        </div>
      ) : (
        // Fallback - show current cart value
        <div 
          className="p-4"
          style={{ 
            background: 'linear-gradient(135deg, #6b7280, #4b5563)',
            color: 'white'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-lg">Your Cart</p>
                <p className="text-gray-200 text-sm">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} in cart
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-xl">₹{currentTotal.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuantityDiscountBanner;
