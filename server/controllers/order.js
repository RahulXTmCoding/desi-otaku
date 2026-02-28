const { Order, ProductCart } = require("../models/order");
const shiprocketService = require("../services/shiprocket");
const emailService = require("../services/emailService");
const { creditPoints, redeemPoints } = require("./reward");
const RewardTransaction = require("../models/rewardTransaction");
const { createSecureAccess } = require("./secureOrder");
const invoiceService = require("../services/invoiceService");
const telegramService = require("../services/telegramService");
const AOVService = require("../services/aovService");
const Razorpay = require('razorpay');
const { calculateOrderAmountSecure } = require('./razorpay');
const Product = require("../models/product");
const Design = require("../models/design");
const User = require("../models/user");
const { trackCouponUsage } = require("./coupon");
const isDev = process.env.NODE_ENV !== 'production';
const { processInventoryChanges } = require("../utils/inventoryTracker");

// Razorpay singleton — created once at module load, not per-request
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

exports.getOrderById = (req, res, next, id) => {
  // ✅ SUPER FAST: Ultra-optimized order fetching for maximum speed
  Order.findById(id)
    .populate({
      path: "products.product",
      select: "name price photoUrl category", // ✅ MINIMAL FIELDS ONLY
      options: { lean: true },
      populate: {
        path: "category",
        select: "name", // ✅ Only category name
        options: { lean: true }
      }
    })
    .populate("user", "email name")
    .select("-__v") // ✅ Exclude version field
    .lean() // ✅ Use lean for maximum performance
    .then((order) => {
      if (!order) {
        return res.status(400).json({ err: "Order is not found" });
      }

      // ✅ CRITICAL FIX: Ensure data consistency with getUserOrders
      if (order && order.products) {
        order.products = order.products.map(item => {
          let enhancedItem = { ...item };
          // Ensure photoUrl is available at item level
          if (!enhancedItem.photoUrl) {
            if (item.product && typeof item.product === 'object' && item.product._id) {
              enhancedItem.photoUrl = `/api/product/image/${item.product._id}/0`;
            } else if (typeof item.product === 'string' && item.product) {
              enhancedItem.photoUrl = `/api/product/image/${item.product}/0`;
            }
          }
          return enhancedItem;
        });
      }

      req.order = order;
      next();
    })
    .catch(() => res.status(400).json({ err: "Order is not found" }));
};

