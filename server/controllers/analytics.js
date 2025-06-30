const Order = require("../models/order");
const Product = require("../models/product");
const User = require("../models/user");
const Category = require("../models/category");
const Review = require("../models/review");

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Get date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setDate(1);
    lastMonth.setHours(0, 0, 0, 0);
    
    const thisYear = new Date();
    thisYear.setMonth(0);
    thisYear.setDate(1);
    thisYear.setHours(0, 0, 0, 0);

    // Get total counts
    const [totalOrders, totalProducts, totalUsers, totalCategories] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments(),
      User.countDocuments({ role: 0 }), // Only customers
      Category.countDocuments()
    ]);

    // Get revenue statistics
    const revenueStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          averageOrderValue: { $avg: "$amount" }
        }
      }
    ]);

    // Get today's stats
    const todayStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          todayRevenue: { $sum: "$amount" },
          todayOrders: { $sum: 1 }
        }
      }
    ]);

    // Get this month's stats
    const thisMonthStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thisMonth }
        }
      },
      {
        $group: {
          _id: null,
          monthRevenue: { $sum: "$amount" },
          monthOrders: { $sum: 1 }
        }
      }
    ]);

    res.json({
      overview: {
        totalOrders,
        totalProducts,
        totalUsers,
        totalCategories,
        totalRevenue: revenueStats[0]?.totalRevenue || 0,
        averageOrderValue: revenueStats[0]?.averageOrderValue || 0
      },
      today: {
        revenue: todayStats[0]?.todayRevenue || 0,
        orders: todayStats[0]?.todayOrders || 0
      },
      thisMonth: {
        revenue: thisMonthStats[0]?.monthRevenue || 0,
        orders: thisMonthStats[0]?.monthOrders || 0
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      error: "Failed to fetch dashboard statistics"
    });
  }
};

// Get sales data over time
exports.getSalesData = async (req, res) => {
  try {
    const { period = "month" } = req.query;
    
    let dateFormat;
    let startDate = new Date();
    
    switch (period) {
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        dateFormat = "%Y-%m-%d";
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        dateFormat = "%Y-%m-%d";
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        dateFormat = "%Y-%m";
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
        dateFormat = "%Y-%m-%d";
    }

    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: "Cancelled" }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: dateFormat,
              date: "$createdAt"
            }
          },
          revenue: { $sum: "$amount" },
          orders: { $sum: 1 },
          items: { $sum: { $size: "$products" } }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json(salesData);
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      error: "Failed to fetch sales data"
    });
  }
};

// Get top products
exports.getTopProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topProducts = await Product.aggregate([
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "product",
          as: "reviews"
        }
      },
      {
        $project: {
          name: 1,
          price: 1,
          sold: 1,
          category: 1,
          avgRating: { $avg: "$reviews.rating" },
          reviewCount: { $size: "$reviews" },
          revenue: { $multiply: ["$sold", "$price"] }
        }
      },
      {
        $sort: { sold: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    // Populate category names
    await Category.populate(topProducts, { path: "category", select: "name" });

    res.json(topProducts);
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      error: "Failed to fetch top products"
    });
  }
};

// Get category performance
exports.getCategoryPerformance = async (req, res) => {
  try {
    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          productCount: { $sum: 1 },
          totalSold: { $sum: "$sold" },
          totalRevenue: { $sum: { $multiply: ["$sold", "$price"] } },
          avgPrice: { $avg: "$price" }
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryInfo"
        }
      },
      {
        $unwind: "$categoryInfo"
      },
      {
        $project: {
          name: "$categoryInfo.name",
          productCount: 1,
          totalSold: 1,
          totalRevenue: 1,
          avgPrice: 1
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);

    res.json(categoryStats);
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      error: "Failed to fetch category performance"
    });
  }
};

// Get customer analytics
exports.getCustomerAnalytics = async (req, res) => {
  try {
    // Get customer growth over time
    const customerGrowth = await User.aggregate([
      {
        $match: { role: 0 } // Only customers
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m",
              date: "$createdAt"
            }
          },
          newCustomers: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $limit: 12 // Last 12 months
      }
    ]);

    // Get top customers by order value
    const topCustomers = await Order.aggregate([
      {
        $group: {
          _id: "$user",
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$amount" },
          avgOrderValue: { $avg: "$amount" }
        }
      },
      {
        $sort: { totalSpent: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      {
        $unwind: "$userInfo"
      },
      {
        $project: {
          name: "$userInfo.name",
          email: "$userInfo.email",
          totalOrders: 1,
          totalSpent: 1,
          avgOrderValue: 1
        }
      }
    ]);

    // Get customer retention rate
    const repeatCustomers = await Order.aggregate([
      {
        $group: {
          _id: "$user",
          orderCount: { $sum: 1 }
        }
      },
      {
        $match: {
          orderCount: { $gt: 1 }
        }
      },
      {
        $count: "repeatCustomers"
      }
    ]);

    const totalCustomersWithOrders = await Order.distinct("user");
    const retentionRate = repeatCustomers[0] 
      ? (repeatCustomers[0].repeatCustomers / totalCustomersWithOrders.length) * 100 
      : 0;

    res.json({
      customerGrowth,
      topCustomers,
      retentionRate: retentionRate.toFixed(2)
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      error: "Failed to fetch customer analytics"
    });
  }
};

// Get order analytics
exports.getOrderAnalytics = async (req, res) => {
  try {
    // Order status distribution
    const orderStatusDistribution = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: "$amount" }
        }
      }
    ]);

    // Orders by time of day
    const ordersByHour = await Order.aggregate([
      {
        $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 },
          avgValue: { $avg: "$amount" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Average delivery time (for delivered orders)
    const deliveryTimeStats = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
          "shipping.estimatedDelivery": { $exists: true }
        }
      },
      {
        $project: {
          deliveryTime: {
            $divide: [
              { $subtract: ["$updatedAt", "$createdAt"] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgDeliveryTime: { $avg: "$deliveryTime" },
          minDeliveryTime: { $min: "$deliveryTime" },
          maxDeliveryTime: { $max: "$deliveryTime" }
        }
      }
    ]);

    res.json({
      orderStatusDistribution,
      ordersByHour,
      deliveryTimeStats: deliveryTimeStats[0] || {
        avgDeliveryTime: 0,
        minDeliveryTime: 0,
        maxDeliveryTime: 0
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      error: "Failed to fetch order analytics"
    });
  }
};

// Get revenue analytics
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    
    // Monthly revenue for the year
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${parseInt(year) + 1}-01-01`)
          },
          status: { $ne: "Cancelled" }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$amount" },
          orders: { $sum: 1 },
          avgOrderValue: { $avg: "$amount" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Revenue by payment method
    const revenueByPayment = await Order.aggregate([
      {
        $match: {
          status: { $ne: "Cancelled" }
        }
      },
      {
        $group: {
          _id: "$paymentMethod",
          revenue: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Discount/Coupon impact
    const discountImpact = await Order.aggregate([
      {
        $match: {
          discount: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalDiscount: { $sum: "$discount" },
          ordersWithDiscount: { $sum: 1 },
          avgDiscountPerOrder: { $avg: "$discount" }
        }
      }
    ]);

    res.json({
      monthlyRevenue,
      revenueByPayment,
      discountImpact: discountImpact[0] || {
        totalDiscount: 0,
        ordersWithDiscount: 0,
        avgDiscountPerOrder: 0
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      error: "Failed to fetch revenue analytics"
    });
  }
};
