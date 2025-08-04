const Wishlist = require("../models/wishlist");
const Product = require("../models/product");

// Get user's wishlist
exports.getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.profile._id })
      .populate({
        path: 'products.product',
        match: { isDeleted: { $ne: true } }, // Exclude soft-deleted products
        select: 'name price description stock category photoUrl mrp discount discountPercentage sizeStock sizeAvailability totalStock rating reviews',
        populate: {
          path: 'category',
          select: 'name'
        }
      });

    if (!wishlist) {
      // Create empty wishlist if doesn't exist
      wishlist = await Wishlist.create({ user: req.profile._id, products: [] });
    }

    // Filter out null products (if any were soft-deleted)
    wishlist.products = wishlist.products.filter(item => item.product);

    // Add photo URLs for products
    const wishlistWithPhotos = {
      ...wishlist.toObject(),
      products: wishlist.products.map(item => ({
        ...item.toObject(),
        product: {
          ...item.product.toObject(),
          photoUrl: item.product.photoUrl || `/api/product/image/${item.product._id}`
        }
      }))
    };

    res.json(wishlistWithPhotos);
  } catch (err) {
    return res.status(400).json({
      error: "Failed to get wishlist",
      details: err.message
    });
  }
};

// Add product to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        error: "Product not found"
      });
    }

    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ user: req.profile._id });
    
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.profile._id, products: [] });
    }

    // Check if already in wishlist
    if (wishlist.hasProduct(productId)) {
      return res.status(400).json({
        error: "Product already in wishlist"
      });
    }

    // Add product
    await wishlist.addProduct(productId);

    res.json({
      message: "Product added to wishlist",
      wishlist
    });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to add to wishlist",
      details: err.message
    });
  }
};

// Remove product from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.profile._id });
    
    if (!wishlist) {
      return res.status(404).json({
        error: "Wishlist not found"
      });
    }

    // Remove product
    await wishlist.removeProduct(productId);

    res.json({
      message: "Product removed from wishlist",
      wishlist
    });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to remove from wishlist",
      details: err.message
    });
  }
};

// Check if product is in wishlist
exports.isInWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.profile._id });
    
    const isInWishlist = wishlist ? wishlist.hasProduct(productId) : false;

    res.json({ isInWishlist });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to check wishlist",
      details: err.message
    });
  }
};

// Get wishlist count
exports.getWishlistCount = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.profile._id });
    const count = wishlist ? wishlist.products.length : 0;

    res.json({ count });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to get wishlist count",
      details: err.message
    });
  }
};

// Clear wishlist
exports.clearWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.profile._id });
    
    if (wishlist) {
      wishlist.products = [];
      await wishlist.save();
    }

    res.json({
      message: "Wishlist cleared successfully"
    });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to clear wishlist",
      details: err.message
    });
  }
};

// Move item from wishlist to cart
exports.moveToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.profile._id });
    
    if (!wishlist || !wishlist.hasProduct(productId)) {
      return res.status(404).json({
        error: "Product not in wishlist"
      });
    }

    // Remove from wishlist
    await wishlist.removeProduct(productId);

    res.json({
      message: "Product moved to cart",
      productId
    });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to move to cart",
      details: err.message
    });
  }
};
