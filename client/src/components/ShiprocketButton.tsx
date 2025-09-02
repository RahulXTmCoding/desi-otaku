import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, CreditCard, Truck, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAOV } from '../context/AOVContext';
import { useDevMode } from '../context/DevModeContext';
import { API } from '../backend';

// Declare HeadlessCheckout on window for TypeScript
declare global {
  interface Window {
    HeadlessCheckout: {
      addToCart: (event: Event, token: string, options: { fallbackUrl: string }) => void;
    };
  }
}

// Import CartItem from the actual helper to ensure type consistency
import { CartItem } from '../core/helper/cartHelper';

interface ShiprocketButtonProps {
  cart?: CartItem[];
  buyNowItem?: CartItem;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

const ShiprocketButton: React.FC<ShiprocketButtonProps> = ({
  cart,
  buyNowItem,
  disabled = false,
  className = '',
  children,
  variant = 'primary',
  size = 'md'
}) => {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { quantityTiers } = useAOV();
  const { isTestMode } = useDevMode();
  
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState('');

  // Determine which cart to use
  const checkoutCart = buyNowItem ? [buyNowItem] : (cart || []);

  // Calculate AOV discount from existing context data
  const frontendAovDiscount = React.useMemo(() => {
    if (!quantityTiers || quantityTiers.length === 0) {
      return { discount: 0, percentage: 0 };
    }

    const totalQuantity = checkoutCart.reduce((total, item) => total + item.quantity, 0);
    const subtotal = checkoutCart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    const applicableTier = quantityTiers
      .filter(tier => totalQuantity >= tier.minQuantity)
      .sort((a, b) => b.minQuantity - a.minQuantity)[0];

    if (applicableTier) {
      const discountAmount = Math.round((subtotal * applicableTier.discount) / 100);
      return {
        discount: discountAmount,
        percentage: applicableTier.discount
      };
    }

    return { discount: 0, percentage: 0 };
  }, [checkoutCart, quantityTiers]);

  // Load Shiprocket script
  useEffect(() => {
    const loadShiprocketScript = () => {
      if (window.HeadlessCheckout) {
        setScriptLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout-ui.shiprocket.com/assets/js/channels/shopify.js';
      script.async = true;
      script.onload = () => {
        setScriptLoaded(true);
      };
      script.onerror = () => {
        setError('Failed to load Shiprocket checkout. Please try again.');
      };
      document.head.appendChild(script);

      return () => {
        try {
          document.head.removeChild(script);
        } catch (e) {
          // Script might already be removed
        }
      };
    };

    loadShiprocketScript();
  }, []);

  const handleShiprocketCheckout = useCallback(async () => {
    if (checkoutCart.length === 0) {
      setError('Your cart is empty');
      return;
    }

    if (!scriptLoaded) {
      setError('Shiprocket checkout is loading. Please wait...');
      return;
    }

    if (!window.HeadlessCheckout) {
      setError('Shiprocket checkout not available. Please refresh and try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Prepare discounts (simplified for now)
      const discounts = {
        quantity: frontendAovDiscount.discount > 0 ? {
          discount: frontendAovDiscount.discount,
          percentage: frontendAovDiscount.percentage
        } : null,
        // TODO: Add coupon and reward points integration
        coupon: null,
        rewardPoints: null
      };

      console.log('🚀 Initiating Shiprocket checkout with cart:', checkoutCart);
      console.log('💰 Calculated discounts:', discounts);

      // Call backend to generate Shiprocket token
      const response = await fetch(`${API}/shiprocket/generate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart: checkoutCart,
          discounts
        })
      });

      const data = await response.json();

      if (response.ok && data.success && data.token) {
        console.log('✅ Shiprocket token generated:', data.token);
        
        // Open Shiprocket checkout
        const fallbackUrl = `${window.location.origin}/checkout-fallback?order_id=${data.order_id}`;
        
        window.HeadlessCheckout.addToCart(
          new Event('click'), 
          data.token, 
          { fallbackUrl }
        );

        // Clear cart after successful checkout initiation (only for regular cart, not buy now)
        if (!buyNowItem && cart) {
          await clearCart();
        }

      } else {
        console.error('❌ Failed to generate Shiprocket token:', data);
        setError(data.error || 'Failed to initiate checkout. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ Shiprocket checkout error:', error);
      setError(error.message || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [checkoutCart, frontendAovDiscount, scriptLoaded, buyNowItem, cart, clearCart]);

  // Calculate button styles based on variant and size
  const getButtonStyles = () => {
    let baseStyles = 'font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2 rounded-lg disabled:cursor-not-allowed disabled:transform-none disabled:opacity-50';
    
    // Size styles
    switch (size) {
      case 'sm':
        baseStyles += ' py-2 px-4 text-sm';
        break;
      case 'lg':
        baseStyles += ' py-4 px-8 text-lg';
        break;
      default: // md
        baseStyles += ' py-3 px-6 text-base';
        break;
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyles += ' bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-600 disabled:text-gray-400';
        break;
      default: // primary
        baseStyles += ' bg-yellow-400 hover:bg-yellow-300 text-gray-900 disabled:bg-gray-600 disabled:text-gray-400';
        break;
    }

    return baseStyles;
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleShiprocketCheckout}
        disabled={disabled || loading || !scriptLoaded || checkoutCart.length === 0}
        className={`${getButtonStyles()} ${className}`}
      >
        {loading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Opening Checkout...
          </>
        ) : !scriptLoaded ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Loading...
          </>
        ) : checkoutCart.length === 0 ? (
          <>
            <Package className="w-5 h-5" />
            Cart is Empty
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            {children}
          </>
        )}
      </button>

      {/* Error display */}
      {error && (
        <div className="text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* Benefits/Features */}
      {!error && checkoutCart.length > 0 && (
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <CreditCard className="w-3 h-3" />
            <span>Secure</span>
          </div>
          <div className="flex items-center gap-1">
            <Truck className="w-3 h-3" />
            <span>COD Available</span>
          </div>
          <div className="flex items-center gap-1">
            <Package className="w-3 h-3" />
            <span>Fast Checkout</span>
          </div>
        </div>
      )}

      {/* Test Mode Indicator */}
      {isTestMode && (
        <div className="text-center">
          <span className="text-xs text-blue-400">
            🧪 Test Mode: Demo checkout experience
          </span>
        </div>
      )}
    </div>
  );
};

export default ShiprocketButton;
