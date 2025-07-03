const User = require("../models/user");
const { Order } = require("../models/order");
const product = require("../models/product");

exports.getUserById = (req, res, next, id) => {
  User.findById(id).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        err: "User is not found in DB",
      });
    }
    req.profile = user;
    next();
  });
};

exports.getUser = (req, res) => {
  req.profile.salt = undefined;
  req.profile.encry_password = undefined;
  req.profile.updatedAt = undefined;
  req.profile.createdAt = undefined;
  return res.json(req.profile);
};

exports.updateUser = (req, res) => {
  // Prevent updating sensitive fields
  const allowedUpdates = ['name', 'lastname', 'email', 'userinfo', 'phone', 'address', 'city', 'state', 'country', 'pincode'];
  const updates = {};
  
  // Only include allowed fields
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  User.findByIdAndUpdate(
    { _id: req.profile._id },
    { $set: updates },
    { new: true, useFindAndModify: false },
    (err, user) => {
      if (err || !user) {
        return res.status(400).json({
          err: "Failed to update user profile",
        });
      }
      user.salt = undefined;
      user.encry_password = undefined;
      user.updatedAt = undefined;
      res.json({
        message: "Profile updated successfully",
        user
      });
    }
  );
};

// Get user profile with additional details
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.profile._id)
      .select('-salt -encry_password -updatedAt');
    
    // Get order count
    const orderCount = await Order.countDocuments({ user: req.profile._id });
    
    // Get wishlist count
    const Wishlist = require("../models/wishlist");
    const wishlist = await Wishlist.findOne({ user: req.profile._id });
    const wishlistCount = wishlist ? wishlist.products.length : 0;
    
    // Get review count
    const Review = require("../models/review");
    const reviewCount = await Review.countDocuments({ user: req.profile._id });
    
    res.json({
      user,
      stats: {
        totalOrders: orderCount,
        wishlistItems: wishlistCount,
        totalReviews: reviewCount
      }
    });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to get user profile",
      details: err.message
    });
  }
};

// Update user password (while logged in)
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Please provide current and new password"
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "New password must be at least 6 characters long"
      });
    }
    
    const user = await User.findById(req.profile._id);
    
    // Verify current password
    if (!user.authenticate(currentPassword)) {
      return res.status(401).json({
        error: "Current password is incorrect"
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({
      message: "Password updated successfully"
    });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to update password",
      details: err.message
    });
  }
};

// Add or update user address
exports.updateAddress = async (req, res) => {
  try {
    const { address, city, state, country, pincode, phone } = req.body;
    
    const updates = {};
    if (address) updates.address = address;
    if (city) updates.city = city;
    if (state) updates.state = state;
    if (country) updates.country = country;
    if (pincode) updates.pincode = pincode;
    if (phone) updates.phone = phone;
    
    const user = await User.findByIdAndUpdate(
      req.profile._id,
      { $set: updates },
      { new: true }
    ).select('-salt -encry_password');
    
    res.json({
      message: "Address updated successfully",
      user
    });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to update address",
      details: err.message
    });
  }
};

// Delete user account (soft delete)
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        error: "Please provide your password to confirm account deletion"
      });
    }
    
    const user = await User.findById(req.profile._id);
    
    // Verify password
    if (!user.authenticate(password)) {
      return res.status(401).json({
        error: "Password is incorrect"
      });
    }
    
    // Soft delete - mark as inactive
    user.isActive = false;
    user.deletedAt = new Date();
    await user.save();
    
    res.json({
      message: "Account deleted successfully"
    });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to delete account",
      details: err.message
    });
  }
};

exports.userPurchaseList = (req, res) => {
  Order.find({ user: req.profile._id })
    .populate("user", "_id name")
    .populate("products.product", "name price photoUrl")
    .exec((err, order) => {
      if (err) {
        return res.status(400).json({
          err: "No Order found",
        });
      }

      return res.json(order);
    });
};

exports.pushOrderInPurchaseList = (req, res, next) => {
  let purchases = [];
  
  // Check if order exists in request body
  if (!req.body.order || !req.body.order.products) {
    console.log("No order data found in request");
    return next(); // Skip if no order data
  }
  
  req.body.order.products.forEach((product) => {
    purchases.push({
      _id: product.product || product._id, // Handle both formats
      name: product.name,
      description: product.description || '',
      category: product.category || 'general',
      quantity: product.count || product.quantity || 1,
      amount: req.body.order.amount,
      transaction_id: req.body.order.transaction_id,
    });
  });
  
  //store this in DB
  User.findOneAndUpdate(
    { _id: req.profile._id },
    { $push: { purchases: purchases } },
    { new: true },
    (err, purchases) => {
      if (err) {
        console.error("Error saving purchase list:", err);
        // Don't fail the order if purchase list fails
        return next();
      }
      next();
    }
  );
};

// Get all saved addresses for a user
exports.getUserAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.profile._id).select('addresses');
    
    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }
    
    res.json(user.addresses || []);
  } catch (err) {
    return res.status(400).json({
      error: "Failed to fetch addresses",
      details: err.message
    });
  }
};

// Add a new address for a user
exports.addUserAddress = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      address,
      city,
      state,
      country,
      pinCode,
      isDefault
    } = req.body;
    
    // Validate required fields
    if (!fullName || !phone || !address || !city || !state || !pinCode) {
      return res.status(400).json({
        error: "Please provide all required address fields"
      });
    }
    
    const user = await User.findById(req.profile._id);
    
    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }
    
    // If this is set as default, unset other default addresses
    if (isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }
    
    // Add the new address
    user.addresses.push({
      fullName,
      email: email || user.email,
      phone,
      address,
      city,
      state,
      country: country || 'India',
      pinCode,
      isDefault: isDefault || user.addresses.length === 0 // First address is default
    });
    
    await user.save();
    
    res.json({
      message: "Address added successfully",
      addresses: user.addresses
    });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to add address",
      details: err.message
    });
  }
};

// Update a saved address
exports.updateUserAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const updates = req.body;
    
    const user = await User.findById(req.profile._id);
    
    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }
    
    const addressIndex = user.addresses.findIndex(
      addr => addr._id.toString() === addressId
    );
    
    if (addressIndex === -1) {
      return res.status(404).json({
        error: "Address not found"
      });
    }
    
    // If setting as default, unset other defaults
    if (updates.isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }
    
    // Update the address
    Object.assign(user.addresses[addressIndex], updates);
    
    await user.save();
    
    res.json({
      message: "Address updated successfully",
      addresses: user.addresses
    });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to update address",
      details: err.message
    });
  }
};

// Delete a saved address
exports.deleteUserAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    
    const user = await User.findById(req.profile._id);
    
    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }
    
    const addressIndex = user.addresses.findIndex(
      addr => addr._id.toString() === addressId
    );
    
    if (addressIndex === -1) {
      return res.status(404).json({
        error: "Address not found"
      });
    }
    
    // Remove the address
    user.addresses.splice(addressIndex, 1);
    
    // If the deleted address was default and there are other addresses,
    // make the first one default
    if (user.addresses.length > 0 && !user.addresses.some(addr => addr.isDefault)) {
      user.addresses[0].isDefault = true;
    }
    
    await user.save();
    
    res.json({
      message: "Address deleted successfully",
      addresses: user.addresses
    });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to delete address",
      details: err.message
    });
  }
};
