const express = require("express");
const router = express.Router();
const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  markHelpful,
  getUserReview,
  getReviewStats,
  getAllReviews,
  adminDeleteReview
} = require("../controllers/review");
const { isSignedIn, isAuthenticated, isAdmin } = require("../controllers/auth");
const { getUserById } = require("../controllers/user");
const { getProductById } = require("../controllers/product");

// Params
router.param("userId", getUserById);
router.param("productId", getProductById);

// Public routes
router.get("/reviews/product/:productId", getProductReviews);
router.get("/reviews/product/:productId/stats", getReviewStats);

// Authenticated user routes
router.get("/reviews/product/:productId/user/:userId", isSignedIn, isAuthenticated, getUserReview);
router.post("/reviews/product/:productId/:userId", isSignedIn, isAuthenticated, createReview);
router.put("/reviews/:reviewId/:userId", isSignedIn, isAuthenticated, updateReview);
router.delete("/reviews/:reviewId/:userId", isSignedIn, isAuthenticated, deleteReview);
router.post("/reviews/:reviewId/helpful/:userId", isSignedIn, isAuthenticated, markHelpful);

// Admin routes
router.get("/admin/reviews/:userId", isSignedIn, isAuthenticated, isAdmin, getAllReviews);
router.delete("/admin/reviews/:reviewId/:userId", isSignedIn, isAuthenticated, isAdmin, adminDeleteReview);

module.exports = router;
