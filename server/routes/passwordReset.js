const express = require("express");
const router = express.Router();
const { 
  requestPasswordReset, 
  verifyResetToken, 
  resetPassword,
  changePassword
} = require("../controllers/passwordReset");
const { isSignedIn, isAuthenticated } = require("../controllers/auth");
const { getUserById } = require("../controllers/user");

// Param middleware
router.param("userId", getUserById);

// Password reset routes (no auth required)
router.post("/password/forgot", requestPasswordReset);
router.get("/password/reset/:token", verifyResetToken);
router.post("/password/reset/:token", resetPassword);

// Change password route (auth required)
router.post(
  "/password/change/:userId",
  isSignedIn,
  isAuthenticated,
  changePassword
);

module.exports = router;
