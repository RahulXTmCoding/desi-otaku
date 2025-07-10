import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  User, 
  Package, 
  Heart, 
  MapPin, 
  Settings,
  LogOut,
  ShoppingBag,
  Clock,
  ChevronRight,
  Edit2,
  Mail,
  Phone,
  Loader
} from 'lucide-react';
import { isAutheticated, signout } from "../auth/helper";
import { getOrders, mockGetOrders } from "../core/helper/orderHelper";
import { useDevMode } from "../context/DevModeContext";
import OrderCard from "../components/OrderCard";

interface Order {
  _id: string;
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

const UserDashBoard = () => {
  const navigate = useNavigate();
  const authData = isAutheticated();
  const user = authData && authData.user;
  const token = authData && authData.token;
  const { isTestMode } = useDevMode();
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrders();
  }, [isTestMode]);

  const loadOrders = () => {
    setLoading(true);
    setError('');

    if (isTestMode) {
      // Use mock data in test mode
      mockGetOrders().then((data) => {
        setOrders(data);
        setLoading(false);
      });
    } else {
      // Fetch from backend
      if (user && token) {
        getOrders(user._id, token).then((data) => {
          if (data.error) {
            setError(data.error);
            setOrders([]);
          } else {
            setOrders(data);
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }
  };

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

  const getTotalItems = (order: Order) => {
    return order.products.reduce((total, item) => total + item.count, 0);
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="w-[96%] md:w-[90%] mx-auto px-4 py-4 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">My Dashboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-2xl p-4 md:p-6">
              {/* User Info */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-yellow-400 rounded-full mx-auto mb-3 md:mb-4 flex items-center justify-center">
                  <User className="w-8 h-8 md:w-10 md:h-10 text-gray-900" />
                </div>
                <h2 className="font-semibold text-base md:text-lg">{user?.name || 'User'}</h2>
                <p className="text-gray-400 text-xs md:text-sm">{user?.email}</p>
              </div>

              {/* Navigation */}
              <nav className="space-y-1 md:space-y-2">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 md:px-4 md:py-3 rounded-lg transition-all text-sm md:text-base ${
                      activeTab === item.id
                        ? 'bg-yellow-400 text-gray-900'
                        : 'hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    <item.icon className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
                <button
                  onClick={handleSignout}
                  className="w-full flex items-center gap-3 px-3 py-2 md:px-4 md:py-3 rounded-lg hover:bg-red-500/10 text-red-400 transition-all text-sm md:text-base"
                >
                  <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-800 rounded-xl p-4 md:p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                      <ShoppingBag className="w-6 h-6 md:w-8 md:h-8 text-yellow-400" />
                      <span className="text-xl md:text-2xl font-bold">{orders.length}</span>
                    </div>
                    <p className="text-gray-400 text-sm md:text-base">Total Orders</p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-4 md:p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                      <Heart className="w-6 h-6 md:w-8 md:h-8 text-red-400" />
                      <span className="text-xl md:text-2xl font-bold">0</span>
                    </div>
                    <p className="text-gray-400 text-sm md:text-base">Wishlist Items</p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-4 md:p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                      <MapPin className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
                      <span className="text-xl md:text-2xl font-bold">0</span>
                    </div>
                    <p className="text-gray-400 text-sm md:text-base">Saved Addresses</p>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-gray-800 rounded-2xl p-4 md:p-6 border border-gray-700">
                  <h3 className="text-lg md:text-xl font-bold mb-4 flex items-center justify-between">
                    Recent Orders
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-yellow-400 text-sm hover:text-yellow-300"
                    >
                      View All
                    </button>
                  </h3>
                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader className="w-8 h-8 animate-spin text-yellow-400" />
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <p className="text-red-400">{error}</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No orders found</p>
                      <button
                        onClick={() => navigate('/shop')}
                        className="mt-4 text-yellow-400 hover:text-yellow-300"
                      >
                        Start Shopping →
                      </button>
                    </div>
                  ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 3).map((order) => (
                      <OrderCard key={order._id} order={order} />
                    ))}
                  </div>
                  )}
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-gray-800 rounded-2xl p-4 md:p-6 border border-gray-700">
                <h2 className="text-lg md:text-xl font-bold mb-6">Order History</h2>
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader className="w-8 h-8 animate-spin text-yellow-400" />
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <p className="text-red-400">{error}</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">No orders yet</p>
                    <button
                      onClick={() => navigate('/shop')}
                      className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-6 py-3 rounded-lg font-bold transition-all"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <OrderCard key={order._id} order={order} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <div className="bg-gray-800 rounded-2xl p-4 md:p-6 border border-gray-700">
                <h2 className="text-lg md:text-xl font-bold mb-6">My Wishlist</h2>
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">Your wishlist is empty</p>
                  <button
                    onClick={() => navigate('/shop')}
                    className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-6 py-3 rounded-lg font-bold transition-all"
                  >
                    Explore Products
                  </button>
                </div>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="bg-gray-800 rounded-2xl p-4 md:p-6 border border-gray-700">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <h2 className="text-lg md:text-xl font-bold mb-4 sm:mb-0">Saved Addresses</h2>
                  <button className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base">
                    Add New Address
                  </button>
                </div>
                <div className="text-center py-12">
                  <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No saved addresses yet</p>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-2xl p-4 md:p-6 border border-gray-700">
                  <h2 className="text-lg md:text-xl font-bold mb-6">Profile Settings</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        defaultValue={user?.name || ''}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        defaultValue={user?.email || ''}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                      />
                    </div>
                  </div>
                  <button className="mt-6 bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105 text-sm md:text-base">
                    Save Changes
                  </button>
                </div>

                <div className="bg-gray-800 rounded-2xl p-4 md:p-6 border border-gray-700">
                  <h2 className="text-lg md:text-xl font-bold mb-6">Change Password</h2>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                      />
                    </div>
                  </div>
                  <button className="mt-6 bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105 text-sm md:text-base">
                    Update Password
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashBoard;
