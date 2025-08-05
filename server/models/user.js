//import mongoose from "mongoose";
const mongoose = require("mongoose");
var { Schema, ObjectId } = mongoose;
//const { createHmac } = await import("node:crypto");
const crypto = require("crypto");

const { v4: uuidv4 } = require("uuid");

// Address Schema
const addressSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  addressLine1: {
    type: String,
    required: true,
  },
  addressLine2: String,
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    default: 'India',
  },
  pinCode: {
    type: String,
    required: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Has defined the architecture of the user database
var userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: 32,
      trim: true,
    },

    lastname: {
      type: String,
      maxlength: 32,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },

    userinfo: {
      type: String,
      trim: true,
    },

    //TO DO: COME BACK HERE

    encry_password: {
      type: String,
      required: true,
    },

    salt: String,

    role: {
      type: Number,
      default: 0,
    },
    photo: {
      data: Buffer,
      contentType: String,
    },
    oauthId: {
      type: String,
      sparse: true,
    },
    oauthProvider: {
      type: String,
    },
    facebookId: {
      type: String,
      sparse: true,
    },
    googleId: {
      type: String,
      sparse: true,
    },
    accountCreatedOn: {
      type: Date,
      default: Date.now,
    },
    purchases: [
      {
        type: ObjectId,
        ref: "Order",
      },
    ],
    addresses: [addressSchema],
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: Date,
    dateOfBirth: Date,
    gender: String,
    preferences: {
      newsletter: {
        type: Boolean,
        default: true,
      },
      smsNotifications: {
        type: Boolean,
        default: true,
      },
    },
    rewardPoints: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // Auto-created flag for guest user accounts
    autoCreated: {
      type: Boolean,
      default: false,
    },
    
    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: Date,
  },
  { timestamps: true }
);

// Password encrypting method

userSchema
  .virtual("password")
  .set(function (password) {
    this._password = password;
    // _describes the private variable
    this.salt = uuidv4();
    this.encry_password = this.securePassword(password);
  })

  .get(function () {
    return this._password;
  });

userSchema.methods = {
  authenticate: function (plainpassword) {
    return this.securePassword(plainpassword) === this.encry_password;
  },

  securePassword: function (plainpassword) {
    if (!plainpassword) return "";
    try {
      return crypto
        .createHmac("sha256", this.salt)
        .update(plainpassword)
        .digest("hex");
    } catch (err) {
      return "";
    }
  },
};

module.exports = mongoose.model("User", userSchema);
