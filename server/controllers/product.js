const Product = require("../models/product");
const formidable = require("formidable");
const _ = require("lodash");
const fs = require("fs");
const { sortBy } = require("lodash");
const emailService = require("../services/emailService");
const redisService = require("../services/redisService");

//get the product by its id
exports.getProductById = (req, res, next, id) => {
  Product.findById(id)
    .populate("category")
    .populate("subcategory")
    .populate("productType")
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
  form.multiples = true; // Enable multiple file uploads
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        err: "problem to upload the img",
      });
    }

    //destructure the fields
    const { name, description, price, category, sizeStock, imageUrls } = fields;

    //Restrictions on the product fields
    if (!name || !description || !price || !category) {
      return res.status(400).json({
        error: "Include all the fields",
      });
    }

    let product = new Product(fields);

    // Handle sizeStock if provided as JSON string
    if (sizeStock && typeof sizeStock === 'string') {
      try {
        const stockData = JSON.parse(sizeStock);
        // Update stock for each size
        ['S', 'M', 'L', 'XL', 'XXL'].forEach(size => {
          if (stockData[size] !== undefined) {
            product.sizeStock[size] = parseInt(stockData[size]) || 0;
          }
        });
      } catch (e) {
        console.error("Error parsing sizeStock:", e);
      }
    }

    // Handle multiple image URLs
    if (imageUrls) {
      try {
        const urlData = typeof imageUrls === 'string' ? JSON.parse(imageUrls) : imageUrls;
        if (Array.isArray(urlData)) {
          urlData.forEach((item) => {
            // Handle both simple string URLs and object format
            if (typeof item === 'string') {
              product.images.push({
                url: item.trim(),
                isPrimary: product.images.length === 0,
                order: product.images.length
              });
            } else if (item && item.url) {
              product.images.push({
                url: item.url.trim(),
                isPrimary: item.isPrimary || product.images.length === 0,
                order: item.order !== undefined ? item.order : product.images.length,
                caption: item.caption || ''
              });
            }
          });
        }
      } catch (e) {
        console.error("Error parsing imageUrls:", e);
      }
    }

    // Handle multiple file uploads
    // Check for both 'images' and 'images[]' field names
    const imageField = files['images[]'] || files.images;
    if (imageField) {
      console.log("Files received:", imageField);
      const imageFiles = Array.isArray(imageField) ? imageField : [imageField];
      console.log("Processing", imageFiles.length, "image files");
      
      imageFiles.forEach((file, index) => {
        if (file && file.size && file.size <= 3000000) {
          console.log(`  Processing file ${index}: ${file.originalFilename || 'unnamed'}`);
          product.images.push({
            data: fs.readFileSync(file.filepath),
            contentType: file.mimetype,
            isPrimary: false, // Will be set later based on primaryImageIndex
            order: product.images.length
          });
        } else if (file && file.size > 3000000) {
          console.log(`  File ${index} too large: ${file.size} bytes`);
        }
      });
    }

    // Now handle primary image index across all images
    if (fields.primaryImageIndex !== undefined) {
      const primaryIndex = parseInt(fields.primaryImageIndex);
      console.log("Setting primary image index:", primaryIndex);
      // Reset all images to not primary
      product.images.forEach((img, idx) => {
        img.isPrimary = idx === primaryIndex;
      });
    } else {
      // Ensure at least one image is marked as primary
      if (product.images.length > 0 && !product.images.some(img => img.isPrimary)) {
        product.images[0].isPrimary = true;
      }
    }
    
    console.log("\n=== Create Product Debug ===");
    console.log("Total images to save:", product.images.length);
    product.images.forEach((img, idx) => {
      console.log(`  [${idx}] ${img.url || 'File upload'} - Primary: ${img.isPrimary}`);
    });

    //save to DB
    product.save(async (err, product) => {
      if (err) {
        return res.status(400).json({
          err: "Failed to save the product in DB",
          details: err.message
        });
      }

      // Clear any potential cache entries for this product (though unlikely to exist)
      try {
        await redisService.connect();
        const cacheKey = `product:${product._id}`;
        await redisService.del(cacheKey);
        console.log(`🔄 REDIS CACHE CLEARED for new product: ${product._id}`);
      } catch (redisError) {
        console.error('Redis cache clear failed for new product:', redisError);
        // Continue without failing the creation
      }

      res.json(product);
    });
  });
};

