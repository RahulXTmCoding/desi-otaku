import React from 'react';
import { X, User, Package, Truck, Clock, Printer, Copy, Download } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import { Order } from './types';
import CartTShirtPreview from '../../../components/CartTShirtPreview';
import { getProductImageUrl } from './utils/imageHelper';
import { API } from '../../../backend';

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, onClose }) => {
  const invoiceRef = React.useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${order._id}`
  });

  const copyOrderId = () => {
    navigator.clipboard.writeText(order._id);
    toast.success('Order ID copied to clipboard');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">Order Details</h2>
            <p className="text-gray-400">Order #{order._id.slice(-8).toUpperCase()}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Customer Info */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-yellow-400" />
              Customer Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Name</p>
                <p className="font-medium">{order.user ? order.user.name : order.guestInfo?.name || 'Guest'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Email</p>
                <p className="font-medium">{order.user ? order.user.email : order.guestInfo?.email || 'N/A'}</p>
              </div>
              {(order.user?.phone || order.guestInfo?.phone) && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Phone</p>
                  <p className="font-medium">{order.user ? order.user.phone : order.guestInfo?.phone}</p>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Order Date</p>
                <p className="font-medium">{format(new Date(order.createdAt), 'PPpp')}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-yellow-400" />
              Order Items
            </h3>
            <div className="space-y-4">
              {order.products.map((item, index) => (
                <div key={index} className="flex gap-4 p-4 bg-gray-800 rounded-lg">
                  {/* Product Image */}
                  <div className="w-24 h-24 flex-shrink-0">
                    {!item.product && (item.isCustom || item.customization || item.designId || item.customDesign) ? (
                      <CartTShirtPreview
                        design={item.customDesign || item.name}
                        color={item.color || 'White'}
                        colorValue={item.colorValue || '#FFFFFF'}
                        customization={item.customization}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 rounded-lg flex items-center justify-center">
                        <img
                          src={getProductImageUrl(item)}
                          alt={item.name}
                          className="w-full h-full object-contain rounded-lg"
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
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-400">
                      {item.size && `Size: ${item.size} • `}
                      {item.color && `Color: ${item.color} • `}
                      Qty: {item.count}
                    </p>
                    {!item.product && (item.isCustom || item.customization || item.designId || item.customDesign) && (
                      <div className="mt-1">
                        <p className="text-xs text-yellow-400">Custom Design</p>
                        {item.customization && (item.customization.frontDesign?.designImage || item.customization.backDesign?.designImage) && (
                          <p className="text-xs text-gray-500">
                            {item.customization.frontDesign?.designImage && item.customization.backDesign?.designImage && 'Front & Back'}
                            {item.customization.frontDesign?.designImage && !item.customization.backDesign?.designImage && 'Front Only'}
                            {!item.customization.frontDesign?.designImage && item.customization.backDesign?.designImage && 'Back Only'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Price */}
                  <p className="font-bold">₹{item.price * item.count}</p>
                </div>
              ))}
              <div className="pt-4 border-t border-gray-700 space-y-3">
                <div className="flex justify-between text-sm">
                  <p className="text-gray-400">Subtotal</p>
                  <p className="font-medium">₹{(order.originalAmount || order.amount).toLocaleString('en-IN')}</p>
                </div>
                
                {order.shipping?.shippingCost > 0 ? (
                  <div className="flex justify-between text-sm">
                    <p className="text-gray-400">Shipping</p>
                    <p className="font-medium">₹{order.shipping.shippingCost.toLocaleString('en-IN')}</p>
                  </div>
                ) : (
                  <div className="flex justify-between text-sm">
                    <p className="text-green-400">Free Shipping</p>
                    <p className="text-green-400 font-medium">₹0</p>
                  </div>
                )}
                
                {order.aovDiscount && (
                  <div className="flex justify-between text-sm">
                    <p className="text-yellow-400">Quantity Discount ({order.aovDiscount.percentage}% off for {order.aovDiscount.totalQuantity} items)</p>
                    <p className="text-yellow-400 font-medium">-₹{order.aovDiscount.amount.toLocaleString('en-IN')}</p>
                  </div>
                )}
                
                {order.coupon && (
                  <div className="flex justify-between text-sm">
                    <p className="text-green-400">Coupon Discount ({order.coupon.code})</p>
                    <p className="text-green-400 font-medium">-₹{(order.coupon.discountValue || order.coupon.discount).toLocaleString('en-IN')}</p>
                  </div>
                )}
                
                {order.rewardPointsRedeemed > 0 && (
                  <div className="flex justify-between text-sm">
                    <p className="text-purple-400">Reward Points ({order.rewardPointsRedeemed} points)</p>
                    <p className="text-purple-400 font-medium">-₹{order.rewardPointsRedeemed.toLocaleString('en-IN')}</p>
                  </div>
                )}
                
                {(order.discount || 0) > 0 && (
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-600">
                    <p className="text-green-400 font-semibold">Total Savings</p>
                    <p className="text-green-400 font-semibold">-₹{order.discount.toLocaleString('en-IN')}</p>
                  </div>
                )}
                
                <div className="pt-2 border-t border-gray-600">
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-semibold">Total Amount</p>
                    <p className="text-2xl font-bold text-yellow-400">₹{order.amount.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          {order.shippingAddress && (
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-yellow-400" />
                Shipping Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Delivery Address</p>
                  <p className="font-medium">
                    {order.shippingAddress.fullName}<br />
                    {order.shippingAddress.addressLine1}<br />
                    {order.shippingAddress.addressLine2 && `${order.shippingAddress.addressLine2}`}<br />
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                  </p>
                </div>
                {order.shipping && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Tracking</p>
                    <p className="font-medium">
                      {order.shipping.courier}<br />
                      {order.shipping.trackingNumber}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          {order.timeline && order.timeline.length > 0 && (
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                Order Timeline
              </h3>
              <div className="space-y-4">
                {order.timeline.map((event, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2"></div>
                    <div className="flex-1">
                      <p className="font-medium">{event.status}</p>
                      <p className="text-sm text-gray-400">
                        {format(new Date(event.timestamp), 'PPp')} • by {event.user}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-700">
          <div className="flex gap-4">
            <button
              onClick={() => {
                if (handlePrint) handlePrint();
              }}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Print Invoice
            </button>
            <button
              onClick={async () => {
                try {
                  const response = await fetch(`${API}/invoice/order/${order._id}/download`);
                  if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `invoice-${order._id}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  }
                } catch (error) {
                  console.error('Download error:', error);
                }
              }}
              className="px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-gray-900 rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Invoice
            </button>
            <button
              onClick={copyOrderId}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
            >
              <Copy className="w-5 h-5" />
              Copy Order ID
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Invoice for Printing */}
      <div style={{ display: 'none' }}>
        <div ref={invoiceRef} className="p-8 bg-white text-black">
          <h1 className="text-2xl font-bold mb-4">Invoice</h1>
          <p>Order ID: {order._id}</p>
          <p>Date: {format(new Date(order.createdAt), 'PPP')}</p>
          <div className="mt-4">
            <h3 className="font-bold">Customer:</h3>
            <p>{order.user ? order.user.name : order.guestInfo?.name || 'Guest'}</p>
            <p>{order.user ? order.user.email : order.guestInfo?.email || 'N/A'}</p>
          </div>
          <div className="mt-4">
            <h3 className="font-bold">Items:</h3>
            {order.products.map((item, index) => (
              <p key={index}>{item.name} x {item.count} - ₹{item.price * item.count}</p>
            ))}
          </div>
          <div className="mt-4">
            <p className="font-bold">Total: ₹{order.amount}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
