const Product = require("../models/product");

// Get product variants
exports.getProductVariants = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    
    if (!product) {
      return res.status(404).json({
        error: "Product not found"
      });
    }

    // Return variants or empty array
    res.json({
      variants: product.variants || []
    });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to fetch variants"
    });
  }
};

// Save/Update product variants
exports.saveProductVariants = async (req, res) => {
  try {
    const { variants } = req.body;
    
    if (!variants || !Array.isArray(variants)) {
      return res.status(400).json({
        error: "Invalid variants data"
      });
    }

    const product = await Product.findById(req.params.productId);
    
    if (!product) {
      return res.status(404).json({
        error: "Product not found"
      });
    }

    // Update product with variants
    product.variants = variants;
    await product.save();

    res.json({
      message: "Variants saved successfully",
      variants: product.variants
    });
  } catch (err) {
    console.error("Save variants error:", err);
    return res.status(400).json({
      error: "Failed to save variants"
    });
  }
};
