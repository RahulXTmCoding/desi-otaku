require("dotenv").config();
const mongoose = require("mongoose");
const Settings = require("../models/settings");

// Connect to MongoDB
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB CONNECTED");
    enableRewardSystem();
  })
  .catch((err) => {
    console.error("DB CONNECTION ERROR:", err);
  });

const enableRewardSystem = async () => {
  try {
    console.log("Enabling Reward Points System...");

    // Enable the rewards system
    await Settings.setSetting("rewards.enabled", true, "Enable/disable rewards system");
    console.log("✓ Rewards system enabled");

    // Set earning rate (1% of order value)
    await Settings.setSetting("rewards.earningRate", 0.01, "Points earned per rupee spent (1%)");
    console.log("✓ Earning rate set to 1%");

    // Set redemption rate (1 point = ₹0.5)
    await Settings.setSetting("rewards.redemptionRate", 0.5, "Rupee value per point (₹0.5)");
    console.log("✓ Redemption rate set to ₹0.5 per point");

    // Set max redemption per order (50 points)
    await Settings.setSetting("rewards.maxRedemptionPerOrder", 50, "Maximum points that can be redeemed per order");
    console.log("✓ Max redemption per order set to 50 points");

    console.log("\n✅ Reward Points System successfully enabled!");
    console.log("\nSettings:");
    console.log("- Earning rate: 1% of order value");
    console.log("- Redemption value: 1 point = ₹0.5");
    console.log("- Max redemption: 50 points per order (₹25 value)");
    console.log("\nUsers will now earn points on successful orders!");

    process.exit(0);
  } catch (error) {
    console.error("Error enabling reward system:", error);
    process.exit(1);
  }
};
