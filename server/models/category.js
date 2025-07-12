const mongoose = require("mongoose");
const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 32,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true
    },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null
    },
    level: {
      type: Number,
      default: 0 // 0 for main categories, 1 for subcategories
    },
    icon: {
      type: String,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Generate slug from name before saving
categorySchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')     // Replace spaces with -
      .replace(/--+/g, '-')     // Replace multiple - with single -
      .trim();
  }
  next();
});

// Set level based on parent
categorySchema.pre('save', async function(next) {
  if (this.parentCategory) {
    const parent = await mongoose.model('Category').findById(this.parentCategory);
    if (parent) {
      this.level = parent.level + 1;
    }
  } else {
    this.level = 0;
  }
  next();
});

// Add indexes for performance
categorySchema.index({ parentCategory: 1, isActive: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ level: 1 });

// Instance method to get all subcategories
categorySchema.methods.getSubcategories = async function() {
  return await mongoose.model('Category').find({ 
    parentCategory: this._id,
    isActive: true 
  }).sort({ name: 1 });
};

// Instance method to get parent category
categorySchema.methods.getParent = async function() {
  if (!this.parentCategory) return null;
  return await mongoose.model('Category').findById(this.parentCategory);
};

// Static method to get all main categories
categorySchema.statics.getMainCategories = function() {
  return this.find({ 
    parentCategory: null,
    $or: [{ isActive: true }, { isActive: { $exists: false } }]
  }).sort({ name: 1 });
};

// Static method to get category with its subcategories
categorySchema.statics.getCategoryHierarchy = async function(categoryId) {
  const category = await this.findById(categoryId);
  if (!category) return null;
  
  const subcategories = await this.find({ 
    parentCategory: categoryId,
    isActive: true 
  }).sort({ name: 1 });
  
  return {
    ...category.toObject(),
    subcategories
  };
};

module.exports = mongoose.model("Category", categorySchema);
