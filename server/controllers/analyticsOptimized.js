const { Order } = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');
const { startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay, endOfWeek, endOfMonth, endOfYear, subDays, subWeeks, subMonths, subYears, format } = require('date-fns');

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(method, params) {
  return `${method}_${JSON.stringify(params)}`;
}

function getFromCache(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// Get analytics dashboard data with MongoDB aggregation
exports.getAnalyticsDashboard = async (req, res) => {
  try {
    const { period = 'month', startDate: customStartDate, endDate: customEndDate } = req.query;
    
    // Check cache first (skip cache for custom dates to ensure fresh data)
    const cacheKey = getCacheKey('dashboard', { period, startDate: customStartDate, endDate: customEndDate });
    const cachedData = period !== 'custom' ? getFromCache(cacheKey) : null;
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // Get date range based on period or custom dates
    const { startDate, endDate, previousStartDate, previousEndDate } = getDateRange(period, customStartDate, customEndDate);
    
    // Use MongoDB aggregation for better performance
    const [currentMetrics, previousMetrics] = await Promise.all([
      getMetricsForPeriod(startDate, endDate),
      getMetricsForPeriod(previousStartDate, previousEndDate)
    ]);
    
    // Calculate growth rates
    const revenueGrowth = previousMetrics.totalRevenue > 0 
      ? ((currentMetrics.totalRevenue - previousMetrics.totalRevenue) / previousMetrics.totalRevenue) * 100 
      : 0;
    
    const orderGrowth = previousMetrics.totalOrders > 0 
      ? ((currentMetrics.totalOrders - previousMetrics.totalOrders) / previousMetrics.totalOrders) * 100 
      : 0;
    
    // Get revenue chart data using aggregation
    const revenueChartData = await getRevenueChartData(period, startDate, endDate);
    
    // Get top products using aggregation
    const topProducts = await getTopProductsAggregation(startDate, endDate);
    
    // Get category breakdown using aggregation
    const categoryBreakdown = await getCategoryBreakdownAggregation(startDate, endDate);
    
    // Get product type breakdown using aggregation
    const productTypeBreakdown = await getProductTypeBreakdownAggregation(startDate, endDate);
    
    const result = {
      overview: {
        totalRevenue: currentMetrics.totalRevenue,
        totalOrders: currentMetrics.totalOrders,
        totalProducts: currentMetrics.totalProducts,
        totalCustomers: currentMetrics.totalCustomers,
        revenueGrowth,
        orderGrowth,
        avgOrderValue: currentMetrics.avgOrderValue,
        conversionRate: 3.5 // This would need actual visitor tracking
      },
      revenueChart: revenueChartData,
      topProducts,
      categoryBreakdown,
      productTypeBreakdown
    };
    
    // Cache the result
    setCache(cacheKey, result);
    
    res.json(result);
    
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics data'
    });
  }
};

// Get metrics for a specific period using aggregation
async function getMetricsForPeriod(startDate, endDate) {
  const result = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        paymentStatus: 'Paid',
        status: { $ne: 'Cancelled' } // Explicitly exclude cancelled orders
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        totalOrders: { $sum: 1 },
        totalProducts: { $sum: { $size: '$products' } },
        uniqueCustomers: { 
          $addToSet: { 
            $cond: [
              { $ne: ['$user', null] },
              '$user',
              '$guestInfo.email'
            ]
          }
        }
      }
    },
    {
      $project: {
        totalRevenue: 1,
        totalOrders: 1,
        totalProducts: 1,
        totalCustomers: { $size: '$uniqueCustomers' },
        avgOrderValue: {
          $cond: [
            { $gt: ['$totalOrders', 0] },
            { $divide: ['$totalRevenue', '$totalOrders'] },
            0
          ]
        }
      }
    }
  ]);
  
  return result[0] || {
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    avgOrderValue: 0
  };
}

