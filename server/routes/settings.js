const express = require("express");
const router = express.Router();

const { isSignedIn, isAuthenticated, isAdmin } = require("../controllers/auth");
const { getUserById } = require("../controllers/user");
const {
  getAllSettings,
  getSetting,
  updateSetting,
  toggleReviews,
  getReviewsStatus,
  toggleRewards,
  getRewardsStatus
} = require("../controllers/settings");

// Param
router.param("userId", getUserById);

// Public routes
router.get("/settings/reviews-status", getReviewsStatus);
router.get("/settings/rewards-status", getRewardsStatus);

// Admin routes
router.get("/settings/:userId", isSignedIn, isAuthenticated, isAdmin, getAllSettings);
router.get("/settings/:key/:userId", isSignedIn, isAuthenticated, isAdmin, getSetting);
router.put("/settings/:key/:userId", isSignedIn, isAuthenticated, isAdmin, updateSetting);
router.post("/settings/toggle-reviews/:userId", isSignedIn, isAuthenticated, isAdmin, toggleReviews);
router.post("/settings/toggle-rewards/:userId", isSignedIn, isAuthenticated, isAdmin, toggleRewards);

module.exports = router;
