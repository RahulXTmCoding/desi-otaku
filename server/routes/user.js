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
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
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

// Address management routes
router.get("/user/:userId/addresses", isSignedIn, isAuthenticated, getUserAddresses);
router.post("/user/:userId/address", isSignedIn, isAuthenticated, addUserAddress);
router.put("/user/:userId/address/:addressId", isSignedIn, isAuthenticated, updateUserAddress);
router.delete("/user/:userId/address/:addressId", isSignedIn, isAuthenticated, deleteUserAddress);

module.exports = router;
