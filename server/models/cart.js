const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  // For regular products
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },
  
  // For custom designs
  isCustom: {
    type: Boolean,
    default: false
  },
  
  // Custom design details - matching order model structure
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
    },
    selectedProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    }
  },
  
  // Common fields
  name: String, // Product name or "Custom T-Shirt"
  photoUrl: String, // URL-based product images
  size: {
    type: String,
    required: true,
    enum: ["S", "M", "L", "XL", "XXL"]
  },
  color: String,
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  sessionId: String, // For guest cart merging
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastActivity on any modification
cartSchema.pre('save', function(next) {
  this.lastActivity = new Date();
  next();
});

// Method to calculate total
cartSchema.methods.getTotal = function() {
  return this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
};

// Method to get item count
cartSchema.methods.getItemCount = function() {
  return this.items.reduce((count, item) => {
    return count + item.quantity;
  }, 0);
};

// Method to merge guest cart
cartSchema.methods.mergeCart = function(guestCartItems) {
  guestCartItems.forEach(guestItem => {
    // Skip invalid items
    if (!guestItem || !guestItem.size) return;
    
    // Check if item already exists
    const existingItemIndex = this.items.findIndex(item => {
      if (guestItem.isCustom && item.isCustom) {
        // For custom items, check if designs match
        try {
          return JSON.stringify(item.customization) === JSON.stringify(guestItem.customization) &&
                 item.size === guestItem.size &&
                 item.color === guestItem.color;
        } catch (e) {
          return false;
        }
      } else if (!guestItem.isCustom && !item.isCustom && guestItem.product && item.product) {
        // For regular products - ensure both have valid product IDs
        try {
          const guestProductId = guestItem.product._id || guestItem.product;
          const itemProductId = item.product._id || item.product;
          return guestProductId.toString() === itemProductId.toString() &&
                 item.size === guestItem.size &&
                 item.color === guestItem.color;
        } catch (e) {
          return false;
        }
      }
      return false;
    });
    
    if (existingItemIndex > -1) {
      // Update quantity if item exists
      this.items[existingItemIndex].quantity += (guestItem.quantity || 1);
    } else {
      // Create a clean item object to avoid validation errors
      const newItem = {
        size: guestItem.size,
        color: guestItem.color || 'Black',
        quantity: guestItem.quantity || 1,
        price: guestItem.price || 0,
        name: guestItem.name || 'Product',
        addedAt: guestItem.addedAt || new Date()
      };
      
      // Add product or custom fields
      if (guestItem.isCustom) {
        newItem.isCustom = true;
        newItem.customization = guestItem.customization || {};
      } else if (guestItem.product) {
        // Extract just the ID if it's an object
        newItem.product = guestItem.product._id || guestItem.product;
      }
      
      // Include photoUrl if available
      if (guestItem.photoUrl) {
        newItem.photoUrl = guestItem.photoUrl;
      }
      
      // Add new item
      this.items.push(newItem);
    }
  });
};

// Index for faster queries
cartSchema.index({ user: 1 });
cartSchema.index({ sessionId: 1 });
cartSchema.index({ lastActivity: 1 });

module.exports = mongoose.model("Cart", cartSchema);