exports.getProduct = async (req, res) => {
  try {
    const productId = req.product._id.toString();
    const cacheKey = `product:${productId}`;
    
    // Initialize Redis connection if not already connected
    await redisService.connect();
    
    // Try to get from Redis cache first
    const cachedProduct = await redisService.get(cacheKey);
    
    if (cachedProduct) {
      console.log(`🔥 REDIS CACHE HIT for product: ${productId}`);
      return res.json({
        ...cachedProduct,
        _cached: true,
        _cacheAge: Date.now() - cachedProduct._cachedAt
      });
    }
    
    console.log(`💾 REDIS CACHE MISS for product: ${productId} - fetching from DB`);
    
    // Cache miss - prepare product data
    const product = req.product.toObject();
    
    // ✅ FIX: Create clean version for API response WITHOUT modifying original data
    const responseProduct = {
      ...product,
      images: product.images ? product.images.map(img => ({
        _id: img._id,
        url: img.url,
        isPrimary: img.isPrimary,
        order: img.order,
        caption: img.caption,
        // ✅ CRITICAL: Keep binary data for image serving endpoint
        hasData: !!(img.data && img.contentType),
        // Don't include actual binary data in JSON response (too large)
        data: undefined,
        contentType: img.contentType // Keep contentType for reference
      })) : []
    };
    
    // Cache the clean version
    const cacheableProduct = {
      ...responseProduct,
      _cachedAt: Date.now(),
      _cacheKey: cacheKey
    };
    
    // Store in Redis cache with 2-minute TTL (120 seconds)
    const cacheSuccess = await redisService.set(cacheKey, cacheableProduct, 120);
    
    if (cacheSuccess) {
      console.log(`✅ REDIS CACHED product: ${productId} for 2 minutes`);
    } else {
      console.log(`⚠️ REDIS CACHE FAILED for product: ${productId}`);
    }
    
    return res.json({
      ...cacheableProduct,
      _cached: false
    });
    
  } catch (error) {
    console.error('Error in getProduct with Redis caching:', error);
    
    // Fallback to original behavior if Redis fails
    const product = req.product.toObject();
    
    // ✅ FIX: Don't remove binary data in fallback either
    const responseProduct = {
      ...product,
      images: product.images ? product.images.map(img => ({
        _id: img._id,
        url: img.url,
        isPrimary: img.isPrimary,
        order: img.order,
        caption: img.caption,
        hasData: !!(img.data && img.contentType),
        data: undefined,
        contentType: img.contentType
      })) : []
    };
    
    return res.json(responseProduct);
  }
};

// Get product image by index or primary image
exports.getProductImage = (req, res, next) => {
  const { imageIndex } = req.params;
  const product = req.product;
  
  // Check if product exists
  if (!product) {
    console.log('❌ IMAGE ENDPOINT: Product not found');
    return res.status(404).json({ error: "Product not found" });
  }
  
  // Check if product has images
  if (!product.images || product.images.length === 0) {
    console.log('❌ IMAGE ENDPOINT: No images available for this product');
    return res.status(404).json({ error: "No images available for this product" });
  }
  
  let image;
  
  if (imageIndex !== undefined) {
    // Get specific image by index
    image = product.images[parseInt(imageIndex)];
  } else {
    // Get primary image
    image = product.images.find(img => img.isPrimary) || product.images[0];
  }
  
  if (!image) {
    console.log('❌ IMAGE ENDPOINT: No image found at specified index/primary');
    return res.status(404).json({ error: "No image available for this product" });
  }
  
  // If image has binary data, send it
  if (image.data && image.contentType) {
    res.set("Content-Type", image.contentType);
    return res.send(image.data);
  }
  
  // If image has URL, redirect to it
  if (image.url) {
    console.log('✅ IMAGE ENDPOINT: Redirecting to URL:', image.url);
    return res.redirect(image.url);
  }
  
  // No image data available
  console.log('❌ IMAGE ENDPOINT: No image data or URL available');
  res.status(404).json({ error: "Image data not available" });
};

//delete controller - soft delete

exports.deleteProduct = async (req, res) => {
  try {
    let product = req.product;
    
    // Soft delete - mark as deleted but keep in database
    product.isDeleted = true;
    product.deletedAt = new Date();
    product.deletedBy = req.auth._id; // Assuming auth middleware sets req.auth
    product.isActive = false; // Also mark as inactive
    
    await product.save();
    
    res.json({
      msg: "Product is soft deleted successfully",
      deletedProduct: product,
    });
  } catch (err) {
    return res.status(400).json({
      err: "Failed to delete the product",
      details: err.message
    });
  }
};

// Permanently delete controller (admin only)
exports.permanentlyDeleteProduct = async (req, res) => {
  try {
    let product = req.product;
    
    // Only allow permanent deletion if product is already soft deleted
    if (!product.isDeleted) {
      return res.status(400).json({
        err: "Product must be soft deleted first before permanent deletion"
      });
    }
    
    // Remove the product permanently
    await product.remove();
    
    res.json({
      msg: "Product is permanently deleted",
      deletedProduct: product,
    });
  } catch (err) {
    return res.status(400).json({
      err: "Failed to permanently delete the product",
      details: err.message
    });
  }
};

// Restore soft deleted product
exports.restoreProduct = async (req, res) => {
  try {
    let product = req.product;
    
    // Check if product is soft deleted
    if (!product.isDeleted) {
      return res.status(400).json({
        err: "Product is not deleted"
      });
    }
    
    // Restore the product
    product.isDeleted = false;
    product.deletedAt = null;
    product.deletedBy = null;
    product.isActive = true;
    
    await product.save();
    
    res.json({
      msg: "Product restored successfully",
      restoredProduct: product,
    });
  } catch (err) {
    return res.status(400).json({
      err: "Failed to restore the product",
      details: err.message
    });
  }
};

