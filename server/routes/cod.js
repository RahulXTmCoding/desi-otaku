const express = require("express");
const router = express.Router();

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
      const jwt = require('jsonwebtoken');
      
      try {
        const decoded = jwt.verify(token, process.env.SECRET);
        req.auth = decoded;
        
        // Get user by ID from token (secure - no URL parameter manipulation)
        const User = require('../models/user');
        const user = await User.findById(decoded._id);
        if (user) {
          req.user = user;
          console.log('✅ COD Order: User authenticated securely via JWT:', user._id);
        } else {
          return res.status(401).json({
            error: 'User not found - invalid token'
          });
        }
      } catch (jwtError) {
        console.log('❌ COD Order: Invalid JWT token');
        return res.status(401).json({
          error: 'Invalid authentication token'
        });
      }
    } catch (authError) {
      console.log('❌ COD Order: Auth error:', authError.message);
      return res.status(401).json({
        error: 'Authentication failed'
      });
    }
  } else {
    return res.status(401).json({
      error: 'Authentication token required for authenticated COD orders'
    });
  }
  next();
}, codController.createCodOrder);


// Admin routes
router.get("/stats", requireAdmin, codController.getCodStats);
router.put("/order/:orderId/status", requireAdmin, codController.updateCodOrderStatus);

module.exports = router;
