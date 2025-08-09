const express = require("express");
const router = express.Router();

// Import COD controller functions
const codController = require("../controllers/cod");

// Import middleware
const { requireSignin, isAuth } = require("../controllers/auth");
const { getUserById } = require("../controllers/user");
const { requireAdmin } = require("../middleware/adminAuth");

// Debug: Check if functions exist
console.log('COD Controller functions:', Object.keys(codController));
console.log('Auth middleware:', { requireSignin: !!requireSignin, isAuth: !!isAuth });
console.log('User middleware:', { getUserById: !!getUserById });
console.log('Admin middleware:', { requireAdmin: !!requireAdmin });

// Route to get user by ID (middleware)
router.param("userId", getUserById);

// Public routes for COD verification
router.post("/send-otp", codController.sendCodOtp);
router.post("/verify-otp", codController.verifyCodOtp);

// Guest COD order creation
router.post("/order/guest/create", codController.createGuestCodOrder);

// Authenticated user COD order creation (temporarily without auth middleware)
router.post("/order/create/:userId", codController.createCodOrder);

// Admin routes
router.get("/stats", requireAdmin, codController.getCodStats);
router.put("/order/:orderId/status", requireAdmin, codController.updateCodOrderStatus);

module.exports = router;
