const express = require("express");
const router = express.Router();

const {
  getRewardBalance,
  getRewardHistory,
  adjustPoints,
  toggleRewardsSystem,
  getRewardsSystemStatus,
  getAllUsersRewards
} = require("../controllers/reward");

const { isSignedIn, isAuthenticated, isAdmin } = require("../controllers/auth");
const { getUserById } = require("../controllers/user");

// Params
router.param("userId", getUserById);

// User routes
router.get(
  "/rewards/balance/:userId",
  isSignedIn,
  isAuthenticated,
  getRewardBalance
);

router.get(
  "/rewards/history/:userId",
  isSignedIn,
  isAuthenticated,
  getRewardHistory
);

// Admin routes
router.post(
  "/admin/rewards/adjust/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  adjustPoints
);

router.post(
  "/admin/rewards/toggle/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  toggleRewardsSystem
);

router.get(
  "/admin/rewards/status/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  getRewardsSystemStatus
);

router.get(
  "/admin/rewards/users/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  getAllUsersRewards
);

module.exports = router;