// ✅ UNIFIED ORDER CREATION FUNCTION
// Used by both Razorpay and COD flows to ensure consistency
exports.createUnifiedOrder = async (orderData, userProfile, paymentVerification = null) => {
  try {
    isDev && console.log('🎯 UNIFIED ORDER CREATION:', {
      paymentMethod: orderData.paymentMethod,
      amount: orderData.amount,
      hasUser: !!userProfile,
      hasCoupon: !!orderData.coupon?.code,
      hasRewards: !!orderData.rewardPointsRedeemed
    });

    // 🔒 SECURITY: Payment verification (method-specific)
    if (paymentVerification) {
      if (paymentVerification.type === 'razorpay' && paymentVerification.payment?.id) {
        try {
          const paymentDetails = await razorpayInstance.payments.fetch(paymentVerification.payment.id);
          isDev && console.log('✅ Razorpay payment verified:', paymentDetails.id);
        } catch (paymentVerifyError) {
          console.error('❌ Razorpay payment verification failed:', paymentVerifyError);
          throw new Error('Payment verification failed');
        }
      } else if (paymentVerification.type === 'cod' && !paymentVerification.codVerified) {
        throw new Error('Phone verification required for COD orders');
      }
    }

    // ✅ UNIFIED DISCOUNT CALCULATION
    const cartItems = orderData.products.map(item => ({
      product: item.product || item.productId,
      name: item.name,
      quantity: item.count || item.quantity,
      size: item.size,
      customization: item.customization,
      isCustom: item.isCustom,
      price: item.price
    }));

    const serverCalculation = await calculateOrderAmountSecure(
      cartItems,
      orderData.coupon?.code,
      orderData.rewardPointsRedeemed,
      userProfile,
      orderData.paymentMethod || 'cod'
    );

    if (serverCalculation.error) {
      throw new Error(serverCalculation.error);
    }

    isDev && console.log('✅ UNIFIED CALCULATION COMPLETE:', {
      subtotal: serverCalculation.subtotal,
      quantityDiscount: serverCalculation.quantityDiscount,
      couponDiscount: serverCalculation.couponDiscount,
      onlinePaymentDiscount: serverCalculation.onlinePaymentDiscount,
      rewardDiscount: serverCalculation.rewardDiscount,
      finalAmount: serverCalculation.total
    });

    // ✅ PROCESS AND VALIDATE PRODUCTS WITH INVENTORY TRACKING
    const validatedProducts = [];
    const stockChanges = []; // Track inventory changes for low stock alerts

    for (const item of orderData.products) {
      let validatedItem = {
        name: item.name,
        count: item.count || item.quantity || 1,
        size: item.size || 'M'
      };

      // Preserve photoUrl if present
      if (item.photoUrl) {
        validatedItem.photoUrl = item.photoUrl;
      }

      // ✅ CRITICAL FIX: Handle custom products with temporary IDs
      const productId = item.product || item.productId;
      const isTemporaryId = !productId || 
                           productId === 'custom' || 
                           typeof productId === 'string' && (
                             productId.startsWith('temp_') || 
                             productId.startsWith('custom') ||
                             productId.length < 12 ||
                             !/^[0-9a-fA-F]{24}$/.test(productId)
                           );

      if (isTemporaryId || item.isCustom) {
        // Handle custom products (no inventory tracking needed)
        validatedItem.isCustom = true;
        validatedItem.customDesign = item.customDesign || item.name;
        validatedItem.color = item.color || item.selectedColor || 'White';
        validatedItem.colorValue = item.colorValue || item.selectedColorValue || '#FFFFFF';
        validatedItem.product = null; // ✅ CRITICAL: Use null instead of invalid ObjectId

        // Store customization data
        if (item.customization) {
          validatedItem.customization = {};
          
          if (item.customization.frontDesign?.designId && item.customization.frontDesign?.designImage) {
            validatedItem.customization.frontDesign = {
              designId: item.customization.frontDesign.designId,
              designImage: item.customization.frontDesign.designImage,
              position: item.customization.frontDesign.position || 'center',
              price: item.customization.frontDesign.price || 150
            };
          }
          
          if (item.customization.backDesign?.designId && item.customization.backDesign?.designImage) {
            validatedItem.customization.backDesign = {
              designId: item.customization.backDesign.designId,
              designImage: item.customization.backDesign.designImage,
              position: item.customization.backDesign.position || 'center',
              price: item.customization.backDesign.price || 150
            };
          }

          // Only keep customization if it has actual design data
          if (!validatedItem.customization.frontDesign && !validatedItem.customization.backDesign) {
            delete validatedItem.customization;
          }
        }

        // Use server-calculated price for custom products
        validatedItem.price = serverCalculation.validatedItems.find(v => 
          v.name === item.name && v.quantity === validatedItem.count
        )?.price || item.price;
      } else {
        // Handle regular products - VALIDATE ONLY, DON'T DECREASE INVENTORY YET
        const product = await Product.findById(productId);
        if (!product || product.isDeleted) {
          throw new Error(`Product not found or unavailable: ${item.name}`);
        }
        
        validatedItem.product = product._id;
        validatedItem.price = product.price;
        validatedItem.name = product.name;
      }

      validatedProducts.push(validatedItem);
    }

    // ✅ BUILD ORDER DATA WITH SERVER CALCULATIONS
    const unifiedOrderData = {
      ...orderData,
      products: validatedProducts,
      amount: serverCalculation.total,
      originalAmount: serverCalculation.subtotal + serverCalculation.shippingCost,
      discount: serverCalculation.couponDiscount + serverCalculation.rewardDiscount,
      user: userProfile?._id || userProfile,
      paymentStatus: orderData.paymentMethod === 'cod' ? 'Pending' : 'Paid'
    };

    // ✅ STORE DETAILED DISCOUNT BREAKDOWN
    if (serverCalculation.quantityDiscount > 0) {
      unifiedOrderData.quantityDiscount = {
        amount: serverCalculation.quantityDiscount,
        percentage: Math.round((serverCalculation.quantityDiscount / serverCalculation.subtotal) * 100),
        totalQuantity: validatedProducts.reduce((total, item) => total + item.count, 0),
        message: `Bulk discount applied`
      };
    }

    if (serverCalculation.onlinePaymentDiscount > 0) {
      unifiedOrderData.onlinePaymentDiscount = {
        amount: serverCalculation.onlinePaymentDiscount,
        percentage: 5,
        paymentMethod: orderData.paymentMethod
      };
    }

    unifiedOrderData.rewardPointsDiscount = serverCalculation.rewardDiscount;

    // ✅ CREATE AND SAVE ORDER
    const order = new Order(unifiedOrderData);
    const savedOrder = await order.save();

    isDev && console.log('✅ UNIFIED ORDER CREATED:', savedOrder._id);

    // ✅ POPULATE USER INFO FOR EMAIL
    await savedOrder.populate('user', 'email name');

    // ✅ NOW DECREASE INVENTORY AFTER ORDER IS CREATED SUCCESSFULLY
    // Batch fetch all regular products in ONE query instead of N queries
    const regularItems = savedOrder.products.filter(item => item.product && !item.isCustom);
    if (regularItems.length > 0) {
      try {
        const productIds = regularItems.map(item => item.product);
        const fetchedProducts = await Product.find({ _id: { $in: productIds }, isDeleted: false });
        const productsMap = {};
        fetchedProducts.forEach(p => { productsMap[p._id.toString()] = p; });

        const savePromises = [];
        for (const item of regularItems) {
          const product = productsMap[item.product.toString()];
          if (!product) {
            console.error(`❌ Product not found during inventory update: ${item.product}`);
            continue;
          }
          const result = product.decreaseStock(item.size, item.count);
          if (result.success) {
            stockChanges.push(result.stockChange);
            savePromises.push(product.save());
          } else {
            console.error(`❌ Failed to decrease stock for ${product.name} (${item.size})`);
          }
        }
        // Parallel saves — all products update concurrently
        await Promise.all(savePromises);
      } catch (error) {
        console.error(`❌ Error updating inventory for order ${savedOrder._id}:`, error);
      }
    }

    // ✅ PROCESS REWARD POINTS (if applicable)
    if (orderData.rewardPointsRedeemed > 0 && userProfile?._id) {
      try {
        await redeemPoints(userProfile._id, orderData.rewardPointsRedeemed, savedOrder._id);
        isDev && console.log(`✅ Reward points redeemed: ${orderData.rewardPointsRedeemed}`);
      } catch (rewardError) {
        console.error('❌ Reward points redemption failed:', rewardError);
      }
    }

    // ✅ CREDIT REWARD POINTS (for paid orders)
    if (savedOrder.paymentStatus === 'Paid' && userProfile?._id) {
      creditPoints(userProfile._id, savedOrder._id, savedOrder.amount).then(result => {
        if (result.success) {
          isDev && console.log(`✅ Background: Credited ${result.points} reward points`);
        }
      }).catch(err => {
        console.error("❌ Background: Failed to credit reward points:", err);
      });
    }

    // ✅ FAST RESPONSE: Return immediately, process notifications in background
    const response = {
      success: true,
      order: savedOrder,
      trackingInfo: null // Will be generated in background
    };

    // 🚀 BACKGROUND JOBS: Process all notifications and non-critical tasks asynchronously
    setImmediate(async () => {
      try {
        isDev && console.log(`🚀 Processing background tasks for order ${savedOrder._id}`);

        // ✅ GENERATE SECURE ACCESS TOKENS
        let magicLink = null;
        let pin = null;
        
        const customerEmail = savedOrder.user?.email || savedOrder.guestInfo?.email;
        if (customerEmail) {
          try {
            const secureAccess = await createSecureAccess(savedOrder._id, customerEmail);
            if (secureAccess.success) {
              magicLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/track/${Buffer.from(secureAccess.token).toString('base64url')}`;
              pin = secureAccess.pin;
              isDev && console.log('✅ Secure access tokens generated in background');
            }
          } catch (err) {
            console.error('❌ Background: Failed to create secure access tokens:', err);
          }
        }

        // ✅ SEND EMAIL CONFIRMATION
        const customerInfo = savedOrder.user || savedOrder.guestInfo;
        
        if (customerInfo?.email && magicLink && pin) {
          emailService.sendOrderConfirmationWithTracking(savedOrder, customerInfo, magicLink, pin).catch(err => {
            console.error("❌ Background: Failed to send order confirmation email:", err);
          });
        }

        // ✅ TRACK COUPON USAGE
        if (orderData.coupon?.code) {
          trackCouponUsage(orderData.coupon.code, savedOrder._id, userProfile?._id).catch(err => {
            console.error("❌ Background: Failed to track coupon usage:", err);
          });
        }

        

        // ✅ LOW STOCK ALERTS (process stock changes and send Telegram alerts if needed)
        if (stockChanges.length > 0) {
          processInventoryChanges(stockChanges, savedOrder._id).catch(err => {
            console.error("❌ Background: Failed to process inventory changes:", err);
          });
        }

        // ✅ TELEGRAM NOTIFICATIONS
        telegramService.sendNewOrderNotification(savedOrder, customerInfo).catch(err => {
          console.error("❌ Background: Failed to send Telegram notification:", err);
        });

        isDev && console.log(`✅ Background tasks completed for order ${savedOrder._id}`);

      } catch (backgroundError) {
        console.error(`❌ Background task error for order ${savedOrder._id}:`, backgroundError);
      }
    });

    return response;

  } catch (error) {
    console.error('❌ UNIFIED ORDER CREATION FAILED:', error);
    throw error;
  }
};

// ✅ NEW: Unified order creation for logged-in users (uses createUnifiedOrder)
exports.createOrderUnified = async (req, res) => {
  try {
    isDev && console.log('🔄 Creating unified order for logged-in user:', req.profile._id);
    
    // 🔒 SECURITY: Payment verification using existing middleware data
    let paymentVerification = null;
    if (req.payment) {
      paymentVerification = {
        type: 'razorpay',
        payment: req.payment
      };
    }
    
    // ✅ Use the proven createUnifiedOrder function
    const result = await exports.createUnifiedOrder(
      req.body.order,
      req.profile,
      paymentVerification
    );
    
    if (result.success) {
      isDev && console.log('✅ Unified order created successfully:', result.order._id);
      res.json(result.order);
    } else {
      throw new Error('Order creation failed');
    }
    
  } catch (error) {
    console.error('❌ Unified order creation failed:', error);
    return res.status(400).json({
      error: "Unable to save order in DB",
      details: error.message
    });
  }
};

// createOrder: deprecated stub — the active route uses createOrderUnified
exports.createOrder = async (req, res) => {
  return res.status(410).json({ message: "Deprecated. Use the unified order endpoint." });
};

exports.getAllOrders = async (req, res) => {
  isDev && console.log('🚨 getAllOrders function called instead of getUserOrders!');
  isDev && console.log('🚨 User ID:', req.params.userId);
  isDev && console.log('🚨 Query params:', req.query);
  
  try {
    const userId = req.params.userId;
    
    // Check if user is admin
    if (!req.profile || req.profile.role !== 1) {
      return res.status(403).json({
        error: "Access denied. Admin only."
      });
    }
    
    // Extract query parameters
    const {
      page = 1,
      limit = 20,
      status,
      search,
      startDate,
      endDate,
      paymentMethod,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query
    let query = {};
    
    // Status filter (case-insensitive)
    if (status && status !== 'all') {
      query.status = { $regex: new RegExp(`^${status}$`, 'i') };
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // Payment method filter
    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod;
    }
    
    // Search filter - Enhanced to include customer name, phone, email, order ID, transaction ID
    // Note: We can only search on fields that exist in the Order document itself
    // User fields will be populated after the query, so we search in guestInfo and shipping
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { transaction_id: searchRegex },
        { 'guestInfo.name': searchRegex },
        { 'guestInfo.email': searchRegex },
        { 'guestInfo.phone': searchRegex },
        { 'shipping.name': searchRegex },
        { 'shipping.phone': searchRegex },
        { address: searchRegex }
      ];
      
      // Try to match ObjectId if search string is valid ObjectId format
      if (search.match(/^[0-9a-fA-F]{24}$/)) {
        query.$or.push({ _id: search });
      }
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Execute query with full shipping and guest info for admin needs
    const [orders, totalCount] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email phone') // Include user phone
        .populate('products.product', 'name price images photoUrl') // Include images for product display
        .select('_id user guestInfo products transaction_id amount address shipping status createdAt updatedAt paymentStatus paymentMethod') // Include shipping and guestInfo for COD orders
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(), // Use lean() for better performance
      Order.countDocuments(query)
    ]);
    
    // Calculate stats
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Format stats
    const formattedStats = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };
    
    stats.forEach(stat => {
      const status = stat._id.toLowerCase();
      if (formattedStats.hasOwnProperty(status)) {
        formattedStats[status] = stat.count;
      }
    });
    
    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalOrders: totalCount,
        hasMore: skip + orders.length < totalCount
      },
      stats: formattedStats
    });
    
  } catch (err) {
    console.error('Get all orders error:', err);
    return res.status(400).json({
      error: "Failed to fetch orders",
      details: err.message
    });
  }
};

// Bulk update order status
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { orderIds, status } = req.body;
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        error: "Invalid order IDs"
      });
    }
    
    if (!status) {
      return res.status(400).json({
        error: "Status is required"
      });
    }
    
    // Update all orders
    const result = await Order.updateMany(
      { _id: { $in: orderIds } },
      { $set: { status } }
    );
    
    // Send email notifications for each order
    const orders = await Order.find({ _id: { $in: orderIds } }).populate('user', 'email name');
    orders.forEach(order => {
      if (order.user && order.user.email) {
        emailService.sendOrderStatusUpdate(order, order.user, order.status).catch(err => {
          console.error(`Failed to send status update email for order ${order._id}:`, err);
        });
      }
    });
    
    res.json({
      success: true,
      updated: result.modifiedCount,
      message: `Successfully updated ${result.modifiedCount} orders`
    });
    
  } catch (err) {
    console.error('Bulk update error:', err);
    return res.status(400).json({
      error: "Failed to update orders",
      details: err.message
    });
  }
};

// Export orders to CSV
exports.exportOrders = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    let query = {};
    if (status && status !== 'all') query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('products.product', 'name price')
      .sort({ createdAt: -1 });
    
    // Create CSV content
    const csvData = [
      ['Order ID', 'Date', 'Customer', 'Email', 'Status', 'Payment Status', 'Items', 'Total', 'Shipping Address']
    ];
    
    orders.forEach(order => {
      const items = order.products.map(p => `${p.product?.name || 'Unknown'} (x${p.count})`).join('; ');
      const address = order.address ? `${order.address.street}, ${order.address.city}, ${order.address.state} ${order.address.pincode}` : 'N/A';
      
      csvData.push([
        order._id.toString(),
        new Date(order.createdAt).toLocaleDateString(),
        order.user?.name || 'Guest',
        order.user?.email || 'N/A',
        order.status,
        order.paymentStatus,
        items,
        `₹${order.amount}`,
        address
      ]);
    });
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=orders-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
    
  } catch (err) {
    console.error('Export error:', err);
    return res.status(400).json({
      error: "Failed to export orders",
      details: err.message
    });
  }
};

exports.getOrder = (req, res) => {
  // Allow admin to get any order
  if (req.profile.role === 1) {
    return res.json(req.order);
  }
  
  // ✅ ENHANCED: Handle both user orders and guest orders
  let isOwner = false;
  
  // Check if user owns the order directly
  if (req.order.user && req.order.user._id) {
    isOwner = req.order.user._id.toString() === req.profile._id.toString();
  }
  
  // ✅ CRITICAL FIX: Also check guest orders by email (for converted accounts)
  if (!isOwner && req.order.guestInfo && req.order.guestInfo.email && req.profile.email) {
    isOwner = req.order.guestInfo.email.toLowerCase() === req.profile.email.toLowerCase();
  }
  
  if (!isOwner) {
    return res.status(403).json({
      error: "Access denied. You are not the owner of this order."
    });
  }
  
  return res.json(req.order);
};

// ✅ ENHANCED: Get user's orders with unified email-based search
exports.getUserOrders = async (req, res) => {
  
  try {
    const userId = req.params.userId;
    
    // Ensure user can only access their own orders (unless admin)
    if (req.profile.role !== 1 && req.profile._id.toString() !== userId) {
      return res.status(403).json({
        error: "Access denied. You can only view your own orders."
      });
    }
    
    // Get user details for email-based search
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }
    
    // Extract pagination parameters
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // ✅ UNIFIED QUERY: Find orders by user ID OR email (for guest orders that got converted)
    let query = {
      $or: [
        { user: userId }, // Orders directly linked to user
        { 'guestInfo.email': user.email } // Guest orders with same email
      ]
    };
    
    // Status filter
    if (status && status !== 'all') {
      query.status = { $regex: new RegExp(`^${status}$`, 'i') };
    }
    
    // Pagination calculations
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;
    const sortDirection = sortOrder === 'desc' ? -1 : 1;



    // ✅ OPTIMIZED: Minimal population for speed (like old userPurchaseList)
    const [orders, totalCount] = await Promise.all([
      Order.find(query)
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limitInt)
        .populate("user", "_id name")
        .populate("products.product", "name price photoUrl") // ✅ Minimal fields only
        .lean()
        .exec(), // ✅ Use exec() for consistency with old method
      
      Order.countDocuments(query)
    ]);

    
    // ✅ ENHANCE: Add missing fields to improve frontend display
    const enhancedOrders = orders.map(order => ({
      ...order,
      products: order.products.map(item => {
        // ✅ CRITICAL: Ensure proper image URL resolution
        let enhancedItem = { ...item };
        
        // If it's a regular product with populated product data
        if (item.product && typeof item.product === 'object' && !item.isCustom) {
          // Ensure photoUrl is available
          if (!enhancedItem.photoUrl && item.product.photoUrl) {
            enhancedItem.photoUrl = item.product.photoUrl;
          }
          
          // Fallback to image endpoint if no photoUrl
          if (!enhancedItem.photoUrl && item.product._id) {
            enhancedItem.photoUrl = `/api/product/image/${item.product._id}/0`;
          }
        }
        
        return enhancedItem;
      })
    }));
    
    // ✅ RETURN PAGINATED RESPONSE
    res.json({
      orders: enhancedOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalOrders: totalCount,
        ordersPerPage: parseInt(limit),
        hasNextPage: skip + orders.length < totalCount,
        hasPreviousPage: parseInt(page) > 1
      }
    });
    
  } catch (err) {
    console.error('❌ Get user orders error:', err);
    return res.status(400).json({
      error: "Failed to fetch orders",
      details: err.message
    });
  }
};

exports.getOrderStatus = (req, res) => {
  res.json(Order.schema.path("status").enumValues);
};

exports.updateStatus = async (req, res) => {
  try {
    // Get current order to compare status
    const oldOrder = await Order.findById(req.params.orderId);
    if (!oldOrder) {
      return res.status(400).json({
        err: "Order not found",
      });
    }
    const oldStatus = oldOrder.status;

    // Update status
    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { $set: { status: req.body.status } },
      { new: true }
    ).populate('user', 'email name');

    // Send email notifications based on status change
    const customer = order.user || order.guestInfo;
    if (customer && customer.email) {
      const isGuest = !order.user;
      const customerInfo = {
        name: customer.name,
        email: customer.email,
      };

      if (req.body.status === 'Shipped' && oldStatus !== 'Shipped') {
        // Send shipping notification
        emailService.sendShippingUpdate(order, customerInfo, isGuest).catch(err => {
          console.error("Failed to send shipping email:", err);
        });
      } else if (oldStatus !== req.body.status) {
        // Send general status update
        emailService.sendOrderStatusUpdate(order, customerInfo, oldStatus, isGuest).catch(err => {
          console.error("Failed to send status update email:", err);
        });
      }
    }

    // 📱 TELEGRAM: Send status update notification to admin
    if (oldStatus !== req.body.status) {
      telegramService.sendOrderStatusUpdate(order, oldStatus, req.body.status).catch(err => {
        console.error("Failed to send Telegram status update notification:", err);
      });
    }

    res.json(order);
  } catch (err) {
    return res.status(400).json({
      err: "Status update failed",
      details: err.message
    });
  }
};

// New shipping-related methods

// Calculate shipping rates
exports.calculateShipping = async (req, res) => {
  try {
    const { pincode, weight, amount, cod } = req.body;
    
    const rates = await shiprocketService.getShippingRates({
      pincode,
      weight: weight || 0.3,
      amount,
      cod: cod || false
    });

    res.json({
      success: true,
      rates
    });
  } catch (err) {
    console.error('Shipping calculation error:', err);
    res.status(400).json({
      err: "Failed to calculate shipping rates",
      details: err.message
    });
  }
};

// Check pincode serviceability
exports.checkPincode = async (req, res) => {
  try {
    const { pincode } = req.params;
    
    const result = await shiprocketService.checkServiceability(pincode);
    
    res.json({
      success: true,
      serviceable: result.serviceable,
      couriers: result.available_couriers
    });
  } catch (err) {
    console.error('Pincode check error:', err);
    res.status(400).json({
      err: "Failed to check pincode",
      details: err.message
    });
  }
};

// Generate shipping label
exports.generateLabel = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId);
    if (!order || !order.shipping.shipmentId) {
      return res.status(400).json({
        err: "Order or shipment not found"
      });
    }

    const label = await shiprocketService.generateLabel(order.shipping.shipmentId);
    
    res.json({
      success: true,
      label_url: label.label_url
    });
  } catch (err) {
    console.error('Label generation error:', err);
    res.status(400).json({
      err: "Failed to generate label",
      details: err.message
    });
  }
};

// Track shipment
exports.trackShipment = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId);
    if (!order || !order.shipping.shipmentId) {
      return res.status(400).json({
        err: "Order or shipment not found"
      });
    }

    const tracking = await shiprocketService.trackShipment(order.shipping.shipmentId);
    
    res.json({
      success: true,
      tracking
    });
  } catch (err) {
    console.error('Tracking error:', err);
    res.status(400).json({
      err: "Failed to track shipment",
      details: err.message
    });
  }
};

// Create shipment for existing order (retry)
exports.createShipment = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId).populate('user', 'email name');
    if (!order) {
      return res.status(400).json({
        err: "Order not found"
      });
    }

    const shipmentData = await shiprocketService.createShipment(order);
    
    // Update order with shipment details
    order.shipping.shipmentId = shipmentData.shipment_id;
    order.shipping.awbCode = shipmentData.awb_code;
    order.shipping.courier = shipmentData.courier_name;
    
    await order.save();

    res.json({
      success: true,
      shipment: shipmentData
    });
  } catch (err) {
    console.error('Shipment creation error:', err);
    res.status(400).json({
      err: "Failed to create shipment",
      details: err.message
    });
  }
};

// ✅ NEW: Update tracking link for admin
exports.updateTrackingLink = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { trackingLink, trackingId, courier } = req.body;
    
    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        error: "Order not found"
      });
    }
    
    // Update shipping information
    if (!order.shipping) {
      order.shipping = {};
    }
    
    if (trackingLink) {
      order.shipping.trackingLink = trackingLink;
    }
    
    if (trackingId) {
      order.shipping.trackingId = trackingId;
    }
    
    if (courier) {
      order.shipping.courier = courier;
    }
    
    // Set updated timestamp
    order.updated = Date.now();
    
    await order.save();
    
    isDev && console.log(`✅ Tracking link updated for order ${orderId}:`, {
      trackingLink: order.shipping.trackingLink,
      trackingId: order.shipping.trackingId,
      courier: order.shipping.courier
    });
    
    res.json({
      success: true,
      message: "Tracking information updated successfully",
      order: {
        _id: order._id,
        shipping: order.shipping
      }
    });
    
  } catch (err) {
    console.error('Update tracking link error:', err);
    res.status(500).json({
      error: "Failed to update tracking information",
      details: err.message
    });
  }
};
