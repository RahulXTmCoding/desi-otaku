const mongoose = require("mongoose");
const { Schema } = mongoose;
const { ObjectId } = mongoose.Schema;

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
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
      trim: true,
    },
    category: {
      type: ObjectId,
      ref: "Category",
    },
    productType: {
      type: ObjectId,
      ref: "ProductType",
      required: true
    },
    
    // Multiple product images - supports both file uploads and URLs
    images: [{
      // Can be either file upload or URL
      data: Buffer,
      contentType: String,
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
    
    // Simple size-based inventory
    sizeStock: {
      S: {
        type: Number,
        default: 0
      },
      M: {
        type: Number,
        default: 0
      },
      L: {
        type: Number,
        default: 0
      },
      XL: {
        type: Number,
        default: 0
      },
      XXL: {
        type: Number,
        default: 0
      }
    },
    
    // Available sizes (which sizes are offered for this product)
    availableSizes: {
      type: [String],
      default: ['S', 'M', 'L', 'XL', 'XXL'],
      enum: ['S', 'M', 'L', 'XL', 'XXL']
    },
    
    // Total stock (calculated from sizeStock)
    totalStock: {
      type: Number,
      default: 0
    },
    
    // Total sold
    sold: {
      type: Number,
      default: 0
    },
    
    // Low stock alert threshold
    lowStockThreshold: {
      type: Number,
      default: 10
    },
    
    // Product status
    isActive: {
      type: Boolean,
      default: true
    },
    
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: ObjectId,
      ref: "User",
      default: null
    },
    
    // Reviews
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
    
    // Tags for search
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }]
  },
  { timestamps: true }
);

// Indexes
productSchema.index({ isDeleted: 1, isActive: 1, category: 1, productType: 1 });
productSchema.index({ isDeleted: 1, isActive: 1, price: 1 });
productSchema.index({ isDeleted: 1, isActive: 1, averageRating: -1 });
productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ createdAt: -1 });
productSchema.index({ sold: -1 });
productSchema.index({ totalStock: 1 });

// Pre-save hook to calculate total stock
productSchema.pre('save', function(next) {
  // Calculate total stock from size inventory
  let total = 0;
  if (this.sizeStock) {
    for (const size of this.availableSizes) {
      total += this.sizeStock[size] || 0;
    }
  }
  this.totalStock = total;
  next();
});

// Methods
productSchema.methods.getStockForSize = function(size) {
  return this.sizeStock[size] || 0;
};

productSchema.methods.isInStock = function(size) {
  if (size) {
    return this.getStockForSize(size) > 0;
  }
  return this.totalStock > 0;
};

productSchema.methods.updateStock = function(size, quantity) {
  if (this.sizeStock[size] !== undefined) {
    this.sizeStock[size] = Math.max(0, this.sizeStock[size] + quantity);
    return true;
  }
  return false;
};

productSchema.methods.decreaseStock = function(size, quantity) {
  if (this.sizeStock[size] !== undefined && this.sizeStock[size] >= quantity) {
    this.sizeStock[size] -= quantity;
    this.sold += quantity;
    return true;
  }
  return false;
};

productSchema.methods.getPrimaryImage = function() {
  const primaryImage = this.images.find(img => img.isPrimary);
  return primaryImage || this.images[0] || null;
};

module.exports = mongoose.model("Product", productSchema);
