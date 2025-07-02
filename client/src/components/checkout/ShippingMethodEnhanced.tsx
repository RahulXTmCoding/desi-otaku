import React, { useState, useEffect } from 'react';
import { Truck, Package, Info } from 'lucide-react';

interface ShippingMethodProps {
  selectedShipping: any;
  onSelectShipping: (shipping: any) => void;
  shippingPincode?: string;
  cartTotal?: number;
}

const ShippingMethodEnhanced: React.FC<ShippingMethodProps> = ({
  selectedShipping,
  onSelectShipping,
  shippingPincode = '',
  cartTotal = 0
}) => {
  // Check if free shipping applies (orders above ₹1000)
  const isFreeShipping = cartTotal >= 1000;

  // Fixed shipping options
  const baseShippingOptions = [
    {
      courier_company_id: "standard",
      courier_name: "Standard Delivery",
      rate: 60,
      etd: "5-7 business days",
      cod: true
    },
    {
      courier_company_id: "express", 
      courier_name: "Express Delivery",
      rate: 120,
      etd: "2-3 business days",
      cod: true
    }
  ];

  // Apply free shipping if applicable
  const shippingOptions = baseShippingOptions.map(option => ({
    ...option,
    rate: isFreeShipping ? 0 : option.rate
  }));

  // Auto-select first option on mount or when pincode is valid
  useEffect(() => {
    if (shippingPincode && shippingPincode.length === 6 && !selectedShipping) {
      onSelectShipping(shippingOptions[0]);
    }
  }, [shippingPincode]);

  // Update selected shipping when free shipping status changes
  useEffect(() => {
    if (selectedShipping) {
      const updatedOption = shippingOptions.find(
        opt => opt.courier_company_id === selectedShipping.courier_company_id
      );
      if (updatedOption) {
        onSelectShipping(updatedOption);
      }
    }
  }, [isFreeShipping]);

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">Select Shipping Method</h3>
      
      {/* Free Shipping Banner */}
      {isFreeShipping && (
        <div className="mb-4 p-3 bg-green-600/20 border border-green-600 rounded-lg flex items-center gap-2">
          <Package className="w-5 h-5 text-green-400" />
          <span className="text-green-400 font-medium">
            Congratulations! You qualify for FREE shipping on this order!
          </span>
        </div>
      )}
      
      {/* Minimum for Free Shipping Info */}
      {!isFreeShipping && cartTotal > 0 && (
        <div className="mb-4 p-3 bg-blue-600/20 border border-blue-600 rounded-lg flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-400" />
          <span className="text-blue-400 text-sm">
            Add ₹{(1000 - cartTotal).toFixed(2)} more to qualify for FREE shipping!
          </span>
        </div>
      )}

      {!shippingPincode && (
        <div className="text-gray-400 text-sm">
          Please enter a valid pincode in the address form to see shipping options.
        </div>
      )}

      {shippingPincode && shippingPincode.length === 6 && shippingOptions.length > 0 && (
        <div className="space-y-3">
          {shippingOptions.map((option) => (
            <label
              key={option.courier_company_id}
              className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedShipping?.courier_company_id === option.courier_company_id
                  ? 'bg-gray-700 border-yellow-400'
                  : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
              }`}
            >
              <input
                type="radio"
                name="shipping"
                value={option.courier_company_id}
                checked={selectedShipping?.courier_company_id === option.courier_company_id}
                onChange={() => onSelectShipping(option)}
                className="sr-only"
              />
              
              <div className="flex items-center justify-between w-full">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedShipping?.courier_company_id === option.courier_company_id
                        ? 'border-yellow-400 bg-yellow-400'
                        : 'border-gray-400'
                    }`}
                  >
                    {selectedShipping?.courier_company_id === option.courier_company_id && (
                      <div className="w-2 h-2 bg-gray-900 rounded-full" />
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-white">{option.courier_name}</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      Estimated delivery: {option.etd}
                    </p>
                    {option.cod && (
                      <p className="text-xs text-gray-500 mt-1">Cash on Delivery available</p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  {isFreeShipping ? (
                    <div>
                      <p className="text-sm text-gray-400 line-through">₹{option.rate || 0}</p>
                      <p className="font-bold text-green-400">FREE</p>
                    </div>
                  ) : (
                    <p className="font-bold text-white">₹{option.rate || 0}</p>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>
      )}

      {/* Shipping Information */}
      <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
        <h4 className="font-medium text-yellow-400 mb-2">Shipping Information</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Free shipping on orders above ₹1000</li>
          <li>• Delivery times are estimates and may vary</li>
          <li>• Tracking information will be sent via email</li>
          <li>• Cash on Delivery available for most locations</li>
        </ul>
      </div>
    </div>
  );
};

export default ShippingMethodEnhanced;
