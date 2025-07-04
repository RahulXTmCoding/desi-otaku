import React, { useState, useEffect } from 'react';
import { RefreshCw, Download, Loader, Package } from 'lucide-react';
import { isAutheticated } from '../auth/helper';
import { useDevMode } from '../context/DevModeContext';
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
import { Order, OrderStats as OrderStatsType } from './components/orders/types';

const OrderManagement: React.FC = () => {
  const authData = isAutheticated();
  const user = authData && authData.user;
  const token = authData && authData.token;
  const { isTestMode } = useDevMode();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State management
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [ordersPerPage] = useState(10);
  
  // Initialize filters from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [dateFilter, setDateFilter] = useState(searchParams.get('date') || 'all');
  const [paymentFilter, setPaymentFilter] = useState(searchParams.get('payment') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'date-desc');
  
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

  // Update URL params whenever filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('search', searchQuery);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (dateFilter !== 'all') params.set('date', dateFilter);
    if (paymentFilter !== 'all') params.set('payment', paymentFilter);
    if (sortBy !== 'date-desc') params.set('sort', sortBy);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    setSearchParams(params);
  }, [searchQuery, statusFilter, dateFilter, paymentFilter, sortBy, currentPage, setSearchParams]);

  useEffect(() => {
    loadOrders();
  }, [isTestMode]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [orders, searchQuery, statusFilter, dateFilter, paymentFilter, sortBy]);

  useEffect(() => {
    calculateStats();
  }, [orders]);

  const loadOrders = async () => {
    setLoading(true);
    setError('');

    try {
      if (isTestMode) {
        // Mock data for test mode
        const mockOrders = generateMockOrders();
        setOrders(mockOrders);
      } else {
        if (user && token) {
          const response = await fetch(`${API}/order/all/${user._id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch orders');
          }
          
          const data = await response.json();
          // Handle the new response structure
          if (data.orders) {
            setOrders(data.orders);
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
            }
          } else {
            // Fallback for old API structure
            setOrders(Array.isArray(data) ? data : []);
          }
        }
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders');
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...orders];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(order => 
        order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.shipping?.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => 
        order.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(order => 
        new Date(order.createdAt) >= filterDate
      );
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(order => 
        order.paymentMethod?.toLowerCase() === paymentFilter.toLowerCase()
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        default:
          return 0;
      }
    });

    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const calculateStats = () => {
    const stats: OrderStatsType = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      total: orders.length
    };

    orders.forEach(order => {
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

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    
    try {
      if (isTestMode) {
        // Update local state for test mode
        setOrders(orders.map(order => 
          order._id === orderId 
            ? { 
                ...order, 
                status: newStatus,
                timeline: [
                  ...(order.timeline || []),
                  {
                    status: newStatus,
                    timestamp: new Date().toISOString(),
                    user: user?.name || 'Admin'
                  }
                ]
              } 
            : order
        ));
        toast.success('Order status updated successfully');
      } else {
        if (user && token) {
          const response = await fetch(`${API}/order/${orderId}/status`, {
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
        }
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
    const csvData = filteredOrders.map(order => ({
      'Order ID': order._id,
      'Date': format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm'),
      'Customer Name': order.user.name,
      'Customer Email': order.user.email,
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

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // Generate mock orders for test mode
  function generateMockOrders(): Order[] {
    const statuses = ['Received', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    const paymentMethods = ['Credit Card', 'Debit Card', 'PayPal', 'Razorpay'];
    
    return Array.from({ length: 25 }, (_, i) => ({
      _id: `ORD${Date.now()}${i}`,
      user: {
        _id: `USER${i}`,
        name: `Customer ${i + 1}`,
        email: `customer${i + 1}@example.com`,
        phone: `+91 ${9000000000 + i}`
      },
      products: [
        {
          product: `PROD${i}`,
          name: `Anime T-Shirt ${i + 1}`,
          price: 799 + (i * 50),
          count: Math.floor(Math.random() * 3) + 1,
          size: ['S', 'M', 'L', 'XL'][Math.floor(Math.random() * 4)],
          color: ['Black', 'White', 'Navy', 'Red'][Math.floor(Math.random() * 4)]
        }
      ],
      transaction_id: `TXN${Date.now()}${i}`,
      amount: 799 + (i * 50),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      shippingAddress: {
        fullName: `Customer ${i + 1}`,
        addressLine1: `${i + 1} Main Street`,
        addressLine2: `Apartment ${i + 1}`,
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: `400${String(i).padStart(3, '0')}`,
        phone: `+91 ${9000000000 + i}`
      },
      shipping: {
        method: 'Standard',
        trackingNumber: `TRACK${Date.now()}${i}`,
        courier: 'Blue Dart',
        estimatedDelivery: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString(),
        cost: 99
      },
      timeline: [
        {
          status: 'Received',
          timestamp: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
          user: 'System'
        }
      ],
      createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }

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
              {isTestMode && (
                <p className="text-yellow-400 text-sm mt-2">
                  🧪 Test Mode: Using sample orders
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => loadOrders()}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
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

        {/* Stats Cards */}
        <OrderStats stats={orderStats} />

        {/* Filters and Search */}
        <OrderFilters
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          dateFilter={dateFilter}
          paymentFilter={paymentFilter}
          sortBy={sortBy}
          onSearchChange={setSearchQuery}
          onStatusFilterChange={setStatusFilter}
          onDateFilterChange={setDateFilter}
          onPaymentFilterChange={setPaymentFilter}
          onSortByChange={setSortBy}
        />

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
          {currentOrders.map(order => (
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
        {filteredOrders.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400">No orders found</p>
            <p className="text-gray-500 mt-2">
              Try adjusting your filters or search criteria
            </p>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={ordersPerPage}
          totalItems={filteredOrders.length}
        />

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
