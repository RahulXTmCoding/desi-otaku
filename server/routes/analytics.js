const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/adminAuth");
// Switch to optimized analytics controller for better performance
const { getAnalyticsDashboard, exportAnalytics } = require("../controllers/analyticsOptimized");

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

module.exports = router;
