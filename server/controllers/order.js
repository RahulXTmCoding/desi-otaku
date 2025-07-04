const { Order, ProductCart } = require("../models/order");
const shiprocketService = require("../services/shiprocket");
const emailService = require("../services/emailService");

exports.getOrderById = (req, res, next, id) => {
  Order.findById(id)
    .populate({
      path: "products.product",
      select: "name price photoUrl images category productType"  // Removed photo to avoid sending binary data
    })
    .populate("user", "email name")
    .exec((err, order) => {
      if (err) {
        return res.status(400).json({
          err: "Order is not found",
        });
      }

      req.order = order;
      next();
    });
};

exports.createOrder = async (req, res) => {
  try {
    console.log('Creating order with data:', JSON.stringify(req.body.order, null, 2));
    
    // Ensure user is set
    req.body.order.user = req.profile._id || req.profile;
    
    const order = new Order(req.body.order);
    
    // Save order first
    const savedOrder = await order.save();
    
    // Populate user info for email and shipment
    await savedOrder.populate('user', 'email name');
    
    // Send order confirmation email (don't wait for it)
    emailService.sendOrderConfirmation(savedOrder, savedOrder.user).catch(err => {
      console.error("Failed to send order confirmation email:", err);
    });
    
    // If Shiprocket is configured, create shipment
    if (process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD) {
      try {
        // Create shipment in Shiprocket
        const shipmentData = await shiprocketService.createShipment(savedOrder);
        
        // Update order with shipment details
        savedOrder.shipping.shipmentId = shipmentData.shipment_id;
        savedOrder.shipping.awbCode = shipmentData.awb_code;
        savedOrder.shipping.courier = shipmentData.courier_name;
        
        await savedOrder.save();
      } catch (shipmentError) {
        console.error('Shiprocket error (order still created):', shipmentError);
        // Don't fail the order if shipping fails - can be retried later
      }
    }

    res.json(savedOrder);
  } catch (err) {
    console.error('Order creation error:', err);
    return res.status(400).json({
      err: "Unable to save order in DB",
      details: err.message
    });
  }
};

exports.getAllOrders = async (req, res) => {
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
    
    // Status filter
    if (status && status !== 'all') {
      query.status = status;
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
    
    // Search filter (order ID or user email)
    if (search) {
      query.$or = [
        { _id: { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Execute query with population
    const [orders, totalCount] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email')
        .populate('products.product', 'name price photoUrl images category productType')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(parseInt(limit)),
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
  if (req.order.user._id.toString() !== req.profile._id.toString()) {
    return res.status(403).json({
      error: "Access denied. You are not the owner of this order."
    });
  }
  return res.json(req.order);
};

exports.getOrderStatus = (req, res) => {
  res.json(Order.schema.path("status").enumValues);
};

exports.updateStatus = async (req, res) => {
  try {
    // Get current order to compare status
    const oldOrder = await Order.findById(req.body.orderId);
    if (!oldOrder) {
      return res.status(400).json({
        err: "Order not found",
      });
    }
    const oldStatus = oldOrder.status;

    // Update status
    const order = await Order.findByIdAndUpdate(
      req.body.orderId,
      { $set: { status: req.body.status } },
      { new: true }
    ).populate('user', 'email name');

    // Send email notifications based on status change
    if (order.user && order.user.email) {
      if (req.body.status === 'Shipped' && oldStatus !== 'Shipped') {
        // Send shipping notification
        emailService.sendShippingUpdate(order, order.user).catch(err => {
          console.error("Failed to send shipping email:", err);
        });
      } else if (oldStatus !== req.body.status) {
        // Send general status update
        emailService.sendOrderStatusUpdate(order, order.user, oldStatus).catch(err => {
          console.error("Failed to send status update email:", err);
        });
      }
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