// Get revenue chart data using aggregation
async function getRevenueChartData(period, startDate, endDate) {
  let labels = [];
  let data = [];
  
  switch (period) {
    case 'today':
      // Group by hour
      for (let i = 0; i < 24; i++) {
        labels.push(`${i}:00`);
      }
      const hourlyData = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            paymentStatus: 'Paid',
            status: { $ne: 'Cancelled' }
          }
        },
        {
          $group: {
            _id: { $hour: '$createdAt' },
            revenue: { $sum: '$amount' }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      
      data = new Array(24).fill(0);
      hourlyData.forEach(item => {
        if (item._id >= 0 && item._id < 24) {
          data[item._id] = item.revenue;
        }
      });
      break;
      
    case 'week':
      // Group by day of week
      labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyData = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            paymentStatus: 'Paid',
            status: { $ne: 'Cancelled' }
          }
        },
        {
          $group: {
            _id: { $dayOfWeek: '$createdAt' },
            revenue: { $sum: '$amount' }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      
      data = new Array(7).fill(0);
      weeklyData.forEach(item => {
        if (item._id >= 1 && item._id <= 7) {
          data[item._id - 1] = item.revenue;
        }
      });
      break;
      
    case 'month':
      // Group by day of month
      const daysInMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        labels.push(i.toString());
      }
      
      const monthlyData = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            paymentStatus: 'Paid'
          }
        },
        {
          $group: {
            _id: { $dayOfMonth: '$createdAt' },
            revenue: { $sum: '$amount' }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      
      data = new Array(daysInMonth).fill(0);
      monthlyData.forEach(item => {
        if (item._id >= 1 && item._id <= daysInMonth) {
          data[item._id - 1] = item.revenue;
        }
      });
      break;
      
    case 'quarter':
      // Group by month for 3 months
      const quarterStartMonth = startDate.getMonth();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 0; i < 3; i++) {
        labels.push(months[(quarterStartMonth + i) % 12]);
      }
      
      const quarterData = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            paymentStatus: 'Paid'
          }
        },
        {
          $group: {
            _id: { $month: '$createdAt' },
            revenue: { $sum: '$amount' }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      
      data = new Array(3).fill(0);
      quarterData.forEach(item => {
        const monthIndex = item._id - 1 - quarterStartMonth;
        if (monthIndex >= 0 && monthIndex < 3) {
          data[monthIndex] = item.revenue;
        }
      });
      break;
      
    case 'year':
      // Group by month
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const yearlyData = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            paymentStatus: 'Paid'
          }
        },
        {
          $group: {
            _id: { $month: '$createdAt' },
            revenue: { $sum: '$amount' }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      
      data = new Array(12).fill(0);
      yearlyData.forEach(item => {
        if (item._id >= 1 && item._id <= 12) {
          data[item._id - 1] = item.revenue;
        }
      });
      break;
      
    case 'custom':
      // Custom date range - smart granularity
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 1) {
        // Single day - hourly data
        for (let i = 0; i < 24; i++) {
          labels.push(`${i}:00`);
        }
        const customHourlyData = await Order.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate, $lte: endDate },
              paymentStatus: 'Paid'
            }
          },
          {
            $group: {
              _id: { $hour: '$createdAt' },
              revenue: { $sum: '$amount' }
            }
          },
          { $sort: { _id: 1 } }
        ]);
        
        data = new Array(24).fill(0);
        customHourlyData.forEach(item => {
          if (item._id >= 0 && item._id < 24) {
            data[item._id] = item.revenue;
          }
        });
      } else {
        // Multi-day - daily data
        for (let i = 0; i < daysDiff; i++) {
          const currentDay = new Date(start);
          currentDay.setDate(start.getDate() + i);
          labels.push(format(currentDay, 'MMM dd'));
        }
        
        const customDailyData = await Order.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate, $lte: endDate },
              paymentStatus: 'Paid'
            }
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$createdAt'
                }
              },
              revenue: { $sum: '$amount' }
            }
          },
          { $sort: { _id: 1 } }
        ]);
        
        data = new Array(daysDiff).fill(0);
        const dateMap = new Map();
        customDailyData.forEach(item => {
          dateMap.set(item._id, item.revenue);
        });
        
        for (let i = 0; i < daysDiff; i++) {
          const currentDay = new Date(start);
          currentDay.setDate(start.getDate() + i);
          const dateStr = format(currentDay, 'yyyy-MM-dd');
          data[i] = dateMap.get(dateStr) || 0;
        }
      }
      break;
      
    default:
      // Default to last 30 days for unknown periods
      for (let i = 29; i >= 0; i--) {
        const date = new Date(endDate);
        date.setDate(date.getDate() - i);
        labels.push(format(date, 'MMM d'));
      }
      
      const dailyData = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            paymentStatus: 'Paid'
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            revenue: { $sum: '$amount' }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      
      data = new Array(30).fill(0);
      const dateMap = new Map();
      dailyData.forEach(item => {
        dateMap.set(item._id, item.revenue);
      });
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(endDate);
        date.setDate(date.getDate() - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        data[29 - i] = dateMap.get(dateStr) || 0;
      }
      break;
  }
  
  return {
    labels,
    datasets: [{
      label: 'Revenue',
      data,
      backgroundColor: 'rgba(251, 191, 36, 0.8)',
      borderColor: 'rgba(251, 191, 36, 1)',
      borderWidth: 2
    }]
  };
}

