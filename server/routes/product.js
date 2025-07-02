const express = require("express");
const router = express.Router();
const {
  getProductById,
  createProduct,
  getProduct,
  photo,
  deleteProduct,
  updateProduct,
  getAllProducts,
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
} = require("../controllers/product");
const { 
  getProductVariants, 
  saveProductVariants 
} = require("../controllers/productVariant");
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
router.get("/product/photo/:productId", photo);

//delete route

router.delete(
  "/product/:productId/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  deleteProduct
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
router.get("/products/categories", getAllUniqueCategories);

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

module.exports = router;
