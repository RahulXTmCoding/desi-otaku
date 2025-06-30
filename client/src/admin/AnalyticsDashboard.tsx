import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Base from '../core/Base';
import { isAutheticated } from '../auth/helper/index';
import { useDevMode } from '../context/DevModeContext';
import {
  getDashboardStats,
  getSalesData,
  getTopProducts,
  getCategoryPerformance,
  getCustomerAnalytics,
  getOrderAnalytics,
  getRevenueAnalytics,
  mockAnalyticsData
} from '../core/helper/analyticsHelper';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, Package, ShoppingBag,
  DollarSign, Calendar, BarChart3, Loader, Clock,
  Award, Target, Activity
} from 'lucide-react';

interface DashboardStats {
  overview: {
    totalOrders: number;
    totalProducts: number;
    totalUsers: number;
    totalCategories: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
  today: {
    revenue: number;
    orders: number;
  };
  thisMonth: {
    revenue: number;
    orders: number;
  };
}

const AnalyticsDashboard = () => {
  const auth = isAutheticated();
  const { isTestMode } = useDevMode();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // State for different analytics data
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [categoryPerformance, setCategoryPerformance] = useState<any[]>([]);
  const [customerAnalytics, setCustomerAnalytics] = useState<any>(null);
  const [orderAnalytics, setOrderAnalytics] = useState<any>(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState<any>(null);

  const COLORS = ['#FCD34D', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

  useEffect(() => {
    loadAnalyticsData();
  }, [period, selectedYear, isTestMode]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    
    if (!auth) {
      setLoading(false);
      return;
    }

    const { user, token } = auth;

    try {
      if (isTestMode) {
        // Use mock data in test mode
        setDashboardStats(mockAnalyticsData.dashboardStats);
        setSalesData(mockAnalyticsData.salesData);
        setTopProducts(mockAnalyticsData.topProducts);
        setCategoryPerformance(mockAnalyticsData.categoryPerformance);
        setCustomerAnalytics(mockAnalyticsData.customerAnalytics);
        setOrderAnalytics(mockAnalyticsData.orderAnalytics);
        setRevenueAnalytics(mockAnalyticsData.revenueAnalytics);
      } else {
        // Fetch real data from API
        const [
          statsData,
          salesResponse,
          productsData,
          categoryData,
          customerData,
          orderData,
          revenueData
        ] = await Promise.all([
          getDashboardStats(user._id, token),
          getSalesData(user._id, token, period),
          getTopProducts(user._id, token, 5),
          getCategoryPerformance(user._id, token),
          getCustomerAnalytics(user._id, token),
          getOrderAnalytics(user._id, token),
          getRevenueAnalytics(user._id, token, selectedYear)
        ]);

        if (!statsData.error) setDashboardStats(statsData);
        if (!salesResponse.error) setSalesData(salesResponse);
        if (!productsData.error) setTopProducts(productsData);
        if (!categoryData.error) setCategoryPerformance(categoryData);
        if (!customerData.error) setCustomerAnalytics(customerData);
        if (!orderData.error) setOrderAnalytics(orderData);
        if (!revenueData.error) setRevenueAnalytics(revenueData);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 100;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  if (!auth) {
    return (
      <Base title="Unauthorized" description="Please login to access analytics">
        <div className="text-center py-8">
          <p className="text-red-400">You need to be logged in as admin to access this page.</p>
        </div>
      </Base>
    );
  }

  const renderStatCard = (title: string, value: string | number, change: string, icon: React.ReactNode, color: string) => (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${color} bg-opacity-20 flex items-center justify-center`}>
          {icon}
        </div>
        <span className={`text-sm font-medium ${parseFloat(change) >= 0 ? 'text-green-400' : 'text-red-400'} flex items-center gap-1`}>
          {parseFloat(change) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {change}%
        </span>
      </div>
      <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );

  return (
    <Base title="Analytics Dashboard" description="View detailed analytics and insights">
      <Link 
        to="/admin/dashboard" 
        className="btn bg-gray-700 hover:bg-gray-600 text-white mb-6 inline-block"
      >
        Back to Dashboard
      </Link>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader className="w-12 h-12 animate-spin text-yellow-400" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Header with Period Selector */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Analytics Overview</h1>
              <p className="text-gray-400">Track your business performance and insights</p>
              {isTestMode && (
                <p className="text-yellow-400 text-sm mt-2">🧪 Test Mode: Using sample data</p>
              )}
            </div>
            <div className="flex gap-2">
              {['week', 'month', 'year'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg capitalize transition-all ${
                    period === p
                      ? 'bg-yellow-400 text-gray-900 font-semibold'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          {dashboardStats && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {renderStatCard(
                'Total Revenue',
                formatCurrency(dashboardStats.overview.totalRevenue),
                '12.5',
                <DollarSign className="w-6 h-6 text-green-400" />,
                'bg-green-400'
              )}
              {renderStatCard(
                'Total Orders',
                dashboardStats.overview.totalOrders,
                '8.2',
                <ShoppingBag className="w-6 h-6 text-blue-400" />,
                'bg-blue-400'
              )}
              {renderStatCard(
                'Active Users',
                dashboardStats.overview.totalUsers,
                '15.3',
                <Users className="w-6 h-6 text-purple-400" />,
                'bg-purple-400'
              )}
              {renderStatCard(
                'Avg Order Value',
                formatCurrency(dashboardStats.overview.averageOrderValue),
                '5.7',
                <Target className="w-6 h-6 text-yellow-400" />,
                'bg-yellow-400'
              )}
            </div>
          )}

          {/* Sales Chart */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold mb-6">Sales Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FCD34D" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#FCD34D" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="_id" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#FCD34D' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#FCD34D"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Top Products and Categories */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                Top Products
              </h3>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                        <span className="text-lg">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-400">{product.sold} sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-yellow-400">{formatCurrency(product.revenue)}</p>
                      <p className="text-sm text-gray-400">⭐ {product.avgRating?.toFixed(1) || 0}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Performance */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold mb-6">Category Performance</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryPerformance}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="totalRevenue"
                  >
                    {categoryPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    formatter={(value: any) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Customer Analytics */}
          {customerAnalytics && (
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold mb-6">Customer Analytics</h3>
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Customer Growth Chart */}
                <div className="lg:col-span-2">
                  <h4 className="text-lg font-semibold mb-4">Customer Growth</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={customerAnalytics.customerGrowth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="_id" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="newCustomers" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        dot={{ fill: '#10B981' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Retention Rate */}
                <div className="bg-gray-900 rounded-xl p-6 text-center">
                  <h4 className="text-lg font-semibold mb-4">Retention Rate</h4>
                  <div className="text-4xl font-bold text-green-400 mb-2">
                    {customerAnalytics.retentionRate}%
                  </div>
                  <p className="text-sm text-gray-400">of customers return</p>
                </div>
              </div>
            </div>
          )}

          {/* Order Analytics */}
          {orderAnalytics && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Order Status Distribution */}
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-6">Order Status Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={orderAnalytics.orderStatusDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="_id" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    />
                    <Bar dataKey="count" fill="#FCD34D" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Delivery Stats */}
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  Delivery Performance
                </h3>
                <div className="space-y-4">
                  <div className="bg-gray-900 rounded-lg p-4">
                    <p className="text-gray-400 mb-1">Average Delivery Time</p>
                    <p className="text-2xl font-bold">
                      {orderAnalytics.deliveryTimeStats.avgDeliveryTime.toFixed(1)} days
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-900 rounded-lg p-4">
                      <p className="text-gray-400 text-sm mb-1">Fastest</p>
                      <p className="text-lg font-bold text-green-400">
                        {orderAnalytics.deliveryTimeStats.minDeliveryTime} days
                      </p>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-4">
                      <p className="text-gray-400 text-sm mb-1">Slowest</p>
                      <p className="text-lg font-bold text-red-400">
                        {orderAnalytics.deliveryTimeStats.maxDeliveryTime} days
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Revenue Analytics */}
          {revenueAnalytics && (
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Revenue Analytics</h3>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
                >
                  {[2023, 2024, 2025].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Monthly Revenue Chart */}
                <div className="lg:col-span-2">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={revenueAnalytics.monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="_id" 
                        stroke="#9CA3AF"
                        tickFormatter={(month) => {
                          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          return months[month - 1];
                        }}
                      />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                        labelFormatter={(month) => {
                          const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                          return months[month - 1];
                        }}
                      />
                      <Bar dataKey="revenue" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Discount Impact */}
                <div className="bg-gray-900 rounded-xl p-6">
                  <h4 className="text-lg font-semibold mb-4">Discount Impact</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-400 text-sm">Total Discounts Given</p>
                      <p className="text-xl font-bold text-yellow-400">
                        {formatCurrency(revenueAnalytics.discountImpact.totalDiscount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Orders with Discount</p>
                      <p className="text-lg font-bold">
                        {revenueAnalytics.discountImpact.ordersWithDiscount}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Avg Discount per Order</p>
                      <p className="text-lg font-bold">
                        {formatCurrency(revenueAnalytics.discountImpact.avgDiscountPerOrder)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Base>
  );
};

export default AnalyticsDashboard;
