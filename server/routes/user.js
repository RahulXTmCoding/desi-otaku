const express = require("express");
const router = express.Router();

const { isSignedIn, isAuthenticated, isAdmin } = require("../controllers/auth");
const {
  getUserById,
  getUser,
  updateUser,
  userPurchaseList,
  getUserProfile,
  updatePassword,
  updateAddress,
  deleteAccount,
} = require("../controllers/user");

router.param("userId", getUserById);
router.get("/user/:userId", isSignedIn, isAuthenticated, getUser);
router.put("/user/:userId", isSignedIn, isAuthenticated, updateUser);
router.get(
  "/orders/user/:userId",
  isSignedIn,
  isAuthenticated,
  userPurchaseList
);

// New profile management routes
router.get("/user/profile/:userId", isSignedIn, isAuthenticated, getUserProfile);
router.put("/user/password/:userId", isSignedIn, isAuthenticated, updatePassword);
router.put("/user/address/:userId", isSignedIn, isAuthenticated, updateAddress);
router.delete("/user/account/:userId", isSignedIn, isAuthenticated, deleteAccount);

module.exports = router;
