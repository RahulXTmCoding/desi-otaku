import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useDevMode } from '../context/DevModeContext';
import { getMockProductImage } from '../data/mockData';
import { API } from '../backend';
import CartTShirtPreview from '../components/CartTShirtPreview';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { isTestMode } = useDevMode();
  const { cart, loading, error, updateQuantity, removeFromCart, clearCart, getTotal, getItemCount } = useCart();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  const getProductImage = (item: any) => {
    if (isTestMode) {
      return getMockProductImage(item._id?.split('-')[0] || '');
    }
    
    // For custom designs, we don't show a product image
    if (item.isCustom) {
      return '';
    }
    
    // Check if product has photoUrl (URL-based images)
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
      return `${API}/product/photo/${item.image}`;
    }
    
    // If we have a product ID in the product field, use it
    if (item.product) {
      // If product is an object with photoUrl
      if (typeof item.product === 'object' && item.product.photoUrl) {
        return item.product.photoUrl;
      }
      // If product is an object with _id
      if (typeof item.product === 'object' && item.product._id) {
        return `${API}/product/photo/${item.product._id}`;
      }
      // If product is a string ID
      return `${API}/product/photo/${item.product}`;
    }
    
    // Fallback to _id if not custom
    if (item._id && !item._id.startsWith('temp_') && !item._id.startsWith('custom')) {
      return `${API}/product/photo/${item._id}`;
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
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setIsRemoving(itemId);
    try {
      await removeFromCart(itemId);
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

  const cartTotal = getTotal();
  const shipping = cartTotal > 0 && cartTotal < 999 ? 79 : 0;
  const finalTotal = cartTotal + shipping;

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
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Shopping Cart</h1>
          <p className="text-gray-400 mt-2">{getItemCount()} items in your cart</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items - Takes 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => {
              const isCustomDesign = item.isCustom;
              
              return (
                <div
                  key={item._id}
                  className={`bg-gray-800 rounded-xl p-4 md:p-6 border border-gray-700 transition-all ${
                    isRemoving === item._id ? 'opacity-50 scale-95' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Product Image */}
                    <div className="w-full sm:w-32 h-40 sm:h-32 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                      {isCustomDesign && item.customization ? (
                        <CartTShirtPreview
                          design={null}
                          color={item.color}
                          colorValue="#000000"
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
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/api/placeholder/80/80';
                          }}
                        />
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          {isCustomDesign && (
                            <p className="text-sm text-yellow-400">Custom Design</p>
                          )}
                          <div className="flex gap-4 mt-1 text-sm text-gray-400">
                            {item.size && <span>Size: {item.size}</span>}
                            {item.color && (
                              <span className="flex items-center gap-1">
                                Color: {item.color}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item._id!)}
                          disabled={isRemoving === item._id}
                          className="text-red-400 hover:text-red-300 p-1 disabled:opacity-50"
                          title="Remove item"
                        >
                          {isRemoving === item._id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      {/* Price and Quantity */}
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div className="text-xl font-bold text-yellow-400">
                          ₹{item.price * item.quantity}
                          <span className="text-sm text-gray-400 ml-2">
                            (₹{item.price} each)
                          </span>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityUpdate(item._id!, item.quantity - 1)}
                            disabled={isUpdating === item._id || item.quantity <= 1}
                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isUpdating === item._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Minus className="w-4 h-4" />
                            )}
                          </button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityUpdate(item._id!, item.quantity + 1)}
                            disabled={isUpdating === item._id || item.quantity >= 10}
                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isUpdating === item._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Plus className="w-4 h-4" />
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
            )}
          </div>

          {/* Order Summary - Sticky on large screens */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal ({getItemCount()} items)</span>
                  <span>₹{cartTotal}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-green-400' : ''}>
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-yellow-400">
                    Add ₹{999 - cartTotal} more for free shipping!
                  </p>
                )}
                <hr className="border-gray-700" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-yellow-400">₹{finalTotal}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold py-3 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                Proceed to Checkout
                <ArrowRight className="w-5 h-5" />
              </button>

              <Link
                to="/shop"
                className="block text-center text-gray-400 hover:text-white mt-4 text-sm"
              >
                Continue Shopping
              </Link>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Secure Checkout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>100% Safe Payment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Easy Returns</span>
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
