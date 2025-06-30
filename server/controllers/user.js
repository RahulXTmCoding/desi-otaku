const User = require("../models/user");
const Order = require("../models/order");
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
  req.body.order.products.forEach((product) => {
    purchases.push({
      _id: product._id,
      name: product.name,
      description: product.description,
      category: product.category,
      quantity: product.quantity,
      amount: product.body.order.amount,
      transaction_id: product.body.order.transaction_id,
    });
  });
  //store this in DB
  User.findOneAndUpdate(
    { _id: req.profile._id },
    { $push: { purchases: purchases } },
    { new: true },
    (err, purchases) => {
      if (err) {
        return res.status(400).json({
          err: "Unable to save purchase List",
        });
      }
      next();
    }
  );
};
