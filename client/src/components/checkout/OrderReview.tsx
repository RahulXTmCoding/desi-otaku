import React, { memo } from 'react';
import { Package, MapPin, Truck, Clock, Home, CreditCard, Shield } from 'lucide-react';

interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  colorValue?: string;
  image?: string;
}

interface OrderReviewProps {
  cartItems: CartItem[];
  shippingInfo: any;
  selectedShipping: any;
  getTotalAmount: () => number;
}

const OrderReview: React.FC<OrderReviewProps> = memo(({
  cartItems,
  shippingInfo,
  selectedShipping,
  getTotalAmount
}) => {
  return (
    <>
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Package className="w-6 h-6 text-yellow-400" />
        Review Your Order
      </h2>
      
      {/* Order Items */}
      <div className="mb-8">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span className="text-lg">Order Items</span>
          <span className="text-sm text-gray-400 bg-gray-700 px-2 py-1 rounded">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
          </span>
        </h3>
        <div className="space-y-4">
          {cartItems.map((item) => (
            <OrderItemCard key={item._id} item={item} />
          ))}
        </div>
      </div>

      {/* Shipping & Delivery Info */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Shipping Address */}
        <ShippingAddressCard shippingInfo={shippingInfo} />
        
        {/* Delivery Method */}
        <DeliveryMethodCard selectedShipping={selectedShipping} />
      </div>

      {/* Order Summary */}
      <OrderSummaryCard
        cartItems={cartItems}
        selectedShipping={selectedShipping}
        getTotalAmount={getTotalAmount}
      />
    </>
  );
});

// Separate component for order items
const OrderItemCard = memo(({ item }: { item: CartItem }) => {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
      {/* Product Image */}
      {item.image && (
        <div className="w-20 h-20 bg-gray-600 rounded-lg overflow-hidden flex-shrink-0">
          <img 
            src={item.image} 
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="flex-1">
        <p className="font-medium text-white">{item.name}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-sm text-gray-400">Size: {item.size}</span>
          <span className="text-gray-500">•</span>
          <span className="text-sm text-gray-400">Color: {item.color}</span>
          <span className="text-gray-500">•</span>
          <span className="text-sm text-gray-400">Qty: {item.quantity}</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          ₹{item.price} each
        </p>
      </div>
      
      <div className="text-right">
        <p className="font-bold text-lg text-white">₹{item.price * item.quantity}</p>
      </div>
    </div>
  );
});

// Separate component for shipping address
const ShippingAddressCard = memo(({ shippingInfo }: { shippingInfo: any }) => {
  return (
    <div>
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-yellow-400" />
        Shipping Address
      </h3>
      <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
        <div className="flex items-start gap-3">
          <Home className="w-5 h-5 text-gray-400 mt-1" />
          <div className="space-y-1">
            <p className="font-medium text-white">{shippingInfo.fullName}</p>
            <p className="text-sm text-gray-300">{shippingInfo.phone}</p>
            <p className="text-sm text-gray-400">
              {shippingInfo.address}<br />
              {shippingInfo.city}, {shippingInfo.state} - {shippingInfo.pinCode}
            </p>
            <p className="text-sm text-gray-500">{shippingInfo.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
});

// Separate component for delivery method
const DeliveryMethodCard = memo(({ selectedShipping }: { selectedShipping: any }) => {
  return (
    <div>
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Truck className="w-5 h-5 text-yellow-400" />
        Delivery Method
      </h3>
      <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-gray-400 mt-1" />
          <div className="flex-1">
            <p className="font-medium text-white">{selectedShipping?.courier_name}</p>
            <p className="text-sm text-gray-400 mt-1">
              Estimated delivery: {selectedShipping?.estimated_delivery}
            </p>
            <div className="mt-3 pt-3 border-t border-gray-600">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Shipping Cost</span>
                <span className="font-medium text-white">₹{selectedShipping?.rate || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// Separate component for order summary
const OrderSummaryCard = memo(({ cartItems, selectedShipping, getTotalAmount }: any) => {
  const subtotal = getTotalAmount();
  const shippingCost = selectedShipping?.rate || 0;
  const total = subtotal + shippingCost;

  return (
    <div className="bg-gradient-to-r from-gray-700/50 to-gray-700/30 rounded-lg p-6 border border-gray-600">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-yellow-400" />
        Order Summary
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Subtotal ({cartItems.length} items)</span>
          <span className="text-white">₹{subtotal}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Shipping & Handling</span>
          <span className="text-white">₹{shippingCost}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Tax (Included)</span>
          <span className="text-white">₹0</span>
        </div>
        <div className="border-t border-gray-600 pt-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-white">Total Amount</span>
            <span className="text-2xl font-bold text-yellow-400">
              ₹{total}
            </span>
          </div>
        </div>
      </div>
      
      {/* Additional Info */}
      <div className="mt-4 pt-4 border-t border-gray-600">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-green-400 mt-0.5" />
          <div>
            <p className="text-sm text-gray-400">
              Your order is protected by our secure payment system
            </p>
            <p className="text-xs text-gray-500 mt-1">
              All transactions are encrypted and secure
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

OrderReview.displayName = 'OrderReview';
OrderItemCard.displayName = 'OrderItemCard';
ShippingAddressCard.displayName = 'ShippingAddressCard';
DeliveryMethodCard.displayName = 'DeliveryMethodCard';
OrderSummaryCard.displayName = 'OrderSummaryCard';

export default OrderReview;
