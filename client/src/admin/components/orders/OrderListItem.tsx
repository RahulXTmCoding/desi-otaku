import React from 'react';
import { ChevronDown, Loader, Mail, Phone, MapPin, Package } from 'lucide-react';
import { format } from 'date-fns';
import { Order } from './types';
import OrderStatusBadge from './OrderStatusBadge';
import CartTShirtPreview from '../../../components/CartTShirtPreview';
import { getProductImageUrl } from './utils/imageHelper';

interface OrderListItemProps {
  order: Order;
  isExpanded: boolean;
  isSelected: boolean;
  isUpdating: boolean;
  onToggleExpand: () => void;
  onToggleSelect: () => void;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
  onAddNote?: (orderId: string) => void;
  onViewDetails: (order: Order) => void;
}

const OrderListItem: React.FC<OrderListItemProps> = ({
  order,
  isExpanded,
  isSelected,
  isUpdating,
  onToggleExpand,
  onToggleSelect,
  onStatusUpdate,
  onAddNote,
  onViewDetails
}) => {
  const orderStatuses = ['Received', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      {/* Order Header */}
      <div 
        className="p-6 cursor-pointer hover:bg-gray-750 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelect();
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded border-gray-600 text-yellow-400 focus:ring-yellow-400"
            />
            <div>
              <h3 className="font-mono text-yellow-400 font-medium">
                Order #{order._id.slice(-8).toUpperCase()}
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {format(new Date(order.createdAt), 'PPpp')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <OrderStatusBadge status={order.status} />
            <div className="text-right">
              <p className="text-2xl font-bold">₹{order.amount}</p>
              <p className="text-sm text-gray-400">{order.products.length} items</p>
            </div>
            <ChevronDown 
              className={`w-5 h-5 text-gray-400 transform transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* Expanded Order Details */}
      {isExpanded && (
        <div className="border-t border-gray-700 p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Customer Info */}
            <div>
              <h4 className="font-semibold mb-3 text-gray-300">Customer Information</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Name:</span>
                  <span>{order.user?.name || 'Guest'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>{order.user?.email}</span>
                </div>
                {order.user?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{order.user.phone}</span>
                  </div>
                )}
                {order.shippingAddress && (
                  <div className="flex items-start gap-2 text-sm mt-3">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                    <span className="text-gray-300">
                      {order.shippingAddress.addressLine1}, {order.shippingAddress.city}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Status & Actions */}
            <div>
              <h4 className="font-semibold mb-3 text-gray-300">Order Status</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">
                    Transaction: {order.transaction_id ? order.transaction_id.slice(0, 12) + '...' : 'N/A'}
                  </span>
                </div>
                
                {/* Status Update Dropdown */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-400">Update Status:</label>
                  <select
                    value={order.status || 'Processing'}
                    onChange={(e) => onStatusUpdate(order._id, e.target.value)}
                    disabled={isUpdating}
                    className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                  >
                    {orderStatuses.map(status => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  {isUpdating && (
                    <Loader className="w-4 h-4 animate-spin text-yellow-400" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mt-6">
            <h4 className="font-semibold mb-3 text-gray-300">Order Items</h4>
            <div className="bg-gray-900 rounded-lg p-4 space-y-3">
              {order.products.map((item, index) => (
                <div key={index} className="flex items-center gap-4 pb-3 border-b border-gray-800 last:border-0">
                  {/* Product Image */}
                  <div className="w-16 h-16 flex-shrink-0">
                    {item.isCustom || item.designId ? (
                      <CartTShirtPreview
                        design={item.name}
                        color={item.color || 'White'}
                        image={getProductImageUrl(item)}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 rounded flex items-center justify-center">
                        <img
                          src={getProductImageUrl(item)}
                          alt={item.name}
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.png';
                            (e.target as HTMLImageElement).onerror = null;
                          }}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Product Details */}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-400">
                      {item.size && `Size: ${item.size} • `}
                      {item.color && `Color: ${item.color} • `}
                      Qty: {item.count}
                    </p>
                    {item.isCustom && (
                      <p className="text-xs text-yellow-400">Custom Design</p>
                    )}
                  </div>
                  
                  {/* Price */}
                  <div className="text-right">
                    <p className="text-sm text-gray-400">₹{item.price} × {item.count}</p>
                    <p className="font-medium">₹{item.price * item.count}</p>
                  </div>
                </div>
              ))}
              
              {/* Total */}
              <div className="pt-3 border-t border-gray-700 flex justify-between items-center">
                <p className="font-semibold">Total Amount</p>
                <p className="text-xl font-bold text-yellow-400">₹{order.amount}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => onViewDetails(order)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
            >
              View Full Details
            </button>
            {onAddNote && (
              <button
                onClick={() => onAddNote(order._id)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
              >
                Add Note
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderListItem;
