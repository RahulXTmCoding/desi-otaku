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
    // Pricing structure for GST-inclusive model
    price: {
      type: Number,
      required: true,
      trim: true,
    },
    mrp: {
      type: Number,
      required: false,
      trim: true,
    },
    // Auto-calculated fields
    discount: {
      type: Number,
      default: 0
    },
    discountPercentage: {
      type: Number,
      default: 0
    },
    category: {
      type: ObjectId,
      ref: "Category",
    },
    subcategory: {
      type: ObjectId,
      ref: "Category",
      default: null
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

// Indexes - Optimized for similar products performance
// Core compound index for similar products queries
productSchema.index({ 
  isDeleted: 1, 
  isActive: 1, 
  totalStock: 1, 
  category: 1, 
  productType: 1,
  sold: -1,
  createdAt: -1 
});

// Optimized index for same category products (Stage 1)
productSchema.index({ 
  isDeleted: 1, 
  isActive: 1, 
  totalStock: 1, 
  category: 1,
  sold: -1 
});

// Optimized index for same product type queries (Stage 2)
productSchema.index({ 
  isDeleted: 1, 
  isActive: 1, 
  totalStock: 1, 
  productType: 1,
  sold: -1 
});

// Index for popular products fallback (Stage 3)
productSchema.index({ 
  isDeleted: 1, 
  isActive: 1, 
  totalStock: 1, 
  sold: -1 
});

// Additional indexes for other features
productSchema.index({ isDeleted: 1, isActive: 1, subcategory: 1 });
productSchema.index({ isDeleted: 1, isActive: 1, price: 1 });
productSchema.index({ isDeleted: 1, isActive: 1, averageRating: -1 });
productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ createdAt: -1 });
productSchema.index({ sold: -1 });

// Pre-save hook to calculate total stock and pricing
productSchema.pre('save', function(next) {
  // Calculate total stock from size inventory
  let total = 0;
  if (this.sizeStock) {
    for (const size of this.availableSizes) {
      total += this.sizeStock[size] || 0;
    }
  }
  this.totalStock = total;
  
  // Auto-calculate discount if MRP is provided
  if (this.mrp && this.mrp > 0 && this.price && this.price > 0) {
    this.discount = this.mrp - this.price;
    this.discountPercentage = Math.round((this.discount / this.mrp) * 100);
  } else {
    this.discount = 0;
    this.discountPercentage = 0;
  }
  
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
    const previousStock = this.sizeStock[size];
    this.sizeStock[size] -= quantity;
    this.sold += quantity;
    
    // Return both success status and stock change info for low stock tracking
    return {
      success: true,
      stockChange: {
        productId: this._id,
        productName: this.name,
        size: size,
        previousStock: previousStock,
        currentStock: this.sizeStock[size],
        quantityDecreased: quantity
      }
    };
  }
  return { success: false };
};

productSchema.methods.getPrimaryImage = function() {
  const primaryImage = this.images.find(img => img.isPrimary);
  return primaryImage || this.images[0] || null;
};

// Pricing methods for GST-inclusive model
productSchema.methods.getGrossAmount = function() {
  // Use actual MRP if set, otherwise generate one
  return this.mrp || (this.price * 1.5);
};

productSchema.methods.getDiscountAmount = function() {
  return this.discount || (this.getGrossAmount() - this.price);
};

productSchema.methods.getDiscountPercentage = function() {
  const grossAmount = this.getGrossAmount();
  return grossAmount > 0 ? Math.round((this.getDiscountAmount() / grossAmount) * 100) : 0;
};

productSchema.methods.getPricingDisplay = function() {
  return {
    price: this.price,
    mrp: this.mrp,
    grossAmount: this.getGrossAmount(),
    discount: this.getDiscountAmount(),
    discountPercentage: this.getDiscountPercentage(),
    savings: this.mrp ? (this.mrp - this.price) : 0
  };
};

productSchema.methods.isDiscounted = function() {
  return this.mrp && this.mrp > this.price;
};

module.exports = mongoose.model("Product", productSchema);
