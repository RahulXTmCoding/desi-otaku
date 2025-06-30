const express = require("express");
const router = express.Router();

const { isSignedIn, isAuthenticated, isAdmin } = require("../controllers/auth");
const { getUserById } = require("../controllers/user");

const {
  getDashboardStats,
  getSalesData,
  getTopProducts,
  getCategoryPerformance,
  getCustomerAnalytics,
  getOrderAnalytics,
  getRevenueAnalytics
} = require("../controllers/analytics");

// Param middleware
router.param("userId", getUserById);

// All analytics routes require admin authentication
router.get(
  "/analytics/dashboard/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  getDashboardStats
);

router.get(
  "/analytics/sales/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  getSalesData
);

router.get(
  "/analytics/products/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  getTopProducts
);

router.get(
  "/analytics/categories/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  getCategoryPerformance
);

router.get(
  "/analytics/customers/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  getCustomerAnalytics
);

router.get(
  "/analytics/orders/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  getOrderAnalytics
);

router.get(
  "/analytics/revenue/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  getRevenueAnalytics
);

module.exports = router;
