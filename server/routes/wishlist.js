const express = require("express");
const router = express.Router();
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
  getWishlistCount,
  clearWishlist,
  moveToCart
} = require("../controllers/wishlist");
const { isSignedIn, isAuthenticated } = require("../controllers/auth");
const { getUserById } = require("../controllers/user");

// Param
router.param("userId", getUserById);

// Routes - all require authentication
router.get("/wishlist/:userId", isSignedIn, isAuthenticated, getWishlist);
router.post("/wishlist/:userId/add/:productId", isSignedIn, isAuthenticated, addToWishlist);
router.delete("/wishlist/:userId/remove/:productId", isSignedIn, isAuthenticated, removeFromWishlist);
router.get("/wishlist/:userId/check/:productId", isSignedIn, isAuthenticated, isInWishlist);
router.get("/wishlist/:userId/count", isSignedIn, isAuthenticated, getWishlistCount);
router.delete("/wishlist/:userId/clear", isSignedIn, isAuthenticated, clearWishlist);
router.post("/wishlist/:userId/move-to-cart/:productId", isSignedIn, isAuthenticated, moveToCart);

module.exports = router;
