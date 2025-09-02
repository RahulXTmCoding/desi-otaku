import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ShoppingBag, Loader, Package, CreditCard, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAOV } from '../context/AOVContext';
import { useDevMode } from '../context/DevModeContext';
import { API } from '../backend';
import CartTShirtPreview from '../components/CartTShirtPreview';
import { getMockProductImage } from '../data/mockData';

// Declare HeadlessCheckout on window for TypeScript
declare global {
  interface Window {
    HeadlessCheckout: {
      addToCart: (event: Event, token: string, options: { fallbackUrl: string }) => void;
    };
  }
}

const ShiprocketCheckout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart: regularCart, clearCart } = useCart();
  const { quantityTiers } = useAOV();
  const { isTestMode } = useDevMode();
  
  // Check for Buy Now item
  const buyNowItem = location.state?.buyNowItem;
  const cart = buyNowItem ? [buyNowItem] : regularCart;
  
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState('');

  // Calculate AOV discount from existing context data
  const frontendAovDiscount = React.useMemo(() => {
    if (!quantityTiers || quantityTiers.length === 0) {
      return { discount: 0, percentage: 0 };
    }

    const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
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
  }, [cart, quantityTiers]);

  // Calculate totals
  const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);

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
        document.head.removeChild(script);
      };
    };

    loadShiprocketScript();
  }, []);

  // Check cart items on mount
  useEffect(() => {
    if (!buyNowItem && (!regularCart || regularCart.length === 0)) {
      navigate('/cart');
    }
  }, [buyNowItem, regularCart, navigate]);

  // Get product image using same logic as CheckoutSinglePage
  const getProductImage = useCallback((item: any) => {
    if (isTestMode) {
      return getMockProductImage(item._id?.split('-')[0] || '');
    }
    
    if (item.isCustom) {
      return '';
    }
    
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      const primaryImage = item.images.find((img: any) => img.isPrimary) || item.images[0];
      if (primaryImage && primaryImage.url) {
        return primaryImage.url;
      }
      const primaryIndex = item.images.findIndex((img: any) => img.isPrimary);
      const index = primaryIndex >= 0 ? primaryIndex : 0;
      const productId = item.product?._id || item.product || item._id;
      return `${API}/product/image/${productId}/${index}`;
    }
    
    if (item.product && typeof item.product === 'object' && item.product.images && Array.isArray(item.product.images)) {
      const primaryImage = item.product.images.find((img: any) => img.isPrimary) || item.product.images[0];
      if (primaryImage && primaryImage.url) {
        return primaryImage.url;
      }
      const primaryIndex = item.product.images.findIndex((img: any) => img.isPrimary);
      const index = primaryIndex >= 0 ? primaryIndex : 0;
      return `${API}/product/image/${item.product._id}/${index}`;
    }
    
    if (item.photoUrl) {
      if (item.photoUrl.startsWith('http') || item.photoUrl.startsWith('data:')) {
        return item.photoUrl;
      }
      return item.photoUrl;
    }
    
    if (item.image) {
      if (item.image.startsWith('http') || item.image.startsWith('data:')) {
        return item.image;
      }
      if (item.image.startsWith('/api')) {
        return item.image;
      }
    }
    
    const productId = item.product?._id || item.product || item._id;
    if (productId && !productId.startsWith('temp_') && !productId.startsWith('custom')) {
      return `${API}/product/image/${productId}/0`;
    }
    
    return '/api/placeholder/80/80';
  }, [isTestMode]);

  const handleShiprocketCheckout = async () => {
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

      console.log('🚀 Initiating Shiprocket checkout with cart:', cart);
      console.log('💰 Calculated discounts:', discounts);

      // Call backend to generate Shiprocket token
      const response = await fetch(`${API}/shiprocket/generate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart,
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

        // Clear cart after successful checkout initiation
        if (!buyNowItem) {
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
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Cart
          </button>
          <h1 className="text-3xl font-bold">Shiprocket Checkout</h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Side - Cart Summary */}
          <div className="space-y-6">
            
            {/* Cart Items */}
            <div className="bg-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag className="w-5 h-5 text-yellow-400" />
                <h2 className="text-xl font-bold">Order Summary</h2>
                <span className="ml-auto text-sm text-gray-400">{cart.length} items</span>
              </div>
              
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {cart.map((item, index) => {
                  const isCustomDesign = item.isCustom;
                  
                  return (
                    <div key={index} className="flex gap-3 p-3 bg-gray-700 rounded-lg">
                      <div className="w-16 h-16 bg-gray-600 rounded-lg overflow-hidden flex-shrink-0">
                        {isCustomDesign && item.customization ? (
                          <CartTShirtPreview
                            design={null}
                            color={item.color}
                            image={null}
                            customization={{
                              frontDesign: item.customization.frontDesign ? {
                                designImage: item.customization.frontDesign.designImage,
                                position: item.customization.frontDesign.position
                              } : undefined,
                              backDesign: item.customization.backDesign ? {
                                designImage: item.customization.backDesign.designImage,
                                position: item.customization.backDesign.position
                              } : undefined
                            }}
                          />
                        ) : (
                          <img
                            src={getProductImage(item)}
                            alt={item.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/api/placeholder/80/80';
                            }}
                          />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-medium text-sm line-clamp-2">{item.name}</h3>
                        {isCustomDesign && (
                          <p className="text-xs text-yellow-400">Custom Design</p>
                        )}
                        <div className="flex gap-2 mt-1 text-xs text-gray-400">
                          {item.size && <span>Size: {item.size}</span>}
                          {item.color && (
                            <span className="flex items-center gap-1">
                              Color: {item.color}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold">₹{item.price}</p>
                        <p className="text-xs text-gray-400">each</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Features */}
            <div className="bg-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">Why Choose Shiprocket Checkout?</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-green-400" />
                  <span className="text-sm">Secure payments with multiple options</span>
                </div>
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-blue-400" />
                  <span className="text-sm">COD available with phone verification</span>
                </div>
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-purple-400" />
                  <span className="text-sm">Address validation to reduce delivery issues</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Checkout Action */}
          <div className="space-y-6">
            
            {/* Order Summary */}
            <div className="bg-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Payment Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({totalQuantity} items)</span>
                  <span>₹{subtotal}</span>
                </div>
                
                {frontendAovDiscount.discount > 0 && (
                  <div className="flex justify-between text-sm text-yellow-400">
                    <span>Quantity Discount ({frontendAovDiscount.percentage}%)</span>
                    <span>-₹{frontendAovDiscount.discount}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Shipping & other charges</span>
                  <span>Calculated at checkout</span>
                </div>
                
                <div className="border-t border-gray-600 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Estimated Total</span>
                    <span className="text-yellow-400">
                      ₹{subtotal - frontendAovDiscount.discount}+
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Final amount will be calculated during checkout
                  </p>
                </div>
              </div>
            </div>

            {/* Checkout Button */}
            <div className="bg-gray-800 rounded-2xl p-6">
              <button
                onClick={handleShiprocketCheckout}
                disabled={loading || !scriptLoaded}
                className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-600 text-gray-900 disabled:text-gray-400 py-4 rounded-lg font-bold text-lg disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Proceed to Secure Checkout
                  </>
                )}
              </button>
              
              <p className="text-xs text-gray-500 text-center mt-3">
                You'll be redirected to Shiprocket's secure checkout
              </p>
            </div>

            {/* Test Mode Indicator */}
            {isTestMode && (
              <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
                <p className="text-sm text-blue-400">
                  🧪 Test Mode: This is a demonstration of Shiprocket integration
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiprocketCheckout;
