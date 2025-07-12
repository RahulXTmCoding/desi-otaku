const Review = require("../models/review");
const Product = require("../models/product");
const { Order } = require("../models/order");
const Settings = require("../models/settings");

// Get all reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;

    // Build sort criteria
    let sortCriteria = {};
    switch (sort) {
      case 'highest':
        sortCriteria = { rating: -1, createdAt: -1 };
        break;
      case 'lowest':
        sortCriteria = { rating: 1, createdAt: -1 };
        break;
      case 'helpful':
        sortCriteria = { helpfulCount: -1, createdAt: -1 };
        break;
      default: // newest
        sortCriteria = { createdAt: -1 };
    }

    const reviews = await Review.find({ product: productId })
      .populate('user', 'name')
      .sort(sortCriteria)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Add helpful count to each review
    const reviewsWithCount = reviews.map(review => ({
      ...review,
      helpfulCount: review.helpful ? review.helpful.length : 0,
      isHelpful: req.auth ? review.helpful.includes(req.auth._id) : false
    }));

    // Get total count
    const totalReviews = await Review.countDocuments({ product: productId });

    // Get rating statistics
    const stats = await Review.calculateAverageRating(productId);

    res.json({
      reviews: reviewsWithCount,
      currentPage: page,
      totalPages: Math.ceil(totalReviews / limit),
      totalReviews,
      stats
    });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to get reviews",
      details: err.message
    });
  }
};

// Create a review
exports.createReview = async (req, res) => {
  try {
    // Check if reviews are enabled
    const reviewsEnabled = await Settings.getSetting("reviews_enabled", true);
    if (!reviewsEnabled) {
      return res.status(403).json({
        error: "Reviews are currently disabled"
      });
    }

    const { productId } = req.params;
    const { rating, title, comment } = req.body;

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: req.profile._id
    });

    if (existingReview) {
      return res.status(400).json({
        error: "You have already reviewed this product"
      });
    }

    // Check if user has purchased this product
    const purchasedOrder = await Order.findOne({
      user: req.profile._id,
      "products.product": productId,
      status: { $in: ["Delivered", "Received"] }
    });
    
    const hasPurchased = !!purchasedOrder;

    // Create review
    const review = new Review({
      product: productId,
      user: req.profile._id,
      rating,
      title,
      comment,
      verified: hasPurchased
    });

    await review.save();

    // Populate user info before sending response
    await review.populate('user', 'name');

    res.json({
      message: "Review created successfully",
      review
    });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to create review",
      details: err.message
    });
  }
};

// Update a review
exports.updateReview = async (req, res) => {
  try {
    // Check if reviews are enabled
    const reviewsEnabled = await Settings.getSetting("reviews_enabled", true);
    if (!reviewsEnabled) {
      return res.status(403).json({
        error: "Reviews are currently disabled"
      });
    }

    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;

    const review = await Review.findOne({
      _id: reviewId,
      user: req.profile._id
    });

    if (!review) {
      return res.status(404).json({
        error: "Review not found or you don't have permission to update it"
      });
    }

    // Update fields
    if (rating) review.rating = rating;
    if (title) review.title = title;
    if (comment) review.comment = comment;

    await review.save();

    res.json({
      message: "Review updated successfully",
      review
    });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to update review",
      details: err.message
    });
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findOne({
      _id: reviewId,
      user: req.profile._id
    });

    if (!review) {
      return res.status(404).json({
        error: "Review not found or you don't have permission to delete it"
      });
    }

    await review.remove();

    res.json({
      message: "Review deleted successfully"
    });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to delete review",
      details: err.message
    });
  }
};

// Mark review as helpful
exports.markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        error: "Review not found"
      });
    }

    // Check if user has already marked this review as helpful
    const alreadyMarked = review.helpful.includes(req.profile._id);

    if (alreadyMarked) {
      // Remove from helpful
      review.helpful = review.helpful.filter(
        userId => userId.toString() !== req.profile._id.toString()
      );
    } else {
      // Add to helpful
      review.helpful.push(req.profile._id);
    }

    await review.save();

    res.json({
      message: alreadyMarked ? "Removed from helpful" : "Marked as helpful",
      helpfulCount: review.helpful.length
    });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to mark review",
      details: err.message
    });
  }
};

// Get user's review for a product
exports.getUserReview = async (req, res) => {
  try {
    const { productId } = req.params;

    const review = await Review.findOne({
      product: productId,
      user: req.profile._id
    }).populate('user', 'name');

    if (!review) {
      return res.status(404).json({
        error: "No review found"
      });
    }

    res.json(review);
  } catch (err) {
    return res.status(400).json({
      error: "Failed to get user review",
      details: err.message
    });
  }
};

// Get review statistics for a product
exports.getReviewStats = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const stats = await Review.calculateAverageRating(productId);
    
    res.json(stats);
  } catch (err) {
    return res.status(400).json({
      error: "Failed to get review statistics",
      details: err.message
    });
  }
};

// Admin: Get all reviews (with filters)
exports.getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, rating, verified } = req.query;
    
    let filter = {};
    if (rating) filter.rating = rating;
    if (verified !== undefined) filter.verified = verified === 'true';

    const reviews = await Review.find(filter)
      .populate('user', 'name email')
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalReviews = await Review.countDocuments(filter);

    res.json({
      reviews,
      currentPage: page,
      totalPages: Math.ceil(totalReviews / limit),
      totalReviews
    });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to get all reviews",
      details: err.message
    });
  }
};

// Admin: Delete any review
exports.adminDeleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        error: "Review not found"
      });
    }

    await review.remove();

    res.json({
      message: "Review deleted successfully"
    });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to delete review",
      details: err.message
    });
  }
};
