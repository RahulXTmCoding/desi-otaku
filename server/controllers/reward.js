const User = require("../models/user");
const RewardTransaction = require("../models/rewardTransaction");
const Settings = require("../models/settings");

// Check if rewards system is enabled
const isRewardsEnabled = async () => {
  const enabled = await Settings.getSetting("rewards.enabled", true);
  return enabled;
};

// Get user's reward balance
exports.getRewardBalance = async (req, res) => {
  try {
    if (!(await isRewardsEnabled())) {
      return res.status(400).json({
        error: "Rewards system is currently disabled"
      });
    }

    const user = await User.findById(req.profile._id).select("rewardPoints");
    
    res.json({
      balance: user.rewardPoints || 0,
      isEnabled: true
    });
  } catch (error) {
    console.error("Get reward balance error:", error);
    res.status(400).json({
      error: "Failed to get reward balance"
    });
  }
};

// Get reward transaction history
exports.getRewardHistory = async (req, res) => {
  try {
    if (!(await isRewardsEnabled())) {
      return res.status(400).json({
        error: "Rewards system is currently disabled"
      });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const transactions = await RewardTransaction.find({ user: req.profile._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate("orderId", "orderId totalAmount");

    const total = await RewardTransaction.countDocuments({ user: req.profile._id });

    res.json({
      transactions,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalTransactions: total
    });
  } catch (error) {
    console.error("Get reward history error:", error);
    res.status(400).json({
      error: "Failed to get reward history"
    });
  }
};

// Internal API - Credit points (only called from order completion)
exports.creditPoints = async (userId, orderId, orderAmount) => {
  try {
    if (!(await isRewardsEnabled())) {
      return { success: false, message: "Rewards system is disabled" };
    }

    // Calculate base points (1% of order value, rounded down)
    const basePoints = Math.floor(orderAmount * 0.01);
    
    if (basePoints === 0) {
      return { success: true, points: 0 };
    }

    // 🎯 AOV: Apply loyalty multipliers for enhanced point earning
    let finalPoints = basePoints;
    let multiplierApplied = 1;
    let multiplierMessage = "";
    
    try {
      const AOVService = require("../services/aovService");
      const multiplierResult = await AOVService.calculateLoyaltyMultiplier(orderAmount);
      
      if (multiplierResult && multiplierResult.multiplier > 1) {
        finalPoints = Math.floor(basePoints * multiplierResult.multiplier);
        multiplierApplied = multiplierResult.multiplier;
        multiplierMessage = multiplierResult.message;
        
        console.log(`✅ AOV Loyalty Multiplier Applied: ${multiplierApplied}X (${basePoints} base points → ${finalPoints} total points)`);
      }
    } catch (aovError) {
      console.error('AOV loyalty multiplier calculation error:', aovError);
      // Continue with base points if AOV service fails
    }

    // Update user's points
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { rewardPoints: finalPoints } },
      { new: true }
    );

    // Create transaction record with multiplier details
    const description = multiplierApplied > 1 
      ? `Earned ${finalPoints} points for order #${orderId} (${basePoints} base + ${finalPoints - basePoints} bonus from ${multiplierApplied}X multiplier)`
      : `Earned ${finalPoints} points for order #${orderId}`;

    await RewardTransaction.create({
      user: userId,
      type: "earned",
      amount: finalPoints,
      balance: user.rewardPoints,
      description: description,
      orderId: orderId,
      metadata: {
        orderAmount: orderAmount,
        basePoints: basePoints,
        multiplierApplied: multiplierApplied,
        bonusPoints: finalPoints - basePoints,
        multiplierMessage: multiplierMessage
      }
    });

    return { 
      success: true, 
      points: finalPoints,
      basePoints: basePoints,
      bonusPoints: finalPoints - basePoints,
      multiplierApplied: multiplierApplied,
      multiplierMessage: multiplierMessage,
      newBalance: user.rewardPoints 
    };
  } catch (error) {
    console.error("Credit points error:", error);
    return { success: false, error: error.message };
  }
};

// Internal API - Redeem points (only called from checkout)
exports.redeemPoints = async (userId, points, orderId) => {
  try {
    if (!(await isRewardsEnabled())) {
      return { success: false, message: "Rewards system is disabled" };
    }

    // Validate redemption amount (max 50 points)
    if (points > 50) {
      return { success: false, message: "Maximum 50 points can be redeemed per order" };
    }

    // Get user and validate balance
    const user = await User.findById(userId);
    if (!user || user.rewardPoints < points) {
      return { success: false, message: "Insufficient reward points" };
    }

    // Update user's points
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { rewardPoints: -points } },
      { new: true }
    );

    // Create transaction record
    await RewardTransaction.create({
      user: userId,
      type: "redeemed",
      amount: -points,
      balance: updatedUser.rewardPoints,
      description: `Redeemed ${points} points for order #${orderId}`,
      orderId: orderId
    });

    // Calculate discount (1 point = ₹0.5)
    const discountAmount = points * 0.5;

    return { 
      success: true, 
      pointsRedeemed: points, 
      discountAmount: discountAmount,
      newBalance: updatedUser.rewardPoints 
    };
  } catch (error) {
    console.error("Redeem points error:", error);
    return { success: false, error: error.message };
  }
};

