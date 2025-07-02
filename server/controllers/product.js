const Product = require("../models/product");
const formidable = require("formidable");
const _ = require("lodash");
const fs = require("fs");
const { sortBy } = require("lodash");
const emailService = require("../services/emailService");

//get the product by its id
exports.getProductById = (req, res, next, id) => {
  Product.findById(id)
    .populate("category")
    .exec((err, product) => {
      if (err) {
        return res.status(400).json({
          err: "Product not found",
        });
      }
      req.product = product;
      next();
    });
};

//create the new product and save it to the database
exports.createProduct = (req, res) => {
  let form = new formidable.IncomingForm();
  //This will display the extension of file
  form.keepExtensions = true;
  form.parse(req, (err, fields, file) => {
    if (err) {
      return res.status(400).json({
        err: "problem to upload the img",
      });
    }

    //destructure the fields
    const { name, description, price, category, stock, inventory, photoUrl } = fields;

    //Restrictions on the product fields
    if (!name || !description || !price || !category) {
      return res.status(400).json({
        error: "Include all the fields",
      });
    }

    let product = new Product(fields);

    // Handle inventory if provided as JSON string
    if (inventory && typeof inventory === 'string') {
      try {
        const inventoryData = JSON.parse(inventory);
        // Update inventory for each size
        ['S', 'M', 'L', 'XL', 'XXL'].forEach(size => {
          if (inventoryData[size] && inventoryData[size].stock) {
            product.inventory[size].stock = parseInt(inventoryData[size].stock) || 0;
          }
        });
      } catch (e) {
        console.error("Error parsing inventory:", e);
      }
    } else if (stock) {
      // If only total stock is provided, distribute evenly across sizes
      const totalStock = parseInt(stock) || 0;
      const stockPerSize = Math.floor(totalStock / 5); // 5 sizes
      const remainder = totalStock % 5;
      
      ['S', 'M', 'L', 'XL', 'XXL'].forEach((size, index) => {
        // Add remainder to first few sizes
        product.inventory[size].stock = stockPerSize + (index < remainder ? 1 : 0);
      });
    }

    // If photoUrl is provided, store it
    if (photoUrl) {
      product.photoUrl = photoUrl;
    }

    //handle file
    if (file.photo) {
      if (file.photo.size > 3000000) {
        return res.status(400).json({
          message: "file size is too large",
        });
      }
      product.photo.data = fs.readFileSync(file.photo.filepath);
      product.photo.contentType = file.photo.mimetype;
    }

    //save to DB
    product.save((err, product) => {
      if (err) {
        return res.status(400).json({
          err: "Failed to save the product in DB",
        });
      }

      res.json(product);
    });
  });
};

exports.getProduct = (req, res) => {
  //for making application faster
  req.product.photo = undefined;
  return res.json(req.product);
};

exports.photo = (req, res, next) => {
  if (req.product.photo.data) {
    res.set("content-Type", req.product.photo.contentType);
    return res.send(req.product.photo.data);
  }
  next();
};

//delete controller

exports.deleteProduct = (req, res) => {
  let product = req.product;
  product.remove((err, deletedProduct) => {
    if (err) {
      return res.status(400).json({
        err: "Failed to delete the product",
      });
    }
    res.json({
      msg: "Product is deleted successfully",
      deletedProduct,
    });
  });
};

//update controller
exports.updateProduct = (req, res) => {
  let form = new formidable.IncomingForm();
  //This will display the extension of file
  form.keepExtensions = true;
  form.parse(req, (err, fields, file) => {
    if (err) {
      return res.status(400).json({
        err: "problem to upload the img",
      });
    }

    //updation code
    let product = req.product;
    product = _.extend(product, fields);

    // Handle inventory update
    if (fields.inventory && typeof fields.inventory === 'string') {
      try {
        const inventoryData = JSON.parse(fields.inventory);
        // Update inventory for each size
        ['S', 'M', 'L', 'XL', 'XXL'].forEach(size => {
          if (inventoryData[size] && inventoryData[size].stock !== undefined) {
            product.inventory[size].stock = parseInt(inventoryData[size].stock) || 0;
          }
        });
      } catch (e) {
        console.error("Error parsing inventory:", e);
      }
    } else if (fields.stock) {
      // If only total stock is provided, distribute evenly across sizes
      const totalStock = parseInt(fields.stock) || 0;
      const stockPerSize = Math.floor(totalStock / 5); // 5 sizes
      const remainder = totalStock % 5;
      
      ['S', 'M', 'L', 'XL', 'XXL'].forEach((size, index) => {
        // Add remainder to first few sizes
        product.inventory[size].stock = stockPerSize + (index < remainder ? 1 : 0);
      });
    }

    // Update photoUrl if provided
    if (fields.photoUrl) {
      product.photoUrl = fields.photoUrl;
    }

    //handle file
    if (file.photo) {
      if (file.photo.size > 3000000) {
        return res.status(400).json({
          message: "file size is too large",
        });
      }
      product.photo.data = fs.readFileSync(file.photo.filepath);
      product.photo.contentType = file.photo.mimetype;
    }

    //save to DB
    product.save((err, product) => {
      if (err) {
        return res.status(400).json({
          err: "Updation in DB is failed",
        });
      }

      // Check for low stock and send alerts
      checkAndSendInventoryAlerts(product);

      res.json(product);
    });
  });
};

