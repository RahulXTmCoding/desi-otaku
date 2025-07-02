//import mongoose from "mongoose";
const mongoose = require("mongoose");
var { Schema } = mongoose;
//const { createHmac } = await import("node:crypto");
const crypto = require("crypto");

const { v4: uuidv4 } = require("uuid");

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

    purchases: {
      type: Array,
      default: [],
    },

    // Password reset fields
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // Additional profile fields
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
    
    // Saved addresses array
    addresses: [{
      fullName: {
        type: String,
        required: true,
      },
      email: String,
      phone: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
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
    }],
    
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