//update controller
exports.updateProduct = (req, res) => {
  let form = new formidable.IncomingForm();
  //This will display the extension of file
  form.keepExtensions = true;
  form.multiples = true; // Enable multiple file uploads
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        err: "problem to upload the img",
      });
    }

    //updation code
    let product = req.product;
    product = _.extend(product, fields);

    // Handle sizeStock update
    if (fields.sizeStock && typeof fields.sizeStock === 'string') {
      try {
        const stockData = JSON.parse(fields.sizeStock);
        // Update stock for each size
        ['S', 'M', 'L', 'XL', 'XXL'].forEach(size => {
          if (stockData[size] !== undefined) {
            product.sizeStock[size] = parseInt(stockData[size]) || 0;
          }
        });
      } catch (e) {
        console.error("Error parsing sizeStock:", e);
      }
    }

    // Update photoUrl if provided
    if (fields.photoUrl) {
      product.photoUrl = fields.photoUrl;
      // Update or add as primary image
      const primaryIndex = product.images.findIndex(img => img.isPrimary);
      if (primaryIndex >= 0) {
        product.images[primaryIndex].url = fields.photoUrl;
      } else {
        product.images.push({
          url: fields.photoUrl,
          isPrimary: true,
          order: 0
        });
      }
    }

    // Handle file upload
    if (files.photo) {
      if (files.photo.size > 3000000) {
        return res.status(400).json({
          message: "file size is too large",
        });
      }
      product.photo.data = fs.readFileSync(files.photo.filepath);
      product.photo.contentType = files.photo.mimetype;
    }

    // Keep track of original images before modification
    const originalImages = [...product.images];
    let newImagesArray = [];

    console.log("\n=== Product Update Debug ===");
    console.log("Product ID:", product._id);
    console.log("Original images count:", originalImages.length);
    originalImages.forEach((img, idx) => {
      console.log(`  [${idx}] ${img.url || 'File upload'} - Primary: ${img.isPrimary}`);
    });
    console.log("\nReceived fields:");
    console.log("  keepExistingImages:", fields.keepExistingImages);
    console.log("  imageUrls:", fields.imageUrls);
    console.log("  primaryImageIndex:", fields.primaryImageIndex);
    console.log("  Has new file uploads:", files.images ? 'Yes' : 'No');

    // Handle keeping existing images
    if (fields.keepExistingImages) {
      try {
        const keepIndices = JSON.parse(fields.keepExistingImages);
        console.log("Indices to keep:", keepIndices);
        // Add the existing images we want to keep
        keepIndices.forEach(index => {
          if (originalImages[index]) {
            newImagesArray.push(originalImages[index]);
          }
        });
        console.log("Images kept:", newImagesArray.length);
      } catch (e) {
        console.error("Error parsing keepExistingImages:", e);
        // If error, keep all existing images
        newImagesArray = [...originalImages];
      }
    } else {
      // If not specified, keep all existing images
      newImagesArray = [...originalImages];
    }

    // Handle multiple image URLs update
    if (fields.imageUrls) {
      try {
        const urlData = typeof fields.imageUrls === 'string' ? JSON.parse(fields.imageUrls) : fields.imageUrls;
        if (Array.isArray(urlData)) {
          urlData.forEach((item) => {
            // Handle both simple string URLs and object format
            if (typeof item === 'string') {
              newImagesArray.push({
                url: item.trim(),
                isPrimary: false,
                order: newImagesArray.length
              });
            } else if (item && item.url) {
              newImagesArray.push({
                url: item.url.trim(),
                isPrimary: false,
                order: item.order !== undefined ? item.order : newImagesArray.length,
                caption: item.caption || ''
              });
            }
          });
        }
      } catch (e) {
        console.error("Error parsing imageUrls:", e);
      }
    }

    // Handle multiple file uploads
    // Check for both 'images' and 'images[]' field names
    const imageField = files['images[]'] || files.images;
    if (imageField) {
      const imageFiles = Array.isArray(imageField) ? imageField : [imageField];
      imageFiles.forEach((file, index) => {
        if (file.size <= 3000000) {
          newImagesArray.push({
            data: fs.readFileSync(file.filepath),
            contentType: file.mimetype,
            isPrimary: false,
            order: newImagesArray.length
          });
        }
      });
    }

    // Update the product images array
    product.images = newImagesArray;

    console.log("\nFinal state before save:");
    console.log("Total images:", product.images.length);
    product.images.forEach((img, idx) => {
      console.log(`  [${idx}] ${img.url || 'File upload'} - Primary: ${img.isPrimary}`);
    });
    console.log("=== End Debug ===\n");

    // Handle setting primary image
    if (fields.primaryImageIndex !== undefined) {
      const primaryIndex = parseInt(fields.primaryImageIndex);
      product.images.forEach((img, index) => {
        img.isPrimary = index === primaryIndex;
      });
    }

    // Ensure at least one image is marked as primary
    if (product.images.length > 0 && !product.images.some(img => img.isPrimary)) {
      product.images[0].isPrimary = true;
    }

    //save to DB
    product.save(async (err, product) => {
      if (err) {
        return res.status(400).json({
          err: "Updation in DB is failed",
          details: err.message
        });
      }

      // Invalidate Redis cache for this product
      try {
        await redisService.connect();
        const cacheKey = `product:${product._id}`;
        await redisService.del(cacheKey);
        console.log(`🔄 REDIS CACHE INVALIDATED for updated product: ${product._id}`);
      } catch (redisError) {
        console.error('Redis cache invalidation failed:', redisError);
        // Continue without failing the update
      }

      // Check for low stock and send alerts
      checkAndSendInventoryAlerts(product);

      res.json(product);
    });
  });
};

