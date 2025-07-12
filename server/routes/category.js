const express = require("express");
const router = express.Router();
const {
  getCategoryById,
  createCategory,
  getCategory,
  getAllCategory,
  updateCategory,
  removeCategory,
  getMainCategories,
  getSubcategories,
  getCategoryHierarchy,
  getCategoryTree,
} = require("../controllers/category");
const { isSignedIn, isAuthenticated, isAdmin } = require("../controllers/auth");
const { getUserById } = require("../controllers/user");

router.param("userId", getUserById);
router.param("categoryId", getCategoryById);

//actual routes

//post route
router.post(
  "/category/create/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  createCategory
);

//read route
router.get("/category/:categoryId", getCategory);
router.get("/categories", getAllCategory);

// New subcategory routes
router.get("/categories/main", getMainCategories);
router.get("/categories/subcategories/:parentId", getSubcategories);
router.get("/categories/hierarchy/:categoryId", getCategoryHierarchy);
router.get("/categories/tree", getCategoryTree);

//update route
router.put(
  "/category/:categoryId/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  updateCategory
);

//delete route
router.delete(
  "/category/:categoryId/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  removeCategory
);

module.exports = router;
