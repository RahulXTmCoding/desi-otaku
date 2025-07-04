import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { isAutheticated } from "../auth/helper";
import { API } from "../backend";
import { Loader, Package, Truck, CreditCard, MapPin, ChevronLeft, ExternalLink } from "lucide-react";
import CartTShirtPreview from "../components/CartTShirtPreview";

const OrderDetail = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { orderId } = useParams();
  const auth = useMemo(() => isAutheticated(), []);
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    console.log(`OrderDetail Component Rendered: ${renderCount.current} times`);
    console.log({
      loading,
      error,
      order,
      auth,
      orderId
    });
  });

  useEffect(() => {
    const fetchOrderDetail = async () => {
      console.log("fetchOrderDetail called");
      if (!auth) {
        console.log("No auth object, setting error.");
        setError("You must be logged in to view order details.");
        setLoading(false);
        return;
      }

      const { user, token } = auth;
      if (!user || !token || !orderId) {
        console.log("Missing user, token, or orderId.", { user, token, orderId });
        setError("Missing required information to fetch order.");
        setLoading(false);
        return;
      }

      console.log(`Fetching order ${orderId} for user ${user._id}`);
      try {
        const response = await fetch(`${API}/order/${orderId}/${user._id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("API Error:", errorData);
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Order data received:", data);
        setOrder(data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching order details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [auth, orderId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
        <Loader className="w-8 h-8 animate-spin text-yellow-400" />
        <p className="ml-4">Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-red-400">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
        <p>Order not found.</p>
      </div>
    );
  }

  // Debug log to see the full order structure
  console.log("Full order object:", JSON.stringify(order, null, 2));

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to="/user/dashboard" className="text-yellow-400 hover:text-yellow-300 inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
        <div className="bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between md:items-center border-b border-gray-700 pb-6 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Order Details</h1>
              <p className="text-sm text-gray-400">
                Order ID: <span className="font-mono text-yellow-400">#{order._id}</span>
              </p>
            </div>
            <div className="mt-4 md:mt-0 text-left md:text-right">
              <p className="text-sm text-gray-400 mb-2">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${
                order.status === 'Delivered' 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : order.status === 'Shipped'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : order.status === 'Processing'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              }`}>
                {order.status === 'Shipped' && <Truck className="w-4 h-4 mr-2" />}
                {order.status === 'Delivered' && <Package className="w-4 h-4 mr-2" />}
                {order.status}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Package className="w-6 h-6 mr-2 text-yellow-400" />
                Order Items
              </h2>
              <div className="space-y-4">
                {order.products && order.products.length > 0 ? (
                  order.products.map((product, index) => (
                    <div key={index} className="bg-gray-700/50 backdrop-blur p-6 rounded-xl border border-gray-600 hover:border-yellow-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-400/10">
                      <div className="flex items-start space-x-4">
                        {/* Product Image/Preview */}
                        <div className="w-24 h-24 flex-shrink-0">
                          {product.isCustom ? (
                            // Show custom t-shirt preview for custom designs
                            <div className="w-full h-full rounded-lg overflow-hidden bg-gray-600">
                              <CartTShirtPreview
                                design={product.customDesign || product.name}
                                color={product.color || product.selectedColor || "White"}
                                colorValue={product.colorValue || product.selectedColorValue || "#FFFFFF"}
                                image={product.designImage || product.image || (product.designId ? `${API}/design/photo/${product.designId}` : undefined)}
                              />
                            </div>
                          ) : product.product ? (
                            <Link 
                              to={`/product/${product.product._id || product.product}`}
                              className="relative group block w-full h-full"
                            >
                              <img 
                                src={
                                  product.product.photoUrl || 
                                  (product.product._id ? `${API}/product/photo/${product.product._id}` : null) ||
                                  (typeof product.product === 'string' ? `${API}/product/photo/${product.product}` : null) ||
                                  '/placeholder.png'
                                } 
                                alt={product.name} 
                                className="w-full h-full rounded-lg object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder.png';
                                  (e.target as HTMLImageElement).onerror = null;
                                }}
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                                <ExternalLink className="w-6 h-6 text-white" />
                              </div>
                            </Link>
                          ) : (
                            <div className="w-full h-full bg-gray-600 rounded-lg flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-grow">
                          <div className="flex items-start justify-between">
                            <div>
                              {product.product ? (
                                <Link 
                                  to={`/product/${product.product._id || product.product}`}
                                  className="font-semibold text-lg text-white hover:text-yellow-400 transition-colors duration-200 flex items-center group"
                                >
                                  {product.name || 'Unknown Product'}
                                  <ExternalLink className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                </Link>
                              ) : (
                                <p className="font-semibold text-lg text-white">{product.name || 'Unknown Product'}</p>
                              )}
                              <div className="flex items-center mt-2 space-x-4 text-sm text-gray-400">
                                {product.size && (
                                  <span className="flex items-center">
                                    Size: <span className="ml-1 text-white font-medium">{product.size}</span>
                                  </span>
                                )}
                                <span className="flex items-center">
                                  Qty: <span className="ml-1 text-white font-medium">{product.count || 1}</span>
                                </span>
                              </div>
                              {product.isCustom && (
                                <span className="inline-flex items-center mt-2 px-3 py-1 bg-yellow-400/20 text-yellow-400 text-xs font-medium rounded-full">
                                  Custom Design
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-white">₹{(product.price || 0) * (product.count || 1)}</p>
                              <p className="text-sm text-gray-400 mt-1">₹{product.price || 0} each</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No products found in this order.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
              {order.shipping && (
                <div className="bg-gray-700/50 backdrop-blur p-6 rounded-xl border border-gray-600">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-yellow-400" />
                    Shipping Address
                  </h2>
                  <div className="text-gray-300 text-sm space-y-1">
                    <p className="font-bold text-white text-base">{order.shipping.name || order.guestInfo?.name || 'N/A'}</p>
                    <p>{order.address || 'Address not available'}</p>
                    {order.shipping.city && order.shipping.state && (
                      <p>{order.shipping.city}, {order.shipping.state} - {order.shipping.pincode}</p>
                    )}
                    <p className="flex items-center mt-2">
                      <span className="text-gray-400 mr-2">Phone:</span>
                      {order.shipping.phone || order.guestInfo?.phone || 'N/A'}
                    </p>
                    {order.guestInfo?.email && (
                      <p className="flex items-center">
                        <span className="text-gray-400 mr-2">Email:</span>
                        {order.guestInfo.email}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="bg-gray-700/50 backdrop-blur p-6 rounded-xl border border-gray-600">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-yellow-400" />
                  Order Summary
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="text-white font-medium">₹{order.subtotal || order.amount - (order.shipping?.shippingCost || 0)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Discount</span>
                      <span className="text-green-400 font-medium">-₹{order.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Shipping</span>
                    <span className="text-white font-medium">₹{order.shipping?.shippingCost || 0}</span>
                  </div>
                  <div className="border-t border-gray-600 my-3"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-white">Total Paid</span>
                    <span className="text-2xl font-bold text-yellow-400">₹{order.amount || 0}</span>
                  </div>
                  {order.transaction_id && (
                    <div className="mt-4 pt-4 border-t border-gray-600">
                      <p className="text-xs text-gray-400 mb-1">Transaction ID</p>
                      <p className="text-xs font-mono text-gray-300 break-all bg-gray-800 p-2 rounded">{order.transaction_id}</p>
                    </div>
                  )}
                </div>
              </div>

              {order.shipping?.trackingId && (
                <div className="bg-gray-700/50 backdrop-blur p-6 rounded-xl border border-gray-600">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <Truck className="w-5 h-5 mr-2 text-yellow-400" />
                    Tracking Information
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Tracking ID</p>
                      <p className="font-mono text-sm text-white bg-gray-800 p-2 rounded break-all">{order.shipping.trackingId}</p>
                    </div>
                    {order.shipping.courier && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Courier Partner</p>
                        <p className="text-sm text-white font-medium">{order.shipping.courier}</p>
                      </div>
                    )}
                    {order.shipping.estimatedDelivery && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Estimated Delivery</p>
                        <p className="text-sm text-white font-medium">
                          {new Date(order.shipping.estimatedDelivery).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
