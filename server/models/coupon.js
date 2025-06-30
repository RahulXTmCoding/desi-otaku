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
    }
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
    discount = (subtotal * this.discountValue) / 100;
    if (this.maxDiscount !== null && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    discount = this.discountValue;
  }

  return Math.min(discount, subtotal); // Discount can't exceed subtotal
};

module.exports = mongoose.model("Coupon", couponSchema);
