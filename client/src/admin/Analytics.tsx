import React, { useState, useEffect } from 'react';
import { BarChart3, Download, RefreshCw, Loader } from 'lucide-react';
import { isAutheticated } from '../auth/helper';
import { useDevMode } from '../context/DevModeContext';
import { toast, Toaster } from 'react-hot-toast';
import { format } from 'date-fns';
import { API } from '../backend';

// Import modular components
import SalesOverviewCards from './components/analytics/SalesOverviewCards';
import DateRangeSelector from './components/analytics/DateRangeSelector';
import RevenueChart from './components/analytics/RevenueChart';
import ProductPerformanceTable from './components/analytics/ProductPerformanceTable';
import { 
  SalesOverview, 
  ProductPerformance, 
  ChartData 
} from './components/analytics/types';

const Analytics: React.FC = () => {
  const authData = isAutheticated();
  const user = authData && authData.user;
  const token = authData && authData.token;
  const { isTestMode } = useDevMode();

  // State management
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  
  // Custom date range state
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [salesOverview, setSalesOverview] = useState<SalesOverview>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    revenueGrowth: 0,
    orderGrowth: 0,
    avgOrderValue: 0,
    conversionRate: 0
  });
  const [revenueChartData, setRevenueChartData] = useState<ChartData>({
    labels: [],
    datasets: []
  });
  const [topProducts, setTopProducts] = useState<ProductPerformance[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [productTypeBreakdown, setProductTypeBreakdown] = useState<any[]>([]);

  useEffect(() => {
    loadAnalyticsData();
  }, [isTestMode, dateRange, customStartDate, customEndDate]);

  const handleCustomDateChange = (startDate: string, endDate: string) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    setDateRange('custom');
    // The useEffect will trigger loadAnalyticsData when dateRange changes
  };

  const loadAnalyticsData = async (clearCache = false) => {
    setLoading(true);

    try {
      if (isTestMode || !user || !token) {
        // Generate mock data for test mode or when not authenticated
        const mockData = generateMockAnalyticsData();
        setSalesOverview(mockData.overview);
        setRevenueChartData(mockData.revenueChart);
        setTopProducts(mockData.topProducts);
      } else {
        // Real API call
        try {
          // Clear cache if requested
          if (clearCache) {
            await fetch(`${API}/analytics/clear-cache`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            toast.success('Analytics cache cleared. Loading fresh data...', {
              icon: '🔄',
              duration: 2000,
            });
          }

          // Build analytics URL with date range
          let analyticsUrl = `${API}/analytics/dashboard?period=${dateRange}`;
          
          // Add custom date parameters if applicable
          if (dateRange === 'custom' && customStartDate && customEndDate) {
            analyticsUrl += `&startDate=${customStartDate}&endDate=${customEndDate}`;
          }

          const response = await fetch(analyticsUrl, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch analytics data');
          }

          const data = await response.json();
          const fallbackData = generateMockAnalyticsData();
          setSalesOverview(data.overview || fallbackData.overview);
          setRevenueChartData(data.revenueChart || fallbackData.revenueChart);
          setTopProducts(data.topProducts || fallbackData.topProducts);
          setCategoryBreakdown(data.categoryBreakdown || []);
          setProductTypeBreakdown(data.productTypeBreakdown || []);
        } catch (apiError) {
          console.error('API Error, using mock data:', apiError);
          // Use mock data as fallback when API fails
          const mockData = generateMockAnalyticsData();
          setSalesOverview(mockData.overview);
          setRevenueChartData(mockData.revenueChart);
          setTopProducts(mockData.topProducts);
          toast('Using sample data. Backend API not available.', {
            icon: '📊',
            duration: 4000,
          });
        }
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      toast.error('Failed to load analytics data');
      // Ensure we have some data to display
      const mockData = generateMockAnalyticsData();
      setSalesOverview(mockData.overview);
      setRevenueChartData(mockData.revenueChart);
      setTopProducts(mockData.topProducts);
    } finally {
      setLoading(false);
    }
  };

  const generateMockAnalyticsData = () => {
    // Generate labels based on date range
    const labels = [];
    const dataPoints = [];
    
    switch (dateRange) {
      case 'today':
        for (let i = 0; i < 24; i++) {
          labels.push(`${i}:00`);
          dataPoints.push(Math.floor(Math.random() * 5000) + 1000);
        }
        break;
      case 'week':
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        days.forEach(day => {
          labels.push(day);
          dataPoints.push(Math.floor(Math.random() * 20000) + 5000);
        });
        break;
      case 'month':
        for (let i = 1; i <= 30; i++) {
          if (i % 5 === 0) {
            labels.push(`Day ${i}`);
            dataPoints.push(Math.floor(Math.random() * 30000) + 10000);
          }
        }
        break;
      case 'year':
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        months.forEach(month => {
          labels.push(month);
          dataPoints.push(Math.floor(Math.random() * 100000) + 50000);
        });
        break;
      default:
        break;
    }

    const totalRevenue = dataPoints.reduce((sum, val) => sum + val, 0);

    return {
      overview: {
        totalRevenue,
        totalOrders: Math.floor(totalRevenue / 850),
        totalProducts: 45,
        totalCustomers: Math.floor(totalRevenue / 1200),
        revenueGrowth: Math.random() * 30 - 5,
        orderGrowth: Math.random() * 25 - 5,
        avgOrderValue: 850,
        conversionRate: 3.5
      },
      revenueChart: {
        labels,
        datasets: [{
          label: 'Revenue',
          data: dataPoints,
          backgroundColor: 'rgba(251, 191, 36, 0.8)',
          borderColor: 'rgba(251, 191, 36, 1)',
          borderWidth: 2
        }]
      },
      topProducts: [
        {
          productId: 'PROD001',
          name: 'Naruto Sage Mode T-Shirt',
          sold: 125,
          revenue: 99875,
          views: 3500,
          conversionRate: 3.6
        },
        {
          productId: 'PROD002',
          name: 'Attack on Titan Survey Corps Tee',
          sold: 98,
          revenue: 78204,
          views: 2800,
          conversionRate: 3.5
        },
        {
          productId: 'PROD003',
          name: 'One Piece Straw Hat Crew Design',
          sold: 87,
          revenue: 69513,
          views: 2100,
          conversionRate: 4.1
        },
        {
          productId: 'PROD004',
          name: 'Demon Slayer Breathing Styles',
          sold: 76,
          revenue: 60724,
          views: 1900,
          conversionRate: 4.0
        },
        {
          productId: 'PROD005',
          name: 'My Hero Academia Plus Ultra',
          sold: 65,
          revenue: 51935,
          views: 1500,
          conversionRate: 4.3
        }
      ]
    };
  };

  const handleExport = () => {
    // Export analytics data to CSV
    const csvData = [
      ['Metric', 'Value'],
      ['Total Revenue', salesOverview.totalRevenue],
      ['Total Orders', salesOverview.totalOrders],
      ['Average Order Value', salesOverview.avgOrderValue],
      ['Total Customers', salesOverview.totalCustomers],
      ['Revenue Growth', `${salesOverview.revenueGrowth.toFixed(1)}%`],
      ['Order Growth', `${salesOverview.orderGrowth.toFixed(1)}%`]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${dateRange}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Analytics data exported');
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
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-yellow-400" />
                Analytics Dashboard
              </h1>
              <p className="text-gray-400">Track your store performance and insights</p>
              {isTestMode && (
                <p className="text-yellow-400 text-sm mt-2">
                  🧪 Test Mode: Showing sample analytics data
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
                onClick={() => loadAnalyticsData(true)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                title="Clear cache and refresh data"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Sales Overview Cards */}
        <SalesOverviewCards data={salesOverview} loading={loading} />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <RevenueChart data={revenueChartData} loading={loading} />
          
          {/* Sales by Category */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-xl font-semibold mb-6">Sales by Category</h3>
            <div className="space-y-4">
              {categoryBreakdown.length > 0 ? (
                categoryBreakdown.map((category) => (
                  <div key={category.name}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm capitalize">
                        {category.name.replace(/-/g, ' ')}
                      </span>
                      <span className="text-sm font-medium">
                        {category.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>{category.units} units</span>
                      <span>₹{category.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">
                  No category sales data available for this period
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Product Type and Additional Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sales by Product Type */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-xl font-semibold mb-6">Sales by Product Type</h3>
            <div className="space-y-4">
              {productTypeBreakdown.length > 0 ? (
                productTypeBreakdown.map((type) => (
                  <div key={type.name}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm capitalize">
                        {type.name.replace(/-/g, ' ')}
                      </span>
                      <span className="text-sm font-medium">
                        {type.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${type.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>{type.units} units</span>
                      <span>₹{type.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">
                  No product type sales data available for this period
                </p>
              )}
            </div>
          </div>

          {/* Sales Distribution Summary */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-xl font-semibold mb-6">Sales Distribution</h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3">Top Category</h4>
                {categoryBreakdown.length > 0 && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="font-semibold capitalize">{categoryBreakdown[0].name}</p>
                    <p className="text-2xl font-bold text-blue-400">
                      ₹{categoryBreakdown[0].revenue.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400">
                      {categoryBreakdown[0].percentage.toFixed(1)}% of total sales
                    </p>
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3">Top Product Type</h4>
                {productTypeBreakdown.length > 0 && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="font-semibold capitalize">{productTypeBreakdown[0].name}</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      ₹{productTypeBreakdown[0].revenue.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400">
                      {productTypeBreakdown[0].percentage.toFixed(1)}% of total sales
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Product Performance Table */}
        <ProductPerformanceTable products={topProducts} loading={loading} />

        {/* Insights Section */}
        <div className="mt-8 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 rounded-2xl p-6 border border-yellow-400/20">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">💡</span>
            Key Insights
          </h4>
          <ul className="space-y-2 text-gray-300">
            <li>• Your best performing product is generating {topProducts[0]?.conversionRate}% conversion rate</li>
            <li>• Revenue has {salesOverview.revenueGrowth > 0 ? 'increased' : 'decreased'} by {Math.abs(salesOverview.revenueGrowth).toFixed(1)}% compared to last period</li>
            <li>• Average order value is ₹{salesOverview.avgOrderValue}, consider upselling strategies</li>
            <li>• Peak sales occur during weekends - optimize inventory accordingly</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
