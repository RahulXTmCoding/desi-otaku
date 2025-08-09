const { Order } = require("../models/order");
const { User } = require("../models/user");
const crypto = require('crypto');
const { calculateOrderAmountSecure } = require('./razorpay');

// Generate a simple OTP for COD verification
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map();

// Send OTP for COD verification
exports.sendCodOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        error: "Phone number is required"
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpKey = `cod_otp_${phone}`;
    
    // Store OTP with 5-minute expiry
    otpStore.set(otpKey, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      attempts: 0
    });

    // In production, integrate with SMS service (Twilio, MSG91, etc.)
    console.log(`COD OTP for ${phone}: ${otp}`);

    // For development, return success (in production, actually send SMS)
    res.json({
      success: true,
      message: "OTP sent successfully",
      // Remove this line in production
      developmentOtp: process.env.NODE_ENV === 'development' ? otp : undefined
    });

  } catch (error) {
    console.error("Send COD OTP error:", error);
    res.status(500).json({
      error: "Failed to send OTP"
    });
  }
};

// Verify OTP for COD
exports.verifyCodOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        error: "Phone number and OTP are required"
      });
    }

    const otpKey = `cod_otp_${phone}`;
    const storedOtpData = otpStore.get(otpKey);

    if (!storedOtpData) {
      return res.status(400).json({
        error: "OTP not found. Please request a new OTP."
      });
    }

    // Check if OTP expired
    if (Date.now() > storedOtpData.expiresAt) {
      otpStore.delete(otpKey);
      return res.status(400).json({
        error: "OTP has expired. Please request a new OTP."
      });
    }

    // Check attempts
    if (storedOtpData.attempts >= 3) {
      otpStore.delete(otpKey);
      return res.status(400).json({
        error: "Too many failed attempts. Please request a new OTP."
      });
    }

    // Verify OTP
    if (storedOtpData.otp !== otp) {
      storedOtpData.attempts++;
      return res.status(400).json({
        error: "Invalid OTP. Please try again."
      });
    }

    // OTP verified successfully
    otpStore.delete(otpKey);

    res.json({
      success: true,
      verified: true,
      message: "Phone number verified successfully"
    });

  } catch (error) {
    console.error("Verify COD OTP error:", error);
    res.status(500).json({
      error: "Failed to verify OTP"
    });
  }
};

