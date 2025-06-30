const crypto = require('crypto');
const User = require('../models/user');
const emailService = require('../services/emailService');

// Request password reset
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required"
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({
        message: "If an account exists with this email, you will receive a password reset link."
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token before saving
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Save token and expiry to user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    await user.save({ validateBeforeSave: false });

    // Send email
    await emailService.sendPasswordResetEmail(user, resetToken);

    res.json({
      message: "If an account exists with this email, you will receive a password reset link."
    });

  } catch (err) {
    console.error('Password reset request error:', err);
    
    // Clear reset token if error
    if (req.user) {
      req.user.resetPasswordToken = undefined;
      req.user.resetPasswordExpire = undefined;
      await req.user.save({ validateBeforeSave: false });
    }
    
    return res.status(500).json({
      error: "Failed to process password reset request"
    });
  }
};

// Verify reset token
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        error: "Reset token is required"
      });
    }

    // Hash the token to compare
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        error: "Invalid or expired reset token"
      });
    }

    res.json({
      message: "Token is valid",
      email: user.email
    });

  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(500).json({
      error: "Failed to verify token"
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    // Validate inputs
    if (!password || !confirmPassword) {
      return res.status(400).json({
        error: "Password and confirm password are required"
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: "Passwords do not match"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long"
      });
    }

    // Hash the token to compare
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        error: "Invalid or expired reset token"
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      message: "Password has been reset successfully"
    });

  } catch (err) {
    console.error('Password reset error:', err);
    return res.status(500).json({
      error: "Failed to reset password"
    });
  }
};

// Change password (for logged in users)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.profile._id;

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        error: "All fields are required"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: "New passwords do not match"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long"
      });
    }

    // Get user with password field
    const user = await User.findById(userId).select('+password +salt');
    
    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

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
      message: "Password changed successfully"
    });

  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({
      error: "Failed to change password"
    });
  }
};
