const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models/user');

// Import COD controller functions
const codController = require("../controllers/cod");

// Import middleware
const { getUserById } = require("../controllers/user");
const { requireAdmin } = require("../middleware/adminAuth");

// Route to get user by ID (middleware)
router.param("userId", getUserById);

// Public routes for COD verification
router.post("/send-otp", codController.sendCodOtp);
router.post("/verify-otp", codController.verifyCodOtp);

// Public route to check bypass status
router.get("/bypass-status", codController.getCodBypassStatus);

// Guest COD order creation
router.post("/order/guest/create", codController.createGuestCodOrder);

// ✅ SECURE: Authenticated user COD order creation with proper JWT authentication  
router.post("/order/create", async (req, res, next) => {
  // Require authentication header for authenticated COD orders
  if (req.headers.authorization) {
    try {
      const token = req.headers.authorization.replace('Bearer ', '');
      try {
        const decoded = jwt.verify(token, process.env.SECRET);
        req.auth = decoded;
        // Get user by ID from token (secure - no URL parameter manipulation)
        const user = await User.findById(decoded._id);
        if (user) {
          req.user = user;
          console.log('✅ COD Order: User authenticated securely via JWT:', user._id);
        } else {
          return res.status(401).json({ error: 'User not found - invalid token' });
        }
      } catch (jwtError) {
        console.log('❌ COD Order: Invalid JWT token');
        return res.status(401).json({ error: 'Invalid authentication token' });
      }
    } catch (authError) {
      console.log('❌ COD Order: Auth error:', authError.message);
      return res.status(401).json({ error: 'Authentication failed' });
    }
  } else {
    return res.status(401).json({ error: 'Authentication token required for authenticated COD orders' });
  }
  next();
}, codController.createCodOrder);


// Admin routes
router.get("/stats", requireAdmin, codController.getCodStats);
router.put("/order/:orderId/status", requireAdmin, codController.updateCodOrderStatus);

// ─────────────────────────────────────────────────────────────
//  PARTIAL COD ROUTES
// ─────────────────────────────────────────────────────────────

// Public: check if pincode is blocked for full COD
router.post("/check-pincode", codController.checkPincodeCod);

// Public: create Razorpay order for ₹X advance payment
router.post("/partial-advance/create", codController.createPartialCodAdvanceOrder);

// Guest: create partial COD order (no auth required)
router.post("/order/partial/guest/create", codController.createGuestPartialCodOrder);

// Authenticated: create partial COD order (inline JWT — same pattern as /order/create)
router.post("/order/partial/create", async (req, res, next) => {
  if (req.headers.authorization) {
    try {
      const token = req.headers.authorization.replace('Bearer ', '');
      try {
        const decoded = jwt.verify(token, process.env.SECRET);
        req.auth = decoded;
        const user = await User.findById(decoded._id);
        if (user) {
          req.user = user;
          console.log('✅ Partial COD Order: User authenticated via JWT:', user._id);
        } else {
          return res.status(401).json({ error: 'User not found - invalid token' });
        }
      } catch (jwtError) {
        return res.status(401).json({ error: 'Invalid authentication token' });
      }
    } catch (authError) {
      return res.status(401).json({ error: 'Authentication failed' });
    }
  } else {
    return res.status(401).json({ error: 'Authentication token required' });
  }
  next();
}, codController.createPartialCodOrder);

module.exports = router;