// Create COD order for authenticated users
exports.createCodOrder = async (req, res) => {
  try {
    const userId = req.profile._id;
    const {
      products,
      amount,
      coupon,
      rewardPointsRedeemed,
      address,
      shipping,
      codVerified
    } = req.body;

    if (!codVerified) {
      return res.status(400).json({
        error: "Phone verification required for COD orders"
      });
    }

    // Generate unique transaction ID for COD
    const transaction_id = `cod_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // ✅ CRITICAL FIX: Handle custom products with temporary IDs for authenticated users too
    const processedProducts = products.map(product => {
      const productId = product.product || product.productId;
      
      // Check if this is a custom/temporary product
      const isTemporaryId = !productId || 
                           productId === 'custom' || 
                           typeof productId === 'string' && (
                             productId.startsWith('temp_') || 
                             productId.startsWith('custom') ||
                             productId.length < 12 || // MongoDB ObjectIds are 24 hex chars or 12 bytes
                             !/^[0-9a-fA-F]{24}$/.test(productId) // Not a valid ObjectId
                           );
      
      if (isTemporaryId) {
        // For custom products, set product to null and store custom data
        return {
          product: null, // ✅ CRITICAL: Use null instead of invalid ObjectId
          name: product.name || 'Custom T-Shirt',
          price: product.price || 499,
          count: product.count || product.quantity || 1,
          size: product.size || 'M',
          isCustom: true,
          customization: product.customization || null,
          color: product.color || 'white',
          // Store original temp ID for reference
          originalProductId: productId
        };
      } else {
        // Regular product - keep as is
        return {
          product: productId,
          name: product.name,
          price: product.price,
          count: product.count || product.quantity,
          size: product.size,
          isCustom: product.isCustom || false,
          customization: product.customization || null,
          color: product.color || null
        };
      }
    });

    // Create order
    const orderData = {
      products: processedProducts, // ✅ Use processed products
      transaction_id,
      amount,
      paymentMethod: 'cod',
      paymentStatus: 'Pending', // COD orders are pending until delivery
      coupon,
      rewardPointsRedeemed: rewardPointsRedeemed || 0,
      address,
      shipping,
      status: "Received",
      user: userId,
      codVerification: {
        phoneVerified: true,
        verificationMethod: 'otp',
        otpSentAt: new Date()
      }
    };

    const order = new Order(orderData);
    const savedOrder = await order.save();

    // Update user reward points if redeemed
    if (rewardPointsRedeemed > 0) {
      await User.findByIdAndUpdate(userId, {
        $inc: { rewardPoints: -rewardPointsRedeemed }
      });
    }

    res.json({
      success: true,
      order: savedOrder,
      message: "COD order created successfully"
    });

  } catch (error) {
    console.error("Create COD order error:", error);
    res.status(500).json({
      error: "Failed to create COD order"
    });
  }
};

// Create COD order for guest users
exports.createGuestCodOrder = async (req, res) => {
  try {
    const {
      products,
      amount,
      coupon,
      address,
      shipping,
      guestInfo,
      codVerified
    } = req.body;

    if (!codVerified) {
      return res.status(400).json({
        error: "Phone verification required for COD orders"
      });
    }

    if (!guestInfo || !guestInfo.name || !guestInfo.email || !guestInfo.phone) {
      return res.status(400).json({
        error: "Guest information (name, email, phone) is required"
      });
    }

    // Generate unique transaction ID for COD
    const transaction_id = `cod_guest_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // Generate guest ID
    const guestId = `guest_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // ✅ CRITICAL FIX: Handle custom products with temporary IDs
    const processedProducts = products.map(product => {
      const productId = product.product || product.productId;
      
      // Check if this is a custom/temporary product
      const isTemporaryId = !productId || 
                           productId === 'custom' || 
                           typeof productId === 'string' && (
                             productId.startsWith('temp_') || 
                             productId.startsWith('custom') ||
                             productId.length < 12 || // MongoDB ObjectIds are 24 hex chars or 12 bytes
                             !/^[0-9a-fA-F]{24}$/.test(productId) // Not a valid ObjectId
                           );
      
      if (isTemporaryId) {
        // For custom products, set product to null and store custom data
        return {
          product: null, // ✅ CRITICAL: Use null instead of invalid ObjectId
          name: product.name || 'Custom T-Shirt',
          price: product.price || 499,
          count: product.count || product.quantity || 1,
          size: product.size || 'M',
          isCustom: true,
          customization: product.customization || null,
          color: product.color || 'white',
          // Store original temp ID for reference
          originalProductId: productId
        };
      } else {
        // Regular product - keep as is
        return {
          product: productId,
          name: product.name,
          price: product.price,
          count: product.count || product.quantity,
          size: product.size,
          isCustom: product.isCustom || false,
          customization: product.customization || null,
          color: product.color || null
        };
      }
    });

    // Create order
    const orderData = {
      products: processedProducts, // ✅ Use processed products
      transaction_id,
      amount,
      paymentMethod: 'cod',
      paymentStatus: 'Pending', // COD orders are pending until delivery
      coupon,
      address,
      shipping,
      status: "Received",
      guestInfo: {
        id: guestId,
        name: guestInfo.name,
        email: guestInfo.email,
        phone: guestInfo.phone
      },
      codVerification: {
        phoneVerified: true,
        verificationMethod: 'otp',
        otpSentAt: new Date()
      },
      // Generate secure access for order tracking
      orderAccess: {
        token: crypto.randomBytes(32).toString('hex'),
        pin: Math.floor(1000 + Math.random() * 9000).toString(), // 4-digit PIN
        tokenExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      }
    };

    const order = new Order(orderData);
    const savedOrder = await order.save();

    res.json({
      success: true,
      order: savedOrder,
      trackingInfo: {
        orderId: savedOrder._id,
        token: savedOrder.orderAccess.token,
        pin: savedOrder.orderAccess.pin
      },
      message: "COD order created successfully"
    });

  } catch (error) {
    console.error("Create guest COD order error:", error);
    res.status(500).json({
      error: "Failed to create COD order"
    });
  }
};

// Get COD order statistics (for admin)
exports.getCodStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const stats = await Order.aggregate([
      {
        $match: {
          paymentMethod: 'cod'
        }
      },
      {
        $facet: {
          total: [
            { $count: "count" }
          ],
          today: [
            {
              $match: {
                createdAt: { $gte: startOfDay }
              }
            },
            { $count: "count" }
          ],
          thisMonth: [
            {
              $match: {
                createdAt: { $gte: startOfMonth }
              }
            },
            { $count: "count" }
          ],
          byStatus: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
                totalAmount: { $sum: "$amount" }
              }
            }
          ],
          totalValue: [
            {
              $group: {
                _id: null,
                total: { $sum: "$amount" }
              }
            }
          ]
        }
      }
    ]);

    const result = {
      totalOrders: stats[0].total[0]?.count || 0,
      todayOrders: stats[0].today[0]?.count || 0,
      monthOrders: stats[0].thisMonth[0]?.count || 0,
      totalValue: stats[0].totalValue[0]?.total || 0,
      statusBreakdown: stats[0].byStatus
    };

    res.json({
      success: true,
      stats: result
    });

  } catch (error) {
    console.error("Get COD stats error:", error);
    res.status(500).json({
      error: "Failed to get COD statistics"
    });
  }
};

// Update COD order status (for admin/logistics)
exports.updateCodOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, paymentStatus, deliveryNotes } = req.body;

    const updateData = {
      updated: new Date()
    };

    if (status) {
      updateData.status = status;
    }

    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
    }

    // If order is delivered and it's COD, mark payment as received
    if (status === 'Delivered' && paymentStatus !== 'Paid') {
      updateData.paymentStatus = 'Paid';
    }

    const order = await Order.findByIdAndUpdate(orderId, updateData, { new: true });

    if (!order) {
      return res.status(404).json({
        error: "Order not found"
      });
    }

    res.json({
      success: true,
      order,
      message: "COD order status updated successfully"
    });

  } catch (error) {
    console.error("Update COD order status error:", error);
    res.status(500).json({
      error: "Failed to update COD order status"
    });
  }
};