//listing controller
exports.getAllProducts = (req, res) => {
  let limit = req.query.limit ? parseInt(req.query.limit) : 8;
  let sortBy = req.query.sortBy ? req.query.sortBy : "_id";
  Product.find()
    .select("-photo")
    .populate("category")
    .sort([[sortBy, "asc"]])
    .limit(limit)
    .exec((err, products) => {
      if (err) {
        return res.status(400).json({
          err: "No product is found",
        });
      }
      res.json(products);
    });
};

//updating the inventory - now handles size-wise stock
exports.updateStock = async (req, res, next) => {
  try {
    const orderItems = req.body.order.products;
    
    // Process each item
    for (const item of orderItems) {
      // Skip custom designs - they don't have product IDs in database
      if (item.name && item.name.includes('Custom Design')) {
        console.log(`Skipping stock update for custom design: ${item.name}`);
        continue;
      }
      
      const productId = item.product || item._id;
      
      // Skip if no valid product ID
      if (!productId || productId === 'custom') {
        console.log('Skipping item without valid product ID');
        continue;
      }
      
      try {
        const product = await Product.findById(productId);
        
        if (product) {
          const size = item.size || 'M'; // Default to M if no size specified
          const quantity = item.count || item.quantity || 1;
          
          // Use the new inventory methods
          if (product.confirmSale(size, quantity)) {
            await product.save();
            
            // Check for low stock alerts
            checkAndSendInventoryAlerts(product);
          } else {
            console.error(`Failed to update stock for product ${product._id}, size ${size}`);
          }
        } else {
          console.log(`Product not found for ID: ${productId}`);
        }
      } catch (productError) {
        console.error(`Error processing product ${productId}:`, productError);
        // Continue with other products
      }
    }
    
    next();
  } catch (err) {
    console.error("Stock update error:", err);
    // Don't fail the entire order if stock update fails
    next();
  }
};

// New inventory management functions

// Check inventory availability before order
exports.checkInventory = async (req, res) => {
  try {
    const { productId, size, quantity } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    const availableStock = product.getAvailableStock(size);
    const isAvailable = availableStock >= quantity;
    
    res.json({
      available: isAvailable,
      availableStock,
      size,
      productName: product.name
    });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to check inventory",
      details: err.message
    });
  }
};

// Reserve stock during checkout
exports.reserveInventory = async (req, res) => {
  try {
    const { items } = req.body; // Array of { productId, size, quantity }
    const reservations = [];
    
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product && product.reserveStock(item.size, item.quantity)) {
        await product.save();
        reservations.push({
          productId: item.productId,
          size: item.size,
          quantity: item.quantity,
          reserved: true
        });
      } else {
        // Release any previous reservations if one fails
        for (const reserved of reservations) {
          const prod = await Product.findById(reserved.productId);
          prod.releaseStock(reserved.size, reserved.quantity);
          await prod.save();
        }
        
        return res.status(400).json({
          error: `Insufficient stock for ${product?.name || 'product'} size ${item.size}`
        });
      }
    }
    
    res.json({
      success: true,
      reservations
    });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to reserve inventory",
      details: err.message
    });
  }
};

// Get low stock products
exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).populate('category');
    const lowStockProducts = [];
    
    for (const product of products) {
      const lowStockSizes = [];
      
      for (const size of product.availableSizes) {
        if (product.isLowStock(size)) {
          lowStockSizes.push({
            size,
            available: product.getAvailableStock(size),
            threshold: product.lowStockThreshold
          });
        }
      }
      
      if (lowStockSizes.length > 0) {
        lowStockProducts.push({
          _id: product._id,
          name: product.name,
          category: product.category?.name || 'Uncategorized',
          totalStock: product.stock,
          lowStockSizes,
          photoUrl: product.photoUrl
        });
      }
    }
    
    res.json(lowStockProducts);
  } catch (err) {
    return res.status(400).json({
      error: "Failed to get low stock products",
      details: err.message
    });
  }
};

