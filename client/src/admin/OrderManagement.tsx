import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Download, Loader, Package, Search } from 'lucide-react';
import { isAutheticated } from '../auth/helper';
import { toast, Toaster } from 'react-hot-toast';
import { CSVLink } from 'react-csv';
import { format } from 'date-fns';
import { API } from '../backend';
import { useSearchParams } from 'react-router-dom';

// Import modular components
import OrderStats from './components/orders/OrderStats';
import OrderFilters from './components/orders/OrderFilters';
import OrderListItem from './components/orders/OrderListItem';
import OrderDetailModal from './components/orders/OrderDetailModal';
import BulkActions from './components/orders/BulkActions';
import Pagination from './components/orders/Pagination';
import DateRangeSelector from './components/analytics/DateRangeSelector';
import { Order, OrderStats as OrderStatsType } from './components/orders/types';

const OrderManagement: React.FC = () => {
  const authData = isAutheticated();
  const user = authData && authData.user;
  const token = authData && authData.token;
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State management - Backend filtering approach
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  
  // Backend pagination state
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPagesFromBackend, setTotalPagesFromBackend] = useState(1);
  const [totalOrdersFromBackend, setTotalOrdersFromBackend] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [ordersPerPage] = useState(20);
  
  // Enhanced filters with date range selector
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [dateRange, setDateRange] = useState('today'); // Default to today
  const [paymentFilter, setPaymentFilter] = useState(searchParams.get('payment') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'date-desc');
  
  // Debounce timer ref
  const debounceTimerRef = useRef<number | null>(null);
  
  // Custom date range state
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Modals
  const [showOrderDetail, setShowOrderDetail] = useState<Order | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  
  // Stats
  const [orderStats, setOrderStats] = useState<OrderStatsType>({
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    total: 0
  });

  // Debounce search query
  useEffect(() => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay
    
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);
  
  // Update URL params whenever filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (debouncedSearchQuery) params.set('search', debouncedSearchQuery);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (dateRange !== 'today') params.set('dateRange', dateRange);
    if (paymentFilter !== 'all') params.set('payment', paymentFilter);
    if (sortBy !== 'date-desc') params.set('sort', sortBy);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    setSearchParams(params);
  }, [debouncedSearchQuery, statusFilter, dateRange, paymentFilter, sortBy, currentPage, setSearchParams]);

  useEffect(() => {
    loadOrders();
  }, [dateRange, statusFilter, debouncedSearchQuery, currentPage, paymentFilter, sortBy]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [statusFilter, debouncedSearchQuery, dateRange, paymentFilter, sortBy]);

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
  };

  const loadOrders = async (resetPage = false) => {
    setLoading(true);
    setError('');

    if (resetPage) {
      setCurrentPage(1);
    }

    try {
      if (!user || !token) {
        setError('Authentication required');
        setOrders([]);
        setLoading(false);
        return;
      }

      // Build query parameters for backend filtering
      const { startDate, endDate } = getDateRangeParams();
        
        // Convert frontend sortBy to backend format
        let backendSortBy = 'createdAt';
        let backendSortOrder = 'desc';
        
        switch (sortBy) {
          case 'date-desc':
            backendSortBy = 'createdAt';
            backendSortOrder = 'desc';
            break;
          case 'date-asc':
            backendSortBy = 'createdAt';
            backendSortOrder = 'asc';
            break;
          case 'amount-desc':
            backendSortBy = 'amount';
            backendSortOrder = 'desc';
            break;
          case 'amount-asc':
            backendSortBy = 'amount';
            backendSortOrder = 'asc';
            break;
          case 'status':
            backendSortBy = 'status';
            backendSortOrder = 'asc';
            break;
          default:
            backendSortBy = 'createdAt';
            backendSortOrder = 'desc';
        }
        
      const params = new URLSearchParams({
        page: (resetPage ? 1 : currentPage).toString(),
        limit: ordersPerPage.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
        ...(paymentFilter !== 'all' && { paymentMethod: paymentFilter }),
        startDate,
        endDate,
        sortBy: backendSortBy,
        sortOrder: backendSortOrder
      });

      const response = await fetch(`${API}/order/all/${user._id}?${params}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch orders`);
      }

      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setOrders([]);
      } else {
        setOrders(data.orders || []);
        setCurrentPage(data.pagination?.currentPage || 1);
        setTotalPagesFromBackend(data.pagination?.totalPages || 1);
        setTotalOrdersFromBackend(data.pagination?.totalOrders || 0);
        setHasMore(data.pagination?.hasMore || false);
        
        // Update stats if provided
        if (data.stats) {
          setOrderStats({
            pending: data.stats.pending || 0,
            processing: data.stats.processing || 0,
            shipped: data.stats.shipped || 0,
            delivered: data.stats.delivered || 0,
            cancelled: data.stats.cancelled || 0,
            total: data.pagination?.totalOrders || data.orders.length
          });
        } else {
          calculateStats(data.orders || []);
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

  const calculateStats = (ordersToCalculate = orders) => {
    const stats: OrderStatsType = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      total: ordersToCalculate.length
    };

    ordersToCalculate.forEach(order => {
      switch (order.status?.toLowerCase()) {
        case 'pending':
        case 'received':
          stats.pending++;
          break;
        case 'processing':
          stats.processing++;
          break;
        case 'shipped':
          stats.shipped++;
          break;
        case 'delivered':
          stats.delivered++;
          break;
        case 'cancelled':
          stats.cancelled++;
          break;
      }
    });

    setOrderStats(stats);
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    loadOrders(true);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    
    try {
      if (user && token) {
        const response = await fetch(`${API}/status/${orderId}/${user._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) {
          throw new Error('Failed to update status');
        }
        
        await loadOrders();
        toast.success('Order status updated successfully');
      } else {
        toast.error('Authentication required');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedOrders.length === 0) {
      toast.error('No orders selected');
      return;
    }

    try {
      toast.loading('Updating orders...');
      
      for (const orderId of selectedOrders) {
        await handleStatusUpdate(orderId, newStatus);
      }
      
      setSelectedOrders([]);
      setShowBulkActions(false);
      toast.dismiss();
      toast.success(`Updated ${selectedOrders.length} orders`);
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to update some orders');
    }
  };

  const handleExportCSV = () => {
    const csvData = orders.map(order => ({
      'Order ID': order._id,
      'Date': format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm'),
      'Customer Name': order.user ? order.user.name : order.guestInfo?.name || 'Guest',
      'Customer Email': order.user ? order.user.email : order.guestInfo?.email || 'N/A',
      'Products': order.products.map(p => `${p.name} x${p.count}`).join(', '),
      'Amount': order.amount,
      'Status': order.status || 'Pending',
      'Payment Method': order.paymentMethod || 'N/A',
      'Transaction ID': order.transaction_id,
      'Tracking Number': order.shipping?.trackingNumber || 'N/A'
    }));

    return csvData;
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader className="w-12 h-12 animate-spin text-yellow-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">Order Management</h1>
              <p className="text-gray-400">Manage and track all customer orders</p>
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
              <CSVLink
                data={handleExportCSV()}
                filename={`orders-${format(new Date(), 'yyyy-MM-dd')}.csv`}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </CSVLink>
            </div>
          </div>
        </div>



        {/* Order Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Total Orders</p>
            <p className="text-2xl font-bold text-yellow-400">{totalOrdersFromBackend}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Current Page</p>
            <p className="text-2xl font-bold text-blue-400">{currentPage} / {totalPagesFromBackend}</p>
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
            <p className="text-lg font-bold text-purple-400">{orders.length} orders</p>
          </div>
        </div>

        {/* Stats Cards */}
        <OrderStats stats={orderStats} />

        {/* Filters and Search */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <div className="grid lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by order ID, customer, transaction ID, tracking..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
            >
              <option value="all">All Status</option>
              <option value="received">Received</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="customer refused">Customer Refused</option>
              <option value="customer unavailable">Customer Unavailable</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
              <option value="status">Status</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Payment Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 text-sm"
            >
              <option value="all">All Payments</option>
              <option value="cod">💵 COD Orders</option>
              {/* <option value="razorpay">💳 Online Payments</option> */}
              {/* <option value="credit card">Credit Card</option>
              <option value="debit card">Debit Card</option>
              <option value="paypal">PayPal</option> */}
              <option value="razorpay">Razorpay</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        <BulkActions
          selectedCount={selectedOrders.length}
          showActions={showBulkActions}
          onToggleActions={() => setShowBulkActions(!showBulkActions)}
          onClearSelection={() => setSelectedOrders([])}
          onBulkStatusUpdate={handleBulkStatusUpdate}
        />

        {/* Orders List */}
        <div className="space-y-4">
          {orders.map(order => (
            <OrderListItem
              key={order._id}
              order={order}
              isExpanded={expandedOrder === order._id}
              isSelected={selectedOrders.includes(order._id)}
              isUpdating={updatingStatus === order._id}
              onToggleExpand={() => setExpandedOrder(
                expandedOrder === order._id ? null : order._id
              )}
              onToggleSelect={() => toggleOrderSelection(order._id)}
              onStatusUpdate={handleStatusUpdate}
              onViewDetails={() => setShowOrderDetail(order)}
            />
          ))}
        </div>

        {/* Empty State */}
        {orders.length === 0 && !loading && (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400">No orders found</p>
            <p className="text-gray-500 mt-2">
              Try adjusting your filters or search criteria
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && orders.length > 0 && totalPagesFromBackend > 1 && (
          <div className="mt-8 flex justify-center items-center gap-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Previous
            </button>
            
            <div className="flex gap-2">
              {Array.from({ length: Math.min(5, totalPagesFromBackend) }, (_, i) => {
                let pageNum;
                if (totalPagesFromBackend <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPagesFromBackend - 2) {
                  pageNum = totalPagesFromBackend - 4 + i;
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
              onClick={() => setCurrentPage(prev => Math.min(totalPagesFromBackend, prev + 1))}
              disabled={currentPage === totalPagesFromBackend}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* Order Detail Modal */}
        {showOrderDetail && (
          <OrderDetailModal
            order={showOrderDetail}
            onClose={() => setShowOrderDetail(null)}
          />
        )}
      </div>
    </div>
  );
};

export default OrderManagement;
