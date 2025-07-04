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
  designId: {
    type: String,  // Not ObjectId since it could be from different sources
    required: false
  },
  designImage: {
    type: String,
    required: false
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

const Order = mongoose.model("Order", OrderSchema);

module.exports = { Order, ProductCart };
