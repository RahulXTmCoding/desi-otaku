import React, { useState } from 'react';
import { X, ShoppingCart, Plus, Minus, Trash2, ChevronRight, Loader2, Cloud, CloudOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useDevMode } from '../context/DevModeContext';
import { isAutheticated } from '../auth/helper';
import { API } from '../backend';
import { getMockProductImage } from '../data/mockData';
import CartTShirtPreview from './CartTShirtPreview';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { isTestMode } = useDevMode();
  const { cart, loading, error, updateQuantity, removeFromCart, clearCart, getTotal, getItemCount } = useCart();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  
  const authData = isAutheticated();
  const isLoggedIn = !!(authData && authData.user);

  const getProductImage = (item: any) => {
    if (isTestMode) {
      return getMockProductImage(item._id?.split('-')[0] || '');
    }
    
    // For custom designs, we don't show a product image
    if (item.isCustom || item.type === 'custom' || item.category === 'custom') {
      return '';
    }
    
    // Check if product has images array (new multi-image structure)
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      // Find primary image or use first image
      const primaryImage = item.images.find((img: any) => img.isPrimary) || item.images[0];
      if (primaryImage) {
        // If it has a URL
        if (primaryImage.url) {
          return primaryImage.url;
        }
        // If it has binary data, use the product image endpoint with index
        if (item._id && !item._id.startsWith('temp_')) {
          const imageIndex = item.images.indexOf(primaryImage);
          return `${API}/product/image/${item._id}/${imageIndex}`;
        }
      }
    }
    
    // Check if product object has images array
    if (item.product && typeof item.product === 'object') {
      // If product has images array
      if (item.product.images && Array.isArray(item.product.images) && item.product.images.length > 0) {
        const primaryImage = item.product.images.find((img: any) => img.isPrimary) || item.product.images[0];
        if (primaryImage && primaryImage.url) {
          return primaryImage.url;
        } else if (item.product._id) {
          const imageIndex = item.product.images.indexOf(primaryImage);
          return `${API}/product/image/${item.product._id}/${imageIndex}`;
        }
      }
      // If product has photoUrl (legacy)
      else if (item.product.photoUrl) {
        return item.product.photoUrl;
      }
      // Try without index for older products
      else if (item.product._id) {
        // First try the old photo endpoint for legacy products
        return `${API}/product/photo/${item.product._id}`;
      }
    }
    
    // Check if product has photoUrl (legacy URL-based images)
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
        return `${API}/product/image/${item.product._id}`;
      }
      // If product is a string ID
      return `${API}/product/image/${item.product}`;
    }
    
    // Fallback to _id if not custom
    if (item._id && !item._id.startsWith('temp_') && !item._id.startsWith('custom')) {
      return `${API}/product/image/${item._id}`;
    }
    
    // Return a data URL placeholder instead of a relative path
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjNEI1NTYzIi8+CjxwYXRoIGQ9Ik00MCA0MEMzNS41ODE3IDQwIDMyIDQzLjU4MTcgMzIgNDhDMzIgNTIuNDE4MyAzNS41ODE3IDU2IDQwIDU2QzQ0LjQxODMgNTYgNDggNTIuNDE4MyA0OCA0OEM0OCA0My41ODE3IDQ0LjQxODMgNDAgNDAgNDBaIiBmaWxsPSIjNkI3MjgwIi8+CjxwYXRoIGQ9Ik0yNCAyOEMyNCAyNi44OTU0IDI0Ljg5NTQgMjYgMjYgMjZINTRDNTUuMTA0NiAyNiA1NiAyNi44OTU0IDU2IDI4VjM2SDI0VjI4WiIgZmlsbD0iIzZCNzI4MCIvPgo8L3N2Zz4=';
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

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  const handleContinueShopping = () => {
    onClose();
    navigate('/shop');
  };

  const cartTotal = getTotal();
  const shipping = cartTotal > 0 && cartTotal < 999 ? 79 : 0;
  const finalTotal = cartTotal + shipping;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity z-40 ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Cart Drawer */}
      <div
        className={`fixed right-0 top-0 h-screen w-full sm:w-96 shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex flex-col h-screen relative">
          {/* Header */}
          <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surfaceHover)' }}>
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Your Cart</h2>
              <span className="px-2 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primaryText)' }}>
                {getItemCount()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Sync Status Indicator */}
              <div className="flex items-center gap-1">
                {loading ? (
                  <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                ) : isLoggedIn ? (
                  <span title="Cart synced to account">
                    <Cloud className="w-4 h-4 text-green-400" />
                  </span>
                ) : (
                  <span title="Cart stored locally">
                    <CloudOff className="w-4 h-4" style={{ color: 'var(--color-textMuted)' }} />
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--color-text)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surfaceHover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Cart Items Area (scrollable) */}
          <div className="flex-1 overflow-hidden">
            {/* Error Message */}
            {error && (
              <div className="px-4 py-2 text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--color-error)' }}>
                {error}
              </div>
            )}
            
            <div className="h-full overflow-y-auto p-6" style={{ paddingBottom: cart.length > 0 ? '300px' : '24px' }}>
              {loading && cart.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
                </div>
              ) : cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-textMuted)' }} />
                  <p className="mb-6" style={{ color: 'var(--color-textMuted)' }}>Your cart is empty</p>
                  <button
                    onClick={handleContinueShopping}
                    className="px-6 py-3 rounded-lg font-semibold transition-colors"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primaryText)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primaryHover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item._id}
                      className={`rounded-lg p-4 transition-all ${
                        isRemoving === item._id ? 'opacity-50 scale-95' : ''
                      }`}
                      style={{ backgroundColor: 'var(--color-surfaceHover)' }}
                      onMouseEnter={(e) => !isRemoving && (e.currentTarget.style.backgroundColor = 'var(--color-border)')}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surfaceHover)'}
                    >
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: 'var(--color-border)' }}>
                          {item.isCustom && item.customization ? (
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
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjNEI1NTYzIi8+CjxwYXRoIGQ9Ik00MCA0MEMzNS41ODE3IDQwIDMyIDQzLjU4MTcgMzIgNDhDMzIgNTIuNDE4MyAzNS41ODE3IDU2IDQwIDU2QzQ0LjQxODMgNTYgNDggNTIuNDE4MyA0OCA0OEM0OCA0My41ODE3IDQ0LjQxODMgNDAgNDAgNDBaIiBmaWxsPSIjNkI3MjgwIi8+CjxwYXRoIGQ9Ik0yNCAyOEMyNCAyNi44OTU0IDI0Ljg5NTQgMjYgMjYgMjZINTRDNTUuMTA0NiAyNiA1NiAyNi44OTU0IDU2IDI4VjM2SDI0VjI4WiIgZmlsbD0iIzZCNzI4MCIvPgo8L3N2Zz4=';
                              }}
                            />
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1" style={{ color: 'var(--color-text)' }}>{item.name}</h3>
                          <div className="text-sm space-y-1" style={{ color: 'var(--color-textMuted)' }}>
                            <p>Size: {item.size}</p>
                            <p>Color: {item.color}</p>
                            {item.isCustom && (
                              <p className="text-xs" style={{ color: 'var(--color-primary)' }}>Custom Design</p>
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="font-bold" style={{ color: 'var(--color-primary)' }}>₹{item.price}</p>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleQuantityUpdate(item._id!, item.quantity - 1)}
                            disabled={isUpdating === item._id || item.quantity <= 1}
                            className="p-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }}
                            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'var(--color-borderHover)')}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-border)'}
                          >
                            {isUpdating === item._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Minus className="w-4 h-4" />
                            )}
                          </button>
                          <span className="w-8 text-center" style={{ color: 'var(--color-text)' }}>{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityUpdate(item._id!, item.quantity + 1)}
                            disabled={isUpdating === item._id}
                            className="p-1 rounded transition-colors disabled:opacity-50"
                            style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }}
                            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'var(--color-borderHover)')}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-border)'}
                          >
                            {isUpdating === item._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item._id!)}
                          disabled={isRemoving === item._id}
                          className="p-2 transition-colors disabled:opacity-50"
                          style={{ color: 'var(--color-textMuted)' }}
                          onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.color = 'var(--color-error)')}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-textMuted)'}
                        >
                          {isRemoving === item._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4" style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)' }}>
              {/* Price Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--color-textMuted)' }}>Subtotal</span>
                  <span style={{ color: 'var(--color-text)' }}>₹{cartTotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--color-textMuted)' }}>Shipping</span>
                  <span style={{ color: shipping === 0 ? 'var(--color-success)' : 'var(--color-text)' }}>
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs" style={{ color: 'var(--color-warning)' }}>
                    Add ₹{999 - cartTotal} more for free shipping
                  </p>
                )}
                <div className="flex justify-between font-bold text-lg pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text)' }}>Total</span>
                  <span style={{ color: 'var(--color-primary)' }}>₹{finalTotal}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleCheckout}
                  className="w-full py-4 rounded-lg font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primaryText)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primaryHover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
                >
                  Proceed to Checkout
                  <ChevronRight className="w-5 h-5" />
                </button>

                <button
                  onClick={handleContinueShopping}
                  className="w-full py-3 transition-colors"
                  style={{ color: 'var(--color-textMuted)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-textMuted)'}
                >
                  Continue Shopping
                </button>

                {cart.length > 1 && (
                  <button
                    onClick={handleClearCart}
                    className="w-full py-2 transition-colors text-sm"
                    style={{ color: 'var(--color-error)' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              {/* Sync Status Info */}
              <div className="text-xs text-center pt-2" style={{ color: 'var(--color-textMuted)', borderTop: '1px solid var(--color-border)' }}>
                {isLoggedIn ? (
                  <span className="flex items-center justify-center gap-1">
                    <Cloud className="w-3 h-3" />
                    Cart saved to your account
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1">
                    <CloudOff className="w-3 h-3" />
                    Sign in to save your cart
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
