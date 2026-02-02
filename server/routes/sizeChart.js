const express = require("express");
const router = express.Router();

const { isSignedIn, isAuthenticated, isAdmin } = require("../controllers/auth");
const { getUserById } = require("../controllers/user");
const {
  getAllSizeCharts,
  getSizeChartById,
  getSizeChartBySlug,
  createSizeChart,
  updateSizeChart,
  deleteSizeChart,
  toggleSizeChartStatus,
  getSizeChartsForDropdown
} = require("../controllers/sizeChart");

// Params
router.param("userId", getUserById);

// ============================================
// PUBLIC ROUTES
// ============================================

// Get all active size charts (public)
router.get("/sizecharts", getAllSizeCharts);

// Get size charts for dropdown (public - for product forms)
router.get("/sizecharts/dropdown", getSizeChartsForDropdown);

// Get single size chart by ID
router.get("/sizechart/:id", getSizeChartById);

// Get single size chart by slug
router.get("/sizechart/slug/:slug", getSizeChartBySlug);

// ============================================
// ADMIN ROUTES
// ============================================

// Create new size chart template
router.post(
  "/sizechart/create/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  createSizeChart
);

// Update size chart template
router.put(
  "/sizechart/:id/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  updateSizeChart
);

// Delete size chart template
router.delete(
  "/sizechart/:id/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  deleteSizeChart
);

// Toggle size chart active status
router.put(
  "/sizechart/:id/toggle/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  toggleSizeChartStatus
);

module.exports = router;
