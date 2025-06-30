const Settings = require("../models/settings");

// Get all settings (admin only)
exports.getAllSettings = async (req, res) => {
  try {
    const settings = await Settings.find().populate("updatedBy", "name email");
    res.json(settings);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch settings",
    });
  }
};

// Get a specific setting
exports.getSetting = async (req, res) => {
  const { key } = req.params;
  
  try {
    const setting = await Settings.findOne({ key });
    
    if (!setting) {
      return res.status(404).json({
        error: "Setting not found",
      });
    }
    
    res.json({
      key: setting.key,
      value: setting.value,
      description: setting.description,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch setting",
    });
  }
};

// Update a setting (admin only)
exports.updateSetting = async (req, res) => {
  const { key } = req.params;
  const { value, description } = req.body;
  const userId = req.profile._id;
  
  try {
    const setting = await Settings.setSetting(key, value, description, userId);
    
    res.json({
      message: "Setting updated successfully",
      setting,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to update setting",
    });
  }
};

// Toggle reviews enabled/disabled (admin only)
exports.toggleReviews = async (req, res) => {
  const userId = req.profile._id;
  
  try {
    // Get current status
    const currentStatus = await Settings.getSetting("reviews_enabled", true);
    
    // Toggle it
    const newStatus = !currentStatus;
    
    const setting = await Settings.setSetting(
      "reviews_enabled",
      newStatus,
      "Enable or disable product reviews system-wide",
      userId
    );
    
    res.json({
      message: `Reviews ${newStatus ? 'enabled' : 'disabled'} successfully`,
      reviewsEnabled: newStatus,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to toggle reviews",
    });
  }
};

// Get reviews status (public)
exports.getReviewsStatus = async (req, res) => {
  try {
    const reviewsEnabled = await Settings.getSetting("reviews_enabled", true);
    
    res.json({
      reviewsEnabled,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to get reviews status",
    });
  }
};

// Initialize default settings
exports.initializeSettings = async () => {
  try {
    // Check if reviews_enabled setting exists
    const reviewsSetting = await Settings.findOne({ key: "reviews_enabled" });
    
    if (!reviewsSetting) {
      await Settings.setSetting(
        "reviews_enabled",
        true,
        "Enable or disable product reviews system-wide"
      );
      console.log("Initialized default settings");
    }
  } catch (error) {
    console.error("Error initializing settings:", error);
  }
};
