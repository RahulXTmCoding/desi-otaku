import React, { useState, useEffect } from "react";
import { API } from "../backend";
import Base from "./Base";
import { loadCart, removeItemFromCart } from "./helper/cartHelper";
import Paymentb from "./Paymentb";
import { 
  ShoppingCart, 
  Package, 
  Trash2, 
  Plus, 
  Minus,
  X 
} from 'lucide-react';

interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  colorValue?: string;
  image?: string;
  type?: string;
  design?: string;
}

const Cart = () => {
  const [products, setProducts] = useState<CartItem[]>([]);
  const [reload, setReload] = useState(false);

  useEffect(() => {
    const cartItems = loadCart();
    setProducts(cartItems || []);
  }, [reload]);

  const handleRemoveItem = (productId: string) => {
    removeItemFromCart(productId);
    setReload(!reload);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const cart = loadCart();
    const updatedCart = cart.map((item: CartItem) => 
      item._id === productId ? { ...item, quantity: newQuantity } : item
    );
    
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setReload(!reload);
  };

  const getTotalAmount = () => {
    let amount = 0;
    products.forEach(p => {
      amount += (p.price || 0) * (p.quantity || 1);
    });
    return amount;
  };

  const getTotalItems = () => {
    return products.reduce((total, product) => total + (product.quantity || 1), 0);
  };

  const CartItemCard = ({ product }: { product: CartItem }) => {
    return (
      <div className="bg-gray-700 rounded-lg p-4 flex gap-4">
        {/* Product Image */}
        <div className="w-24 h-24 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
          ) : (
            <div className="text-3xl">👕</div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-white">{product.name}</h3>
              {product.type === 'custom' && product.design && (
                <p className="text-sm text-gray-400">Design: {product.design}</p>
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
              className="text-gray-400 hover:text-red-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Price and Quantity */}
          <div className="flex justify-between items-center mt-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateQuantity(product._id, (product.quantity || 1) - 1)}
                className="bg-gray-600 hover:bg-gray-500 p-1 rounded transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-medium w-8 text-center">{product.quantity || 1}</span>
              <button
                onClick={() => updateQuantity(product._id, (product.quantity || 1) + 1)}
                className="bg-gray-600 hover:bg-gray-500 p-1 rounded transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="text-right">
              <p className="text-yellow-400 font-bold">₹{(product.price || 0) * (product.quantity || 1)}</p>
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
          {products.length > 0 ? (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items - 2 columns */}
              <div className="lg:col-span-2">
                <div className="bg-gray-800 rounded-2xl p-6">
                  <h2 className="text-2xl font-bold mb-6 text-yellow-400 flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6" />
                    Your Cart ({getTotalItems()} items)
                  </h2>
                  <div className="space-y-4">
                    {products.map((product, index) => (
                      <div key={index}>
                        <CartItemCard product={product} />
                      </div>
                    ))}
                  </div>
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
                      <span>Subtotal ({getTotalItems()} items)</span>
                      <span>₹{getTotalAmount()}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Shipping</span>
                      <span className="text-green-400">FREE</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Tax</span>
                      <span>₹0</span>
                    </div>
                    <hr className="border-gray-700" />
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-yellow-400">₹{getTotalAmount()}</span>
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
                  <Paymentb products={products} setReload={setReload} />
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
