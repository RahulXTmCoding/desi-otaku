const mongoose = require("mongoose");

const rewardTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ["earned", "redeemed", "admin_adjustment", "expired"],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    balance: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order"
    },
    adminUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    metadata: {
      orderAmount: Number,
      adjustmentReason: String,
      expiryDate: Date
    }
  },
  { timestamps: true }
);

// Indexes for performance
rewardTransactionSchema.index({ createdAt: -1 });
rewardTransactionSchema.index({ user: 1, createdAt: -1 });
rewardTransactionSchema.index({ orderId: 1 });

module.exports = mongoose.model("RewardTransaction", rewardTransactionSchema);
