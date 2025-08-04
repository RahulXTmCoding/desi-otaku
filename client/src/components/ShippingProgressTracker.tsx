import React, { useState, useEffect } from 'react';
import { Truck, Package } from 'lucide-react';
import { API } from '../backend';

interface ShippingProgressProps {
  cartTotal: number;
  className?: string;
  isSticky?: boolean;
}

interface ShippingProgress {
  qualified: boolean;
  remaining: number;
  progress: number;
  message: string;
  threshold: number;
}

const ShippingProgressTracker: React.FC<ShippingProgressProps> = ({
  cartTotal,
  className = '',
  isSticky = false
}) => {
  const [shippingProgress, setShippingProgress] = useState<ShippingProgress>({
    qualified: false,
    remaining: 0,
    progress: 0,
    message: '',
    threshold: 999
  });

  useEffect(() => {
    const fetchShippingProgress = async () => {
      try {
        const response = await fetch(`${API}/aov/shipping-progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ cartTotal })
        });
        
        if (response.ok) {
          const data = await response.json();
          setShippingProgress(data.progress);
        }
      } catch (error) {
        console.error('Failed to fetch shipping progress:', error);
        // Fallback calculation
        const threshold = 999;
        const remaining = Math.max(0, threshold - cartTotal);
        const progress = Math.min(100, (cartTotal / threshold) * 100);
        const qualified = cartTotal >= threshold;
        
        setShippingProgress({
          qualified,
          remaining,
          progress: Math.round(progress),
          message: qualified 
            ? 'Congratulations! You qualify for FREE shipping!' 
            : `Add ₹${remaining} more for FREE shipping!`,
          threshold
        });
      }
    };

    fetchShippingProgress();
  }, [cartTotal]);

  // Don't show if cart is empty
  if (cartTotal === 0) {
    return null;
  }

  const baseClasses = `rounded-lg p-4 border transition-all duration-300 ${className}`;
  const stickyClasses = isSticky 
    ? 'fixed bottom-4 left-4 right-4 z-50 shadow-lg backdrop-blur-md max-w-md mx-auto' 
    : '';
  
  const bgColor = shippingProgress.qualified 
    ? 'bg-green-500/10 border-green-500/30' 
    : 'bg-blue-500/10 border-blue-500/30';
    
  const textColor = shippingProgress.qualified 
    ? 'text-green-400' 
    : 'text-blue-400';
    
  const progressColor = shippingProgress.qualified 
    ? 'bg-green-500' 
    : 'bg-blue-500';

  return (
    <div className={`${baseClasses} ${stickyClasses} ${bgColor}`}>
      <div className="flex items-center gap-3 mb-2">
        {shippingProgress.qualified ? (
          <Package className={`w-5 h-5 ${textColor}`} />
        ) : (
          <Truck className={`w-5 h-5 ${textColor}`} />
        )}
        <span className={`font-medium ${textColor}`}>
          {shippingProgress.qualified ? 'Free Shipping Unlocked!' : 'Free Shipping Progress'}
        </span>
      </div>
      
      <div className="mb-2">
        <p className={`text-sm ${textColor}`}>
          {shippingProgress.message}
        </p>
      </div>
      
      {!shippingProgress.qualified && (
        <div className="relative">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${shippingProgress.progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>₹{cartTotal}</span>
            <span>₹{shippingProgress.threshold}</span>
          </div>
        </div>
      )}
      
      {shippingProgress.qualified && (
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <Package className="w-4 h-4" />
          <span>Your order qualifies for free shipping!</span>
        </div>
      )}
    </div>
  );
};

export default ShippingProgressTracker;