//listing controller
exports.getAllProducts = async (req, res) => {
  try {
    let limit = req.query.limit ? parseInt(req.query.limit) : 8;
    let sortBy = req.query.sortBy ? req.query.sortBy : "_id";
    let includeDeleted = req.query.includeDeleted === 'true'; // Admin option to include deleted
    
    // Create cache key based on query parameters
    const cacheKey = `products:list:${limit}:${sortBy}:${includeDeleted}`;
    
    // Initialize Redis connection
    await redisService.connect();
    
    // Try to get from Redis cache first
    const cachedProducts = await redisService.get(cacheKey);
    
    if (cachedProducts) {
      console.log(`🔥 REDIS CACHE HIT for products list: ${limit} items, sortBy: ${sortBy}`);
      return res.json({
        ...cachedProducts,
        _cached: true,
        _cacheAge: Date.now() - cachedProducts._cachedAt
      });
    }
    
    console.log(`💾 REDIS CACHE MISS for products list - fetching from DB`);
    
    // Build filter - exclude soft deleted products by default
    const filter = includeDeleted ? {} : { isDeleted: { $ne: true } };
    
    // Fetch from database
    const products = await Product.find(filter)
      .select("-photo -images.data") // Exclude heavy binary data
      .populate("category")
      .populate("productType")
      .sort([[sortBy, "asc"]])
      .limit(limit)
      .lean(); // Use lean for better performance
    
    // Clean up image data for caching
    const cleanedProducts = products.map(product => {
      if (product.images && product.images.length > 0) {
        product.images = product.images.map(img => ({
          _id: img._id,
          url: img.url,
          isPrimary: img.isPrimary,
          order: img.order,
          caption: img.caption
          // Exclude binary data
        }));
      }
      return product;
    });
    
    // Prepare cacheable response
    const cacheableResponse = {
      products: cleanedProducts,
      count: cleanedProducts.length,
      _cachedAt: Date.now(),
      _cacheKey: cacheKey
    };
    
    // Store in Redis cache with 8-minute TTL (480 seconds) for home page products
    const cacheSuccess = await redisService.set(cacheKey, cacheableResponse, 480);
    
    if (cacheSuccess) {
      console.log(`✅ REDIS CACHED products list: ${cleanedProducts.length} items for 8 minutes`);
    } else {
      console.log(`⚠️ REDIS CACHE FAILED for products list`);
    }
    
    // Return the products directly (not wrapped in cacheableResponse)
    res.json(cleanedProducts);
    
  } catch (err) {
    console.error('Error in getAllProducts with Redis caching:', err);
    
    // Fallback to original behavior
    let limit = req.query.limit ? parseInt(req.query.limit) : 8;
    let sortBy = req.query.sortBy ? req.query.sortBy : "_id";
    let includeDeleted = req.query.includeDeleted === 'true';
    
    const filter = includeDeleted ? {} : { isDeleted: { $ne: true } };
    
    Product.find(filter)
      .select("-photo")
      .populate("category")
      .populate("productType")
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
  }
};

// Get soft deleted products (admin only)
exports.getDeletedProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [products, totalCount] = await Promise.all([
      Product.find({ isDeleted: true })
        .select("-photo")
        .populate("category")
        .populate("productType")
        .populate("deletedBy", "name email")
        .sort({ deletedAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      Product.countDocuments({ isDeleted: true })
    ]);
    
    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalProducts: totalCount,
        hasMore: skip + products.length < totalCount
      }
    });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to get deleted products",
      details: err.message
    });
  }
};

