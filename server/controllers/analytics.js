const { Order } = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');
const { startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay, endOfWeek, endOfMonth, endOfYear, subDays, subWeeks, subMonths, subYears, format } = require('date-fns');

// Get analytics dashboard data
exports.getAnalyticsDashboard = async (req, res) => {
  try {
    const { period = 'month', startDate: customStartDate, endDate: customEndDate } = req.query;
    const userId = req.user._id; // Changed from req.auth to req.user
    
    // Get date range based on period or custom dates
    const { startDate, endDate, previousStartDate, previousEndDate } = getDateRange(period, customStartDate, customEndDate);
    
    // Current period data
    const currentPeriodOrders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      paymentStatus: 'Paid'
    }).populate({
      path: 'products.product',
      populate: [
        { path: 'category' },
        { path: 'productType' }
      ]
    }).populate('user');
    
    // Previous period data for growth calculations
    const previousPeriodOrders = await Order.find({
      createdAt: { $gte: previousStartDate, $lte: previousEndDate },
      paymentStatus: 'Paid'
    });
    
    // Calculate metrics
    const currentRevenue = currentPeriodOrders.reduce((sum, order) => sum + order.amount, 0);
    const previousRevenue = previousPeriodOrders.reduce((sum, order) => sum + order.amount, 0);
    const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    
    const orderGrowth = previousPeriodOrders.length > 0 
      ? ((currentPeriodOrders.length - previousPeriodOrders.length) / previousPeriodOrders.length) * 100 
      : 0;
    
    // Get unique customers
    const uniqueCustomers = new Set(currentPeriodOrders.map(order => order.user?._id?.toString()).filter(Boolean));
    
    // Calculate average order value
    const avgOrderValue = currentPeriodOrders.length > 0 ? currentRevenue / currentPeriodOrders.length : 0;
    
    // Get total products sold
    const totalProducts = currentPeriodOrders.reduce((sum, order) => {
      return sum + order.products.reduce((prodSum, item) => prodSum + (item.count || 1), 0);
    }, 0);
    
    // Generate revenue chart data
    const revenueChartData = generateRevenueChartData(currentPeriodOrders, period, startDate, endDate);
    
    // Get top performing products
    const topProducts = await getTopProducts(currentPeriodOrders);
    
    // Get category breakdown
    const categoryBreakdown = await getCategoryBreakdown(currentPeriodOrders);
    
    // Get product type breakdown
    const productTypeBreakdown = await getProductTypeBreakdown(currentPeriodOrders);
    
    res.json({
      overview: {
        totalRevenue: currentRevenue,
        totalOrders: currentPeriodOrders.length,
        totalProducts,
        totalCustomers: uniqueCustomers.size,
        revenueGrowth,
        orderGrowth,
        avgOrderValue,
        conversionRate: 3.5 // This would need actual visitor tracking
      },
      revenueChart: revenueChartData,
      topProducts,
      categoryBreakdown,
      productTypeBreakdown
    });
    
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics data'
    });
  }
};

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
    
    console.log('🗓️ Custom date range:', {
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
      // Quarter support
      const currentQuarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
      endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
      previousStartDate = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
      previousEndDate = new Date(now.getFullYear(), currentQuarter * 3, 0);
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

// Generate revenue chart data
function generateRevenueChartData(orders, period, startDate, endDate) {
  const labels = [];
  const data = [];
  
  switch (period) {
    case 'custom':
      // Custom date range - daily data
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 1) {
        // Single day - hourly data
        for (let i = 0; i < 24; i++) {
          labels.push(`${i}:00`);
          const hourOrders = orders.filter(order => {
            const orderHour = new Date(order.createdAt).getHours();
            return orderHour === i;
          });
          data.push(hourOrders.reduce((sum, order) => sum + order.amount, 0));
        }
      } else if (daysDiff <= 7) {
        // Week or less - daily data
        for (let i = 0; i < daysDiff; i++) {
          const currentDay = new Date(start);
          currentDay.setDate(start.getDate() + i);
          labels.push(format(currentDay, 'MMM dd'));
          
          const dayOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate.toDateString() === currentDay.toDateString();
          });
          data.push(dayOrders.reduce((sum, order) => sum + order.amount, 0));
        }
      } else if (daysDiff <= 31) {
        // Month or less - daily data
        for (let i = 0; i < daysDiff; i++) {
          const currentDay = new Date(start);
          currentDay.setDate(start.getDate() + i);
          labels.push(format(currentDay, 'MMM dd'));
          
          const dayOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate.toDateString() === currentDay.toDateString();
          });
          data.push(dayOrders.reduce((sum, order) => sum + order.amount, 0));
        }
      } else {
        // More than a month - weekly data
        const weeks = Math.ceil(daysDiff / 7);
        for (let i = 0; i < weeks; i++) {
          const weekStart = new Date(start);
          weekStart.setDate(start.getDate() + (i * 7));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          
          labels.push(`Week ${i + 1}`);
          
          const weekOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= weekStart && orderDate <= weekEnd;
          });
          data.push(weekOrders.reduce((sum, order) => sum + order.amount, 0));
        }
      }
      break;
      
    case 'today':
      // Hourly data
      for (let i = 0; i < 24; i++) {
        labels.push(`${i}:00`);
        const hourOrders = orders.filter(order => {
          const orderHour = new Date(order.createdAt).getHours();
          return orderHour === i;
        });
        data.push(hourOrders.reduce((sum, order) => sum + order.amount, 0));
      }
      break;
      
    case 'week':
      // Daily data
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 0; i < 7; i++) {
        labels.push(days[i]);
        const dayOrders = orders.filter(order => {
          const orderDay = new Date(order.createdAt).getDay();
          return orderDay === i;
        });
        data.push(dayOrders.reduce((sum, order) => sum + order.amount, 0));
      }
      break;
      
    case 'month':
      // Weekly data
      for (let week = 0; week < 4; week++) {
        labels.push(`Week ${week + 1}`);
        const weekStart = new Date(startDate);
        weekStart.setDate(weekStart.getDate() + (week * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const weekOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= weekStart && orderDate <= weekEnd;
        });
        data.push(weekOrders.reduce((sum, order) => sum + order.amount, 0));
      }
      break;
      
    case 'quarter':
      // Monthly data for quarter
      const quarterMonths = ['Month 1', 'Month 2', 'Month 3'];
      const quarterStart = new Date(startDate);
      
      for (let i = 0; i < 3; i++) {
        labels.push(quarterMonths[i]);
        const monthStart = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + i, 1);
        const monthEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + i + 1, 0);
        
        const monthOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= monthStart && orderDate <= monthEnd;
        });
        data.push(monthOrders.reduce((sum, order) => sum + order.amount, 0));
      }
      break;
      
    case 'year':
      // Monthly data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 0; i < 12; i++) {
        labels.push(months[i]);
        const monthOrders = orders.filter(order => {
          const orderMonth = new Date(order.createdAt).getMonth();
          return orderMonth === i;
        });
        data.push(monthOrders.reduce((sum, order) => sum + order.amount, 0));
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

