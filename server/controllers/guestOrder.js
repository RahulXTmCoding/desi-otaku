const { Order } = require('../models/order');
const User = require('../models/user');
const { v4: uuidv4 } = require('uuid');

// Create order for guest users
exports.createGuestOrder = async (req, res) => {
  try {
    const {
      products,
      transaction_id,
      amount,
      address,
      status = "Received",
      shipping,
      guestInfo
    } = req.body;

    // Validate required fields
    if (!products || !transaction_id || !amount || !address || !guestInfo) {
      return res.status(400).json({
        error: 'Missing required order information'
      });
    }

    if (!guestInfo.email || !guestInfo.name) {
      return res.status(400).json({
        error: 'Guest email and name are required'
      });
    }

    // Check if user exists with this email
    let userId = null;
    try {
      const existingUser = await User.findOne({ email: guestInfo.email });
      if (existingUser) {
        userId = existingUser._id;
        console.log('Found existing user for guest order:', guestInfo.email);
      }
    } catch (error) {
      console.log('Error checking for existing user:', error);
      // Continue without linking if there's an error
    }
    
    // Create guest order with a unique guest ID
    const guestId = `guest_${uuidv4()}`;
    
    const order = new Order({
      products,
      transaction_id,
      amount,
      address,
      status,
      shipping,
      user: userId, // Link to existing user if found
      guestInfo: {
        id: guestId,
        name: guestInfo.name,
        email: guestInfo.email,
        phone: guestInfo.phone
      }
    });

    const savedOrder = await order.save();
    
    console.log('Guest order created:', savedOrder._id);

    res.json({
      success: true,
      order: savedOrder,
      message: 'Guest order created successfully'
    });

  } catch (error) {
    console.error('Guest order creation error:', error);
    res.status(500).json({
      error: 'Failed to create guest order',
      details: error.message
    });
  }
};

// Get guest order by ID and email
exports.getGuestOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required to retrieve guest order'
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      'guestInfo.email': email
    }).populate('products.product', 'name photo');

    if (!order) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Get guest order error:', error);
    res.status(500).json({
      error: 'Failed to retrieve guest order',
      details: error.message
    });
  }
};

// Track guest order by order ID and email
exports.trackGuestOrder = async (req, res) => {
  try {
    const { orderId, email } = req.body;

    if (!orderId || !email) {
      return res.status(400).json({
        error: 'Order ID and email are required'
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      'guestInfo.email': email
    }).select('status shipping createdAt updatedAt');

    if (!order) {
      return res.status(404).json({
        error: 'Order not found. Please check your order ID and email.'
      });
    }

    res.json({
      success: true,
      tracking: {
        orderId: order._id,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        shipping: {
          courier: order.shipping?.courier,
          trackingId: order.shipping?.trackingId,
          estimatedDelivery: order.shipping?.estimatedDelivery
        }
      }
    });

  } catch (error) {
    console.error('Track guest order error:', error);
    res.status(500).json({
      error: 'Failed to track order',
      details: error.message
    });
  }
};
