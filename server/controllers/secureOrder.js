const { Order } = require('../models/order');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/emailService');

// Rate limiting storage (in-memory for now - consider Redis for production)
const rateLimitStore = new Map();

// Clean up rate limit store every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.firstAttempt > 3600000) { // 1 hour
      rateLimitStore.delete(key);
    }
  }
}, 3600000);

// Rate limiting helper
const checkRateLimit = (identifier, maxAttempts = 5, windowMs = 3600000) => {
  const now = Date.now();
  const key = identifier;
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, {
      count: 1,
      firstAttempt: now
    });
    return { allowed: true, remaining: maxAttempts - 1 };
  }
  
  const data = rateLimitStore.get(key);
  
  // Reset if window has passed
  if (now - data.firstAttempt > windowMs) {
    rateLimitStore.set(key, {
      count: 1,
      firstAttempt: now
    });
    return { allowed: true, remaining: maxAttempts - 1 };
  }
  
  // Check if limit exceeded
  if (data.count >= maxAttempts) {
    return { 
      allowed: false, 
      remaining: 0,
      resetTime: new Date(data.firstAttempt + windowMs)
    };
  }
  
  // Increment count
  data.count++;
  rateLimitStore.set(key, data);
  
  return { allowed: true, remaining: maxAttempts - data.count };
};

// Generate secure PIN
const generatePIN = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate JWT token for magic link
const generateSecureToken = (orderId, email) => {
  const payload = {
    orderId,
    email,
    type: 'order_access',
    iat: Math.floor(Date.now() / 1000)
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'default_secret', {
    expiresIn: '7d'
  });
};

// Verify JWT token
const verifySecureToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
  } catch (error) {
    return null;
  }
};

// Get client IP address
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         'unknown';
};

// Create secure access tokens for order
exports.createSecureAccess = async (orderId, email) => {
  try {
    const token = generateSecureToken(orderId, email);
    const pin = generatePIN();
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    await Order.findByIdAndUpdate(orderId, {
      $set: {
        'orderAccess.token': token,
        'orderAccess.pin': pin,
        'orderAccess.tokenExpiry': tokenExpiry,
        'orderAccess.accessCount': 0
      }
    });
    
    return { token, pin, success: true };
  } catch (error) {
    console.error('Error creating secure access:', error);
    return { success: false, error: error.message };
  }
};

// Access order via magic link token
exports.accessOrderByToken = async (req, res) => {
  try {
    const { token } = req.params;
    const clientIP = getClientIP(req);
    
    if (!token) {
      return res.status(400).json({
        error: 'Access token is required'
      });
    }
    
    // Verify token
    const decoded = verifySecureToken(token);
    if (!decoded) {
      return res.status(401).json({
        error: 'Invalid or expired access link'
      });
    }
    
    // Find order with matching token
    const order = await Order.findOne({
      _id: decoded.orderId,
      'orderAccess.token': token,
      'orderAccess.tokenExpiry': { $gt: new Date() }
    })
    .populate('products.product', 'name price photoUrl images category productType')
    .populate('user', 'name email');
    
    if (!order) {
      return res.status(404).json({
        error: 'Order not found or access link has expired'
      });
    }
    
    // Verify email matches (additional security)
    const orderEmail = order.user?.email || order.guestInfo?.email;
    if (orderEmail !== decoded.email) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }
    
    // Update access tracking
    await Order.findByIdAndUpdate(order._id, {
      $inc: { 'orderAccess.accessCount': 1 },
      $set: {
        'orderAccess.lastAccessedAt': new Date(),
        'orderAccess.lastAccessIP': clientIP
      }
    });
    
    // Return order data (excluding sensitive access info)
    const orderData = order.toObject();
    delete orderData.orderAccess;
    
    res.json({
      success: true,
      order: orderData,
      accessInfo: {
        accessedAt: new Date(),
        accessCount: order.orderAccess.accessCount + 1
      }
    });
    
  } catch (error) {
    console.error('Token access error:', error);
    res.status(500).json({
      error: 'Failed to access order',
      details: error.message
    });
  }
};

