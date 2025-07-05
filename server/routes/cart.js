const express = require("express");
const router = express.Router();
const { isSignedIn, isAuthenticated } = require("../controllers/auth");
const { getUserById } = require("../controllers/user");
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  mergeCart,
  syncCart
} = require("../controllers/cart");

// Param middleware
router.param("userId", getUserById);

// Get user's cart
router.get("/cart", isSignedIn, getCart);

// Add item to cart
router.post("/cart/add", isSignedIn, addToCart);

// Update cart item quantity
router.put("/cart/item/:itemId", isSignedIn, updateCartItem);

// Remove item from cart
router.delete("/cart/item/:itemId", isSignedIn, removeFromCart);

// Clear entire cart
router.delete("/cart/clear", isSignedIn, clearCart);

// Merge guest cart with user cart (after login)
router.post("/cart/merge", isSignedIn, mergeCart);

// Sync entire cart from frontend
router.post("/cart/sync", isSignedIn, syncCart);

module.exports = router;
