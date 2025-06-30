import React, { useEffect, useState } from 'react';
import { Product } from '../types';

interface CartItem extends Product {
  quantity: number;
}

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(items);
  }, []);

  const removeFromCart = (id: string) => {
    const updatedCart = cartItems.filter(item => item.id !== id);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    const updatedCart = cartItems.map(item =>
      item.id === id ? { ...item, quantity } : item
    );
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <>
      <h1 className="text-5xl font-extrabold text-center py-20">Shopping Cart</h1>
      <div className="container mx-auto px-6 py-8">
        {cartItems.length === 0 ? (
          <div className="bg-gray-900 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-lg p-8">
            {cartItems.map((item: CartItem) => (
              <div key={item.id} className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg mr-4" />
                  <div>
                    <h3 className="text-xl font-semibold">{item.name}</h3>
                    <p className="text-lg text-yellow-400 font-bold">₹{item.price}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateQuantity(item.id, parseInt(e.target.value))}
                    className="bg-gray-800 p-2 rounded w-20 text-center"
                  />
                  <button onClick={() => removeFromCart(item.id)} className="ml-4 text-red-500">Remove</button>
                </div>
              </div>
            ))}
            <div className="text-right text-2xl font-bold mt-8">
              Total: ₹{getTotalPrice()}
            </div>
            <div className="text-right mt-4">
              <a href="/checkout" className="bg-yellow-400 text-black font-bold py-3 px-8 rounded-full text-lg hover:bg-yellow-300 transition">
                Checkout
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
