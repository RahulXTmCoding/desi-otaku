const { Order, ProductCart } = require("../models/order");
const shiprocketService = require("../services/shiprocket");
const emailService = require("../services/emailService");

exports.getOrderById = (req, res, next, id) => {
  Order.findById(id)
    .populate("products.product", "name price")
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

exports.getAllOrders = (req, res) => {
  Order.find()
    .populate("user", "_id name")
    .exec((err, order) => {
      if (err) {
        return res.status(400).json({
          err: "No order found in DB",
        });
      }
      res.json(order);
    });
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
