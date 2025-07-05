const mongoose = require("mongoose");
const { Schema } = mongoose;
const { ObjectId } = mongoose.Schema;

const ProductCartSchema = new Schema({
  product: {
    type: ObjectId,
    ref: "Product",
    required: false  // Make product reference optional for custom designs
  },
  name: String,
  count: Number,
  price: Number,
  size: String,
  // Additional fields for custom designs
  isCustom: {
    type: Boolean,
    default: false
  },
  customDesign: {
    type: String,  // Store custom design details
    required: false
  },
  // Custom product fields
  color: {
    type: String,
    required: false
  },
  colorValue: {
    type: String,
    required: false
  },
  // Legacy single design fields (kept for backward compatibility)
  designId: {
    type: String,
    required: false
  },
  designImage: {
    type: String,
    required: false
  },
  // New multi-design structure
  customization: {
    frontDesign: {
      designId: {
        type: String,
        required: false
      },
      designImage: {
        type: String,
        required: false
      },
      position: {
        type: String,
        enum: ['center', 'left', 'right', 'center-bottom'],
        default: 'center'
      },
      price: {
        type: Number,
        default: 0
      }
    },
    backDesign: {
      designId: {
        type: String,
        required: false
      },
      designImage: {
        type: String,
        required: false
      },
      position: {
        type: String,
        enum: ['center', 'center-bottom'],
        default: 'center'
      },
      price: {
        type: Number,
        default: 0
      }
    }
  }
});

const ProductCart = mongoose.model("ProductCart", ProductCartSchema);

const OrderSchema = new Schema(
  {
    products: [ProductCartSchema],
    transaction_id: {},
    amount: {
      type: Number,
    },
    subtotal: { 
      type: Number // Amount before discount
    },
    discount: { 
      type: Number, 
      default: 0 
    },
    coupon: {
      code: String,
      discountType: String,
      discountValue: Number
    },
    status: {
      type: String,
      default: "Received",
      enum: ["Cancelled", "Delivered", "Shipped", "Processing", "Received"], //this helps to restrict the options
    },
    // Add payment status for analytics
    paymentStatus: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Paid", "Failed", "Refunded"]
    },
    address: {
      type: String,
    },
    // Shipping details
    shipping: {
      name: String,
      phone: String,
      pincode: String,
      city: String,
      state: String,
      country: {
        type: String,
        default: "India"
      },
      weight: {
        type: Number,
        default: 0.3 // 300gms default for a t-shirt
      },
      length: {
        type: Number,
        default: 28 // cm
      },
      breadth: {
        type: Number,
        default: 22 // cm
      },
      height: {
        type: Number,
        default: 5 // cm
      },
      shippingCost: Number,
      courier: String,
      trackingId: String,
      shipmentId: String,
      awbCode: String, // Airway bill number
      estimatedDelivery: Date
    },
    updated: Date,

    user: {
      type: ObjectId,
      ref: "User",
      required: false  // Make user optional for guest orders
    },
    
    // Guest information for orders without user account
    guestInfo: {
      id: String,      // Unique guest ID
      name: String,
      email: String,
      phone: String
    }
  },
  { timestamps: true }
);

// Indexes for performance optimization
// Most common query pattern: user orders by date
OrderSchema.index({ user: 1, createdAt: -1 });

// For order management and status filtering
OrderSchema.index({ status: 1, createdAt: -1 });

// For analytics queries
OrderSchema.index({ createdAt: -1, paymentStatus: 1 });
OrderSchema.index({ createdAt: -1, status: 1 });

// For guest order lookups
OrderSchema.index({ "guestInfo.email": 1 });
OrderSchema.index({ "guestInfo.id": 1 });

// For transaction lookups
OrderSchema.index({ transaction_id: 1 });

// For shipping/tracking queries
OrderSchema.index({ "shipping.trackingId": 1 });
OrderSchema.index({ "shipping.courier": 1, status: 1 });

// Compound index for analytics date range queries
OrderSchema.index({ createdAt: 1, amount: 1 });

const Order = mongoose.model("Order", OrderSchema);

module.exports = { Order, ProductCart };
