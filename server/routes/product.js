const express = require("express");
const router = express.Router();
const {
  getProductById,
  createProduct,
  getProduct,
  getProductImage,
  deleteProduct,
  permanentlyDeleteProduct,
  restoreProduct,
  updateProduct,
  getAllProducts,
  getDeletedProducts,
  getFilteredProducts,
  getAllUniqueCategories,
  checkInventory,
  reserveInventory,
  getLowStockProducts,
  getInventoryReport,
  searchProducts,
  getSearchSuggestions,
  getPopularSearches,
  addProductImage,
  removeProductImage,
  updateProductImage,
  getProductImages,
  toggleFeatured,
  getFeaturedProducts,
  getTrendingProducts,
} = require("../controllers/product");
const { 
  getProductVariants, 
  saveProductVariants 
} = require("../controllers/productVariant");
const {
  createProductJson,
  updateProductJson
} = require("../controllers/productJson");
const { getSimilarProducts } = require("../controllers/productSimilar");
const { isSignedIn, isAuthenticated, isAdmin } = require("../controllers/auth");
const { getUserById } = require("../controllers/user");

//all of params
router.param("userId", getUserById);
router.param("productId", getProductById);

//all of actual routes

router.post(
  "/product/create/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  createProduct
);

//read route
router.get("/product/:productId", getProduct);
router.get("/product/image/:productId", getProductImage);
router.get("/product/image/:productId/:imageIndex", getProductImage);

//delete routes - soft delete, permanent delete, and restore

router.delete(
  "/product/:productId/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  deleteProduct
);

router.delete(
  "/product/permanent/:productId/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  permanentlyDeleteProduct
);

router.put(
  "/product/restore/:productId/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  restoreProduct
);

//update route
router.put(
  "/product/:productId/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  updateProduct
);

//listing route

router.get("/products", getAllProducts);
router.get("/products/filtered", getFilteredProducts);
router.get("/products/categories", getAllUniqueCategories);

// Similar products route
router.get("/products/:productId/similar", getSimilarProducts);

// Get deleted products (admin only)
router.get(
  "/products/deleted/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  getDeletedProducts
);

// Search routes
router.get("/products/search", searchProducts);
router.get("/products/suggestions", getSearchSuggestions);
router.get("/products/popular-searches", getPopularSearches);

// Inventory management routes
router.post("/inventory/check", checkInventory);
router.post("/inventory/reserve", reserveInventory);
router.get(
  "/inventory/low-stock/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  getLowStockProducts
);
router.get(
  "/inventory/report/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  getInventoryReport
);

// Multiple images routes
router.get("/product/:productId/images", getProductImages);
router.post(
  "/product/:productId/images/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  addProductImage
);
router.put(
  "/product/:productId/images/:imageId/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  updateProductImage
);
router.delete(
  "/product/:productId/images/:imageId/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  removeProductImage
);

// Variant routes
router.get("/product/:productId/variants", getProductVariants);
router.post(
  "/product/:productId/variants/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  saveProductVariants
);

// JSON-based product routes (for handling multiple images properly)
router.post(
  "/product/create-json/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  createProductJson
);

router.put(
  "/product/update-json/:productId/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  updateProductJson
);

// Featured Products Management Routes

// Admin route to toggle featured status
router.put(
  "/product/:productId/toggle-featured/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  toggleFeatured
);

// Public routes for featured and trending products
router.get("/products/featured", getFeaturedProducts);
router.get("/products/trending", getTrendingProducts);

module.exports = router;
