import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Plus, Minus, Trash2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loadCart, removeItemFromCart, updateCartItemQuantity } from '../core/helper/cartHelper';
import { useDevMode } from '../context/DevModeContext';
import { API } from '../backend';
import { getMockProductImage } from '../data/mockData';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { isTestMode } = useDevMode();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCartItems();
    }
  }, [isOpen]);

  const loadCartItems = () => {
    const items = loadCart();
    setCartItems(items);
    calculateTotal(items);
  };

  const calculateTotal = (items: any[]) => {
    const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    setCartTotal(total);
  };

  const getProductImage = (item: any) => {
    if (isTestMode) {
      return getMockProductImage(item._id.split('-')[0]);
    }
    if (item.image) {
      return item.image;
    }
    return `${API}/product/photo/${item._id.split('-')[0]}`;
  };

  const handleQuantityUpdate = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setIsUpdating(itemId);
    try {
      updateCartItemQuantity(itemId, newQuantity, () => {
        loadCartItems();
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    removeItemFromCart(itemId, () => {
      loadCartItems();
    });
  };

  const handleCheckout = () => {
    onClose();
    navigate('/enhanced-checkout');
  };

  const handleContinueShopping = () => {
    onClose();
    navigate('/shop');
  };

  const shipping = cartTotal > 0 && cartTotal < 1000 ? 99 : 0;
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
        className={`fixed right-0 top-0 h-full w-full md:w-96 bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-bold">Your Cart</h2>
              <span className="bg-yellow-400 text-gray-900 px-2 py-1 rounded-full text-sm font-semibold">
                {cartItems.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {cartItems.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 mb-6">Your cart is empty</p>
                <button
                  onClick={handleContinueShopping}
                  className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item._id}
                    className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={getProductImage(item)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/api/placeholder/80/80';
                          }}
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{item.name}</h3>
                        <div className="text-sm text-gray-400 space-y-1">
                          <p>Size: {item.size}</p>
                          <p>Color: {item.color}</p>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="font-bold text-yellow-400">₹{item.price}</p>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleQuantityUpdate(item._id, item.quantity - 1)}
                          disabled={isUpdating === item._id || item.quantity <= 1}
                          className="p-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityUpdate(item._id, item.quantity + 1)}
                          disabled={isUpdating === item._id}
                          className="p-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item._id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className="border-t border-gray-800 p-6 space-y-4">
              {/* Price Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span>₹{cartTotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Shipping</span>
                  <span className={shipping === 0 ? 'text-green-400' : ''}>
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-gray-400">
                    Add ₹{1000 - cartTotal} more for free shipping
                  </p>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-700">
                  <span>Total</span>
                  <span className="text-yellow-400">₹{finalTotal}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                className="w-full bg-yellow-400 text-gray-900 py-4 rounded-lg font-bold hover:bg-yellow-300 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                Proceed to Checkout
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Continue Shopping */}
              <button
                onClick={handleContinueShopping}
                className="w-full py-3 text-gray-400 hover:text-white transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
