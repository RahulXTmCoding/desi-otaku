const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: ObjectId,
      ref: "Product",
      required: true
    },
    user: {
      type: ObjectId,
      ref: "User",
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    helpful: [{
      type: ObjectId,
      ref: "User"
    }],
    verified: {
      type: Boolean,
      default: false // True if user has purchased the product
    },
    images: [{
      url: String,
      caption: String
    }]
  },
  { timestamps: true }
);

// Index for faster queries
reviewSchema.index({ product: 1, user: 1 }, { unique: true }); // One review per user per product
reviewSchema.index({ product: 1, rating: -1 });
reviewSchema.index({ product: 1, createdAt: -1 });

// Virtual for helpful count
reviewSchema.virtual('helpfulCount').get(function() {
  return this.helpful ? this.helpful.length : 0;
});

// Static method to calculate product average rating
reviewSchema.statics.calculateAverageRating = async function(productId) {
  const result = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);

  if (result.length > 0) {
    // Calculate rating distribution
    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };
    
    result[0].ratingDistribution.forEach(rating => {
      distribution[rating]++;
    });

    return {
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      totalReviews: result[0].totalReviews,
      distribution
    };
  }

  return {
    averageRating: 0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  };
};

// Update product rating after save
reviewSchema.post('save', async function() {
  const Product = require('./product');
  const stats = await this.constructor.calculateAverageRating(this.product);
  
  await Product.findByIdAndUpdate(this.product, {
    averageRating: stats.averageRating,
    totalReviews: stats.totalReviews
  });
});

// Update product rating after remove
reviewSchema.post('remove', async function() {
  const Product = require('./product');
  const stats = await this.constructor.calculateAverageRating(this.product);
  
  await Product.findByIdAndUpdate(this.product, {
    averageRating: stats.averageRating,
    totalReviews: stats.totalReviews
  });
});

module.exports = mongoose.model("Review", reviewSchema);
