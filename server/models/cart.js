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
    // Check if item already exists
    const existingItemIndex = this.items.findIndex(item => {
      if (guestItem.isCustom && item.isCustom) {
        // For custom items, check if designs match
        return JSON.stringify(item.customization) === JSON.stringify(guestItem.customization) &&
               item.size === guestItem.size &&
               item.color === guestItem.color;
      } else if (!guestItem.isCustom && !item.isCustom) {
        // For regular products
        return item.product.toString() === guestItem.product.toString() &&
               item.size === guestItem.size &&
               item.color === guestItem.color;
      }
      return false;
    });
    
    if (existingItemIndex > -1) {
      // Update quantity if item exists
      this.items[existingItemIndex].quantity += guestItem.quantity;
    } else {
      // Add new item
      this.items.push(guestItem);
    }
  });
};

// Index for faster queries
cartSchema.index({ user: 1 });
cartSchema.index({ sessionId: 1 });
cartSchema.index({ lastActivity: 1 });

module.exports = mongoose.model("Cart", cartSchema);
