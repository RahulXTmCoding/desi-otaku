const Coupon = require("../models/coupon");
const Order = require("../models/order");
const { validationResult } = require("express-validator");

// Create a new coupon (Admin only)
exports.createCoupon = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: errors.array()[0].msg
      });
    }

    const coupon = new Coupon(req.body);
    await coupon.save();

    res.json({
      message: "Coupon created successfully",
      coupon
    });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({
        error: "Coupon code already exists"
      });
    }
    return res.status(400).json({
      error: "Failed to create coupon"
    });
  }
};

// Get all coupons (Admin only)
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find()
      .populate("applicableCategories", "name")
      .populate("excludedProducts", "name")
      .sort({ createdAt: -1 });

    res.json(coupons);
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      error: "Failed to fetch coupons"
    });
  }
};

// Get single coupon
exports.getCouponById = async (req, res, next, id) => {
  try {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({
        error: "Coupon not found"
      });
    }
    req.coupon = coupon;
    next();
  } catch (err) {
    return res.status(400).json({
      error: "Failed to fetch coupon"
    });
  }
};

exports.getCoupon = (req, res) => {
  return res.json(req.coupon);
};

// Update coupon (Admin only)
exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.coupon._id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json({
      message: "Coupon updated successfully",
      coupon
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      error: "Failed to update coupon"
    });
  }
};

// Delete coupon (Admin only)
exports.deleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.coupon._id);
    res.json({
      message: "Coupon deleted successfully"
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      error: "Failed to delete coupon"
    });
  }
};

// Validate coupon for user
exports.validateCoupon = async (req, res) => {
  try {
    const { code, subtotal = 0 } = req.body;
    const userId = req.auth ? req.auth._id : null;

    if (!code) {
      return res.status(400).json({
        error: "Coupon code is required"
      });
    }

    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      isActive: true
    });

    if (!coupon) {
      return res.status(404).json({
        error: "Invalid coupon code"
      });
    }

    // Check if coupon is valid
    if (!coupon.isValid()) {
      return res.status(400).json({
        error: "Coupon has expired or reached usage limit"
      });
    }

    // Check minimum purchase
    if (subtotal < coupon.minimumPurchase) {
      return res.status(400).json({
        error: `Minimum purchase of ₹${coupon.minimumPurchase} required`
      });
    }

    // Check first time only restriction
    if (coupon.firstTimeOnly && userId) {
      const previousOrders = await Order.countDocuments({ 
        user: userId,
        status: { $ne: "cancelled" }
      });
      if (previousOrders > 0) {
        return res.status(400).json({
          error: "This coupon is only valid for first-time customers"
        });
      }
    }

    // Check user usage limit
    if (userId && coupon.userLimit) {
      const userUsageCount = await Order.countDocuments({
        user: userId,
        "coupon.code": coupon.code,
        status: { $ne: "cancelled" }
      });
      if (userUsageCount >= coupon.userLimit) {
        return res.status(400).json({
          error: "You have already used this coupon maximum times"
        });
      }
    }

    // Calculate discount
    const discount = coupon.calculateDiscount(subtotal);

    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discount: discount,
        minimumPurchase: coupon.minimumPurchase
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      error: "Failed to validate coupon"
    });
  }
};

// Get active coupons for users
exports.getActiveCoupons = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
      $or: [
        { usageLimit: null },
        { $expr: { $lt: ["$usageCount", "$usageLimit"] } }
      ]
    })
    .select("code description discountType discountValue minimumPurchase validUntil")
    .sort({ discountValue: -1 });

    res.json(coupons);
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      error: "Failed to fetch active coupons"
    });
  }
};

// Track coupon usage (called when order is placed)
exports.trackCouponUsage = async (couponCode, orderId) => {
  try {
    const coupon = await Coupon.findOne({ code: couponCode });
    if (coupon) {
      coupon.usageCount += 1;
      await coupon.save();
    }
  } catch (err) {
    console.error("Error tracking coupon usage:", err);
  }
};