// Get top products using aggregation
async function getTopProductsAggregation(startDate, endDate) {
  const topProducts = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        paymentStatus: 'Paid'
      }
    },
    { $unwind: '$products' },
    {
      $project: {
        productId: {
          $cond: [
            { $or: [
              { $eq: ['$products.isCustom', true] },
              { $eq: ['$products.product', null] }
            ]},
            'custom-design',
            '$products.product'
          ]
        },
        name: {
          $cond: [
            { $or: [
              { $eq: ['$products.isCustom', true] },
              { $eq: ['$products.product', null] }
            ]},
            'Custom Design T-Shirts',
            '$products.name'
          ]
        },
        count: { $ifNull: ['$products.count', 1] },
        price: '$products.price',
        isCustom: { $or: [
          { $eq: ['$products.isCustom', true] },
          { $eq: ['$products.product', null] }
        ]}
      }
    },
    {
      $group: {
        _id: '$productId',
        name: { $first: '$name' },
        sold: { $sum: '$count' },
        revenue: { $sum: { $multiply: ['$price', '$count'] } },
        isCustom: { $first: '$isCustom' }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    {
      $project: {
        productId: '$_id',
        name: { 
          $cond: [
            '$isCustom',
            '$name',
            { $ifNull: [{ $arrayElemAt: ['$productInfo.name', 0] }, '$name'] }
          ]
        },
        sold: 1,
        revenue: 1,
        isCustom: 1,
        views: { $multiply: ['$sold', { $rand: {} }, 20, 10] },
        conversionRate: { $add: [2.5, { $multiply: [{ $rand: {} }, 2] }] }
      }
    }
  ]);
  
  return topProducts;
}

// Get category breakdown using aggregation
async function getCategoryBreakdownAggregation(startDate, endDate) {
  const breakdown = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        paymentStatus: 'Paid'
      }
    },
    { $unwind: '$products' },
    {
      $project: {
        isCustom: { $or: [
          { $eq: ['$products.isCustom', true] },
          { $eq: ['$products.product', null] }
        ]},
        product: '$products.product',
        price: '$products.price',
        count: { $ifNull: ['$products.count', 1] }
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    { $unwind: { path: '$productDetails', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'categories',
        localField: 'productDetails.category',
        foreignField: '_id',
        as: 'categoryDetails'
      }
    },
    { $unwind: { path: '$categoryDetails', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: {
          $cond: [
            '$isCustom',
            'custom-designs',
            { $ifNull: ['$categoryDetails._id', 'uncategorized'] }
          ]
        },
        name: { 
          $first: {
            $cond: [
              '$isCustom',
              'Custom Designs',
              { $ifNull: ['$categoryDetails.name', 'Uncategorized'] }
            ]
          }
        },
        revenue: { $sum: { $multiply: ['$price', '$count'] } },
        units: { $sum: '$count' }
      }
    },
    {
      $group: {
        _id: null,
        categories: { $push: '$$ROOT' },
        totalRevenue: { $sum: '$revenue' }
      }
    },
    {
      $unwind: '$categories'
    },
    {
      $project: {
        _id: '$categories._id',
        name: '$categories.name',
        revenue: '$categories.revenue',
        units: '$categories.units',
        percentage: {
          $multiply: [
            { $divide: ['$categories.revenue', '$totalRevenue'] },
            100
          ]
        }
      }
    },
    { $sort: { revenue: -1 } }
  ]);
  
  return breakdown;
}

// Get product type breakdown using aggregation
async function getProductTypeBreakdownAggregation(startDate, endDate) {
  const breakdown = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        paymentStatus: 'Paid'
      }
    },
    { $unwind: '$products' },
    {
      $project: {
        isCustom: { $or: [
          { $eq: ['$products.isCustom', true] },
          { $eq: ['$products.product', null] }
        ]},
        product: '$products.product',
        price: '$products.price',
        count: { $ifNull: ['$products.count', 1] }
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    { $unwind: { path: '$productDetails', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'producttypes',
        localField: 'productDetails.productType',
        foreignField: '_id',
        as: 'productTypeDetails'
      }
    },
    { $unwind: { path: '$productTypeDetails', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: {
          $cond: [
            '$isCustom',
            'custom-tshirt',
            { $ifNull: ['$productTypeDetails._id', 'other'] }
          ]
        },
        name: { 
          $first: {
            $cond: [
              '$isCustom',
              'Custom T-Shirt',
              { $ifNull: ['$productTypeDetails.displayName', 'Other'] }
            ]
          }
        },
        revenue: { $sum: { $multiply: ['$price', '$count'] } },
        units: { $sum: '$count' }
      }
    },
    {
      $group: {
        _id: null,
        types: { $push: '$$ROOT' },
        totalRevenue: { $sum: '$revenue' }
      }
    },
    {
      $unwind: '$types'
    },
    {
      $project: {
        _id: '$types._id',
        name: '$types.name',
        revenue: '$types.revenue',
        units: '$types.units',
        percentage: {
          $multiply: [
            { $divide: ['$types.revenue', '$totalRevenue'] },
            100
          ]
        }
      }
    },
    { $sort: { revenue: -1 } }
  ]);
  
  return breakdown;
}