// Get inventory report
exports.getInventoryReport = async (req, res) => {
  try {
    const products = await Product.find().populate('category').select('-photo');
    
    const report = products.map(product => ({
      _id: product._id,
      name: product.name,
      category: product.category?.name || 'Uncategorized',
      price: product.price,
      totalStock: product.stock,
      totalSold: product.sold,
      inventory: product.inventory,
      isActive: product.isActive,
      value: product.stock * product.price // Inventory value
    }));
    
    const summary = {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.isActive).length,
      totalInventoryValue: report.reduce((sum, p) => sum + p.value, 0),
      totalStock: report.reduce((sum, p) => sum + p.totalStock, 0),
      totalSold: report.reduce((sum, p) => sum + p.totalSold, 0)
    };
    
    res.json({
      summary,
      products: report
    });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to generate inventory report",
      details: err.message
    });
  }
};

// Helper function to check and send inventory alerts
async function checkAndSendInventoryAlerts(product) {
  try {
    // Get admin users (assuming role = 1 is admin)
    const User = require("../models/user");
    const admins = await User.find({ role: 1 });
    
    // Check for out of stock
    if (product.stock === 0 && !product.alertsSent.outOfStock) {
      for (const admin of admins) {
        emailService.sendInventoryAlert(admin, product, 'out-of-stock').catch(console.error);
      }
      product.alertsSent.outOfStock = true;
      await product.save();
    }
    
    // Check for low stock
    else if (product.stock > 0 && product.stock <= product.lowStockThreshold && !product.alertsSent.lowStock) {
      for (const admin of admins) {
        emailService.sendInventoryAlert(admin, product, 'low-stock').catch(console.error);
      }
      product.alertsSent.lowStock = true;
      await product.save();
    }
    
    // Reset alerts if stock is replenished
    else if (product.stock > product.lowStockThreshold) {
      product.alertsSent.lowStock = false;
      product.alertsSent.outOfStock = false;
      await product.save();
    }
  } catch (err) {
    console.error("Error sending inventory alerts:", err);
  }
}

// Search products
exports.searchProducts = async (req, res) => {
  try {
    const { 
      query, 
      category, 
      minPrice, 
      maxPrice, 
      inStock,
      limit = 20,
      page = 1 
    } = req.query;

    // Build search criteria
    const searchCriteria = { isActive: true };

    // Text search on name and description
    if (query) {
      searchCriteria.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      searchCriteria.category = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      searchCriteria.price = {};
      if (minPrice) searchCriteria.price.$gte = parseFloat(minPrice);
      if (maxPrice) searchCriteria.price.$lte = parseFloat(maxPrice);
    }

    // In stock filter
    if (inStock === 'true') {
      searchCriteria.stock = { $gt: 0 };
    }

    // Execute search with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find(searchCriteria)
      .select('-photo')
      .populate('category')
      .sort({ sold: -1, createdAt: -1 }) // Sort by popularity and recency
      .limit(parseInt(limit))
      .skip(skip);

    // Get total count for pagination
    const totalCount = await Product.countDocuments(searchCriteria);

    // Get size availability for each product
    const productsWithAvailability = products.map(product => {
      const productObj = product.toObject();
      
      // Add size availability info
      productObj.sizeAvailability = {};
      for (const size of product.availableSizes) {
        productObj.sizeAvailability[size] = product.getAvailableStock(size) > 0;
      }
      
      // Add if any size is in stock
      productObj.hasStock = product.getAvailableStock() > 0;
      
      return productObj;
    });

    res.json({
      products: productsWithAvailability,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalProducts: totalCount,
        hasMore: skip + products.length < totalCount
      }
    });
  } catch (err) {
    console.error('Search error:', err);
    return res.status(400).json({
      error: "Search failed",
      details: err.message
    });
  }
};

// Get search suggestions (autocomplete)
exports.getSearchSuggestions = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({ suggestions: [] });
    }

    // Find products matching the query
    const products = await Product.find({
      isActive: true,
      name: { $regex: query, $options: 'i' }
    })
      .select('name category')
      .populate('category', 'name')
      .limit(10);

    // Extract unique suggestions
    const suggestions = [];
    const seen = new Set();

    products.forEach(product => {
      // Add product names
      if (!seen.has(product.name.toLowerCase())) {
        suggestions.push({
          type: 'product',
          value: product.name,
          category: product.category?.name
        });
        seen.add(product.name.toLowerCase());
      }

      // Add category names
      if (product.category && !seen.has(product.category.name.toLowerCase())) {
        suggestions.push({
          type: 'category',
          value: product.category.name
        });
        seen.add(product.category.name.toLowerCase());
      }
    });

    // Also search in categories directly
    const Category = require("../models/category");
    const categories = await Category.find({
      name: { $regex: query, $options: 'i' }
    }).limit(5);

    categories.forEach(cat => {
      if (!seen.has(cat.name.toLowerCase())) {
        suggestions.push({
          type: 'category',
          value: cat.name
        });
      }
    });

    res.json({ 
      suggestions: suggestions.slice(0, 10) // Limit to 10 suggestions
    });
  } catch (err) {
    console.error('Suggestion error:', err);
    return res.status(400).json({
      error: "Failed to get suggestions",
      details: err.message
    });
  }
};

