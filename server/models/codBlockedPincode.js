const mongoose = require("mongoose");

const CodBlockedPincodeSchema = new mongoose.Schema(
  {
    pincode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: (v) => /^\d{3,6}$/.test(v),
        message: "Pincode must be 3–6 digits (6 for exact, 3 for prefix)"
      }
    },
    type: {
      type: String,
      enum: ["exact", "prefix"],
      default: "exact"
    },
    // Override the global advance amount for this specific pincode/prefix
    // null = use global setting (partial_cod_advance_amount)
    advanceAmount: {
      type: Number,
      default: null,
      min: 1
    },
    // Payment restriction level:
    //   'partial-cod'  → full COD blocked, partial COD allowed (default)
    //   'online-only'  → all COD blocked, online payment only
    blockLevel: {
      type: String,
      enum: ["partial-cod", "online-only"],
      default: "partial-cod"
    },
    reason: {
      type: String,
      default: "High RTO area",
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

// Index for fast pincode lookups
CodBlockedPincodeSchema.index({ pincode: 1, isActive: 1 });
CodBlockedPincodeSchema.index({ type: 1, isActive: 1 });

/**
 * Check if a pincode has payment restrictions.
 * Queries the DB for exact match first, then prefix match.
 * Returns { blocked, reason, advanceAmount, blockLevel } where:
 *   blocked      – true if any restriction applies
 *   blockLevel   – 'partial-cod' | 'online-only' | null (when not blocked)
 *   advanceAmount – per-pincode override (null = caller should use global setting)
 */
CodBlockedPincodeSchema.statics.isCodBlocked = async function (pincode) {
  if (!pincode || !/^\d{6}$/.test(pincode.trim())) {
    return { blocked: false, reason: "", advanceAmount: null, blockLevel: null };
  }

  const pin = pincode.trim();

  // 1. Exact pincode match
  const exactMatch = await this.findOne({ pincode: pin, type: "exact", isActive: true });
  if (exactMatch) {
    return {
      blocked: true,
      reason: exactMatch.reason,
      advanceAmount: exactMatch.advanceAmount, // may be null
      blockLevel: exactMatch.blockLevel
    };
  }

  // 2. Prefix match (first 3 digits)
  const prefix = pin.substring(0, 3);
  const prefixMatch = await this.findOne({ pincode: prefix, type: "prefix", isActive: true });
  if (prefixMatch) {
    return {
      blocked: true,
      reason: prefixMatch.reason,
      advanceAmount: prefixMatch.advanceAmount, // may be null
      blockLevel: prefixMatch.blockLevel
    };
  }

  return { blocked: false, reason: "", advanceAmount: null, blockLevel: null };
};

module.exports = mongoose.model("CodBlockedPincode", CodBlockedPincodeSchema);
