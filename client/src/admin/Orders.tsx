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
  Filter,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { isAutheticated } from '../auth/helper';
import { getAllOrders, mockGetAllOrders, updateOrderStatus, mockUpdateOrderStatus } from './helper/adminapicall';
import { useDevMode } from '../context/DevModeContext';
import DateRangeSelector from './components/analytics/DateRangeSelector';
import { API } from '../backend';

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
  
  // Enhanced state for backend filtering
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('today'); // Default to today's orders
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [isTestMode, dateRange, statusFilter, searchQuery, currentPage]);

  // Custom date range state
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const getDateRangeParams = () => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    // Handle custom date range
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      const customStart = new Date(customStartDate);
      customStart.setHours(0, 0, 0, 0);
      const customEnd = new Date(customEndDate);
      customEnd.setHours(23, 59, 59, 999);
      
      return {
        startDate: customStart.toISOString(),
        endDate: customEnd.toISOString()
      };
    }
    
    switch (dateRange) {
      case 'today':
        return {
          startDate: startOfDay.toISOString(),
          endDate: endOfDay.toISOString()
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return {
          startDate: weekStart.toISOString(),
          endDate: endOfDay.toISOString()
        };
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          startDate: monthStart.toISOString(),
          endDate: endOfDay.toISOString()
        };
      case 'quarter':
        const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
        return {
          startDate: quarterStart.toISOString(),
          endDate: endOfDay.toISOString()
        };
      case 'year':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        return {
          startDate: yearStart.toISOString(),
          endDate: endOfDay.toISOString()
        };
      default:
        return {
          startDate: startOfDay.toISOString(),
          endDate: endOfDay.toISOString()
        };
    }
  };

  const handleCustomDateChange = (startDate: string, endDate: string) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    setDateRange('custom');
    setCurrentPage(1);
    // The useEffect will trigger loadOrders when dateRange changes
  };

  const loadOrders = async (resetPage = false) => {
    setLoading(true);
    setError('');

    if (resetPage) {
      setCurrentPage(1);
    }

    try {
      if (isTestMode) {
        // Enhanced mock data with filtering
        const mockOrders = await mockGetAllOrders();
        const { startDate, endDate } = getDateRangeParams();
        
        // Filter mock orders by date range
        const filteredOrders = mockOrders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
        });
        
        setOrders(filteredOrders);
        setTotalOrders(filteredOrders.length);
        setTotalPages(1);
        setHasMore(false);
      } else {
        if (user && token) {
          // Use the existing getAllOrders helper with enhanced parameters
          const { startDate, endDate } = getDateRangeParams();
          
          // Build enhanced API call URL with filters
          const baseUrl = `${API}/order/all/${user._id}`;
          const params = new URLSearchParams({
            page: (resetPage ? 1 : currentPage).toString(),
            limit: '20',
            ...(statusFilter !== 'all' && { status: statusFilter }),
            ...(searchQuery && { search: searchQuery }),
            startDate,
            endDate,
            sortBy: 'createdAt',
            sortOrder: 'desc'
          });

          console.log('🔍 Loading orders with params:', {
            dateRange,
            startDate,
            endDate,
            currentPage: resetPage ? 1 : currentPage,
            statusFilter,
            searchQuery
          });

          const response = await fetch(`${baseUrl}?${params}`, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch orders`);
          }

          const data = await response.json();
          
          console.log('📊 Orders API Response:', {
            ordersCount: data.orders?.length || 0,
            totalOrders: data.pagination?.totalOrders || 0,
            currentPage: data.pagination?.currentPage || 1
          });
          
          if (data.error) {
            setError(data.error);
            setOrders([]);
          } else {
            setOrders(data.orders || []);
            setCurrentPage(data.pagination?.currentPage || 1);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotalOrders(data.pagination?.totalOrders || 0);
            setHasMore(data.pagination?.hasMore || false);
          }
        }
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    loadOrders(true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setCurrentPage(prev => prev + 1);
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

  // No frontend filtering - we're using backend filtering
  const filteredOrders = orders;

  const orderStatuses = ['Received', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">Manage Orders</h1>
              <p className="text-gray-400">View and manage all customer orders</p>
              {isTestMode && (
                <p className="text-yellow-400 text-sm mt-2">
                  🧪 Test Mode: Using sample orders
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <DateRangeSelector
                selectedRange={dateRange}
                onRangeChange={setDateRange}
                onCustomDateChange={handleCustomDateChange}
              />
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                title="Refresh orders"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        {isTestMode && (
          <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4 mb-6">
            <h3 className="text-blue-400 font-semibold mb-2">🔍 Debug Info</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Date Range:</strong> {dateRange}</p>
                <p><strong>Custom Start:</strong> {customStartDate || 'Not set'}</p>
                <p><strong>Custom End:</strong> {customEndDate || 'Not set'}</p>
              </div>
              <div>
                <p><strong>API Date Params:</strong></p>
                <pre className="text-xs bg-gray-800 p-2 rounded mt-1">
                  {JSON.stringify(getDateRangeParams(), null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Order Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Total Orders</p>
            <p className="text-2xl font-bold text-yellow-400">{totalOrders}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Current Page</p>
            <p className="text-2xl font-bold text-blue-400">{currentPage} / {totalPages}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Date Range</p>
            <p className="text-lg font-bold text-green-400 capitalize">
              {dateRange === 'custom' && customStartDate && customEndDate 
                ? `${new Date(customStartDate).toLocaleDateString()} - ${new Date(customEndDate).toLocaleDateString()}`
                : dateRange
              }
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Showing</p>
            <p className="text-lg font-bold text-purple-400">{filteredOrders.length} orders</p>
          </div>
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

        {/* Pagination Controls */}
        {!loading && filteredOrders.length > 0 && totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Previous
            </button>
            
            <div className="flex gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? 'bg-yellow-400 text-gray-900 font-bold'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* Load More Button for mobile-friendly experience */}
        {!loading && hasMore && !isTestMode && (
          <div className="mt-6 text-center">
            <button
              onClick={handleLoadMore}
              className="px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-gray-900 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto"
            >
              <Package className="w-5 h-5" />
              Load More Orders
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