// Helper function to get date ranges
function getDateRange(period, customStartDate, customEndDate) {
  const now = new Date();
  let startDate, endDate, previousStartDate, previousEndDate;
  
  // Handle custom date range
  if (period === 'custom' && customStartDate && customEndDate) {
    // Ensure startDate starts at beginning of day
    startDate = startOfDay(new Date(customStartDate));
    // Ensure endDate includes the entire end day
    endDate = endOfDay(new Date(customEndDate));
    
    console.log('🗓️ Custom date range (Optimized):', {
      customStartDate,
      customEndDate,
      processedStartDate: startDate,
      processedEndDate: endDate
    });
    
    // Calculate previous period of same length for growth comparison
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    previousStartDate = startOfDay(subDays(startDate, daysDiff));
    previousEndDate = endOfDay(subDays(endDate, daysDiff));
    
    return { startDate, endDate, previousStartDate, previousEndDate };
  }
  
  switch (period) {
    case 'today':
      startDate = startOfDay(now);
      endDate = endOfDay(now);
      previousStartDate = startOfDay(subDays(now, 1));
      previousEndDate = endOfDay(subDays(now, 1));
      break;
    case 'week':
      startDate = startOfWeek(now);
      endDate = endOfWeek(now);
      previousStartDate = startOfWeek(subWeeks(now, 1));
      previousEndDate = endOfWeek(subWeeks(now, 1));
      break;
    case 'month':
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      previousStartDate = startOfMonth(subMonths(now, 1));
      previousEndDate = endOfMonth(subMonths(now, 1));
      break;
    case 'quarter':
      // Get current quarter
      const currentQuarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
      endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0, 23, 59, 59, 999);
      // Previous quarter
      const prevQuarterStart = new Date(startDate);
      prevQuarterStart.setMonth(prevQuarterStart.getMonth() - 3);
      previousStartDate = prevQuarterStart;
      previousEndDate = new Date(startDate.getTime() - 1);
      break;
    case 'year':
      startDate = startOfYear(now);
      endDate = endOfYear(now);
      previousStartDate = startOfYear(subYears(now, 1));
      previousEndDate = endOfYear(subYears(now, 1));
      break;
    default:
      // Default to last 30 days
      startDate = subDays(now, 30);
      endDate = now;
      previousStartDate = subDays(now, 60);
      previousEndDate = subDays(now, 30);
  }
  
  return { startDate, endDate, previousStartDate, previousEndDate };
}

// Export analytics data
exports.exportAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Get the data first
    const { startDate, endDate } = getDateRange(period);
    const [metrics, topProducts, categoryBreakdown] = await Promise.all([
      getMetricsForPeriod(startDate, endDate),
      getTopProductsAggregation(startDate, endDate),
      getCategoryBreakdownAggregation(startDate, endDate)
    ]);
    
    // Format as CSV
    const csvData = [
      ['Metric', 'Value'],
      ['Total Revenue', metrics.totalRevenue],
      ['Total Orders', metrics.totalOrders],
      ['Average Order Value', metrics.avgOrderValue.toFixed(2)],
      ['Total Customers', metrics.totalCustomers],
      [''],
      ['Top Products'],
      ['Product', 'Revenue', 'Units Sold'],
      ...topProducts.map(p => [p.name, p.revenue, p.sold]),
      [''],
      ['Category Breakdown'],
      ['Category', 'Revenue', 'Percentage'],
      ...categoryBreakdown.map(c => [c.name, c.revenue, c.percentage.toFixed(1) + '%'])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-${period}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    res.send(csvContent);
    
  } catch (error) {
    console.error('Export Error:', error);
    res.status(500).json({
      error: 'Failed to export analytics data'
    });
  }
};

// Clear cache (useful for development/testing)
exports.clearCache = (req, res) => {
  cache.clear();
  res.json({ message: 'Analytics cache cleared' });
};
