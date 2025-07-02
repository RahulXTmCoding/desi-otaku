const mongoose = require("mongoose");
const { Schema } = mongoose;
const { ObjectId } = mongoose.Schema;

const designSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    
    // Design image
    image: {
      data: Buffer,
      contentType: String,
    },
    
    // Image URL for external images
    imageUrl: {
      type: String,
    },

    // Design category (reference to Category model)
    category: {
      type: ObjectId,
      ref: "Category",
      required: true
    },

    // Tags for search and filtering
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],

    // Pricing
    price: {
      type: Number,
      default: 0, // Additional price for this design
    },

    // Popularity tracking
    popularity: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      used: { type: Number, default: 0 }, // Times used in orders
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    
    isFeatured: {
      type: Boolean,
      default: false,
    },

    // Design placement options
    placements: [{
      type: String,
      enum: ['front', 'back', 'left-sleeve', 'right-sleeve', 'pocket'],
      default: ['front']
    }],

    // Design dimensions (for proper scaling)
    dimensions: {
      width: { type: Number }, // in pixels
      height: { type: Number }, // in pixels
      aspectRatio: { type: Number }
    },

    // SEO
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },

    // Creator/Artist info (optional)
    artist: {
      name: { type: String },
      link: { type: String }
    },

    // Design file for high-res printing (optional)
    printFile: {
      url: { type: String },
      format: { type: String } // PDF, AI, SVG, etc.
    }
  },
  { timestamps: true }
);

// Generate slug from name
designSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  
  // Calculate aspect ratio if dimensions are provided
  if (this.dimensions && this.dimensions.width && this.dimensions.height) {
    this.dimensions.aspectRatio = this.dimensions.width / this.dimensions.height;
  }
  
  next();
});

// Index for search
designSchema.index({ name: 'text', description: 'text', tags: 'text' });
designSchema.index({ category: 1, isActive: 1 });
designSchema.index({ tags: 1 });
designSchema.index({ 'popularity.used': -1 });

module.exports = mongoose.model("Design", designSchema);