// Optimized filtered products endpoint with advanced search
exports.getFilteredProducts = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const {
      search,
      category,
      subcategory,
      productType,
      minPrice,
      maxPrice,
      tags,
      sizes,
      availability,
      sortBy,
      sortOrder,
      page = 1,
      limit = 12,
      excludeFeatured
    } = req.query;

    // Create cache key for Redis caching
    const cacheKey = `search:${JSON.stringify({
      search, category, subcategory, productType, minPrice, maxPrice, 
      tags, sizes, availability, sortBy, sortOrder, page, limit
    })}`;

    // Try Redis cache first
    try {
      await redisService.connect();
      const cachedResult = await redisService.get(cacheKey);
      
      if (cachedResult) {
        console.log(`🔥 SEARCH CACHE HIT: ${search || 'filters'} (${Date.now() - startTime}ms)`);
        return res.json({
          ...cachedResult,
          _cached: true,
          _cacheAge: Date.now() - cachedResult._cachedAt
        });
      }
    } catch (redisError) {
      console.log('Redis cache miss or error:', redisError.message);
    }

    console.log(`💾 SEARCH CACHE MISS: ${search || 'filters'} - executing optimized query`);

    // Use aggregation pipeline for optimal performance
    const pipeline = [];
    
    // Stage 1: Build base filter conditions (these are ANDed together)
    const baseConditions = { 
      isDeleted: { $ne: true },
      isActive: { $ne: false }
    };

    // Exclude featured products if requested (prevents duplication with featured section)
    if (excludeFeatured === 'true') {
      baseConditions.isFeatured = { $ne: true };
      console.log('🆕 NEWLY LAUNCHED: Excluding featured products to prevent duplication');
    }

    // === STEP 1: Apply Category Filters (Base Constraint) ===
    const mongoose = require("mongoose");
    const Category = require("../models/category");
    
    // Handle combined category + subcategory filtering
    if (subcategory && subcategory !== 'all') {
      let subcategoryId = null;
      let parentCategoryId = null;
      
      // Find subcategory by ID or name
      if (mongoose.Types.ObjectId.isValid(subcategory)) {
        subcategoryId = mongoose.Types.ObjectId(subcategory);
      } else {
        try {
          const subCat = await Category.findOne({ 
            name: { $regex: new RegExp(subcategory, 'i') },
            isActive: true 
          });
          if (subCat) {
            subcategoryId = subCat._id;
            parentCategoryId = subCat.parentCategory;
          } else {
            return res.json({
              products: [],
              pagination: { currentPage: parseInt(page), totalPages: 0, totalProducts: 0, hasMore: false }
            });
          }
        } catch (err) {
          console.error('Subcategory lookup error:', err);
          return res.json({
            products: [],
            pagination: { currentPage: parseInt(page), totalPages: 0, totalProducts: 0, hasMore: false }
          });
        }
      }
      
      // If both category and subcategory are specified, verify they match
      if (category && category !== 'all') {
        let categoryId = null;
        
        if (mongoose.Types.ObjectId.isValid(category)) {
          categoryId = mongoose.Types.ObjectId(category);
        } else {
          try {
            const categoryDoc = await Category.findOne({ 
              name: { $regex: new RegExp(category, 'i') },
              isActive: true 
            });
            if (categoryDoc) {
              categoryId = categoryDoc._id;
            }
          } catch (err) {
            console.error('Category lookup error:', err);
          }
        }
        
        // Verify subcategory belongs to the specified category
        if (categoryId && parentCategoryId && !parentCategoryId.equals(categoryId)) {
          console.log('Subcategory does not belong to specified category');
          return res.json({
            products: [],
            pagination: { currentPage: parseInt(page), totalPages: 0, totalProducts: 0, hasMore: false }
          });
        }
        
        // Filter by subcategory (which implicitly includes the category constraint)
        baseConditions.subcategory = subcategoryId;
      } else {
        // Only subcategory specified, filter by subcategory
        baseConditions.subcategory = subcategoryId;
      }
      
    } else if (category && category !== 'all') {
      // Only category specified, include main category and all its subcategories
      let categoryId = null;
      
      // Handle category by ID or name
      if (mongoose.Types.ObjectId.isValid(category)) {
        categoryId = mongoose.Types.ObjectId(category);
      } else {
        // Find category by name (supports "anime" finding "Anime")
        try {
          const categoryDoc = await Category.findOne({ 
            name: { $regex: new RegExp(category, 'i') },
            isActive: true 
          });
          
          if (categoryDoc) {
            categoryId = categoryDoc._id;
          } else {
            return res.json({
              products: [],
              pagination: { currentPage: parseInt(page), totalPages: 0, totalProducts: 0, hasMore: false }
            });
          }
        } catch (err) {
          console.error('Category lookup error:', err);
          return res.json({
            products: [],
            pagination: { currentPage: parseInt(page), totalPages: 0, totalProducts: 0, hasMore: false }
          });
        }
      }
      
      // Get subcategories for this category
      try {
        const subcategories = await Category.find({ 
          parentCategory: categoryId,
          isActive: true 
        }).select('_id');
        
        const subcategoryIds = subcategories.map(sub => sub._id);
        
        if (subcategoryIds.length > 0) {
          // Products in main category OR any of its subcategories
          baseConditions.$or = [
            { category: categoryId },
            { subcategory: { $in: subcategoryIds } }
          ];
        } else {
          // Just the main category
          baseConditions.category = categoryId;
        }
      } catch (err) {
        console.error('Subcategory fetch error:', err);
        baseConditions.category = categoryId;
      }
    }

    // === STEP 2: Apply Product Type Filter ===
    if (productType && productType !== 'all') {
      const mongoose = require("mongoose");
      if (mongoose.Types.ObjectId.isValid(productType)) {
        baseConditions.productType = mongoose.Types.ObjectId(productType);
      } else {
        baseConditions.productType = productType;
      }
    }

    // === STEP 3: Apply Price Range Filter ===
    if (minPrice || maxPrice) {
      baseConditions.price = {};
      if (minPrice) baseConditions.price.$gte = parseFloat(minPrice);
      if (maxPrice) baseConditions.price.$lte = parseFloat(maxPrice);
    }

    // === STEP 4: Apply Tags Filter ===
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      baseConditions.tags = { $in: tagArray };
    }

    // === STEP 5: Apply Stock Availability Filter ===
    if (availability === 'instock') {
      baseConditions.totalStock = { $gt: 0 };
    } else if (availability === 'outofstock') {
      baseConditions.totalStock = { $eq: 0 };
    }

    // === STEP 6: Apply Size Filter ===
    if (sizes) {
      const sizeArray = Array.isArray(sizes) ? sizes : sizes.split(',');
      const sizeConditions = sizeArray.map(size => ({
        [`sizeStock.${size}`]: { $gt: 0 }
      }));
      
      // Size filter must be satisfied (OR between different sizes)
      if (baseConditions.$or && !baseConditions.category) {
        // If we already have $or from category, we need to combine properly
        const existingOr = baseConditions.$or;
        delete baseConditions.$or;
        baseConditions.$and = [
          { $or: existingOr },
          { $or: sizeConditions }
        ];
      } else if (baseConditions.$or) {
        // We have category $or, need to add size constraint
        if (!baseConditions.$and) baseConditions.$and = [];
        baseConditions.$and.push({ $or: sizeConditions });
      } else {
        // No existing $or, can add size $or directly
        baseConditions.$or = sizeConditions;
      }
    }

    // === STEP 7: Apply Search WITHIN the Above Constraints ===
    let finalMatchConditions = baseConditions;
    
    if (search) {
      const searchTerm = search.trim();
      const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);
      
      // Check if search matches any category names (for intelligent category search)
      const Category = require("../models/category");
      let matchingCategories = [];
      try {
        matchingCategories = await Category.find({
          name: { $regex: new RegExp(searchTerm, 'i') },
          isActive: true 
        }).select('_id');
      } catch (err) {
        console.error('Category search lookup error:', err);
      }
      
      let searchConditions;
      
      if (searchWords.length === 1) {
        // Single word search with intelligent category matching
        const singleWord = searchWords[0];
        
        // Use regex search for better compatibility with complex queries
        const productSearchConditions = [
          { name: { $regex: singleWord, $options: 'i' } },
          { description: { $regex: singleWord, $options: 'i' } },
          { tags: { $regex: singleWord, $options: 'i' } }
        ];
        
        // If search term matches category names, include products from those categories
        if (matchingCategories.length > 0) {
          const categoryIds = matchingCategories.map(cat => cat._id);
          productSearchConditions.push({ category: { $in: categoryIds } });
        }
        
        searchConditions = { $or: productSearchConditions };
      } else {
        // Multi-word search - each word must be found somewhere
        const wordConditions = searchWords.map(word => ({
          $or: [
            { name: { $regex: word, $options: 'i' } },
            { description: { $regex: word, $options: 'i' } },
            { tags: { $regex: word, $options: 'i' } }
          ]
        }));
        
        searchConditions = { $and: wordConditions };
      }
      
      // Smart combination logic
      if (Object.keys(baseConditions).length > 2) { // More than just isDeleted and isActive
        // If we already have a category filter AND search matches that same category,
        // don't double-filter - just show all products in that category
        const hasExistingCategoryFilter = baseConditions.category || baseConditions.$or;
        const searchMatchesExistingCategory = matchingCategories.some(cat => {
          return baseConditions.category && cat._id.equals(baseConditions.category);
        });
        
        if (hasExistingCategoryFilter && searchMatchesExistingCategory) {
          // User selected "Anime" category and searched "anime" - show all Anime products
          finalMatchConditions = baseConditions;
          console.log('🎯 Smart match: Search term matches selected category, showing all category products');
        } else {
          // Normal case: apply search within existing filters
          finalMatchConditions = {
            $and: [
              baseConditions,
              searchConditions
            ]
          };
        }
      } else {
        // No other filters, just use search conditions
        finalMatchConditions = {
          ...baseConditions,
          ...searchConditions
        };
      }
    }

    console.log('🔍 Final MongoDB Query:', JSON.stringify(finalMatchConditions, null, 2));

    pipeline.push({ $match: finalMatchConditions });

    // Stage 2: Lookup category and productType
    pipeline.push(
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category"
        }
      },
      {
        $lookup: {
          from: "producttypes",
          localField: "productType", 
          foreignField: "_id",
          as: "productType"
        }
      }
    );

    // Stage 3: Add category name search ONLY if no category filter was applied
    if (search && !category && !subcategory) {
      const searchTerm = search.trim();
      pipeline.push({
        $match: {
          $or: [
            // Already matched in stage 1
            { _id: { $exists: true } },
            // Additional category name matching
            { "category.name": { $regex: searchTerm, $options: 'i' } },
            { "productType.displayName": { $regex: searchTerm, $options: 'i' } }
          ]
        }
      });
    }

    // Stage 5: Sort
    let sortStage = {};
    switch (sortBy) {
      case 'price':
        sortStage.price = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'newest':
        sortStage.createdAt = -1;
        break;
      case 'bestselling':
        sortStage.sold = -1;
        break;
      case 'name':
        sortStage.name = sortOrder === 'desc' ? -1 : 1;
        break;
      default:
        sortStage.createdAt = -1;
    }
    pipeline.push({ $sort: sortStage });

    // Stage 6: Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push({ $skip: skip }, { $limit: parseInt(limit) });

    // Create a separate pipeline for counting that matches the products pipeline exactly
    const countPipeline = [...pipeline];
    // Remove pagination stages from count pipeline
    const paginationStageIndices = [];
    countPipeline.forEach((stage, index) => {
      if (stage.$skip !== undefined || stage.$limit !== undefined || stage.$sort !== undefined) {
        paginationStageIndices.push(index);
      }
    });
    
    // Remove pagination stages in reverse order to maintain correct indices
    paginationStageIndices.reverse().forEach(index => {
      countPipeline.splice(index, 1);
    });
    
    // Add count stage
    countPipeline.push({ $count: "total" });
    // Execute optimized aggregation with matching pipelines
    const [products, totalCount] = await Promise.all([
      Product.aggregate(pipeline),
      Product.aggregate(countPipeline)
    ]);

    const total = totalCount[0]?.total || 0;

    // Process results
    const cleanedProducts = products.map(product => {
      // Handle populated fields
      if (Array.isArray(product.category)) {
        product.category = product.category[0] || null;
      }
      if (Array.isArray(product.productType)) {
        product.productType = product.productType[0] || null;
      }

      // Clean up images
      if (product.images && product.images.length > 0) {
        product.images = product.images.map(img => ({
          _id: img._id,
          url: img.url,
          isPrimary: img.isPrimary,
          order: img.order,
          caption: img.caption
        }));
      }
      
      // Add size availability
      product.sizeAvailability = {};
      if (product.sizeStock) {
        ['S', 'M', 'L', 'XL', 'XXL'].forEach(size => {
          product.sizeAvailability[size] = (product.sizeStock[size] || 0) > 0;
        });
      }
      
      return product;
    });

    const result = {
      products: cleanedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total,
        hasMore: skip + products.length < total
      },
      _cachedAt: Date.now(),
      _queryTime: Date.now() - startTime
    };

    // Cache successful results
    try {
      await redisService.set(cacheKey, result, 180); // 3 minutes cache
      console.log(`✅ SEARCH CACHED: ${search || 'filters'} (${result._queryTime}ms)`);
    } catch (cacheError) {
      console.log('Cache save failed:', cacheError.message);
    }

    res.json({
      ...result,
      _cached: false
    });

  } catch (err) {
    console.error('Optimized search error:', err);
    return res.status(400).json({
      error: "Search failed",
      details: err.message,
      _queryTime: Date.now() - startTime
    });
  }
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
          
          // Use the simplified stock methods
          if (product.decreaseStock(size, quantity)) {
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

// Featured Products Management

// Toggle featured status of a product (Admin only)
exports.toggleFeatured = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.profile || req.profile.role !== 1) {
      return res.status(403).json({
        error: "Access denied. Admin only."
      });
    }

    const productId = req.params.productId;
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        error: "Product not found"
      });
    }

    // Toggle featured status
    product.isFeatured = !product.isFeatured;
    product.featuredAt = product.isFeatured ? new Date() : null;
    
    await product.save();

    // Clear featured products cache
    try {
      await redisService.connect();
      const cacheKeys = [
        'products:featured',
        'products:trending',
        `product:${product._id}`
      ];
      
      for (const key of cacheKeys) {
        await redisService.del(key);
      }
      console.log('🔄 Featured products cache cleared');
    } catch (redisError) {
      console.error('Redis cache clear failed:', redisError);
    }

    res.json({
      success: true,
      message: `Product ${product.isFeatured ? 'marked as featured' : 'removed from featured'}`,
      product: {
        _id: product._id,
        name: product.name,
        isFeatured: product.isFeatured,
        featuredAt: product.featuredAt
      }
    });

  } catch (err) {
    console.error('Toggle featured error:', err);
    return res.status(500).json({
      error: "Failed to toggle featured status",
      details: err.message
    });
  }
};

