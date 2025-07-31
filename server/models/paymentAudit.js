const mongoose = require('mongoose');

const paymentAuditSchema = new mongoose.Schema({
  // Order and payment information
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null  // Not required - will be set after order creation
  },
  
  transactionId: {
    type: String,
    required: true,
    index: true
  },
  
  razorpayOrderId: {
    type: String,
    index: true
  },
  
  razorpayPaymentId: {
    type: String,
    index: true
  },
  
  // User information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  guestInfo: {
    email: String,
    name: String,
    phone: String
  },
  
  // Amount verification
  clientAmount: {
    type: Number,
    required: true
  },
  
  serverCalculatedAmount: {
    type: Number,
    required: true
  },
  
  paidAmount: {
    type: Number,
    required: true
  },
  
  amountMismatch: {
    type: Boolean,
    default: false
  },
  
  // Security information
  clientIP: {
    type: String,
    required: true,
    index: true
  },
  
  userAgent: {
    type: String
  },
  
  securityHash: {
    type: String
  },
  
  // Payment details
  paymentMethod: {
    type: String,
    enum: ['card', 'netbanking', 'wallet', 'upi', 'emi', 'bank_transfer', 'unknown'],
    default: 'unknown'
  },
  
  paymentStatus: {
    type: String,
    enum: ['initiated', 'attempted', 'captured', 'failed', 'cancelled', 'refunded'],
    default: 'initiated'
  },
  
  bank: String,
  wallet: String,
  upiId: String,
  cardNetwork: String,
  
  // Fraud detection flags
  flagged: {
    type: Boolean,
    default: false
  },
  
  flagReason: [String],
  
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Verification results
  signatureVerified: {
    type: Boolean,
    default: false
  },
  
  webhookReceived: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  paymentInitiatedAt: {
    type: Date,
    default: Date.now
  },
  
  paymentCompletedAt: Date,
  
  verificationAt: Date,
  
  // Event tracking
  events: [{
    event: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    data: mongoose.Schema.Types.Mixed
  }],
  
  // Error tracking
  errors: [{
    error: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    stack: String
  }]
  
}, {
  timestamps: true,
  indexes: [
    { clientIP: 1, createdAt: -1 },
    { userId: 1, createdAt: -1 },
    { 'guestInfo.email': 1, createdAt: -1 },
    { flagged: 1, createdAt: -1 },
    { amountMismatch: 1, createdAt: -1 }
  ]
});

// Methods
paymentAuditSchema.methods.addEvent = function(event, data = {}) {
  this.events.push({
    event,
    data,
    timestamp: new Date()
  });
  return this.save();
};

paymentAuditSchema.methods.addError = function(error, stack = '') {
  this.errors.push({
    error: error.toString(),
    stack,
    timestamp: new Date()
  });
  return this.save();
};

paymentAuditSchema.methods.flagForReview = function(reason) {
  this.flagged = true;
  if (reason) {
    this.flagReason.push(reason);
  }
  this.riskScore = Math.min(this.riskScore + 20, 100);
  return this.save();
};

// Static methods for fraud detection
paymentAuditSchema.statics.checkIPRisk = async function(ip) {
  const recentAttempts = await this.countDocuments({
    clientIP: ip,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
  });
  
  const failedAttempts = await this.countDocuments({
    clientIP: ip,
    paymentStatus: { $in: ['failed', 'cancelled'] },
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  });
  
  return {
    totalAttempts: recentAttempts,
    failedAttempts,
    riskLevel: recentAttempts > 10 ? 'high' : failedAttempts > 3 ? 'medium' : 'low'
  };
};

paymentAuditSchema.statics.checkEmailRisk = async function(email) {
  const recentOrders = await this.countDocuments({
    $or: [
      { 'guestInfo.email': email },
      { userId: { $exists: true } } // TODO: Join with User model for email
    ],
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
  });
  
  return {
    recentOrders,
    riskLevel: recentOrders > 5 ? 'high' : recentOrders > 2 ? 'medium' : 'low'
  };
};

module.exports = mongoose.model('PaymentAudit', paymentAuditSchema);
