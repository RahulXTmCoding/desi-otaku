const express = require("express");
const router = express.Router();

const { isSignedIn, isAuthenticated, isAdmin } = require("../controllers/auth");
const { getUserById, pushOrderInPurchaseList } = require("../controllers/user");
const { updateStock } = require("../controllers/product");

const {
  getOrderById,
  createOrder,
  getAllOrders,
  getOrderStatus,
  updateStatus,
  calculateShipping,
  checkPincode,
  generateLabel,
  trackShipment,
  createShipment
} = require("../controllers/order");

//params

router.param("userId", getUserById);
router.param("orderId", getOrderById);

//actual routes

//create
router.post(
  "/order/create/:userId",
  isSignedIn,
  isAuthenticated,
  pushOrderInPurchaseList,
  updateStock,
  createOrder
);

//read
router.get(
  "/order/all/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  getAllOrders
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
  "/order/:orderId/:userId",
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

module.exports = router;