// Get popular search terms
exports.getPopularSearches = async (req, res) => {
  try {
    // In a real app, you'd track search queries
    // For now, return most popular products and categories
    const popularProducts = await Product.find({ isActive: true })
      .select('name sold')
      .sort({ sold: -1 })
      .limit(5);

    const Category = require("../models/category");
    const popularCategories = await Category.find()
      .select('name')
      .limit(5);

    res.json({
      popularSearches: [
        ...popularProducts.map(p => ({ type: 'product', value: p.name, count: p.sold })),
        ...popularCategories.map(c => ({ type: 'category', value: c.name }))
      ]
    });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to get popular searches",
      details: err.message
    });
  }
};

//getAllUniqueCategories

exports.getAllUniqueCategories = (req, res) => {
  Product.distinct("category", {}, (err, category) => {
    if (err) {
      return res.status(400).json({
        err: "No category found",
      });
    }
    res.json(category);
  });
};

// Multiple images support

// Add image to product
exports.addProductImage = async (req, res) => {
  try {
    const { url, caption, isPrimary } = req.body;
    const product = req.product;

    // If this is set as primary, unset other primary images
    if (isPrimary) {
      product.images.forEach(img => {
        img.isPrimary = false;
      });
    }

    // Add new image
    const newImage = {
      url,
      caption,
      isPrimary: isPrimary || product.images.length === 0, // First image is primary by default
      order: product.images.length
    };

    product.images.push(newImage);
    await product.save();

    res.json({
      message: "Image added successfully",
      image: newImage,
      totalImages: product.images.length
    });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to add image",
      details: err.message
    });
  }
};

// Remove image from product
exports.removeProductImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const product = req.product;

    // Find and remove the image
    const imageIndex = product.images.findIndex(img => img._id.toString() === imageId);
    
    if (imageIndex === -1) {
      return res.status(404).json({
        error: "Image not found"
      });
    }

    const wasDeleted = product.images[imageIndex];
    product.images.splice(imageIndex, 1);

    // If deleted image was primary and there are other images, make the first one primary
    if (wasDeleted.isPrimary && product.images.length > 0) {
      product.images[0].isPrimary = true;
    }

    // Reorder remaining images
    product.images.forEach((img, index) => {
      img.order = index;
    });

    await product.save();

    res.json({
      message: "Image removed successfully",
      remainingImages: product.images.length
    });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to remove image",
      details: err.message
    });
  }
};

// Update image details
exports.updateProductImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const { caption, isPrimary, order } = req.body;
    const product = req.product;

    // Find the image
    const image = product.images.find(img => img._id.toString() === imageId);
    
    if (!image) {
      return res.status(404).json({
        error: "Image not found"
      });
    }

    // Update caption if provided
    if (caption !== undefined) {
      image.caption = caption;
    }

    // Update primary status
    if (isPrimary !== undefined) {
      if (isPrimary) {
        // Unset other primary images
        product.images.forEach(img => {
          img.isPrimary = false;
        });
      }
      image.isPrimary = isPrimary;
    }

    // Update order if provided
    if (order !== undefined && order !== image.order) {
      // Reorder images
      const oldOrder = image.order;
      
      product.images.forEach(img => {
        if (img._id.toString() !== imageId) {
          if (order < oldOrder && img.order >= order && img.order < oldOrder) {
            img.order++;
          } else if (order > oldOrder && img.order > oldOrder && img.order <= order) {
            img.order--;
          }
        }
      });
      
      image.order = order;
    }

    await product.save();

    res.json({
      message: "Image updated successfully",
      image
    });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to update image",
      details: err.message
    });
  }
};

// Get all images for a product
exports.getProductImages = (req, res) => {
  try {
    const product = req.product;
    
    // Sort images by order
    const sortedImages = product.images.sort((a, b) => a.order - b.order);
    
    res.json({
      productId: product._id,
      productName: product.name,
      images: sortedImages,
      primaryImage: sortedImages.find(img => img.isPrimary) || sortedImages[0]
    });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to get images",
      details: err.message
    });
  }
};
