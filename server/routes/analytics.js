const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/adminAuth");
const { getAnalyticsDashboard, exportAnalytics } = require("../controllers/analytics");

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