// Get featured products for home page
exports.getFeaturedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const cacheKey = `products:featured:${limit}`;

    // Try Redis cache first
    try {
      await redisService.connect();
      const cachedFeatured = await redisService.get(cacheKey);
      
      if (cachedFeatured) {
        console.log(`🔥 FEATURED CACHE HIT: ${limit} products`);
        return res.json({
          ...cachedFeatured,
          _cached: true,
          _cacheAge: Date.now() - cachedFeatured._cachedAt
        });
      }
    } catch (redisError) {
      console.log('Featured cache miss:', redisError.message);
    }

    console.log(`💾 Featured products cache miss - fetching from DB`);

    // Get featured products from database
    const featuredProducts = await Product.find({
      isFeatured: true,
      isActive: true,
      isDeleted: { $ne: true },
      totalStock: { $gt: 0 } // Only show products in stock
    })
      .select("-images.data") // Exclude heavy binary data
      .populate("category", "name")
      .populate("productType", "name")
      .sort({ featuredAt: -1, sold: -1 }) // Most recently featured first, then by sales
      .limit(limit)
      .lean();

    // Clean up data for response
    const cleanedProducts = featuredProducts.map(product => {
      if (product.images && product.images.length > 0) {
        product.images = product.images.map(img => ({
          _id: img._id,
          url: img.url,
          isPrimary: img.isPrimary,
          order: img.order,
          caption: img.caption
        }));
      }
      
      // Add featured badge info
      product.featured = {
        isFeatured: true,
        featuredAt: product.featuredAt
      };
      
      return product;
    });

    // Prepare response
    const response = {
      products: cleanedProducts,
      count: cleanedProducts.length,
      _cachedAt: Date.now()
    };

    // Cache the results
    try {
      await redisService.set(cacheKey, response, 300); // 5 minutes cache
      console.log(`✅ Featured products cached: ${cleanedProducts.length} items`);
    } catch (cacheError) {
      console.log('Featured cache save failed:', cacheError.message);
    }

    res.json({
      ...response,
      _cached: false
    });

  } catch (err) {
    console.error('Get featured products error:', err);
    return res.status(500).json({
      error: "Failed to get featured products",
      details: err.message
    });
  }
};

