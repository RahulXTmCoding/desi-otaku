const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/adminAuth");
// Switch to optimized analytics controller for better performance
const { getAnalyticsDashboard, exportAnalytics, clearCache } = require("../controllers/analyticsOptimized");

// Analytics routes - Admin only
router.get(
  "/analytics/dashboard",
  requireAdmin,
  getAnalyticsDashboard
);

router.get(
  "/analytics/export",
  requireAdmin,
  exportAnalytics
);

// Clear analytics cache
router.post(
  "/analytics/clear-cache",
  requireAdmin,
  clearCache
);

module.exports = router;
