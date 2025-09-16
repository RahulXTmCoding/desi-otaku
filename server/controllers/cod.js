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

// Store verification tokens (in production, use Redis or database)
const verificationTokenStore = new Map();

// Send OTP for COD verification
exports.sendCodOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        error: "Phone number is required"
      });
    }

    // ✅ COD BYPASS: Check if OTP verification is bypassed
    const isBypassEnabled = process.env.COD_BYPASS_OTP === 'true';
    
    if (isBypassEnabled) {
      console.log(`🔓 COD OTP BYPASS ACTIVE - Skipping OTP send for ${phone}`);
      
      // Return success response without actually sending OTP
      const response = {
        success: true,
        message: "OTP verification bypassed - manual verification enabled",
        bypassed: true,
        attemptsLeft: 5
      };

      // 🔧 Development mode: Include bypass info for debugging
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'Dev') {
        response.developmentInfo = {
          bypassActive: true,
          note: "OTP verification is bypassed. Orders will be manually verified."
        };
      }

      return res.json(response);
    }

    // 🔒 SECURITY: Check SMS rate limiting to prevent abuse (only when not bypassed)
    const { smsService, checkSMSRateLimit } = require('../services/smsService');
    const rateLimit = checkSMSRateLimit(phone);
    
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: `Too many OTP requests. Please try again in ${rateLimit.resetIn} minutes.`,
        retryAfter: rateLimit.resetIn * 60 // in seconds
      });
    }

    // Validate phone number format
    try {
      // Use SMS service to validate phone number format
      const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
      if (normalizedPhone.startsWith('+91')) {
        var cleanPhone = normalizedPhone.substring(3);
      } else if (normalizedPhone.startsWith('91') && normalizedPhone.length === 12) {
        var cleanPhone = normalizedPhone.substring(2);
      } else {
        var cleanPhone = normalizedPhone;
      }
      
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        return res.status(400).json({
          error: "Please enter a valid Indian mobile number"
        });
      }
    } catch (phoneError) {
      return res.status(400).json({
        error: "Invalid phone number format"
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpKey = `cod_otp_${phone}`;
    
    // Store OTP with 5-minute expiry
    otpStore.set(otpKey, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      attempts: 0,
      phone: phone,
      createdAt: new Date()
    });

    console.log(`📱 Sending COD OTP to ${phone}...`);

    // 📱 Send OTP via MSG91 SMS service
    let smsResult;
    try {
      smsResult = await smsService.sendOTP(phone, otp);
      
      if (smsResult.success) {
        console.log(`✅ OTP sent successfully to ${phone} via MSG91`);
      } else {
        console.warn(`⚠️ SMS delivery may have failed for ${phone}:`, smsResult.error);
      }
    } catch (smsError) {
      console.error(`❌ SMS service error for ${phone}:`, smsError.message);
      smsResult = { 
        success: false, 
        message: 'SMS delivery may be delayed',
        error: smsError.message 
      };
    }

    // Always respond positively to prevent phone number enumeration
    // But provide appropriate message based on SMS delivery
    const response = {
      success: true,
      message: smsResult.success 
        ? "OTP sent to your mobile number" 
        : "OTP request processed. SMS delivery may be delayed.",
      attemptsLeft: rateLimit.attemptsLeft
    };

    // 🔧 Development mode: Include OTP in response for testing
    if (process.env.NODE_ENV === 'development') {
      response.developmentOtp = otp;
      response.smsDebug = {
        delivered: smsResult.success,
        requestId: smsResult.requestId,
        error: smsResult.error
      };
    }

    res.json(response);

  } catch (error) {
    console.error("❌ Send COD OTP error:", error);
    res.status(500).json({
      error: "Failed to process OTP request"
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

    // ✅ COD BYPASS: Check if OTP verification is bypassed
    const isBypassEnabled = process.env.COD_BYPASS_OTP === 'true';
    
    if (isBypassEnabled) {
      console.log(`🔓 COD OTP BYPASS ACTIVE - Auto-verifying for ${phone}`);
      
      // 🔒 SECURITY: Generate verification token to maintain security architecture
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const tokenData = {
        phone: phone,
        verified: true,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes to complete order
        used: false,
        createdAt: new Date(),
        bypassed: true // Flag to indicate this was bypassed
      };
      
      verificationTokenStore.set(verificationToken, tokenData);
      
      console.log(`✅ Phone ${phone} auto-verified (bypassed), token generated: ${verificationToken.substring(0, 8)}...`);

      const response = {
        success: true,
        verified: true,
        verificationToken: verificationToken, // Frontend must store and send this
        expiresIn: 600, // 10 minutes
        message: "Phone number verification bypassed - manual verification enabled",
        bypassed: true
      };

      // 🔧 Development mode: Include bypass info for debugging
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'Dev') {
        response.developmentInfo = {
          bypassActive: true,
          note: "OTP verification bypassed. Token generated for order processing."
        };
      }

      return res.json(response);
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

    // OTP verified successfully - generate verification token
    otpStore.delete(otpKey);

    // 🔒 SECURITY: Generate verification token to prevent fake verification
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenData = {
      phone: phone,
      verified: true,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes to complete order
      used: false,
      createdAt: new Date()
    };
    
    verificationTokenStore.set(verificationToken, tokenData);
    
    console.log(`✅ Phone ${phone} verified, token generated: ${verificationToken.substring(0, 8)}...`);

    res.json({
      success: true,
      verified: true,
      verificationToken: verificationToken, // Frontend must store and send this
      expiresIn: 600, // 10 minutes
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
    console.log('🎯 COD ORDER - AUTHENTICATED USER');
    
    // ✅ SECURITY FIX: Use req.user (from JWT) instead of req.profile (from URL param)
    const userId = req.user?._id || req.profile?._id;
    
    if (!userId) {
      return res.status(401).json({
        error: "User authentication required for COD orders"
      });
    }
    const {
      products,
      amount,
      coupon,
      rewardPointsRedeemed,
      address,
      shipping,
      verificationToken,
      phone,
      codVerified // Legacy field for backwards compatibility
    } = req.body;

    // ✅ ENHANCED: Handle bypass mode more flexibly
    let phoneVerified = false;
    let verifiedPhone = null;
    
    // Check if bypass is enabled
    const isBypassEnabled = process.env.COD_BYPASS_OTP === 'true';
    
    if (isBypassEnabled && phone) {
      // In bypass mode, allow orders with just phone number
      console.log(`🔓 COD BYPASS ACTIVE - Auto-approving order for ${phone}`);
      phoneVerified = true;
      verifiedPhone = phone;
    } else if (verificationToken && phone) {
      console.log('📱 STANDARD FORMAT: Validating phone verification token for COD order...');
      
      const tokenData = verificationTokenStore.get(verificationToken);
      if (!tokenData) {
        return res.status(400).json({
          error: "Invalid verification token. Please verify your phone number again."
        });
      }

      // Check if token expired
      if (Date.now() > tokenData.expiresAt) {
        verificationTokenStore.delete(verificationToken);
        return res.status(400).json({
          error: "Phone verification expired. Please verify your phone number again."
        });
      }

      // Check if token already used
      if (tokenData.used) {
        return res.status(400).json({
          error: "Phone verification already used. Please verify your phone number again."
        });
      }

      // Check if phone number matches
      if (tokenData.phone !== phone) {
        return res.status(400).json({
          error: "Phone number mismatch. Please verify your phone number again."
        });
      }

      // Mark token as used to prevent replay attacks
      tokenData.used = true;
      phoneVerified = true;
      verifiedPhone = phone;
      console.log(`✅ STANDARD FORMAT: Phone verification token validated for ${phone}`);
      
    } else {
      return res.status(400).json({
        error: "Phone verification is required for COD orders. Please verify your phone number first or update your app."
      });
    }

    // Generate unique transaction ID for COD
    const transaction_id = `cod_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // ✅ UNIFIED ORDER DATA STRUCTURE
    const orderData = {
      products,
      transaction_id,
      amount,
      paymentMethod: 'cod',
      paymentStatus: 'Pending', // COD orders are pending until delivery
      coupon,
      rewardPointsRedeemed: rewardPointsRedeemed || 0,
      address,
      shipping,
      status: "Received",
      codVerification: {
        phoneVerified: true,
        verificationMethod: 'otp',
        otpSentAt: new Date()
      }
    };

    // ✅ USE UNIFIED ORDER CREATION FUNCTION
    const { createUnifiedOrder } = require('./order');
    const result = await createUnifiedOrder(
      orderData,
      req.user || req.profile, // ✅ SECURITY FIX: Use JWT-verified user first, fallback to profile
      { 
        type: 'cod', 
        codVerified: true 
      }
    );

    console.log('✅ COD ORDER CREATED WITH UNIFIED FUNCTION:', result.order._id);

    res.json({
      success: true,
      order: result.order,
      trackingInfo: result.trackingInfo,
      message: "COD order created successfully with full discount calculation and email confirmation"
    });

  } catch (error) {
    console.error("❌ Create COD order error:", error);
    res.status(500).json({
      error: "Failed to create COD order",
      details: error.message
    });
  }
};

// Create COD order for guest users
exports.createGuestCodOrder = async (req, res) => {
  try {
    console.log('🎯 COD ORDER - GUEST USER');
    
    const {
      products,
      amount,
      coupon,
      address,
      shipping,
      guestInfo,
      verificationToken
    } = req.body;

    if (!guestInfo || !guestInfo.name || !guestInfo.email || !guestInfo.phone) {
      return res.status(400).json({
        error: "Guest information (name, email, phone) is required"
      });
    }

    // ✅ ENHANCED: Handle bypass mode for guest orders too
    const isBypassEnabled = process.env.COD_BYPASS_OTP === 'true';
    
    if (isBypassEnabled) {
      // In bypass mode, allow guest orders with just phone validation
      console.log(`🔓 COD BYPASS ACTIVE - Auto-approving guest order for ${guestInfo.phone}`);
    } else {
      // Standard verification token validation
      if (!verificationToken) {
        return res.status(400).json({
          error: "Phone verification token is required for COD orders"
        });
      }

      const tokenData = verificationTokenStore.get(verificationToken);
      if (!tokenData) {
        return res.status(400).json({
          error: "Invalid verification token. Please verify your phone number again."
        });
      }

      // Check if token expired
      if (Date.now() > tokenData.expiresAt) {
        verificationTokenStore.delete(verificationToken);
        return res.status(400).json({
          error: "Phone verification expired. Please verify your phone number again."
        });
      }

      // Check if token already used
      if (tokenData.used) {
        return res.status(400).json({
          error: "Phone verification already used. Please verify your phone number again."
        });
      }

      // Check if phone number matches guest info
      if (tokenData.phone !== guestInfo.phone) {
        return res.status(400).json({
          error: "Phone number mismatch. Please verify your phone number again."
        });
      }

      // Mark token as used to prevent replay attacks
      tokenData.used = true;
      console.log(`✅ Guest phone verification token validated for ${guestInfo.phone}`);
    }

    // Generate unique transaction ID for COD
    const transaction_id = `cod_guest_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // Check if user exists with this email, or create auto-account
    let userId = null;
    let autoAccountCreated = false;
    let existingAccountLinked = false;
    try {
      const User = require("../models/user");
      let existingUser = await User.findOne({ email: guestInfo.email });
      if (existingUser) {
        userId = existingUser._id;
        existingAccountLinked = true;
        console.log('Found existing user for guest COD order:', guestInfo.email);
      } else {
        // Auto-create account for guest user to enable order tracking
        console.log('Creating auto-account for guest COD user:', guestInfo.email);
        
        // Generate a secure random password (user will reset it via email)
        const tempPassword = crypto.randomBytes(32).toString('hex');
        
        const newUser = new User({
          name: guestInfo.name,
          email: guestInfo.email,
          password: tempPassword, // Will be hashed by the model
          role: 0, // Regular user
          // Mark as auto-created so we know to send welcome email
          autoCreated: true
        });
        
        const savedUser = await newUser.save();
        userId = savedUser._id;
        autoAccountCreated = true;
        
        console.log('✅ Auto-account created for guest COD user:', guestInfo.email);
      }
    } catch (error) {
      console.log('Error handling user account for guest COD order:', error);
      // Continue without linking if there's an error
    }

    // Generate guest ID
    const guestId = `guest_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // ✅ UNIFIED ORDER DATA STRUCTURE
    const orderData = {
      products,
      transaction_id,
      amount,
      paymentMethod: 'cod',
      paymentStatus: 'Pending', // COD orders are pending until delivery
      coupon,
      address,
      shipping,
      status: "Received",
      user: userId, // Link to existing or newly created user
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
      }
    };

    // ✅ USE UNIFIED ORDER CREATION FUNCTION
    const { createUnifiedOrder } = require('./order');
    const result = await createUnifiedOrder(
      orderData,
      null, // No user profile for guest orders
      { 
        type: 'cod', 
        codVerified: true 
      }
    );

    console.log('✅ GUEST COD ORDER CREATED WITH UNIFIED FUNCTION:', result.order._id);

    res.json({
      success: true,
      order: result.order,
      autoAccountCreated: autoAccountCreated, // ✅ CRITICAL FIX: Include account creation flag
      existingAccountLinked: existingAccountLinked, // ✅ NEW: Include existing account flag
      trackingInfo: result.trackingInfo,
      message: "Guest COD order created successfully with full discount calculation and email confirmation"
    });

  } catch (error) {
    console.error("❌ Create guest COD order error:", error);
    res.status(500).json({
      error: "Failed to create COD order",
      details: error.message
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

// Check COD bypass status (for frontend configuration)
exports.getCodBypassStatus = async (req, res) => {
  try {
    const isBypassEnabled = process.env.COD_BYPASS_OTP === 'true';
    
    console.log(`🔍 COD BYPASS STATUS CHECK - Bypass ${isBypassEnabled ? 'ENABLED' : 'DISABLED'}`);
    
    res.json({
      success: true,
      bypassEnabled: isBypassEnabled,
      message: isBypassEnabled 
        ? "COD OTP verification is currently bypassed" 
        : "COD OTP verification is active",
      // Only include environment info in development
      ...(process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'Dev' ? {
        environment: process.env.NODE_ENV,
        note: isBypassEnabled 
          ? "Orders will be manually verified - no OTP required"
          : "Standard OTP verification flow is active"
      } : {})
    });

  } catch (error) {
    console.error("Get COD bypass status error:", error);
    res.status(500).json({
      error: "Failed to get COD bypass status"
    });
  }
};
