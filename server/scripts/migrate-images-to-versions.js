/**
 * Image Migration Script
 * Migrates existing product images to multi-version format (vsmall, thumb, medium, original)
 * 
 * Usage: 
 *   node server/scripts/migrate-images-to-versions.js           # Migrate all images
 *   R2_ONLY=true node server/scripts/migrate-images-to-versions.js  # Migrate only R2 images
 */

require('dotenv').config();
const mongoose = require('mongoose');
const sharp = require('sharp');
const axios = require('axios');
const Product = require('../models/product');
const { uploadToR2, extractKeyFromUrl, deleteFromR2, isR2Enabled } = require('../utils/r2Storage');

// Migration mode: only process images already in R2 (skip external URLs)
const R2_ONLY_MODE = process.env.R2_ONLY === 'true' || process.argv.includes('--r2-only');

// Image version configurations
const IMAGE_VERSIONS = {
  vsmall: { width: 300, height: 300, quality: 75, suffix: '-vsmall' },
  thumb: { width: 400, height: 400, quality: 80, suffix: '-thumb' },
  medium: { width: 800, height: 800, quality: 85, suffix: '-medium' },
  original: { width: 1920, height: 1920, quality: 90, suffix: '' } // No suffix for original
};

// Statistics
const stats = {
  totalProducts: 0,
  totalImages: 0,
  processedProducts: 0,
  processedImages: 0,
  failedProducts: 0,
  failedImages: 0,
  skippedImages: 0
};

/**
 * Download image from URL
 */
async function downloadImage(url) {
  try {
    console.log(`    Downloading: ${url}`);
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      maxRedirects: 5
    });
    
    if (response.status === 200) {
      return Buffer.from(response.data);
    }
    throw new Error(`Failed to download: ${response.status}`);
  } catch (error) {
    throw new Error(`Download failed: ${error.message}`);
  }
}

/**
 * Generate image version
 */
async function generateImageVersion(buffer, version, isPng = false) {
  const config = IMAGE_VERSIONS[version];
  
  try {
    let sharpInstance = sharp(buffer)
      .resize(config.width, config.height, {
        fit: 'inside', // Preserve aspect ratio, no cropping
        withoutEnlargement: true
      });
    
    // Preserve format: PNG for transparent images, JPEG for others
    if (isPng) {
      sharpInstance = sharpInstance.png({
        quality: config.quality,
        compressionLevel: 9,
        progressive: true
      });
    } else {
      sharpInstance = sharpInstance.jpeg({
        quality: config.quality,
        progressive: true,
        mozjpeg: true
      });
    }
    
    const resizedBuffer = await sharpInstance.toBuffer();
    
    const sizeMB = (resizedBuffer.length / 1024 / 1024).toFixed(2);
    const format = isPng ? 'PNG' : 'JPEG';
    console.log(`    ✅ Generated ${version}: ${config.width}x${config.height}, ${sizeMB}MB (${format})`);
    
    return resizedBuffer;
  } catch (error) {
    throw new Error(`Failed to generate ${version}: ${error.message}`);
  }
}

/**
 * Upload image versions to R2
 * Uploads: xyz-vsmall.png, xyz-thumb.png, xyz-medium.png, xyz.png
 * Returns: Only original URL (xyz.png)
 * Note: Original is uploaded as-is without any processing
 * @param {Buffer} buffer - Image buffer
 * @param {string} baseKey - Base R2 key
 * @param {string} contentType - Image content type
 * @param {boolean} skipOriginal - Skip uploading original (for migration when it already exists)
 */
