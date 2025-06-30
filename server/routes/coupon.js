const express = require("express");
const router = express.Router();
const { check } = require("express-validator");

const {
  createCoupon,
  getAllCoupons,
  getCouponById,
  getCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  getActiveCoupons
} = require("../controllers/coupon");

const { isSignedIn, isAuthenticated, isAdmin } = require("../controllers/auth");
const { getUserById } = require("../controllers/user");

// Params
router.param("userId", getUserById);
router.param("couponId", getCouponById);

// Admin routes
router.post(
  "/coupon/create/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  [
    check("code", "Coupon code is required").notEmpty(),
    check("description", "Description is required").notEmpty(),
    check("discountType", "Discount type must be percentage or fixed").isIn(["percentage", "fixed"]),
    check("discountValue", "Discount value must be greater than 0").isFloat({ min: 0 }),
    check("validUntil", "Valid until date is required").notEmpty()
  ],
  createCoupon
);

router.get(
  "/coupons/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  getAllCoupons
);

router.get(
  "/coupon/:couponId/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  getCoupon
);

router.put(
  "/coupon/:couponId/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  updateCoupon
);

router.delete(
  "/coupon/:couponId/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  deleteCoupon
);

// Public/User routes
router.post("/coupon/validate", validateCoupon);
router.get("/coupons/active", getActiveCoupons);

module.exports = router;
