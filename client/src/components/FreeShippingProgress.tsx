import React from 'react';
import { Truck, CheckCircle } from 'lucide-react';

interface FreeShippingProgressProps {
  currentOrderValue?: number; // Optional prop to display current order value if needed
}

const FreeShippingProgress: React.FC<FreeShippingProgressProps> = ({ currentOrderValue = 0 }) => {
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
              <p className="font-bold text-lg">🎉 FREE Delivery All Over India!</p>
              <p className="text-green-100 text-sm">
                Enjoy free delivery on all your orders.
              </p>
            </div>
          </div>
          {currentOrderValue > 0 && (
            <div className="flex items-center gap-2">
              <Truck className="w-8 h-8 text-white" />
              <div className="text-right">
                <p className="text-sm text-green-100">Order Value</p>
                <p className="font-bold">₹{currentOrderValue.toLocaleString('en-IN')}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Benefits */}
        <div className="mt-3 bg-white/10 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <span>✨ Free shipping</span>
            <span className="font-bold">₹0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeShippingProgress;