async function uploadImageVersions(buffer, baseKey, contentType = 'image/jpeg', skipOriginal = false) {
  let originalUrl = '';
  
  // Detect if image is PNG (for transparency support)
  const isPng = contentType === 'image/png' || baseKey.toLowerCase().endsWith('.png');
  
  for (const [version, config] of Object.entries(IMAGE_VERSIONS)) {
    // Skip original upload during migration if it already exists
    if (version === 'original' && skipOriginal) {
      const versionKey = baseKey;
      originalUrl = `${process.env.R2_PUBLIC_URL}/${versionKey}`;
      console.log(`    ⏭️  Skipping original upload (already exists): ${originalUrl}`);
      continue;
    }
    try {
      let versionBuffer;
      
      if (version === 'original') {
        // Upload original as-is without processing
        versionBuffer = buffer;
        console.log(`    📦 Using original file without processing`);
      } else {
        // Generate resized version for vsmall, thumb, medium (preserve format)
        versionBuffer = await generateImageVersion(buffer, version, isPng);
      }
      
      // Create key with version suffix
      // vsmall: xyz-vsmall.png, thumb: xyz-thumb.png, medium: xyz-medium.png, original: xyz.png (no suffix)
      const versionKey = config.suffix 
        ? baseKey.replace(/(\.[^.]+)$/, `${config.suffix}$1`)
        : baseKey;
      
      // Upload to R2
      const url = await uploadToR2(versionBuffer, versionKey, contentType);
      
      if (version === 'original') {
        originalUrl = url;
      }
      
      console.log(`    ✅ Uploaded ${version}: ${url}`);
    } catch (error) {
      console.error(`    ❌ Failed to upload ${version}:`, error.message);
      throw error;
    }
  }
  
  return originalUrl; // Only return original URL
}

/**
 * Check if image already has versions
 */
function hasVersions(imageUrl) {
  return imageUrl.includes('-thumb.') || imageUrl.includes('-medium.') || imageUrl.includes('-original.');
}

/**
 * Extract base URL (remove version suffix)
 */
function getBaseUrl(imageUrl) {
  return imageUrl
    .replace(/-thumb\./, '.')
    .replace(/-medium\./, '.')
    .replace(/-original\./, '.');
}

/**
 * Process single product image
 */
async function processProductImage(product, imageIndex) {
  const image = product.images[imageIndex];
  
  console.log(`  Image ${imageIndex + 1}/${product.images.length}: ${image.url}`);
  
  try {
    // Check if image is in R2 or external
    const existingKey = extractKeyFromUrl(image.url);
    const isExternalUrl = !existingKey;
    
    // Skip external URLs if R2-only mode is enabled
    if (R2_ONLY_MODE && isExternalUrl) {
      console.log(`    ⏭️  External URL, skipping (R2-only mode)`);
      stats.skippedImages++;
      return;
    }
    
    // Download original image
    const originalBuffer = await downloadImage(image.url);
    const originalSizeMB = (originalBuffer.length / 1024 / 1024).toFixed(2);
    console.log(`    Downloaded original: ${originalSizeMB}MB`);
    
    // Generate base key from existing URL or create new
    let baseKey;
    
    if (existingKey) {
      // Image already in R2 - only upload optimized versions
      baseKey = existingKey;
      console.log(`    📦 Image already in R2, will skip original upload`);
    } else {
      // External URL - need to upload all versions including original
      const extension = image.url.split('.').pop().split('?')[0] || 'jpg';
      baseKey = `products/${product._id}/${Date.now()}-${imageIndex}.${extension}`;
      console.log(`    🌐 External URL detected, will upload all versions including original`);
    }
    
    // Detect content type from URL extension
    const extension = baseKey.split('.').pop().toLowerCase();
    const contentType = extension === 'png' ? 'image/png' : 'image/jpeg';
    
    // Upload versions (skip original if already in R2)
    const originalUrl = await uploadImageVersions(originalBuffer, baseKey, contentType, !isExternalUrl);
    
    // Update image with ONLY original URL (xyz.png)
    // Frontend will convert to xyz-thumb.png / xyz-medium.png dynamically
    image.url = originalUrl;
    
    console.log(`    ✅ Image migrated successfully`);
    stats.processedImages++;
    
  } catch (error) {
    console.error(`    ❌ Failed to process image:`, error.message);
    stats.failedImages++;
    throw error;
  }
}

/**
 * Process single product
 */
