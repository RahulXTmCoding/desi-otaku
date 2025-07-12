const Category = require("../models/category");

exports.getCategoryById = (req, res, next, id) => {
  Category.findById(id)
    .populate('parentCategory')
    .exec((err, cate) => {
      if (err) {
        return res.status(400).json({
          err: "Category is not found",
        });
      }

      req.category = cate;
      next();
    });
};

exports.createCategory = async (req, res) => {
  try {
    const category = new Category(req.body);
    
    // If parentCategory is provided, validate it exists
    if (req.body.parentCategory) {
      const parentExists = await Category.findById(req.body.parentCategory);
      if (!parentExists) {
        return res.status(400).json({
          err: "Parent category does not exist"
        });
      }
    }
    
    const savedCategory = await category.save();
    res.json(savedCategory);
  } catch (err) {
    return res.status(400).json({
      err: "Not able to save category in DB",
      details: err.message
    });
  }
};

exports.getCategory = (req, res) => {
  return res.json(req.category);
};

exports.getAllCategory = (req, res) => {
  // Find all categories, including those without isActive field
  Category.find({ $or: [{ isActive: true }, { isActive: { $exists: false } }] })
    .populate('parentCategory')
    .exec((err, categories) => {
      if (err) {
        return res.status(400).json({
          err: "No category found",
        });
      }

      res.json(categories);
    });
};

// Get only main categories (no parent)
exports.getMainCategories = async (req, res) => {
  try {
    const categories = await Category.getMainCategories();
    res.json(categories);
  } catch (err) {
    return res.status(400).json({
      err: "Failed to get main categories",
      details: err.message
    });
  }
};

// Get subcategories for a parent category
exports.getSubcategories = async (req, res) => {
  try {
    const { parentId } = req.params;
    
    const subcategories = await Category.find({ 
      parentCategory: parentId,
      isActive: true 
    }).sort({ name: 1 });
    
    res.json(subcategories);
  } catch (err) {
    return res.status(400).json({
      err: "Failed to get subcategories",
      details: err.message
    });
  }
};

// Get category with its subcategories
exports.getCategoryHierarchy = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const hierarchy = await Category.getCategoryHierarchy(categoryId);
    
    if (!hierarchy) {
      return res.status(404).json({
        err: "Category not found"
      });
    }
    
    res.json(hierarchy);
  } catch (err) {
    return res.status(400).json({
      err: "Failed to get category hierarchy",
      details: err.message
    });
  }
};

// Get all categories in hierarchical structure
exports.getCategoryTree = async (req, res) => {
  try {
    // Get all main categories
    const mainCategories = await Category.getMainCategories();
    
    // For each main category, get its subcategories
    const categoryTree = await Promise.all(
      mainCategories.map(async (category) => {
        const subcategories = await category.getSubcategories();
        return {
          ...category.toObject(),
          subcategories
        };
      })
    );
    
    res.json(categoryTree);
  } catch (err) {
    return res.status(400).json({
      err: "Failed to get category tree",
      details: err.message
    });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = req.category;
    
    // Update fields
    if (req.body.name !== undefined) category.name = req.body.name;
    if (req.body.icon !== undefined) category.icon = req.body.icon;
    if (req.body.isActive !== undefined) category.isActive = req.body.isActive;
    
    // Handle parent category update
    if (req.body.parentCategory !== undefined) {
      // Prevent category from being its own parent
      if (req.body.parentCategory === category._id.toString()) {
        return res.status(400).json({
          err: "Category cannot be its own parent"
        });
      }
      
      // Validate parent exists if provided
      if (req.body.parentCategory) {
        const parentExists = await Category.findById(req.body.parentCategory);
        if (!parentExists) {
          return res.status(400).json({
            err: "Parent category does not exist"
          });
        }
      }
      
      category.parentCategory = req.body.parentCategory;
    }
    
    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (err) {
    return res.status(400).json({
      err: "Failed to update category",
      details: err.message
    });
  }
};

exports.removeCategory = async (req, res) => {
  try {
    const category = req.category;
    
    // Check if category has subcategories
    const subcategories = await Category.find({ parentCategory: category._id });
    if (subcategories.length > 0) {
      return res.status(400).json({
        err: "Cannot delete category with subcategories. Please delete subcategories first."
      });
    }
    
    // Check if category has products
    const Product = require("../models/product");
    const productsCount = await Product.countDocuments({ 
      $or: [
        { category: category._id },
        { subcategory: category._id }
      ]
    });
    
    if (productsCount > 0) {
      return res.status(400).json({
        err: `Cannot delete category. ${productsCount} products are using this category.`
      });
    }
    
    await category.remove();
    
    res.json({
      message: "Category successfully deleted!",
    });
  } catch (err) {
    return res.status(400).json({
      err: "Failed to delete category",
      details: err.message
    });
  }
};
