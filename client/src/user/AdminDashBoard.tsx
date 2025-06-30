import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Package, 
  FolderPlus,
  ShoppingBag,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Clock,
  Settings,
  LogOut,
  ChevronRight,
  Plus,
  FileText,
  Grid,
  List,
  Loader,
  MessageSquare,
  Tag
} from 'lucide-react';
import { isAutheticated, signout } from "../auth/helper";
import { getProducts, getCategories, getAllOrders, mockGetAllOrders } from "../admin/helper/adminapicall";
import { useDevMode } from "../context/DevModeContext";
import { mockProducts, mockCategories } from "../data/mockData";

interface StatCard {
  title: string;
  value: string | number;
  change: string;
  icon: React.ElementType;
  color: string;
}

interface Order {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
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
}

const AdminDashBoard = () => {
  const navigate = useNavigate();
  const authData = isAutheticated();
  const user = authData && authData.user;
  const token = authData && authData.token;
  const { isTestMode } = useDevMode();
  const [activeView, setActiveView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, [isTestMode]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      if (isTestMode) {
        // Use mock data
        const mockOrders = await mockGetAllOrders();
        setOrders(mockOrders);
        setProducts(mockProducts);
        setCategories(mockCategories);
      } else {
        // Fetch from backend
        if (user && token) {
          // Get orders
          const ordersData = await getAllOrders(user._id, token);
          if (!ordersData.error) {
            setOrders(ordersData);
          }
        }

        // Get products
        const productsData = await getProducts();
        if (!productsData.error) {
          setProducts(productsData);
        }

        // Get categories
        const categoriesData = await getCategories();
        if (!categoriesData.error) {
          setCategories(categoriesData);
        }
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    // Calculate total revenue from orders
    const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);
    
    // Calculate revenue change (mock for now)
    const revenueChange = orders.length > 0 ? '+12.5%' : '0%';
    
    // Calculate total products sold
    const totalSold = products.reduce((sum, product) => sum + (product.sold || 0), 0);

    return {
      revenue: totalRevenue,
      revenueChange,
      totalOrders: orders.length,
      totalProducts: products.length,
      totalUsers: orders.length > 0 ? new Set(orders.map(o => o.user?._id)).size : 0,
      totalSold
    };
  };

  const stats: StatCard[] = (() => {
    const { revenue, revenueChange, totalOrders, totalProducts, totalUsers } = calculateStats();
    return [
      {
        title: 'Total Revenue',
        value: `₹${revenue.toLocaleString()}`,
        change: revenueChange,
        icon: DollarSign,
        color: 'text-green-400'
      },
      {
        title: 'Total Orders',
        value: totalOrders,
        change: totalOrders > 0 ? '+8.2%' : '0%',
        icon: ShoppingBag,
        color: 'text-blue-400'
      },
      {
        title: 'Total Products',
        value: totalProducts,
        change: `${categories.length} categories`,
        icon: Package,
        color: 'text-purple-400'
      },
      {
        title: 'Active Users',
        value: totalUsers,
        change: totalUsers > 0 ? '+15.3%' : 'New',
        icon: Users,
        color: 'text-yellow-400'
      }
    ];
  })();

  // Get recent orders (last 5)
  const recentOrders = orders.slice(0, 5);

  // Get top products by sold count
  const topProducts = [...products]
    .sort((a, b) => (b.sold || 0) - (a.sold || 0))
    .slice(0, 3);

  const handleSignout = () => {
    signout(() => {
      navigate("/");
    });
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
      month: 'short',
      day: 'numeric'
    });
  };

  const sidebarItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: Grid,
      link: null 
    },
    { 
      id: 'create-category', 
      label: 'Create Category', 
      icon: FolderPlus,
      link: '/admin/create/category'
    },
    { 
      id: 'create-product', 
      label: 'Create Product', 
      icon: Plus,
      link: '/admin/create/product'
    },
    { 
      id: 'manage-products', 
      label: 'Manage Products', 
      icon: Package,
      link: '/admin/products'
    },
    { 
      id: 'manage-orders', 
      label: 'Manage Orders', 
      icon: FileText,
      link: '/admin/orders'
    },
    { 
      id: 'review-settings', 
      label: 'Review Settings', 
      icon: MessageSquare,
      link: '/admin/review-settings'
    },
    { 
      id: 'manage-coupons', 
      label: 'Manage Coupons', 
      icon: Tag,
      link: '/admin/coupons'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 min-h-screen">
          <div className="p-6">
            {/* Admin Info */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-yellow-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">A</span>
              </div>
              <h2 className="font-semibold text-lg">{user?.name || 'Admin'}</h2>
              <p className="text-gray-400 text-sm">{user?.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                Administrator
              </span>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                item.link ? (
                  <Link
                    key={item.id}
                    to={item.link}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-700 text-gray-300 transition-all"
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ) : (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activeView === item.id
                        ? 'bg-yellow-400 text-gray-900'
                        : 'hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                )
              ))}
              
              <hr className="border-gray-700 my-4" />
              
              <button
                onClick={handleSignout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 text-red-400 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-gray-400">Welcome back, {user?.name}! Here's what's happening with your store today.</p>
              {isTestMode && (
                <p className="text-yellow-400 text-sm mt-2">
                  🧪 Test Mode: Using sample data
                </p>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader className="w-12 h-12 animate-spin text-yellow-400" />
              </div>
            ) : error ? (
              <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-400">
                {error}
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {stats.map((stat, index) => (
                    <div key={index} className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <stat.icon className={`w-8 h-8 ${stat.color}`} />
                        <span className="text-sm text-green-400 font-medium">{stat.change}</span>
                      </div>
                      <h3 className="text-gray-400 text-sm mb-1">{stat.title}</h3>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Charts Section */}
                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-yellow-400" />
                      Sales Overview
                    </h3>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <BarChart3 className="w-16 h-16 opacity-20 mx-auto mb-2" />
                        <p>Total Sales: ₹{calculateStats().revenue.toLocaleString()}</p>
                        <p className="text-sm mt-1">{orders.length} orders completed</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5 text-yellow-400" />
                      Top Products
                    </h3>
                    {topProducts.length === 0 ? (
                      <div className="flex items-center justify-center h-48 text-gray-500">
                        <p>No products yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {topProducts.map((product, index) => (
                          <div key={product._id} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center">
                                <span className="text-lg">👕</span>
                              </div>
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-gray-400">{product.sold || 0} sold</p>
                              </div>
                            </div>
                            <span className="text-yellow-400 font-bold">₹{product.price}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Clock className="w-5 h-5 text-yellow-400" />
                      Recent Orders
                    </h3>
                    <Link to="/admin/orders" className="text-yellow-400 hover:text-yellow-300 text-sm">
                      View All →
                    </Link>
                  </div>
                  
                  {recentOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No orders yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left border-b border-gray-700">
                            <th className="pb-3 text-gray-400 font-medium">Order ID</th>
                            <th className="pb-3 text-gray-400 font-medium">Customer</th>
                            <th className="pb-3 text-gray-400 font-medium">Amount</th>
                            <th className="pb-3 text-gray-400 font-medium">Status</th>
                            <th className="pb-3 text-gray-400 font-medium">Date</th>
                            <th className="pb-3 text-gray-400 font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentOrders.map((order) => (
                            <tr key={order._id} className="border-b border-gray-700">
                              <td className="py-4 font-mono text-sm text-yellow-400">
                                #{order._id.slice(-8).toUpperCase()}
                              </td>
                              <td className="py-4">{order.user?.name || 'Guest'}</td>
                              <td className="py-4 font-bold">₹{order.amount}</td>
                              <td className="py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                  {order.status || 'Processing'}
                                </span>
                              </td>
                              <td className="py-4 text-gray-400">{formatDate(order.createdAt)}</td>
                              <td className="py-4">
                                <button 
                                  onClick={() => navigate('/admin/orders')}
                                  className="text-yellow-400 hover:text-yellow-300"
                                >
                                  <ChevronRight className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Quick Actions */}
            <div className="mt-8 grid md:grid-cols-3 gap-4">
              <Link
                to="/admin/create/product"
                className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 p-6 rounded-2xl font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-3"
              >
                <Plus className="w-6 h-6" />
                Add New Product
              </Link>
              <Link
                to="/admin/create/category"
                className="bg-gray-800 hover:bg-gray-700 text-white p-6 rounded-2xl font-bold transition-all border border-gray-700 flex items-center justify-center gap-3"
              >
                <FolderPlus className="w-6 h-6" />
                Create Category
              </Link>
              <Link
                to="/admin/orders"
                className="bg-gray-800 hover:bg-gray-700 text-white p-6 rounded-2xl font-bold transition-all border border-gray-700 flex items-center justify-center gap-3"
              >
                <FileText className="w-6 h-6" />
                View All Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashBoard;
