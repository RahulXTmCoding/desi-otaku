const express = require("express");
const router = express.Router();

const { isSignedIn, isAuthenticated, isAdmin } = require("../controllers/auth");
const { getUserById, pushOrderInPurchaseList } = require("../controllers/user");
const { updateStock } = require("../controllers/product");

const {
  getOrderById,
  createOrder,
  createOrderUnified,
  getAllOrders,
  getOrder,
  getUserOrders,
  getOrderStatus,
  updateStatus,
  calculateShipping,
  checkPincode,
  generateLabel,
  trackShipment,
  createShipment,
  bulkUpdateStatus,
  exportOrders
} = require("../controllers/order");
const { verifyPayment } = require("../middleware/paymentAuth");

//params

router.param("userId", getUserById);
router.param("orderId", getOrderById);

//actual routes

//create
router.post(
  "/order/create/:userId",
  isSignedIn,
  isAuthenticated,
  verifyPayment,
  pushOrderInPurchaseList,
  updateStock,
  createOrderUnified
);

//read
router.get(
  "/order/all/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  getAllOrders
);

// ✅ ADD: Route for getting user's orders with proper product population (MOVED BEFORE GENERIC ROUTE)
router.get(
  "/orders/user/:userId",
  (req, res, next) => {
    console.log(`🎯 ORDER ROUTE HIT: /orders/user/${req.params.userId}`);
    console.log(`🎯 Query params:`, req.query);
    next();
  },
  isSignedIn,
  isAuthenticated,
  getUserOrders
);

router.get(
  "/order/:orderId/:userId",
  isSignedIn,
  isAuthenticated,
  getOrder
);

//Order status
router.get(
  "/order/status/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  getOrderStatus
);
router.put(
  "/order/:orderId/status/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  updateStatus
);

// Shipping routes
router.post(
  "/shipping/calculate",
  calculateShipping
);

router.get(
  "/shipping/pincode/:pincode",
  checkPincode
);

router.get(
  "/order/:orderId/label/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  generateLabel
);

router.get(
  "/order/:orderId/track",
  trackShipment
);

router.post(
  "/order/:orderId/ship/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  createShipment
);

// Bulk operations
router.put(
  "/order/bulk/status/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  bulkUpdateStatus
);

// Export orders
router.get(
  "/order/export/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  exportOrders
);

module.exports = router;
