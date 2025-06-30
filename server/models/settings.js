const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
      default: "general",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Static method to get a setting
settingsSchema.statics.getSetting = async function(key, defaultValue = null) {
  try {
    const setting = await this.findOne({ key });
    return setting ? setting.value : defaultValue;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return defaultValue;
  }
};

// Static method to set a setting
settingsSchema.statics.setSetting = async function(key, value, description = "", userId = null) {
  try {
    const setting = await this.findOneAndUpdate(
      { key },
      { 
        value, 
        description,
        updatedBy: userId 
      },
      { new: true, upsert: true }
    );
    return setting;
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
    throw error;
  }
};

module.exports = mongoose.model("Settings", settingsSchema);
