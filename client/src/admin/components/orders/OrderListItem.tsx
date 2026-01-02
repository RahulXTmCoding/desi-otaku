import React, { useState } from 'react';
import { ChevronDown, Loader, Mail, Phone, MapPin, Package, PhoneCall, ExternalLink, Truck, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Order } from './types';
import OrderStatusBadge from './OrderStatusBadge';
import CartTShirtPreview from '../../../components/CartTShirtPreview';
import { getProductImageUrl } from './utils/imageHelper';
import { API } from '../../../backend';
import TrackingLinkModal from './TrackingLinkModal';

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
  const orderStatuses = ['Received', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Customer Refused', 'Customer Unavailable'];
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(order);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Check if this is a COD order
  const isCODOrder = order.paymentMethod?.toLowerCase() === 'cod';

  // Copy to clipboard function
  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleTrackingUpdate = (updatedOrder: Order) => {
    setCurrentOrder(updatedOrder);
    // Optionally trigger a refresh of the parent list
  };

  return (
    <div className={`rounded-xl border overflow-hidden ${
      isCODOrder 
        ? 'bg-red-900/30 border-red-500/50' 
        : 'bg-gray-800 border-gray-700'
    }`}>
      {/* Order Header */}
      <div 
        className={`p-6 cursor-pointer transition-colors ${
          isCODOrder
            ? 'hover:bg-red-800/40'
            : 'hover:bg-gray-750'
        }`}
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
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-yellow-400 font-medium">
                  Order #{order._id.slice(-8).toUpperCase()}
                </h3>
                {isCODOrder && (
                  <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                    COD
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {format(new Date(order.createdAt), 'PPpp')}
                {isCODOrder && (
                  <span className="text-red-400 ml-2">• Cash on Delivery</span>
                )}
              </p>
              {/* Customer Name */}
              <p className="text-lg text-gray-300 mt-1 font-medium">
                👤 {order.shipping?.name || order.user?.name || order.guestInfo?.name || 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <OrderStatusBadge status={order.status} />
            <div className="text-right">
              <p className={`text-2xl font-bold ${
                isCODOrder ? 'text-red-400' : 'text-white'
              }`}>
                ₹{order.amount}
              </p>
              <p className="text-sm text-gray-400">{order.products.length} items</p>
              {isCODOrder && (
                <p className="text-xs text-red-400 mt-1">Payment Pending</p>
              )}
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
        <div className={`border-t p-6 ${
          isCODOrder ? 'border-red-500/30' : 'border-gray-700'
        }`}>
          {/* Shipping Information Section - All Orders */}
          <div className={`mb-6 rounded-xl p-4 ${
            isCODOrder 
              ? 'bg-gradient-to-r from-red-900/40 to-red-800/30 border-2 border-red-500/50' 
              : 'bg-gradient-to-r from-gray-800/40 to-gray-700/30 border-2 border-gray-600/50'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              {isCODOrder ? (
                <>
                  <PhoneCall className="w-6 h-6 text-red-400 animate-pulse" />
                  <h3 className="text-lg font-bold text-red-300">📞 COD Order - Call Customer to Confirm</h3>
                </>
              ) : (
                <>
                  <Package className="w-6 h-6 text-blue-400" />
                  <h3 className="text-lg font-bold text-blue-300">📦 Shipping Information</h3>
                </>
              )}
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {/* Delivery Address */}
              <div className={`rounded-lg p-3 border ${
                isCODOrder 
                  ? 'bg-red-900/50 border-red-500/50' 
                  : 'bg-gray-700/70 border-gray-500/50'
              }`}>
                <p className={`text-xs mb-1 ${
                  isCODOrder ? 'text-red-300' : 'text-gray-300'
                }`}>Delivery Address</p>
                {order.shipping || order.address ? (
                  <div className="text-sm text-white">
                    {order.shipping?.name && (
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-semibold">{order.shipping.name}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(order.shipping.name, 'name');
                          }}
                          className="p-1 hover:bg-gray-600 rounded transition-colors"
                          title="Copy name"
                        >
                          {copiedField === 'name' ? (
                            <Check className="w-3 h-3 text-white-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-white-400" />
                          )}
                        </button>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2 text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span>{order.user?.email || order.guestInfo?.email}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(order.user?.email || order.guestInfo?.email || '', 'email');
                        }}
                        className="p-1 hover:bg-gray-600 rounded transition-colors"
                        title="Copy email"
                      >
                        {copiedField === 'email' ? (
                          <Check className="w-3 h-3 text-white-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-white-400" />
                        )}
                      </button>
                    </div>
                    {order.shipping?.city && order.shipping?.state ? (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs mt-1 ${
                            isCODOrder ? 'text-red-200' : 'text-gray-200'
                          }`}>
                            {order.shipping.city}, {order.shipping.state}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(`${order.shipping.city}, ${order.shipping.state}`, 'city-state');
                            }}
                            className="p-1 hover:bg-gray-600 rounded transition-colors"
                            title="Copy city and state"
                          >
                            {copiedField === 'city-state' ? (
                              <Check className="w-3 h-3 text-white-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-white-400" />
                            )}
                          </button>
                        </div>
                        {order.shipping.pincode && (
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-m font-mono ${
                              isCODOrder ? 'text-red-200' : 'text-gray-200'
                            }`}>
                              PIN: {order.shipping.pincode}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(order.shipping.pincode, 'pincode');
                              }}
                              className="p-1 hover:bg-gray-600 rounded transition-colors"
                              title="Copy pincode"
                            >
                              {copiedField === 'pincode' ? (
                                <Check className="w-3 h-3 text-white-400" />
                              ) : (
                                <Copy className="w-3 h-3 text-white-400" />
                              )}
                            </button>
                          </div>
                        )}
                        {order.shipping.phone && (
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-xs mt-1 ${
                              isCODOrder ? 'text-green-300' : 'text-blue-300'
                            }`}>
                              📱 {order.shipping.phone}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(order.shipping.phone, 'phone');
                              }}
                              className="p-1 hover:bg-gray-600 rounded transition-colors"
                              title="Copy phone"
                            >
                              {copiedField === 'phone' ? (
                                <Check className="w-3 h-3 text-white-400" />
                              ) : (
                                <Copy className="w-3 h-3 text-white-400" />
                              )}
                            </button>
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs mt-1 ${
                            isCODOrder ? 'text-red-200' : 'text-gray-200'
                          }`}>{order.address}</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(order.address, 'address');
                            }}
                            className="p-1 hover:bg-gray-600 rounded transition-colors"
                            title="Copy address"
                          >
                            {copiedField === 'address' ? (
                              <Check className="w-3 h-3 text-white-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-white-400" />
                            )}
                          </button>
                        </div>
                      </>
                    ) : order.address ? (
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm mt-1 ${
                          isCODOrder ? 'text-red-200' : 'text-gray-200'
                        }`}>{order.address}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(order.address, 'address-alt');
                          }}
                          className="p-1 hover:bg-gray-600 rounded transition-colors"
                          title="Copy address"
                        >
                          {copiedField === 'address-alt' ? (
                            <Check className="w-3 h-3 text-white-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-white-400" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <p className={`text-xs ${
                        isCODOrder ? 'text-red-400' : 'text-gray-400'
                      }`}>Address not available</p>
                    )}
                  </div>
                ) : (
                  <p className={`text-sm ${
                    isCODOrder ? 'text-red-400' : 'text-gray-400'
                  }`}>⚠️ No delivery address</p>
                )}
              </div>

               <div className={`rounded-lg p-3 border ${
                isCODOrder 
                  ? 'bg-red-900/50 border-red-500/50' 
                  : 'bg-gray-700/70 border-gray-500/50'
              }`}>
                <h4 className="font-semibold mb-3 text-white-300">Order Status</h4>
                <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white-400">
                    Transaction: {order.transaction_id ? order.transaction_id.slice(0, 12) + '...' : 'N/A'}
                  </span>
                  {isCODOrder && (
                    <span className="text-xs bg-red-500 text-white px-2 py-1 rounded font-medium">
                      Cash on Delivery
                    </span>
                  )}
                </div>
                {isCODOrder && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-red-400 font-medium">
                        COD Order - Payment Required on Delivery
                      </span>
                    </div>
                    <p className="text-xs text-red-300 mt-1">
                      Customer will pay ₹{order.amount} when the package is delivered
                    </p>
                  </div>
                )}
                
                {/* Status Update Dropdown */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-white-400">Update Status:</label>
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


               <div className={`rounded-lg p-3 border ${
                isCODOrder 
                  ? 'bg-red-900/50 border-red-500/50' 
                  : 'bg-gray-700/70 border-gray-500/50'
              }`}>
                <h4 className="font-semibold mb-3 text-white-300">Order Items</h4>
            <div className="bg-gray-900 rounded-lg p-4 space-y-3">
              {order.products.map((item, index) => (
                <div key={index} className="flex items-center gap-4 pb-3 border-b border-gray-800 last:border-0">
                  {/* Product Image */}
                  <div className="w-16 h-16 flex-shrink-0">
                    {item.isCustom ? (
                      <CartTShirtPreview
                        design={item.customDesign || item.name}
                        color={item.color || 'White'}
                        colorValue={item.colorValue || '#FFFFFF'}
                        image={!item.customization ? (item.designImage || item.image || (item.designId ? `${API}/design/photo/${item.designId}` : undefined)) : undefined}
                        customization={item.customization ? {
                          frontDesign: item.customization.frontDesign ? {
                            designImage: item.customization.frontDesign.designImage,
                            position: item.customization.frontDesign.position
                          } : undefined,
                          backDesign: item.customization.backDesign ? {
                            designImage: item.customization.backDesign.designImage,
                            position: item.customization.backDesign.position
                          } : undefined
                        } : undefined}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 rounded flex items-center justify-center overflow-hidden">
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
                    {/* Product Name with Link */}
                    <div className="flex items-center gap-2">
                      {(() => {
                        // Extract product ID - handle both string IDs and populated objects
                        const productId = typeof item.product === 'string' 
                          ? item.product 
                          : item.product?._id || item.product?.id;
                        
                        return (productId && !item.isCustom) ? (
                          <Link 
                            to={`/product/${productId}`}
                            className="font-medium text-sm text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-1 group"
                            onClick={(e) => e.stopPropagation()}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {item.name}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        ) : (
                          <p className="font-medium text-sm">{item.name}</p>
                        );
                      })()}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(item.name, `product-name-${index}`);
                        }}
                        className="p-1 hover:bg-gray-600 rounded transition-colors flex-shrink-0"
                        title="Copy product name"
                      >
                        {copiedField === `product-name-${index}` ? (
                          <Check className="w-3 h-3 text-green-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-gray-400" />
                        )}
                      </button>
                    </div>
                    
                    <p className="text-xs text-gray-400">
                      {item.size && `Size: ${item.size} • `}
                      {item.color && `Color: ${item.color} • `}
                      Qty: {item.count}
                    </p>
                    {item.isCustom && (
                      <div className="mt-1 p-2 bg-yellow-900/20 rounded border border-yellow-500/30">
                        <p className="text-xs text-yellow-400 font-medium mb-1">🎨 Custom Design Details:</p>
                        <div className="text-xs text-gray-300 space-y-0.5">
                          {item.designId && (
                            <p>• Design ID: <span className="font-mono text-yellow-300">{String(item.designId)}</span></p>
                          )}
                          {item.customDesign && (
                            <p>• Design Name: <span className="text-yellow-300">{String(item.customDesign)}</span></p>
                          )}
                          {item.customization?.position && (
                            <p>• Position: <span className="text-yellow-300 capitalize">{
                              typeof item.customization.position === 'string' 
                                ? item.customization.position 
                                : JSON.stringify(item.customization.position)
                            }</span></p>
                          )}
                          {item.customization?.placement && (
                            <p>• Placement: <span className="text-yellow-300 capitalize">{
                              typeof item.customization.placement === 'string' 
                                ? item.customization.placement 
                                : JSON.stringify(item.customization.placement)
                            }</span></p>
                          )}
                          {(item.customization?.frontDesign || item.customization?.backDesign) && (
                            <div>
                              {item.customization.frontDesign && (
                                <div className="mt-1">
                                  <p className="text-yellow-400">• Front Design:</p>
                                  <div className="ml-3 text-xs">
                                    {item.customization.frontDesign.designId && (
                                      <p>  - Design ID: <span className="font-mono text-yellow-300">{item.customization.frontDesign.designId}</span></p>
                                    )}
                                    {item.customization.frontDesign.position && (
                                      <p>  - Position: <span className="text-yellow-300 capitalize">{item.customization.frontDesign.position}</span></p>
                                    )}
                                    {item.customization.frontDesign.price && (
                                      <p>  - Design Cost: <span className="text-yellow-300">₹{item.customization.frontDesign.price}</span></p>
                                    )}
                                    {item.customization.frontDesign.designImage && (
                                      <div>
                                        <p>  - Image: <span className="text-green-300">✓ Provided</span></p>
                                        <p>  - URL: <a href={item.customization.frontDesign.designImage} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs break-all">{item.customization.frontDesign.designImage}</a></p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              {item.customization.backDesign && (
                                <div className="mt-1">
                                  <p className="text-yellow-400">• Back Design:</p>
                                  <div className="ml-3 text-xs">
                                    {item.customization.backDesign.designId && (
                                      <p>  - Design ID: <span className="font-mono text-yellow-300">{item.customization.backDesign.designId}</span></p>
                                    )}
                                    {item.customization.backDesign.position && (
                                      <p>  - Position: <span className="text-yellow-300 capitalize">{item.customization.backDesign.position}</span></p>
                                    )}
                                    {item.customization.backDesign.price && (
                                      <p>  - Design Cost: <span className="text-yellow-300">₹{item.customization.backDesign.price}</span></p>
                                    )}
                                    {item.customization.backDesign.designImage && (
                                      <div>
                                        <p>  - Image: <span className="text-green-300">✓ Provided</span></p>
                                        <p>  - URL: <a href={item.customization.backDesign.designImage} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs break-all">{item.customization.backDesign.designImage}</a></p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
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
            </div>
            
            {/* Quick Action */}
            <div className={`mt-3 flex items-center gap-2 text-xs ${
              isCODOrder ? 'text-red-300' : 'text-gray-300'
            }`}>
              <Package className="w-4 h-4" />
              <span>{
                isCODOrder 
                  ? 'Call customer to confirm order and delivery address before processing'
                  : 'Verify shipping address and prepare for shipment'
              }</span>
            </div>
            
          </div>

          {/* Order Items */}
          <div className="mt-6">
            
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => onViewDetails(order)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
            >
              View Full Details
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTrackingModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm flex items-center gap-2"
            >
              <Truck className="w-4 h-4" />
              {currentOrder.shipping?.trackingLink ? 'Update Tracking' : 'Add Tracking'}
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

      {/* Tracking Link Modal */}
      {showTrackingModal && (
        <TrackingLinkModal
          order={currentOrder}
          isOpen={showTrackingModal}
          onClose={() => setShowTrackingModal(false)}
          onSuccess={handleTrackingUpdate}
        />
      )}
    </div>
  );
};

export default OrderListItem;
