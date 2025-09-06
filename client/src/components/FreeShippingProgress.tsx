import React from 'react';
import { useCart } from '../context/CartContext';
import { Truck, CheckCircle, Target } from 'lucide-react';

const FreeShippingProgress: React.FC = () => {
  const { getShippingProgress, getItemCount } = useCart();
  const { current, needed, percentage } = getShippingProgress();
  const itemCount = getItemCount();
  
  // Don't show if cart is empty
  if (itemCount === 0) return null;
  
  if (needed === 0) {
    // User has qualified for free shipping
    return (
      <div className="rounded-lg overflow-hidden mb-4 border" style={{ borderColor: 'var(--color-border)' }}>
        <div 
          className="p-4"
          style={{ 
            background: 'linear-gradient(135deg, #059669, #047857)',
            color: 'white'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-lg">🎉 FREE Shipping Unlocked!</p>
                <p className="text-green-100 text-sm">
                  Your order qualifies for free delivery
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-8 h-8 text-white" />
              <div className="text-right">
                <p className="text-sm text-green-100">Order Value</p>
                <p className="font-bold">₹{current.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
          
          {/* Benefits */}
          <div className="mt-3 bg-white/10 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span>✨ Free shipping</span>
              <span className="font-bold">₹0</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span>🚚 Fast delivery</span>
              <span className="text-green-200">3-5 business days</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // User needs more for free shipping
  return (
    <div className="rounded-lg overflow-hidden mb-4 border" style={{ borderColor: 'var(--color-border)' }}>
      <div 
        className="p-4"
        style={{ 
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          color: 'white'
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-lg">
                Add ₹{needed.toLocaleString('en-IN')} more for FREE shipping! 🚚
              </p>
              <p className="text-blue-100 text-sm">
                Save on delivery charges - you're {Math.round(percentage)}% there
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">Current</p>
            <p className="font-bold text-xl">₹{current.toLocaleString('en-IN')}</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-sm text-blue-100 mb-2">
            <span>₹{current.toLocaleString('en-IN')}</span>
            <span className="font-medium">₹1,000 for FREE shipping</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
            <div 
              className="h-3 rounded-full transition-all duration-700 bg-gradient-to-r from-white to-yellow-300" 
              style={{ width: `${Math.min(100, percentage)}%` }}
            />
          </div>
          <div className="text-center mt-2">
            <span className="text-sm font-medium text-blue-100">
              {Math.round(percentage)}% completed
            </span>
          </div>
        </div>
        
        {/* Shipping cost comparison */}
        <div className="bg-white/10 rounded-lg p-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-blue-200">Current shipping:</p>
              <p className="font-bold text-red-300">₹99</p>
            </div>
            <div>
              <p className="text-blue-200">With free shipping:</p>
              <p className="font-bold text-green-300">₹0 (Save ₹99!)</p>
            </div>
          </div>
        </div>
        
        {/* Motivation section */}
        <div className="mt-3 flex items-center justify-between bg-white/10 rounded-lg p-2">
          <span className="text-sm font-medium">Keep shopping to save on delivery!</span>
          <div className="flex items-center gap-1 text-yellow-300">
            <Truck className="w-4 h-4" />
            <span className="text-sm font-bold">₹{needed.toLocaleString('en-IN')} to go</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeShippingProgress;