// Admin: Adjust points
exports.adjustPoints = async (req, res) => {
  try {
    if (!(await isRewardsEnabled())) {
      return res.status(400).json({
        error: "Rewards system is currently disabled"
      });
    }

    const { userId, amount, reason } = req.body;

    if (!userId || amount === undefined || !reason) {
      return res.status(400).json({
        error: "userId, amount, and reason are required"
      });
    }

    // Get current user balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    // Check if adjustment would result in negative balance
    if (user.rewardPoints + amount < 0) {
      return res.status(400).json({
        error: "Adjustment would result in negative balance"
      });
    }

    // Update user's points
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { rewardPoints: amount } },
      { new: true }
    );

    // Create transaction record
    await RewardTransaction.create({
      user: userId,
      type: "admin_adjustment",
      amount: amount,
      balance: updatedUser.rewardPoints,
      description: `Admin adjustment: ${reason}`,
      adminUser: req.auth._id,
      metadata: {
        adjustmentReason: reason
      }
    });

    res.json({
      message: "Points adjusted successfully",
      userId: userId,
      adjustment: amount,
      newBalance: updatedUser.rewardPoints,
      reason: reason
    });
  } catch (error) {
    console.error("Adjust points error:", error);
    res.status(400).json({
      error: "Failed to adjust points"
    });
  }
};

// Admin: Toggle rewards system
exports.toggleRewardsSystem = async (req, res) => {
  try {
    const { enabled } = req.body;

    if (enabled === undefined) {
      return res.status(400).json({
        error: "enabled field is required"
      });
    }

    await Settings.setSetting("rewards.enabled", enabled, "Enable/disable rewards system", req.auth._id);
    
    // Also set related settings
    if (enabled) {
      await Settings.setSetting("rewards.earningRate", 0.01, "Points earned per rupee spent (1%)", req.auth._id);
      await Settings.setSetting("rewards.redemptionRate", 0.5, "Rupee value per point (₹0.5)", req.auth._id);
      await Settings.setSetting("rewards.maxRedemptionPerOrder", 50, "Maximum points that can be redeemed per order", req.auth._id);
    }

    res.json({
      message: `Rewards system ${enabled ? 'enabled' : 'disabled'} successfully`,
      enabled: enabled
    });
  } catch (error) {
    console.error("Toggle rewards system error:", error);
    res.status(400).json({
      error: "Failed to toggle rewards system"
    });
  }
};

// Admin: Get rewards system status
exports.getRewardsSystemStatus = async (req, res) => {
  try {
    const enabled = await Settings.getSetting("rewards.enabled", true);
    const earningRate = await Settings.getSetting("rewards.earningRate", 0.01);
    const redemptionRate = await Settings.getSetting("rewards.redemptionRate", 0.5);
    const maxRedemption = await Settings.getSetting("rewards.maxRedemptionPerOrder", 50);

    res.json({
      enabled,
      settings: {
        earningRate: earningRate * 100 + "%",
        redemptionRate: "₹" + redemptionRate + " per point",
        maxRedemptionPerOrder: maxRedemption + " points"
      }
    });
  } catch (error) {
    console.error("Get rewards status error:", error);
    res.status(400).json({
      error: "Failed to get rewards system status"
    });
  }
};

// Admin: Get all users' reward balances
exports.getAllUsersRewards = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
    const skip = (page - 1) * limit;

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } }
          ]
        }
      : {};

    const users = await User.find(query)
      .select("name email rewardPoints")
      .sort({ rewardPoints: -1 })
      .limit(limit)
      .skip(skip);

    const total = await User.countDocuments(query);

    res.json({
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total
    });
  } catch (error) {
    console.error("Get all users rewards error:", error);
    res.status(400).json({
      error: "Failed to get users' reward balances"
    });
  }
};
