import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { loadCart, updateCartItemQuantity, removeItemFromCart } from '../core/helper/cartHelper';
import { API } from '../backend';
import CartTShirtPreview from '../components/CartTShirtPreview';
// Temporary test import for debugging
import '../utils/testCustomDesign';

interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  colorValue?: string;
  image?: string;
  category?: string | { _id: string; name: string };
  design?: string;
  designPrice?: number;
  isCustom?: boolean;
  customization?: {
    frontDesign?: {
      designId: string;
      designImage: string;
      position: string;
      price: number;
    } | null;
    backDesign?: {
      designId: string;
      designImage: string;
      position: string;
      price: number;
    } | null;
  };
}

const Cart: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCartItems();
  }, []);

  const loadCartItems = () => {
    const items = loadCart();
    setCartItems(items);
    setLoading(false);
  };

  const handleRemoveItem = (productId: string) => {
    removeItemFromCart(productId, () => {
      loadCartItems();
    });
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    if (newQuantity > 10) {
      alert('Maximum quantity per item is 10');
      return;
    }
    updateCartItemQuantity(productId, newQuantity, () => {
      loadCartItems();
    });
  };

  const getImageUrl = (item: CartItem) => {
    if (item.image) {
      if (item.image.startsWith('http')) {
        return item.image;
      }
      return item.image;
    }
    return `${API}/product/photo/${item._id}`;
  };

  const getSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getShippingCost = () => {
    const subtotal = getSubtotal();
    return subtotal >= 999 ? 0 : 99;
  };

  const getTotalAmount = () => {
    return getSubtotal() + getShippingCost();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
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
          <p className="text-gray-400 mt-2">{cartItems.length} items in your cart</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items - Takes 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item._id}
                className="bg-gray-800 rounded-xl p-4 md:p-6 border border-gray-700"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Product Image */}
                  <div className="w-full sm:w-32 h-40 sm:h-32 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                    {(item.category === 'custom' || item.isCustom) && (item.design || item.customization) ? (
                      <CartTShirtPreview
                        design={item.design}
                        color={item.color}
                        colorValue={item.colorValue}
                        image={item.image}
                        customization={item.customization}
                      />
                    ) : (
                      <img
                        src={getImageUrl(item)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/200?text=Product';
                        }}
                      />
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        {item.category === 'custom' && (
                          <>
                            {item.customization?.frontDesign && item.customization?.backDesign ? (
                              <p className="text-sm text-gray-400">
                                Custom Design: Front & Back
                              </p>
                            ) : item.customization?.frontDesign ? (
                              <p className="text-sm text-gray-400">
                                Custom Design: Front Only
                              </p>
                            ) : item.customization?.backDesign ? (
                              <p className="text-sm text-gray-400">
                                Custom Design: Back Only
                              </p>
                            ) : item.design ? (
                              <p className="text-sm text-gray-400">Custom Design: {item.design}</p>
                            ) : null}
                          </>
                        )}
                        <div className="flex gap-4 mt-1 text-sm text-gray-400">
                          {item.size && <span>Size: {item.size}</span>}
                          {item.color && (
                            <span className="flex items-center gap-1">
                              Color: 
                              <span
                                className="w-4 h-4 rounded-full border border-gray-600 inline-block"
                                style={{ backgroundColor: item.colorValue || '#FFFFFF' }}
                              />
                              {item.color}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item._id)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Price and Quantity */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div className="text-xl font-bold text-yellow-400">
                        ₹{item.price}
                        {(item.designPrice || (item.customization && (item.customization.frontDesign || item.customization.backDesign))) && (
                          <span className="text-sm text-gray-400 ml-2">
                            {item.customization ? (
                              <>
                                (incl. 
                                {item.customization.frontDesign && ` Front: ₹${item.customization.frontDesign.price}`}
                                {item.customization.frontDesign && item.customization.backDesign && ' + '}
                                {item.customization.backDesign && ` Back: ₹${item.customization.backDesign.price}`}
                                )
                              </>
                            ) : (
                              `(incl. ₹${item.designPrice} design fee)`
                            )}
                          </span>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                          disabled={item.quantity >= 10}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary - Sticky on large screens */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span>₹{getSubtotal()}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Shipping</span>
                  <span className={getShippingCost() === 0 ? 'text-green-400' : ''}>
                    {getShippingCost() === 0 ? 'FREE' : `₹${getShippingCost()}`}
                  </span>
                </div>
                {getShippingCost() > 0 && (
                  <p className="text-xs text-yellow-400">
                    Add ₹{999 - getSubtotal()} more for free shipping!
                  </p>
                )}
                <hr className="border-gray-700" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-yellow-400">₹{getTotalAmount()}</span>
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
