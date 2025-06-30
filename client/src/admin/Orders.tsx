import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Clock, 
  MapPin, 
  Phone, 
  Mail,
  ChevronDown,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  Search,
  Filter
} from 'lucide-react';
import { isAutheticated } from '../auth/helper';
import { getAllOrders, mockGetAllOrders, updateOrderStatus, mockUpdateOrderStatus } from './helper/adminapicall';
import { useDevMode } from '../context/DevModeContext';

interface Order {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  products: Array<{
    product: string;
    name: string;
    price: number;
    count: number;
  }>;
  transaction_id: string;
  amount: number;
  address?: string;
  status?: string;
  createdAt: string;
  updatedAt?: string;
}

const AdminOrders: React.FC = () => {
  const authData = isAutheticated();
  const user = authData && authData.user;
  const token = authData && authData.token;
  const { isTestMode } = useDevMode();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [isTestMode]);

  const loadOrders = async () => {
    setLoading(true);
    setError('');

    try {
      if (isTestMode) {
        const mockOrders = await mockGetAllOrders();
        setOrders(mockOrders);
      } else {
        if (user && token) {
          const data = await getAllOrders(user._id, token);
          if (data.error) {
            setError(data.error);
            setOrders([]);
          } else {
            setOrders(data);
          }
        }
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    
    try {
      if (isTestMode) {
        await mockUpdateOrderStatus(orderId, newStatus);
        // Update local state
        setOrders(orders.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        ));
      } else {
        if (user && token) {
          const response = await updateOrderStatus(user._id, token, orderId, newStatus);
          if (!response.error) {
            // Update local state
            setOrders(orders.map(order => 
              order._id === orderId ? { ...order, status: newStatus } : order
            ));
          }
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'processing':
      case 'received':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-blue-400" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'text-green-400 bg-green-400/10';
      case 'processing':
      case 'received':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'shipped':
        return 'text-blue-400 bg-blue-400/10';
      case 'cancelled':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      order.status?.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const orderStatuses = ['Received', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Manage Orders</h1>
          <p className="text-gray-400">View and manage all customer orders</p>
          {isTestMode && (
            <p className="text-yellow-400 text-sm mt-2">
              🧪 Test Mode: Using sample orders
            </p>
          )}
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-xl p-4 mb-6 border border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by order ID, customer name, email, or transaction ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
              >
                <option value="all">All Status</option>
                <option value="received">Received</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader className="w-12 h-12 animate-spin text-yellow-400" />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-400">
            {error}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {searchQuery || statusFilter !== 'all' 
                ? 'No orders found matching your criteria' 
                : 'No orders yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div 
                key={order._id} 
                className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
              >
                {/* Order Header */}
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-750 transition-colors"
                  onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(order.status)}
                      <div>
                        <h3 className="font-mono text-yellow-400 font-medium">
                          Order #{order._id.slice(-8).toUpperCase()}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold">₹{order.amount}</p>
                        <p className="text-sm text-gray-400">{order.products.length} items</p>
                      </div>
                      <ChevronDown 
                        className={`w-5 h-5 text-gray-400 transform transition-transform ${
                          expandedOrder === order._id ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Order Details */}
                {expandedOrder === order._id && (
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
                          {order.address && (
                            <div className="flex items-start gap-2 text-sm mt-3">
                              <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                              <span className="text-gray-300">{order.address}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Order Status */}
                      <div>
                        <h4 className="font-semibold mb-3 text-gray-300">Order Status</h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                              {order.status || 'Processing'}
                            </span>
                            <span className="text-sm text-gray-400">
                              Transaction: {order.transaction_id.slice(0, 12)}...
                            </span>
                          </div>
                          
                          {/* Status Update Dropdown */}
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-400">Update Status:</label>
                            <select
                              value={order.status || 'Processing'}
                              onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                              disabled={updatingStatus === order._id}
                              className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                            >
                              {orderStatuses.map(status => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                            {updatingStatus === order._id && (
                              <Loader className="w-4 h-4 animate-spin text-yellow-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mt-6">
                      <h4 className="font-semibold mb-3 text-gray-300">Order Items</h4>
                      <div className="bg-gray-900 rounded-lg p-4">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left text-sm text-gray-400">
                              <th className="pb-2">Product</th>
                              <th className="pb-2">Price</th>
                              <th className="pb-2">Quantity</th>
                              <th className="pb-2 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.products.map((item, index) => (
                              <tr key={index} className="border-t border-gray-800">
                                <td className="py-2">{item.name}</td>
                                <td className="py-2">₹{item.price}</td>
                                <td className="py-2">{item.count}</td>
                                <td className="py-2 text-right font-medium">
                                  ₹{item.price * item.count}
                                </td>
                              </tr>
                            ))}
                            <tr className="border-t border-gray-700 font-bold">
                              <td colSpan={3} className="pt-2">Total Amount</td>
                              <td className="pt-2 text-right text-yellow-400">
                                ₹{order.amount}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
