const ProductType = require("../models/productType");

// Create a new product type
exports.create = async (req, res) => {
  try {
    const productType = new ProductType(req.body);
    const savedType = await productType.save();
    res.json(savedType);
  } catch (err) {
    console.error("Create product type error:", err);
    return res.status(400).json({
      error: err.code === 11000 
        ? "Product type with this name already exists" 
        : "Failed to create product type"
    });
  }
};

// Get all product types
exports.getAll = async (req, res) => {
  try {
    const { active } = req.query;
    let query = {};
    
    if (active === 'true') {
      query.isActive = true;
    }
    
    const productTypes = await ProductType.find(query).sort('order name');
    res.json(productTypes);
  } catch (err) {
    console.error("Get product types error:", err);
    return res.status(400).json({
      error: "Failed to fetch product types"
    });
  }
};

// Get product type by ID
exports.getById = async (req, res) => {
  try {
    const productType = await ProductType.findById(req.params.id);
    
    if (!productType) {
      return res.status(404).json({
        error: "Product type not found"
      });
    }
    
    res.json(productType);
  } catch (err) {
    console.error("Get product type error:", err);
    return res.status(400).json({
      error: "Failed to fetch product type"
    });
  }
};

// Update product type
exports.update = async (req, res) => {
  try {
    const productType = await ProductType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!productType) {
      return res.status(404).json({
        error: "Product type not found"
      });
    }
    
    res.json(productType);
  } catch (err) {
    console.error("Update product type error:", err);
    return res.status(400).json({
      error: err.code === 11000 
        ? "Product type with this name already exists" 
        : "Failed to update product type"
    });
  }
};

// Delete product type
exports.delete = async (req, res) => {
  try {
    // Check if any products are using this type
    const Product = require("../models/product");
    const productCount = await Product.countDocuments({ productType: req.params.id });
    
    if (productCount > 0) {
      return res.status(400).json({
        error: `Cannot delete product type. ${productCount} products are using this type.`
      });
    }
    
    const productType = await ProductType.findByIdAndDelete(req.params.id);
    
    if (!productType) {
      return res.status(404).json({
        error: "Product type not found"
      });
    }
    
    res.json({
      message: "Product type deleted successfully"
    });
  } catch (err) {
    console.error("Delete product type error:", err);
    return res.status(400).json({
      error: "Failed to delete product type"
    });
  }
};

// Update order of product types
exports.updateOrder = async (req, res) => {
  try {
    const { types } = req.body; // Array of { _id, order }
    
    const updatePromises = types.map(type => 
      ProductType.findByIdAndUpdate(type._id, { order: type.order })
    );
    
    await Promise.all(updatePromises);
    
    res.json({
      message: "Product type order updated successfully"
    });
  } catch (err) {
    console.error("Update order error:", err);
    return res.status(400).json({
      error: "Failed to update product type order"
    });
  }
};

// Seed default product types
exports.seedDefaultTypes = async (req, res) => {
  try {
    const defaultTypes = [
      {
        name: "T-Shirt",
        displayName: "Classic T-Shirt",
        description: "Regular fit cotton t-shirt",
        icon: "👕",
        order: 1,
        supportsCustomization: true,
        availableSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
      },
      {
        name: "Hoodie",
        displayName: "Hooded Sweatshirt",
        description: "Warm and comfortable hoodie",
        icon: "🧥",
        order: 2,
        supportsCustomization: true,
        priceMultiplier: 1.5,
        availableSizes: ['S', 'M', 'L', 'XL', 'XXL']
      },
      {
        name: "Tank Top",
        displayName: "Tank Top",
        description: "Sleeveless tank top for summer",
        icon: "🎽",
        order: 3,
        supportsCustomization: true,
        priceMultiplier: 0.8,
        availableSizes: ['S', 'M', 'L', 'XL']
      },
      {
        name: "Long Sleeve",
        displayName: "Long Sleeve Shirt",
        description: "Full sleeve cotton shirt",
        icon: "👔",
        order: 4,
        supportsCustomization: true,
        priceMultiplier: 1.2
      },
      {
        name: "Oversized Tee",
        displayName: "Oversized T-Shirt",
        description: "Relaxed fit oversized t-shirt",
        icon: "👚",
        order: 5,
        supportsCustomization: true,
        priceMultiplier: 1.1,
        availableSizes: ['M', 'L', 'XL', 'XXL', '3XL']
      },
      {
        name: "Crop Top",
        displayName: "Crop Top",
        description: "Trendy cropped t-shirt",
        icon: "👗",
        order: 6,
        supportsCustomization: true,
        priceMultiplier: 0.9,
        availableSizes: ['XS', 'S', 'M', 'L', 'XL']
      },
      {
        name: "Polo Shirt",
        displayName: "Polo Shirt",
        description: "Classic polo with collar",
        icon: "🏌️",
        order: 7,
        supportsCustomization: false,
        priceMultiplier: 1.3
      },
      {
        name: "V-Neck",
        displayName: "V-Neck T-Shirt",
        description: "V-neck style t-shirt",
        icon: "👕",
        order: 8,
        supportsCustomization: true
      }
    ];
    
    // Create types that don't exist
    for (const typeData of defaultTypes) {
      const exists = await ProductType.findOne({ name: typeData.name });
      if (!exists) {
        await ProductType.create(typeData);
      }
    }
    
    const allTypes = await ProductType.find().sort('order name');
    res.json({
      message: "Default product types seeded successfully",
      types: allTypes
    });
  } catch (err) {
    console.error("Seed product types error:", err);
    return res.status(400).json({
      error: "Failed to seed default product types"
    });
  }
};
