const mongoose = require("mongoose");
const { Schema } = mongoose;
const { ObjectId } = mongoose.Schema;

const productTypeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 32,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    icon: {
      type: String, // Icon class or emoji
      default: "📦"
    },
    // Genders this product type is available for
    genders: [{
      type: String,
      enum: ['men', 'women', 'unisex']
    }],
    // Default size chart for this product type
    defaultSizeChart: {
      type: ObjectId,
      ref: "SizeChartTemplate",
      default: null
    },
    // Display order
    order: {
      type: Number,
      default: 0
    },
    // Active status
    isActive: {
      type: Boolean,
      default: true
    },
    // SEO metadata
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String]
  },
  { timestamps: true }
);

// Pre-save hook to generate slug
productTypeSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Static method to get active product types
productTypeSchema.statics.getActiveTypes = function() {
  return this.find({ isActive: true }).sort('order name');
};

module.exports = mongoose.model("ProductType", productTypeSchema);