// Access order via PIN verification
exports.accessOrderByPIN = async (req, res) => {
  try {
    const { orderId, email, pin } = req.body;
    const clientIP = getClientIP(req);
    
    if (!orderId || !email || !pin) {
      return res.status(400).json({
        error: 'Order ID, email, and PIN are required'
      });
    }
    
    // Rate limiting check
    const rateLimitKey = `pin_${email}_${clientIP}`;
    const rateLimit = checkRateLimit(rateLimitKey, 5, 3600000); // 5 attempts per hour
    
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'Too many attempts. Please try again later.',
        resetTime: rateLimit.resetTime
      });
    }
    
    // Find order with matching PIN and email
    const order = await Order.findOne({
      _id: orderId,
      'orderAccess.pin': pin,
      $or: [
        { 'user.email': email },
        { 'guestInfo.email': email }
      ]
    })
    .populate('products.product', 'name price photoUrl images category productType')
    .populate('user', 'name email');
    
    if (!order) {
      return res.status(404).json({
        error: 'Invalid order ID, email, or PIN combination'
      });
    }
    
    // Update access tracking
    await Order.findByIdAndUpdate(order._id, {
      $inc: { 'orderAccess.accessCount': 1 },
      $set: {
        'orderAccess.lastAccessedAt': new Date(),
        'orderAccess.lastAccessIP': clientIP
      }
    });
    
    // Generate new magic link for future use
    const newToken = generateSecureToken(order._id, email);
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    await Order.findByIdAndUpdate(order._id, {
      $set: {
        'orderAccess.token': newToken,
        'orderAccess.tokenExpiry': tokenExpiry
      }
    });
    
    // Return order data and new magic link
    const orderData = order.toObject();
    delete orderData.orderAccess;
    
    res.json({
      success: true,
      order: orderData,
      magicLink: `${process.env.CLIENT_URL || 'http://localhost:5173'}/track/${Buffer.from(newToken).toString('base64url')}`,
      accessInfo: {
        accessedAt: new Date(),
        accessCount: order.orderAccess.accessCount + 1,
        remainingAttempts: rateLimit.remaining
      }
    });
    
  } catch (error) {
    console.error('PIN access error:', error);
    res.status(500).json({
      error: 'Failed to access order',
      details: error.message
    });
  }
};

// Send new magic link to email
exports.requestNewMagicLink = async (req, res) => {
  try {
    const { orderId, email } = req.body;
    const clientIP = getClientIP(req);
    
    if (!orderId || !email) {
      return res.status(400).json({
        error: 'Order ID and email are required'
      });
    }
    
    // Rate limiting check
    const rateLimitKey = `magic_${email}_${clientIP}`;
    const rateLimit = checkRateLimit(rateLimitKey, 3, 3600000); // 3 requests per hour
    
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'Too many magic link requests. Please try again later.',
        resetTime: rateLimit.resetTime
      });
    }
    
    // Find order
    const order = await Order.findOne({
      _id: orderId,
      $or: [
        { 'user.email': email },
        { 'guestInfo.email': email }
      ]
    }).populate('user', 'name email');
    
    if (!order) {
      return res.status(404).json({
        error: 'Order not found for this email'
      });
    }
    
    // Generate new tokens
    const token = generateSecureToken(order._id, email);
    const pin = generatePIN();
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    // Update order with new tokens
    await Order.findByIdAndUpdate(order._id, {
      $set: {
        'orderAccess.token': token,
        'orderAccess.pin': pin,
        'orderAccess.tokenExpiry': tokenExpiry
      }
    });
    
    // Send email with magic link and PIN
    const customerInfo = {
      name: order.user?.name || order.guestInfo?.name || 'Customer',
      email: email
    };
    
    const magicLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/track/${Buffer.from(token).toString('base64url')}`;
    
    await emailService.sendOrderTrackingLink(order, customerInfo, magicLink, pin);
    
    res.json({
      success: true,
      message: 'New tracking link sent to your email',
      remainingRequests: rateLimit.remaining
    });
    
  } catch (error) {
    console.error('Magic link request error:', error);
    res.status(500).json({
      error: 'Failed to send tracking link',
      details: error.message
    });
  }
};

// Check order access status
exports.checkOrderAccess = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId).select('orderAccess guestInfo user');
    
    if (!order) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }
    
    const hasSecureAccess = !!(order.orderAccess?.token && order.orderAccess?.pin);
    const tokenExpiry = order.orderAccess?.tokenExpiry;
    const isTokenValid = tokenExpiry && new Date() < new Date(tokenExpiry);
    
    res.json({
      success: true,
      hasSecureAccess,
      isTokenValid,
      accessCount: order.orderAccess?.accessCount || 0,
      lastAccessed: order.orderAccess?.lastAccessedAt
    });
    
  } catch (error) {
    console.error('Check access error:', error);
    res.status(500).json({
      error: 'Failed to check order access',
      details: error.message
    });
  }
};

module.exports = exports;
