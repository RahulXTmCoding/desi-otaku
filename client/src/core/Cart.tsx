import React from "react";
import { API } from "../backend";
import Base from "./Base";
import { useCart } from "../context/CartContext";
import { useDevMode } from "../context/DevModeContext";
import { getMockProductImage } from "../data/mockData";
import Paymentb from "./Paymentb";
import CartTShirtPreview from "../components/CartTShirtPreview";
import { 
  ShoppingCart, 
  Package, 
  Trash2, 
  Plus, 
  Minus,
  X,
  ArrowRight,
  Loader2
} from 'lucide-react';

const Cart = () => {
  const { cart, loading, error, updateQuantity, removeFromCart, clearCart, getTotal, getItemCount } = useCart();
  const { isTestMode } = useDevMode();
  const [isUpdating, setIsUpdating] = React.useState<string | null>(null);
  const [isRemoving, setIsRemoving] = React.useState<string | null>(null);

  const getProductImage = (item: any) => {
    if (isTestMode) {
      return getMockProductImage(item._id?.split('-')[0] || '');
    }
    
    // For custom designs, we don't show a product image
    if (item.isCustom || item.type === 'custom' || item.category === 'custom') {
      return '';
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

  const CartItemCard = ({ product }: { product: any }) => {
    const isCustomDesign = product.isCustom || product.type === 'custom' || product.category === 'custom';
    
    return (
      <div className="bg-gray-700 rounded-lg p-4 flex gap-4">
        {/* Product Image */}
        <div className="w-24 h-24 bg-gray-600 rounded-lg overflow-hidden flex-shrink-0">
          {isCustomDesign && product.customization ? (
            <CartTShirtPreview
              design={product.design}
              color={product.color}
              colorValue={product.colorValue || "#000000"}
              image={product.image}
              customization={{
                frontDesign: product.customization.frontDesign ? {
                  designImage: product.customization.frontDesign.designImage,
                  position: product.customization.frontDesign.position
                } : undefined,
                backDesign: product.customization.backDesign ? {
                  designImage: product.customization.backDesign.designImage,
                  position: product.customization.backDesign.position
                } : undefined
              }}
            />
          ) : getProductImage(product) ? (
            <img 
              src={getProductImage(product)} 
              alt={product.name} 
              className="w-full h-full object-cover"
              onError={(e: any) => {
                e.target.onerror = null;
                e.target.src = '/placeholder.png';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">👕</div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-white">{product.name}</h3>
              {isCustomDesign && (
                <p className="text-sm text-yellow-400">Custom Design</p>
              )}
              <div className="flex gap-4 mt-1 text-sm text-gray-400">
                {product.size && <span>Size: {product.size}</span>}
                {product.color && (
                  <span className="flex items-center gap-1">
                    Color: 
                    <span 
                      className="w-4 h-4 rounded-full border border-gray-500 inline-block"
                      style={{ backgroundColor: product.colorValue || '#000' }}
                    />
                    {product.color}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleRemoveItem(product._id)}
              disabled={isRemoving === product._id}
              className="text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              {isRemoving === product._id ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <X className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Price and Quantity */}
          <div className="flex justify-between items-center mt-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleQuantityUpdate(product._id, product.quantity - 1)}
                disabled={isUpdating === product._id || product.quantity <= 1}
                className="bg-gray-600 hover:bg-gray-500 p-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating === product._id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Minus className="w-4 h-4" />
                )}
              </button>
              <span className="font-medium w-8 text-center">{product.quantity}</span>
              <button
                onClick={() => handleQuantityUpdate(product._id, product.quantity + 1)}
                disabled={isUpdating === product._id}
                className="bg-gray-600 hover:bg-gray-500 p-1 rounded transition-colors disabled:opacity-50"
              >
                {isUpdating === product._id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="text-right">
              <p className="text-yellow-400 font-bold">₹{product.price * product.quantity}</p>
              <p className="text-xs text-gray-400">₹{product.price} each</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Base title="Shopping Cart" description="Review your items before checkout">
      <div className="min-h-screen bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          {loading && cart.length === 0 ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
            </div>
          ) : cart.length > 0 ? (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items - 2 columns */}
              <div className="lg:col-span-2">
                <div className="bg-gray-800 rounded-2xl p-6">
                  <h2 className="text-2xl font-bold mb-6 text-yellow-400 flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6" />
                    Your Cart ({getItemCount()} items)
                  </h2>
                  
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg mb-4">
                      {error}
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {cart.map((product) => (
                      <CartItemCard key={product._id} product={product} />
                    ))}
                  </div>
                  
                  {cart.length > 1 && (
                    <button
                      onClick={handleClearCart}
                      className="mt-4 text-red-400 hover:text-red-300 transition-colors text-sm"
                    >
                      Clear Cart
                    </button>
                  )}
                </div>
              </div>

              {/* Checkout Section - 1 column */}
              <div className="lg:col-span-1">
                <div className="bg-gray-800 rounded-2xl p-6 sticky top-24">
                  <h2 className="text-2xl font-bold mb-4 text-yellow-400 flex items-center gap-2">
                    <Package className="w-6 h-6" />
                    Order Summary
                  </h2>
                  
                  {/* Order Details */}
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
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-yellow-400">₹{finalTotal}</span>
                    </div>
                  </div>

                  {/* Promo Code */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Promo Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter code"
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                      />
                      <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                        Apply
                      </button>
                    </div>
                  </div>

                  {/* Checkout Section */}
                  <Paymentb products={cart} setReload={() => {}} />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="bg-gray-800 rounded-2xl p-12 max-w-md mx-auto">
                <ShoppingCart className="w-20 h-20 mx-auto mb-4 text-gray-600" />
                <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
                <p className="text-gray-400 mb-6">Add some awesome anime t-shirts to get started!</p>
                <a
                  href="/shop"
                  className="inline-block bg-yellow-400 hover:bg-yellow-300 text-gray-900 py-3 px-8 rounded-lg font-bold transition-all transform hover:scale-105"
                >
                  Continue Shopping
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </Base>
  );
};

export default Cart;
