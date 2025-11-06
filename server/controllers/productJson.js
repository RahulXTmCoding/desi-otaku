const Product = require("../models/product");
const _ = require("lodash");
const { uploadToR2, generateImageKey, isR2Enabled } = require("../utils/r2Storage");
const { upsertProductsToFacebookCatalog } = require("../services/facebookCatalogService");

// Helper function to format product data for Facebook Catalog API
const formatProductForFacebook = (product) => {
  const CLIENT_URL = process.env.PRODUCTION_CLIENT_URL || process.env.CLIENT_URL; // Use production URL if available

  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
  const imageUrl = primaryImage ? primaryImage.url : (product.photoUrl || 'https://yourstore.com/placeholder.jpg'); // Fallback to placeholder
  console.log(JSON.stringify(product.images));
  console.log(`Formatting product ${product._id} for Facebook Catalog with image URL: ${imageUrl}`);
  return {
    method: "UPDATE", // Use UPDATE for upsert, will create if retailer_id doesn't exist
    data: {
      id: product._id.toString(),
      title: product.name,
      description: product.description,
      price: `${product.price}.00 INR`,
      availability: product.totalStock > 0 ? "in stock" : "out of stock",
      brand: "Attars", // As per project brief
      link: `${CLIENT_URL}/product/${product._id}`,
      image_link: imageUrl,
      condition: "new"
    }
  };
};
// Create product with JSON payload
exports.createProductJson = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      mrp,
      category,
      subcategory,
      productType,
      tags,
      customTags,
      sizeStock,
      imageUrls,
      imageFiles,
      primaryImageIndex,
      seoTitle, metaDescription, slug
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
      mrp: mrp || null,
      category,
      subcategory: subcategory && subcategory.trim() !== '' ? subcategory : null,
      productType,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      customTags: customTags ? customTags.split(',').map(t => t.trim()) : [],
      seoTitle, metaDescription, slug
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

    // Handle base64 file images with R2 support
    if (imageFiles && Array.isArray(imageFiles)) {
      console.log(`Processing ${imageFiles.length} base64 images`);
      console.log(`R2 enabled: ${isR2Enabled()}`);
      
      for (let index = 0; index < imageFiles.length; index++) {
        const fileData = imageFiles[index];
        const base64Data = fileData.data.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        console.log(`  Processing image ${index + 1}: ${fileData.name}`);
        
        if (isR2Enabled()) {
          try {
            // Upload to R2
            const extension = fileData.name.split('.').pop() || 'jpg';
            const imageKey = generateImageKey(product._id.toString(), index, extension);
            const r2Url = await uploadToR2(buffer, imageKey, fileData.type);
            
            console.log(`  ✅ R2 upload successful: ${r2Url}`);
            
            product.images.push({
              url: r2Url,
              storageType: 'r2',
              isPrimary: false, // Will be set based on primaryImageIndex
              order: product.images.length,
              originalName: fileData.name
            });
          } catch (error) {
            console.error(`  ❌ R2 upload failed for ${fileData.name}:`, error.message);
            // Fallback to MongoDB GridFS storage
            product.images.push({
              data: buffer,
              contentType: fileData.type,
              storageType: 'gridfs',
              isPrimary: false,
              order: product.images.length
            });
          }
        } else {
          // Use existing MongoDB GridFS storage
          product.images.push({
            data: buffer,
            contentType: fileData.type,
            storageType: 'gridfs',
            isPrimary: false, // Will be set based on primaryImageIndex
            order: product.images.length
          });
        }
      }
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

      // Attempt to upsert product to Facebook Catalog
    try {
      const facebookProductData = formatProductForFacebook(product);
      await upsertProductsToFacebookCatalog([facebookProductData]);
      console.log(`✅ Product ${product._id} sent to Facebook Catalog.`);
    } catch (facebookError) {
      console.error(`❌ Failed to send product ${product._id} to Facebook Catalog:`, facebookError.message);
      // Log the error but do not fail the product creation
    }
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
      mrp,
      category,
      subcategory,
      productType,
      tags,
      customTags,
      sizeStock,
      keepExistingImages,
      imageUrls,
      imageFiles,
      primaryImageIndex,
      seoTitle, metaDescription, slug
    } = req.body;

    let product = req.product;
    
    // Update basic fields
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.mrp = mrp !== undefined ? mrp : product.mrp;
    product.category = category || product.category;
    // Handle subcategory - convert empty string to null to avoid ObjectId casting error
    product.subcategory = subcategory !== undefined ? (subcategory && subcategory.trim() !== '' ? subcategory : null) : product.subcategory;
    product.productType = productType || product.productType;
    product.tags = tags ? tags.split(',').map(t => t.trim()) : product.tags;
    // Handle customTags: if provided and empty, set to empty array; otherwise, process or retain existing.
    if (customTags !== undefined) {
      product.customTags = customTags.length > 0 ? customTags.split(',').map(t => t.trim()) : [];
    }
    product.seoTitle = seoTitle || product.seoTitle;
    product.metaDescription = metaDescription || product.metaDescription;
    product.slug = slug || product.slug;

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

    // Add new base64 file images with R2 support
    if (imageFiles && Array.isArray(imageFiles)) {
      console.log(`Processing ${imageFiles.length} new base64 images`);
      console.log(`R2 enabled: ${isR2Enabled()}`);
      
      for (let index = 0; index < imageFiles.length; index++) {
        const fileData = imageFiles[index];
        const base64Data = fileData.data.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        console.log(`  Processing image ${index + 1}: ${fileData.name}`);
        
        if (isR2Enabled()) {
          try {
            // Upload to R2
            const extension = fileData.name.split('.').pop() || 'jpg';
            const imageKey = generateImageKey(product._id.toString(), newImagesArray.length, extension);
            const r2Url = await uploadToR2(buffer, imageKey, fileData.type);
            
            console.log(`  ✅ R2 upload successful: ${r2Url}`);
            
            newImagesArray.push({
              url: r2Url,
              storageType: 'r2',
              isPrimary: false,
              order: newImagesArray.length,
              originalName: fileData.name
            });
          } catch (error) {
            console.error(`  ❌ R2 upload failed for ${fileData.name}:`, error.message);
            // Fallback to MongoDB GridFS storage
            newImagesArray.push({
              data: buffer,
              contentType: fileData.type,
              storageType: 'gridfs',
              isPrimary: false,
              order: newImagesArray.length
            });
          }
        } else {
          // Use existing MongoDB GridFS storage
          newImagesArray.push({
            data: buffer,
            contentType: fileData.type,
            storageType: 'gridfs',
            isPrimary: false,
            order: newImagesArray.length
          });
        }
      }
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

    // Attempt to upsert product to Facebook Catalog
    try {
      const facebookProductData = formatProductForFacebook(product);
      await upsertProductsToFacebookCatalog([facebookProductData]);
      console.log(`✅ Product ${product._id} updated in Facebook Catalog.`);
    } catch (facebookError) {
      console.error(`❌ Failed to update product ${product._id} in Facebook Catalog:`, facebookError.message);
      // Log the error but do not fail the product update
    }
    res.json(product);
  } catch (err) {
    console.error("Error updating product:", err);
    return res.status(400).json({
      error: "Failed to update the product",
      details: err.message
    });
  }
};
