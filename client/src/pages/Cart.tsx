import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Loader2, Tag, ExternalLink } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useDevMode } from '../context/DevModeContext';
import { useAnalytics } from '../context/AnalyticsContext';
import { getMockProductImage } from '../data/mockData';
const API = import.meta.env.VITE_API_URL;
import CartTShirtPreview from '../components/CartTShirtPreview';
import QuantityDiscountBanner from '../components/QuantityDiscountBanner';
// import FreeShippingProgress from '../components/FreeShippingProgress';
import { getColorName } from '../utils/colorUtils';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { isTestMode } = useDevMode();
  const { cart, loading, error, updateQuantity, removeFromCart, clearCart, getTotal, getItemCount } = useCart();
  const { trackViewCart, trackRemoveFromCart } = useAnalytics();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [quantityDiscount, setQuantityDiscount] = useState<{
    discount: number;
    percentage: number;
    tier: any;
    message: string;
  } | null>(null);

  const getProductImage = (item: any) => {
    if (isTestMode) {
      return getMockProductImage(item._id?.split('-')[0] || '');
    }
    
    // For custom designs, we don't show a product image
    if (item.isCustom) {
      return '';
    }
    
    // Check if product has images array (new multi-image system)
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      // Find the primary image or use the first one
      const primaryImage = item.images.find((img: any) => img.isPrimary) || item.images[0];
      if (primaryImage && primaryImage.url) {
        return primaryImage.url;
      }
      // If no URL, try the indexed endpoint
      return primaryImage.url;
    }
    
    // Check if product object has images array
    if (item.product && typeof item.product === 'object' && item.product.images && Array.isArray(item.product.images)) {
      const primaryImage = item.product.images.find((img: any) => img.isPrimary) || item.product.images[0];
      if (primaryImage && primaryImage.url) {
        return primaryImage.url;
      }
    }
    
    // Check if product has photoUrl (URL-based images - legacy)
    if (item.photoUrl) {
      if (item.photoUrl.startsWith('http') || item.photoUrl.startsWith('data:')) {
        return item.photoUrl;
      }
      return item.photoUrl;
    }
    
    // Check if we have a direct image URL
    if (item.image) {
      if (item.image.startsWith('http') || item.image.startsWith('data:')) {
        return item.image;
      }
      if (item.image.startsWith('/api')) {
        return item.image;
      }
    }
    
    return '/api/placeholder/80/80';
  };

  const handleQuantityUpdate = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    if (newQuantity > 10) {
      alert('Maximum quantity per item is 10');
      return;
    }
    
    setIsUpdating(itemId);
    try {
      await updateQuantity(itemId, newQuantity);
    } catch (error: any) {
      console.error('Failed to update quantity:', error);
      // Show inventory error message to user
      alert(error.message || 'Unable to update quantity. Please check product availability.');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setIsRemoving(itemId);
    
    // Find the item being removed for analytics
    const itemToRemove = cart.find(item => item._id === itemId);
    
    try {
      await removeFromCart(itemId);
      
      // Track remove from cart for analytics
      if (itemToRemove) {
        trackRemoveFromCart(itemToRemove, itemToRemove.quantity);
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setIsRemoving(null);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      try {
        await clearCart();
      } catch (error) {
        console.error('Failed to clear cart:', error);
      }
    }
  };

  // Get product ID for navigation
  const getProductId = (item: any) => {
    // For custom designs, we can't navigate to a product page
    if (item.isCustom || item.type === 'custom' || item.category === 'custom') {
      return null;
    }
    
    // Try to get product ID from various sources
    if (item.product && typeof item.product === 'object' && item.product._id) {
      return item.product._id;
    }
    
    if (item.product && typeof item.product === 'string') {
      return item.product;
    }
    
    if (item._id && !item._id.startsWith('temp_') && !item._id.startsWith('custom')) {
      return item._id;
    }
    
    return null;
  };

  // Handle clicking on cart item to view product
  const handleViewProduct = (item: any) => {
    const productId = getProductId(item);
    if (productId) {
      navigate(`/product/${productId}`);
    }
  };

  // Track cart view when cart has items
  useEffect(() => {
    if (cart.length > 0 && !loading) {
      // Track view cart for analytics
      trackViewCart(cart);
    }
  }, [cart, loading, trackViewCart]);

  // Calculate quantity discounts
  useEffect(() => {
    const calculateQuantityDiscount = async () => {
      if (cart.length === 0) {
        setQuantityDiscount(null);
        return;
      }

      try {
        const cartItems = cart.map(item => ({
          product: item.product,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }));

        const response = await fetch(`${API}/aov/quantity-discount`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ cartItems })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.discount > 0) {
            setQuantityDiscount(data);
          } else {
            setQuantityDiscount(null);
          }
        }
      } catch (error) {
        console.error('Failed to calculate quantity discount:', error);
        setQuantityDiscount(null);
      }
    };

    calculateQuantityDiscount();
  }, [cart]);

  const cartTotal = getTotal();
  const quantityDiscountAmount = quantityDiscount?.discount || 0;
  const discountedSubtotal = cartTotal - quantityDiscountAmount;
  const shipping = 0;
  const finalTotal = discountedSubtotal + shipping;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <ShoppingBag className="w-24 h-24 mx-auto text-gray-600 mb-4" />
            <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
            <p className="text-gray-400 mb-8">Looks like you haven't added anything to your cart yet.</p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105"
            >
              Continue Shopping
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 md:py-8 py-4">
        {/* Page Header */}
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold">Shopping Cart</h1>
          <p className="text-sm text-gray-400 mt-1">{getItemCount()} items in your cart</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Cart Items - Takes 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-3 lg:space-y-4">
            {cart.map((item) => {
              const isCustomDesign = item.isCustom;
              
              return (
                <div
                  key={item._id}
                  className={`bg-gray-800 rounded-lg md:rounded-xl p-3 md:p-4 border border-gray-700 transition-all ${
                    isRemoving === item._id ? 'opacity-50 scale-95' : ''
                  }`}
                >
                    <div className="flex gap-3 md:gap-4">
                      {/* Product Image */}
                      {getProductId(item) ? (
                        <button
                          onClick={() => handleViewProduct(item)}
                          className="w-20 h-20 md:w-28 md:h-28 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0 group relative transition-transform hover:scale-105"
                        >
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
                          {/* Hover overlay for clickable items */}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <ExternalLink className="w-5 h-5 text-white" />
                          </div>
                        </button>
                      ) : (
                        <div className="w-20 h-20 md:w-28 md:h-28 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
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
                      )}

                    {/* Product Details */}
                    <div className="flex-1 min-w-0 md:space-y-2">
                      <div className="flex justify-between items-start gap-2 md:gap-0">
                        <div className="flex-1 min-w-0 md:min-w-fit">
                          {getProductId(item) ? (
                            <button
                              onClick={() => handleViewProduct(item)}
                              className="text-left group w-full md:w-auto"
                            >
                              <h3 className="font-semibold text-sm md:text-lg group-hover:text-yellow-400 transition-colors truncate md:whitespace-normal md:flex md:items-center md:gap-1">
                                {item.name}
                              </h3>
                            </button>
                          ) : (
                            <h3 className="font-semibold text-sm md:text-lg truncate md:whitespace-normal">
                              {item.name}
                            </h3>
                          )}
                          {isCustomDesign && getProductId(item) && (
                            <p className="text-xs md:text-sm text-yellow-400 md:block hidden">Custom Design</p>
                          )}
                          <div className="flex flex-wrap gap-2 md:gap-4 mt-0.5 md:mt-1 text-xs md:text-sm text-gray-400">
                            {isCustomDesign && getProductId(item) && (
                              <span className="text-yellow-400 md:hidden">Custom</span>
                            )}
                            {item.size && <span>Size: {item.size}</span>}
                            {item.isCustom && item.color && (
                              <span className="flex items-center gap-1">
                                Color: {getColorName(item.color)}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item._id!)}
                          disabled={isRemoving === item._id}
                          className="text-red-400 hover:text-red-300 p-1 disabled:opacity-50 flex-shrink-0"
                          title="Remove item"
                        >
                          {isRemoving === item._id ? (
                            <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                          )}
                        </button>
                      </div>

                      {/* Price and Quantity */}
                      <div className="flex items-center justify-between mt-2 gap-2 md:flex-col md:sm:flex-row md:items-end md:justify-between md:gap-4">
                        <div className="text-base md:text-xl font-bold text-yellow-400">
                          ₹{item.price * item.quantity}
                          <span className="text-xs md:text-sm text-gray-400 ml-1 md:ml-2 font-normal md:font-normal">
                            (<span className="md:hidden">₹{item.price} ea</span><span className="hidden md:inline">₹{item.price} each</span>)
                          </span>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1 md:gap-2">
                          <button
                            onClick={() => handleQuantityUpdate(item._id!, item.quantity - 1)}
                            disabled={isUpdating === item._id || item.quantity <= 1}
                            className="p-1.5 md:p-2 bg-gray-700 hover:bg-gray-600 rounded md:rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isUpdating === item._id ? (
                              <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
                            ) : (
                              <Minus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            )}
                          </button>
                          <span className="w-8 md:w-12 text-center text-sm md:text-base font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityUpdate(item._id!, item.quantity + 1)}
                            disabled={isUpdating === item._id || item.quantity >= 10}
                            className="p-1.5 md:p-2 bg-gray-700 hover:bg-gray-600 rounded md:rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isUpdating === item._id ? (
                              <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
                            ) : (
                              <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {cart.length > 1 && (
              <button
                onClick={handleClearCart}
                className="text-red-400 hover:text-red-300 transition-colors text-sm"
              >
                Clear Cart
              </button>
            )}          </div>

          {/* Order Summary - Sticky on large screens */}
          <div className="lg:col-span-1">
            {/* Quantity Discount Banner - Moved to top */}
            <div className="mb-3">
              <QuantityDiscountBanner currentQuantity={0} />
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 lg:sticky lg:top-4">
              <h2 className="text-lg font-bold mb-3">Order Summary</h2>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal ({getItemCount()} items)</span>
                  <span className="font-medium">₹{cartTotal}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Shipping</span>
                  <span className="font-bold text-green-400">FREE</span>
                </div>
                
                <hr className="border-gray-700 my-3" />
                <div className="flex justify-between items-baseline">
                  <span className="text-base font-medium">Total</span>
                  <span className="text-2xl font-bold text-yellow-400">₹{finalTotal}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg text-base"
              >
                Proceed to Checkout
                <ArrowRight className="w-5 h-5" />
              </button>

              <Link
                to="/shop"
                className="block text-center text-gray-400 hover:text-yellow-400 mt-3 text-sm transition-colors"
              >
                Continue Shopping
              </Link>

              {/* Trust Badges */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="grid grid-cols-1 gap-1.5 text-xs">
                  <div className="flex items-center gap-2 text-gray-400">
                    <span className="text-green-400 text-sm">✓</span>
                    <span>Secure Checkout</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <span className="text-green-400 text-sm">✓</span>
                    <span>100% Safe Payment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
