const express = require("express");
const router = express.Router();

const {
  listBlockedPincodes,
  addBlockedPincode,
  bulkAddBlockedPincodes,
  updateBlockedPincode,
  deleteBlockedPincode,
  updateGlobalAdvanceAmount
} = require("../controllers/codBlockedPincodeAdmin");

const { isSignedIn, isAuthenticated, isAdmin } = require("../controllers/auth");
const { getUserById } = require("../controllers/user");

// Route param middleware
router.param("userId", getUserById);

// All routes require admin authentication: isSignedIn → isAuthenticated → isAdmin

// GET  /api/cod-pincodes/:userId  — list all blocked pincodes
router.get("/:userId", isSignedIn, isAuthenticated, isAdmin, listBlockedPincodes);

// POST /api/cod-pincodes/:userId  — add single pincode
router.post("/:userId", isSignedIn, isAuthenticated, isAdmin, addBlockedPincode);

// POST /api/cod-pincodes/bulk/:userId  — bulk import (comma-separated)
router.post("/bulk/:userId", isSignedIn, isAuthenticated, isAdmin, bulkAddBlockedPincodes);

// PUT  /api/cod-pincodes/:id/:userId  — update pincode (reason, isActive, advanceAmount)
router.put("/:id/:userId", isSignedIn, isAuthenticated, isAdmin, updateBlockedPincode);

// DELETE /api/cod-pincodes/:id/:userId  — delete pincode
router.delete("/:id/:userId", isSignedIn, isAuthenticated, isAdmin, deleteBlockedPincode);

// PUT  /api/cod-pincodes/global-advance/:userId  — update global advance amount
router.put("/global-advance/:userId", isSignedIn, isAuthenticated, isAdmin, updateGlobalAdvanceAmount);

module.exports = router;