async function processProduct(product) {
  console.log(`\n[${stats.processedProducts + 1}/${stats.totalProducts}] Processing: ${product.name} (${product._id})`);
  
  if (!product.images || product.images.length === 0) {
    console.log(`  No images to process`);
    return;
  }
  
  console.log(`  Images to process: ${product.images.length}`);
  
  try {
    // Process each image
    for (let i = 0; i < product.images.length; i++) {
      await processProductImage(product, i);
    }
    
    // Save product with updated image URLs
    await product.save();
    console.log(`  ✅ Product saved successfully`);
    stats.processedProducts++;
    
  } catch (error) {
    console.error(`  ❌ Failed to process product:`, error.message);
    stats.failedProducts++;
  }
}

/**
 * Main migration function
 */
async function migrateImages() {
  console.log('\n🚀 Starting Image Migration to Multi-Version Format\n');
  console.log('Mode:', R2_ONLY_MODE ? '📦 R2-ONLY (skip external URLs)' : '🌍 ALL IMAGES (including external URLs)');
  console.log('\nConfiguration:');
  console.log(`  - VSmall: ${IMAGE_VERSIONS.vsmall.width}x${IMAGE_VERSIONS.vsmall.height} @ ${IMAGE_VERSIONS.vsmall.quality}% quality`);
  console.log(`  - Thumb: ${IMAGE_VERSIONS.thumb.width}x${IMAGE_VERSIONS.thumb.height} @ ${IMAGE_VERSIONS.thumb.quality}% quality`);
  console.log(`  - Medium: ${IMAGE_VERSIONS.medium.width}x${IMAGE_VERSIONS.medium.height} @ ${IMAGE_VERSIONS.medium.quality}% quality`);
  console.log(`  - Original: Preserved as-is (no processing)`);
  console.log();
  
  // Check R2 configuration
  if (!isR2Enabled()) {
    console.error('❌ R2 is not configured. Please check your environment variables.');
    process.exit(1);
  }
  
  try {
    // Connect to database
    console.log('Connecting to database...');
    await mongoose.connect(process.env.DATABASE, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to database\n');
    
    // Get all products with images
    const products = await Product.find({ 'images.0': { $exists: true } });
    stats.totalProducts = products.length;
    stats.totalImages = products.reduce((sum, p) => sum + (p.images?.length || 0), 0);
    
    console.log(`Found ${stats.totalProducts} products with ${stats.totalImages} images\n`);
    
    if (stats.totalProducts === 0) {
      console.log('No products to migrate. Exiting...');
      process.exit(0);
    }
    
    // Ask for confirmation
    console.log('⚠️  This will:');
    if (R2_ONLY_MODE) {
      console.log('   - Process ONLY images already in R2 (skip external URLs)');
      console.log('   - Download existing R2 images');
      console.log('   - Generate optimized versions (vsmall, thumb, medium)');
      console.log('   - Upload optimized versions (original won\'t be re-uploaded)');
    } else {
      console.log('   - Download all existing product images');
      console.log('   - Generate optimized versions (vsmall, thumb, medium) for each image');
      console.log('   - Upload ONLY optimized versions (original already exists, won\'t re-upload)');
      console.log('   - For external URLs: migrate all versions including original to R2');
    }
    console.log();
    
    // Process all products
    for (const product of products) {
      await processProduct(product);
    }
    
    // Print statistics
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log(`Total Products: ${stats.totalProducts}`);
    console.log(`  ✅ Processed: ${stats.processedProducts}`);
    console.log(`  ❌ Failed: ${stats.failedProducts}`);
    console.log();
    console.log(`Total Images: ${stats.totalImages}`);
    console.log(`  ✅ Processed: ${stats.processedImages}`);
    console.log(`  ⏭️  Skipped: ${stats.skippedImages}`);
    console.log(`  ❌ Failed: ${stats.failedImages}`);
    console.log('='.repeat(60));
    console.log();
    
    if (stats.failedProducts === 0 && stats.failedImages === 0) {
      console.log('✅ Migration completed successfully!');
    } else {
      console.log('⚠️  Migration completed with errors. Check logs above.');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
  }
}

// Run migration
if (require.main === module) {
  migrateImages()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { migrateImages };
