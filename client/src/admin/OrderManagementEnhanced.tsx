import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Package, Clock, MapPin, Phone, Mail, ChevronDown, Truck,
  CheckCircle, XCircle, AlertCircle, Loader, Search, Filter,
  Download, Printer, MessageSquare, Calendar, DollarSign,
  User, ChevronRight, Eye, Edit, Trash2, RefreshCw,
  FileText, Copy, ExternalLink, ArrowUpDown, MoreVertical,
  TrendingUp, TrendingDown, Box, ShoppingBag, CreditCard,
  Settings, CheckSquare, Square, X, ChevronLeft
} from 'lucide-react';
import { isAutheticated } from '../auth/helper';
import { useDevMode } from '../context/DevModeContext';
import { toast, Toaster } from 'react-hot-toast';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { CSVLink } from 'react-csv';
import { useReactToPrint } from 'react-to-print';
import { API } from '../backend';

interface OrderProduct {
  product: string;
  name: string;
  price: number;
  count: number;
  size?: string;
  color?: string;
  designId?: string;
  customization?: any;
}

interface ShippingInfo {
  method: string;
  trackingNumber?: string;
  courier?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  cost: number;
}

interface OrderTimeline {
  status: string;
  timestamp: string;
  description?: string;
  user?: string;
}

interface Order {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  products: OrderProduct[];
  transaction_id: string;
  amount: number;
  address?: string;
  shippingAddress?: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  status?: string;
  paymentMethod?: string;
  shipping?: ShippingInfo;
  notes?: string[];
  timeline?: OrderTimeline[];
  discount?: number;
  couponCode?: string;
  createdAt: string;
  updatedAt?: string;
}

interface OrderStats {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  total: number;
}

const OrderManagementEnhanced: React.FC = () => {
  const authData = isAutheticated();
  const user = authData && authData.user;
  const token = authData && authData.token;
  const { isTestMode } = useDevMode();
  
  // State management
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  
  // Modals
  const [showOrderDetail, setShowOrderDetail] = useState<Order | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [showAddNote, setShowAddNote] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  
  // Stats
  const [orderStats, setOrderStats] = useState<OrderStats>({
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    total: 0
  });

  // Invoice ref for printing
  const invoiceRef = React.useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: 'Invoice'
  });

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
          setOrders(data);
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
    const stats: OrderStats = {
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

  const handleAddNote = async (orderId: string) => {
    if (!newNote.trim()) {
      toast.error('Please enter a note');
      return;
    }

    try {
      if (isTestMode) {
        setOrders(orders.map(order => 
          order._id === orderId 
            ? { 
                ...order, 
                notes: [...(order.notes || []), `${new Date().toISOString()}|${user?.name}|${newNote}`]
              } 
            : order
        ));
        toast.success('Note added successfully');
      } else {
        // API call to add note
        toast.success('Note added successfully');
      }
      
      setNewNote('');
      setShowAddNote(null);
    } catch (err) {
      toast.error('Failed to add note');
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

  const selectAllOrders = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(order => order._id));
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

  const OrderDetailModal = ({ order }: { order: Order }) => {
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
              onClick={() => setShowOrderDetail(null)}
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
                  <p className="font-medium">{order.user.name}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Email</p>
                  <p className="font-medium">{order.user.email}</p>
                </div>
                {order.user.phone && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Phone</p>
                    <p className="font-medium">{order.user.phone}</p>
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
                  <div key={index} className="flex justify-between items-center p-4 bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-400">
                        {item.size && `Size: ${item.size} • `}
                        {item.color && `Color: ${item.color} • `}
                        Qty: {item.count}
                      </p>
                    </div>
                    <p className="font-bold">₹{item.price * item.count}</p>
                  </div>
                ))}
                <div className="pt-4 border-t border-gray-700">
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-semibold">Total Amount</p>
                    <p className="text-2xl font-bold text-yellow-400">₹{order.amount}</p>
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
                onClick={() => {
                  navigator.clipboard.writeText(order._id);
                  toast.success('Order ID copied to clipboard');
                }}
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
            {/* Add more invoice details as needed */}
          </div>
        </div>
      </div>
    );
  };

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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-5 h-5 text-gray-400" />
              <span className="text-2xl font-bold">{orderStats.total}</span>
            </div>
            <p className="text-sm text-gray-400">Total Orders</p>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-4 border border-yellow-400/20">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span className="text-2xl font-bold text-yellow-400">{orderStats.pending}</span>
            </div>
            <p className="text-sm text-gray-400">Pending</p>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-4 border border-blue-400/20">
            <div className="flex items-center justify-between mb-2">
              <Box className="w-5 h-5 text-blue-400" />
              <span className="text-2xl font-bold text-blue-400">{orderStats.processing}</span>
            </div>
            <p className="text-sm text-gray-400">Processing</p>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-4 border border-purple-400/20">
            <div className="flex items-center justify-between mb-2">
              <Truck className="w-5 h-5 text-purple-400" />
              <span className="text-2xl font-bold text-purple-400">{orderStats.shipped}</span>
            </div>
            <p className="text-sm text-gray-400">Shipped</p>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-4 border border-green-400/20">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-2xl font-bold text-green-400">{orderStats.delivered}</span>
            </div>
            <p className="text-sm text-gray-400">Delivered</p>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-4 border border-red-400/20">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-2xl font-bold text-red-400">{orderStats.cancelled}</span>
            </div>
            <p className="text-sm text-gray-400">Cancelled</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <div className="grid lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2