// Get trending products (future use - hybrid algorithm)
exports.getTrendingProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const cacheKey = `products:trending:${limit}`;

    // Try Redis cache first
    try {
      await redisService.connect();
      const cachedTrending = await redisService.get(cacheKey);
      
      if (cachedTrending) {
        console.log(`🔥 TRENDING CACHE HIT: ${limit} products`);
        return res.json({
          ...cachedTrending,
          _cached: true,
          _cacheAge: Date.now() - cachedTrending._cachedAt
        });
      }
    } catch (redisError) {
      console.log('Trending cache miss:', redisError.message);
    }

    console.log(`💾 Trending products cache miss - calculating trends`);

    // Step 1: Get manually featured products first (highest priority)
    const featuredProducts = await Product.find({
      isFeatured: true,
      isActive: true,
      isDeleted: { $ne: true },
      totalStock: { $gt: 0 }
    })
      .select("-images.data")
      .populate("category", "name")
      .populate("productType", "name")
      .sort({ featuredAt: -1, sold: -1 })
      .limit(limit)
      .lean();

    let trendingProducts = [...featuredProducts];

    // Step 2: If we need more products, fill with algorithm-based trending
    if (trendingProducts.length < limit) {
      const remaining = limit - trendingProducts.length;
      
      // Get products not already featured
      const featuredIds = featuredProducts.map(p => p._id);
      
      // Calculate trending score based on sales, ratings, and recency
      const algorithmicProducts = await Product.find({
        _id: { $nin: featuredIds },
        isFeatured: { $ne: true },
        isActive: true,
        isDeleted: { $ne: true },
        totalStock: { $gt: 0 }
      })
        .select("-images.data")
        .populate("category", "name")
        .populate("productType", "name")
        .sort({ 
          sold: -1,           // Sales priority
          averageRating: -1,  // Rating priority  
          createdAt: -1       // Recency priority
        })
        .limit(remaining)
        .lean();

      trendingProducts.push(...algorithmicProducts);
    }

    // Clean up data for response
    const cleanedProducts = trendingProducts.map(product => {
      if (product.images && product.images.length > 0) {
        product.images = product.images.map(img => ({
          _id: img._id,
          url: img.url,
          isPrimary: img.isPrimary,
          order: img.order,
          caption: img.caption
        }));
      }
      
      // Add trending info
      product.trending = {
        isFeatured: product.isFeatured || false,
        trendingScore: (product.sold || 0) + (product.averageRating || 0) * 10
      };
      
      return product;
    });

    // Prepare response
    const response = {
      products: cleanedProducts,
      count: cleanedProducts.length,
      algorithm: {
        featured: featuredProducts.length,
        algorithmic: cleanedProducts.length - featuredProducts.length
      },
      _cachedAt: Date.now()
    };

    // Cache the results
    try {
      await redisService.set(cacheKey, response, 180); // 3 minutes cache
      console.log(`✅ Trending products cached: ${cleanedProducts.length} items`);
    } catch (cacheError) {
      console.log('Trending cache save failed:', cacheError.message);
    }

    res.json({
      ...response,
      _cached: false
    });

  } catch (err) {
    console.error('Get trending products error:', err);
    return res.status(500).json({
      error: "Failed to get trending products",
      details: err.message
    });
  }
};
