const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      required: true
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },
    minimumPurchase: {
      type: Number,
      default: 0
    },
    maxDiscount: {
      type: Number, // For percentage discounts, max discount amount
      default: null
    },
    displayType: {
      type: String,
      enum: ["promotional", "hidden", "auto-apply"],
      default: "hidden",
      required: true
    },
    bannerImage: {
      type: String, // URL for promotional banner image
      default: null
    },
    bannerText: {
      type: String, // Custom promotional text
      default: null
    },
    autoApplyPriority: {
      type: Number, // Higher priority means this coupon is preferred for auto-apply
      default: 0
    },
    usageLimit: {
      type: Number, // Total number of times coupon can be used
      default: null
    },
    usageCount: {
      type: Number,
      default: 0
    },
    userLimit: {
      type: Number, // Times a single user can use this coupon
      default: 1
    },
    validFrom: {
      type: Date,
      default: Date.now
    },
    validUntil: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    applicableCategories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category"
    }],
    excludedProducts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    }],
    firstTimeOnly: {
      type: Boolean,
      default: false
    },
    usedBy: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
      },
      usedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  { timestamps: true }
);

// Indexes for performance
couponSchema.index({ validUntil: 1 });
couponSchema.index({ isActive: 1 });

// Methods
couponSchema.methods.isValid = function() {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.validFrom &&
    now <= this.validUntil &&
    (this.usageLimit === null || this.usageCount < this.usageLimit)
  );
};

couponSchema.methods.calculateDiscount = function(subtotal) {
  if (!this.isValid()) return 0;
  if (subtotal < this.minimumPurchase) return 0;

  let discount = 0;
  if (this.discountType === "percentage") {
    // ✅ CRITICAL ROUNDING FIX: Use Math.floor() to match payment calculation exactly
    discount = Math.floor((subtotal * this.discountValue) / 100);
    if (this.maxDiscount !== null && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    discount = this.discountValue;
  }

  return Math.min(discount, subtotal); // Discount can't exceed subtotal
};

// Check if coupon can be auto-applied for a user
couponSchema.methods.canAutoApply = async function(userId, subtotal) {
  if (!this.isValid()) return false;
  if (this.displayType !== "auto-apply") return false;
  if (subtotal < this.minimumPurchase) return false;
  
  // Check if user has already used this coupon
  if (userId && this.userLimit) {
    const usageCount = this.usedBy.filter(
      usage => usage.userId?.toString() === userId.toString()
    ).length;
    
    if (usageCount >= this.userLimit) return false;
  }
  
  return true;
};

module.exports = mongoose.model("Coupon", couponSchema);
