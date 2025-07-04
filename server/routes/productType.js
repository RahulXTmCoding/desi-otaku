const express = require("express");
const router = express.Router();

const { isSignedIn, isAuthenticated, isAdmin } = require("../controllers/auth");
const { getUserById } = require("../controllers/user");
const {
  create,
  getAll,
  getById,
  update,
  delete: deleteType,
  updateOrder,
  seedDefaultTypes
} = require("../controllers/productType");

// Params
router.param("userId", getUserById);

// Routes
// Get all product types (public route for shop page)
router.get("/producttypes", getAll);

// Get single product type
router.get("/producttype/:id", getById);

// Admin routes
router.post(
  "/producttype/create/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  create
);

router.put(
  "/producttype/:id/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  update
);

router.delete(
  "/producttype/:id/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  deleteType
);

router.put(
  "/producttypes/order/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  updateOrder
);

// Seed default types (admin only)
router.post(
  "/producttypes/seed/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  seedDefaultTypes
);

module.exports = router;
