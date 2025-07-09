const Product = require("../models/product");
const _ = require("lodash");

// Create product with JSON payload
exports.createProductJson = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      productType,
      tags,
      sizeStock,
      imageUrls,
      imageFiles,
      primaryImageIndex
    } = req.body;

    // Validate required fields
    if (!name || !description || !price || !category) {
      return res.status(400).json({
        error: "Include all the required fields",
      });
    }

    // Create product
    const product = new Product({
      name,
      description,
      price,
      category,
      productType,
      tags: tags ? tags.split(',').map(t => t.trim()) : []
    });

    // Handle size stock
    if (sizeStock) {
      ['S', 'M', 'L', 'XL', 'XXL'].forEach(size => {
        if (sizeStock[size] !== undefined) {
          product.sizeStock[size] = parseInt(sizeStock[size]) || 0;
        }
      });
    }

    // Handle URL images
    if (imageUrls && Array.isArray(imageUrls)) {
      imageUrls.forEach((item) => {
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

    // Handle base64 file images
    if (imageFiles && Array.isArray(imageFiles)) {
      console.log(`Processing ${imageFiles.length} base64 images`);
      
      imageFiles.forEach((fileData, index) => {
        // Extract base64 data from data URL
        const base64Data = fileData.data.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        console.log(`  Processing image ${index + 1}: ${fileData.name}`);
        
        product.images.push({
          data: buffer,
          contentType: fileData.type,
          isPrimary: false, // Will be set based on primaryImageIndex
          order: product.images.length
        });
      });
    }

    // Set primary image
    if (primaryImageIndex !== undefined && product.images[primaryImageIndex]) {
      product.images.forEach((img, idx) => {
        img.isPrimary = idx === primaryImageIndex;
      });
    } else if (product.images.length > 0 && !product.images.some(img => img.isPrimary)) {
      product.images[0].isPrimary = true;
    }

    console.log(`Total images to save: ${product.images.length}`);

    // Save product
    await product.save();
    res.json(product);
  } catch (err) {
    console.error("Error creating product:", err);
    return res.status(400).json({
      error: "Failed to save the product",
      details: err.message
    });
  }
};

// Update product with JSON payload
exports.updateProductJson = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      productType,
      tags,
      sizeStock,
      keepExistingImages,
      imageUrls,
      imageFiles,
      primaryImageIndex
    } = req.body;

    let product = req.product;
    
    // Update basic fields
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;
    product.productType = productType || product.productType;
    product.tags = tags ? tags.split(',').map(t => t.trim()) : product.tags;

    // Update size stock
    if (sizeStock) {
      ['S', 'M', 'L', 'XL', 'XXL'].forEach(size => {
        if (sizeStock[size] !== undefined) {
          product.sizeStock[size] = parseInt(sizeStock[size]) || 0;
        }
      });
    }

    // Handle images
    const originalImages = [...product.images];
    let newImagesArray = [];

    // Keep selected existing images
    if (keepExistingImages && Array.isArray(keepExistingImages)) {
      keepExistingImages.forEach(index => {
        if (originalImages[index]) {
          newImagesArray.push(originalImages[index]);
        }
      });
    } else {
      // Keep all existing images if not specified
      newImagesArray = [...originalImages];
    }

    // Add new URL images
    if (imageUrls && Array.isArray(imageUrls)) {
      imageUrls.forEach((item) => {
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

    // Add new base64 file images
    if (imageFiles && Array.isArray(imageFiles)) {
      console.log(`Processing ${imageFiles.length} new base64 images`);
      
      imageFiles.forEach((fileData, index) => {
        // Extract base64 data from data URL
        const base64Data = fileData.data.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        console.log(`  Processing image ${index + 1}: ${fileData.name}`);
        
        newImagesArray.push({
          data: buffer,
          contentType: fileData.type,
          isPrimary: false,
          order: newImagesArray.length
        });
      });
    }

    // Update product images
    product.images = newImagesArray;

    // Set primary image
    if (primaryImageIndex !== undefined && product.images[primaryImageIndex]) {
      product.images.forEach((img, idx) => {
        img.isPrimary = idx === primaryImageIndex;
      });
    } else if (product.images.length > 0 && !product.images.some(img => img.isPrimary)) {
      product.images[0].isPrimary = true;
    }

    console.log(`Total images after update: ${product.images.length}`);

    // Save product
    await product.save();
    res.json(product);
  } catch (err) {
    console.error("Error updating product:", err);
    return res.status(400).json({
      error: "Failed to update the product",
      details: err.message
    });
  }
};
