const mongoose = require("mongoose");
const { Schema } = mongoose;
const { ObjectId } = mongoose.Schema;

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 32,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2500,
    },

    price: {
      type: Number,
      required: true,
      maxlength: 32,
      trim: true,
    },

    category: {
      type: ObjectId,
      ref: "Category",
    },

    // Product type (t-shirt, vest, hoodie, etc.)
    productType: {
      type: String,
      required: true,
      trim: true,
      enum: ['t-shirt', 'vest', 'hoodie', 'oversized-tee', 'acid-wash', 'tank-top', 'long-sleeve', 'crop-top', 'other'],
      default: 't-shirt'
    },
    
    // Total stock across all sizes (for backward compatibility)
    stock: {
      type: Number,
      default: 0,
    },

    // Size-wise inventory
    inventory: {
      S: {
        stock: { type: Number, default: 0 },
        reserved: { type: Number, default: 0 }, // Reserved during checkout
        sold: { type: Number, default: 0 }
      },
      M: {
        stock: { type: Number, default: 0 },
        reserved: { type: Number, default: 0 },
        sold: { type: Number, default: 0 }
      },
      L: {
        stock: { type: Number, default: 0 },
        reserved: { type: Number, default: 0 },
        sold: { type: Number, default: 0 }
      },
      XL: {
        stock: { type: Number, default: 0 },
        reserved: { type: Number, default: 0 },
        sold: { type: Number, default: 0 }
      },
      XXL: {
        stock: { type: Number, default: 0 },
        reserved: { type: Number, default: 0 },
        sold: { type: Number, default: 0 }
      }
    },

    // Inventory alerts
    lowStockThreshold: {
      type: Number,
      default: 10 // Alert when any size drops below this
    },

    sold: {
      type: Number,
      default: 0,
    },

    photo: {
      data: Buffer,
      contentType: String,
    },
    
    // Photo URL for external images
    photoUrl: {
      type: String,
    },

    // Multiple images support
    images: [{
      url: String,
      caption: String,
      isPrimary: {
        type: Boolean,
        default: false
      },
      order: {
        type: Number,
        default: 0
      }
    }],

    // Available sizes (array of available sizes)
    availableSizes: {
      type: [String],
      default: ['S', 'M', 'L', 'XL', 'XXL']
    },

    // Track if product is active
    isActive: {
      type: Boolean,
      default: true
    },

    // Track if out of stock alerts have been sent
    alertsSent: {
      lowStock: { type: Boolean, default: false },
      outOfStock: { type: Boolean, default: false }
    },

    // Review fields
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    },

    // Tags for search and filtering
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],

    // Color variants
    variants: [{
      color: String,
      colorValue: String,
      image: String,
      enabled: {
        type: Boolean,
        default: false
      },
      stock: {
        S: {
          type: mongoose.Schema.Types.Mixed,
          default: 0
        },
        M: {
          type: mongoose.Schema.Types.Mixed,
          default: 0
        },
        L: {
          type: mongoose.Schema.Types.Mixed,
          default: 0
        },
        XL: {
          type: mongoose.Schema.Types.Mixed,
          default: 0
        },
        XXL: {
          type: mongoose.Schema.Types.Mixed,
          default: 0
        }
      }
    }]
  },
  { timestamps: true }
);

// Methods to check inventory
productSchema.methods.getAvailableStock = function(size) {
  if (!size) {
    // Return total available stock across all sizes
    let total = 0;
    for (const s of this.availableSizes) {
      if (this.inventory[s]) {
        total += (this.inventory[s].stock - this.inventory[s].reserved);
      }
    }
    return total;
  }
  
  // Return available stock for specific size
  if (this.inventory[size]) {
    return this.inventory[size].stock - this.inventory[size].reserved;
  }
  return 0;
};

productSchema.methods.isInStock = function(size) {
  return this.getAvailableStock(size) > 0;
};

productSchema.methods.isLowStock = function(size) {
  const available = this.getAvailableStock(size);
  return available > 0 && available <= this.lowStockThreshold;
};

productSchema.methods.reserveStock = function(size, quantity) {
  if (this.inventory[size] && this.getAvailableStock(size) >= quantity) {
    this.inventory[size].reserved += quantity;
    return true;
  }
  return false;
};

productSchema.methods.releaseStock = function(size, quantity) {
  if (this.inventory[size]) {
    this.inventory[size].reserved = Math.max(0, this.inventory[size].reserved - quantity);
    return true;
  }
  return false;
};

productSchema.methods.confirmSale = function(size, quantity) {
  if (this.inventory[size]) {
    this.inventory[size].stock = Math.max(0, this.inventory[size].stock - quantity);
    this.inventory[size].reserved = Math.max(0, this.inventory[size].reserved - quantity);
    this.inventory[size].sold += quantity;
    this.sold += quantity;
    
    // Update total stock
    this.stock = 0;
    for (const s of this.availableSizes) {
      if (this.inventory[s]) {
        this.stock += this.inventory[s].stock;
      }
    }
    return true;
  }
  return false;
};

// Pre-save hook to update total stock
productSchema.pre('save', function(next) {
  // Calculate total stock from size inventory
  let totalStock = 0;
  for (const size of this.availableSizes) {
    if (this.inventory[size]) {
      totalStock += this.inventory[size].stock;
    }
  }
  this.stock = totalStock;
  next();
});

module.exports = mongoose.model("Product", productSchema);