// Get top performing products
async function getTopProducts(orders) {
  const productStats = {};
  
  // Aggregate product sales
  orders.forEach(order => {
    order.products.forEach(item => {
      if (item.product) {
        // Regular product with reference
        const productId = item.product._id.toString();
        if (!productStats[productId]) {
          productStats[productId] = {
            productId,
            name: item.product.name,
            sold: 0,
            revenue: 0,
            isCustom: false
          };
        }
        productStats[productId].sold += item.count || 1;
        productStats[productId].revenue += (item.product.price * (item.count || 1));
      } else if (item.isCustom || item.customization) {
        // Custom design order
        const customId = 'custom-design';
        if (!productStats[customId]) {
          productStats[customId] = {
            productId: customId,
            name: 'Custom Design T-Shirts',
            sold: 0,
            revenue: 0,
            isCustom: true
          };
        }
        productStats[customId].sold += item.count || 1;
        productStats[customId].revenue += (item.price * (item.count || 1));
      }
    });
  });
  
  // Convert to array and sort by revenue
  const topProducts = Object.values(productStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(product => ({
      ...product,
      views: Math.floor(product.sold * (Math.random() * 20 + 10)), // Mock views
      conversionRate: Math.random() * 2 + 2.5 // Mock conversion rate as number
    }));
  
  return topProducts;
}

// Get category breakdown
async function getCategoryBreakdown(orders) {
  const categoryStats = {};
  let totalRevenue = 0;
  
  // Aggregate sales by category
  orders.forEach(order => {
    order.products.forEach(item => {
      if (item.product && item.product.category) {
        const category = item.product.category;
        const categoryKey = category._id ? category._id.toString() : 'uncategorized';
        const categoryName = category.name || 'Uncategorized';
        
        if (!categoryStats[categoryKey]) {
          categoryStats[categoryKey] = {
            name: categoryName,
            revenue: 0,
            units: 0
          };
        }
        
        const itemRevenue = item.product.price * (item.count || 1);
        categoryStats[categoryKey].revenue += itemRevenue;
        categoryStats[categoryKey].units += (item.count || 1);
        totalRevenue += itemRevenue;
      } else if (item.isCustom || item.customization) {
        // Custom design order - add to custom category
        const categoryKey = 'custom-designs';
        const categoryName = 'Custom Designs';
        
        if (!categoryStats[categoryKey]) {
          categoryStats[categoryKey] = {
            name: categoryName,
            revenue: 0,
            units: 0
          };
        }
        
        const itemRevenue = item.price * (item.count || 1);
        categoryStats[categoryKey].revenue += itemRevenue;
        categoryStats[categoryKey].units += (item.count || 1);
        totalRevenue += itemRevenue;
      }
    });
  });
  
  // Convert to array with percentages
  const categoryBreakdown = Object.values(categoryStats).map(category => ({
    ...category,
    percentage: totalRevenue > 0 ? (category.revenue / totalRevenue) * 100 : 0
  }));
  
  // Sort by revenue
  categoryBreakdown.sort((a, b) => b.revenue - a.revenue);
  
  return categoryBreakdown;
}

// Get product type breakdown
async function getProductTypeBreakdown(orders) {
  const productTypeStats = {};
  let totalRevenue = 0;
  
  // Aggregate sales by product type
  orders.forEach(order => {
    order.products.forEach(item => {
      if (item.product) {
        let productTypeName = 'Other';
        let productTypeKey = 'other';
        
        // Handle both ObjectId references and string values
        if (item.product.productType) {
          if (typeof item.product.productType === 'object' && item.product.productType._id) {
            // ObjectId reference - populated
            productTypeKey = item.product.productType._id.toString();
            productTypeName = item.product.productType.displayName || item.product.productType.name || 'Unknown';
          } else if (typeof item.product.productType === 'string') {
            // String value - legacy format
            productTypeKey = item.product.productType.toLowerCase().replace(/[\s-]/g, '');
            productTypeName = item.product.productType;
            
            // Normalize common variations
            if (productTypeKey === 'tshirt' || productTypeKey === 't-shirt') {
              productTypeName = 'T-Shirt';
            }
          }
        }
        
        if (!productTypeStats[productTypeKey]) {
          productTypeStats[productTypeKey] = {
            name: productTypeName,
            revenue: 0,
            units: 0
          };
        }
        
        const itemRevenue = item.product.price * (item.count || 1);
        productTypeStats[productTypeKey].revenue += itemRevenue;
        productTypeStats[productTypeKey].units += (item.count || 1);
        totalRevenue += itemRevenue;
      } else if (item.isCustom || item.customization) {
        // Custom design order - always a T-shirt
        const productTypeKey = 'custom-tshirt';
        const productTypeName = 'Custom T-Shirt';
        
        if (!productTypeStats[productTypeKey]) {
          productTypeStats[productTypeKey] = {
            name: productTypeName,
            revenue: 0,
            units: 0
          };
        }
        
        const itemRevenue = item.price * (item.count || 1);
        productTypeStats[productTypeKey].revenue += itemRevenue;
        productTypeStats[productTypeKey].units += (item.count || 1);
        totalRevenue += itemRevenue;
      }
    });
  });
  
  // Convert to array with percentages
  const productTypeBreakdown = Object.values(productTypeStats).map(type => ({
    ...type,
    percentage: totalRevenue > 0 ? (type.revenue / totalRevenue) * 100 : 0
  }));
  
  // Sort by revenue
  productTypeBreakdown.sort((a, b) => b.revenue - a.revenue);
  
  return productTypeBreakdown;
}

// Export analytics data
exports.exportAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const analyticsData = await this.getAnalyticsDashboard(req, res);
    
    // Return data in CSV format
    const csvData = [
      ['Metric', 'Value'],
      ['Total Revenue', analyticsData.overview.totalRevenue],
      ['Total Orders', analyticsData.overview.totalOrders],
      ['Average Order Value', analyticsData.overview.avgOrderValue],
      ['Total Customers', analyticsData.overview.totalCustomers],
      ['Revenue Growth', `${analyticsData.overview.revenueGrowth.toFixed(1)}%`],
      ['Order Growth', `${analyticsData.overview.orderGrowth.toFixed(1)}%`]
    ];
    
    // Add top products
    csvData.push([''], ['Top Products']);
    csvData.push(['Product', 'Revenue', 'Units Sold']);
    analyticsData.topProducts.forEach(product => {
      csvData.push([product.name, product.revenue, product.sold]);
    });
    
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
