const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Initialize R2 client (S3-compatible)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload buffer to Cloudflare R2
 * @param {Buffer} buffer - Image buffer
 * @param {string} key - Storage key (path/filename)
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - Public URL
 */
const uploadToR2 = async (buffer, key, contentType) => {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000', // 1 year cache
      Metadata: {
        uploadedAt: new Date().toISOString(),
        source: 'desi-otaku-api'
      }
    });

    await r2Client.send(command);
    
    // Return public URL
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    console.log(`✅ R2 Upload successful: ${publicUrl}`);
    
    return publicUrl;
  } catch (error) {
    console.error('❌ R2 Upload failed:', error.message);
    throw new Error(`R2 upload failed: ${error.message}`);
  }
};

/**
 * Delete object from R2
 * @param {string} key - Storage key
 * @returns {Promise<boolean>} - Success status
 */
const deleteFromR2 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    console.log(`✅ R2 Delete successful: ${key}`);
    return true;
  } catch (error) {
    console.error('❌ R2 Delete failed:', error.message);
    return false;
  }
};

/**
 * Generate unique key for image storage
 * @param {string} productId - Product ID
 * @param {number} index - Image index
 * @param {string} extension - File extension
 * @returns {string} - Storage key
 */
const generateImageKey = (productId, index, extension) => {
  const timestamp = Date.now();
  return `products/${productId}/${timestamp}-${index}.${extension}`;
};

/**
 * Extract key from R2 URL
 * @param {string} url - R2 public URL
 * @returns {string} - Storage key
 */
const extractKeyFromUrl = (url) => {
  if (!url || !url.includes(process.env.R2_PUBLIC_URL)) {
    return null;
  }
  return url.replace(`${process.env.R2_PUBLIC_URL}/`, '');
};

/**
 * Check if R2 is configured and enabled
 * @returns {boolean} - Configuration status
 */
const isR2Enabled = () => {
  return (
    process.env.USE_R2 === 'true' &&
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.R2_PUBLIC_URL
  );
};

/**
 * Upload multiple image versions to R2
 * Uploads: xyz-thumb.png, xyz-medium.png, xyz.png
 * Returns: Only the original URL (xyz.png)
 * Frontend converts URL dynamically to get other versions
 * 
 * @param {Buffer} originalBuffer - Original image buffer
 * @param {string} baseKey - Base storage key (e.g., products/123/image.jpg)
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - Original image URL (frontend will convert to -thumb/-medium)
 */
const uploadImageVersions = async (originalBuffer, baseKey, contentType = 'image/jpeg') => {
  const sharp = require('sharp');
  
  const versions = {
    vsmall: { width: 300, height: 300, quality: 75, suffix: '-vsmall' },
    thumb: { width: 400, height: 400, quality: 80, suffix: '-thumb' },
    medium: { width: 800, height: 800, quality: 85, suffix: '-medium' },
    original: { width: null, height: null, quality: null, suffix: '' } // No suffix, no processing
  };

  let originalUrl = '';
  
  // Detect if image is PNG (for transparency support)
  const isPng = contentType === 'image/png' || baseKey.toLowerCase().endsWith('.png');

  for (const [versionName, config] of Object.entries(versions)) {
    try {
      let bufferToUpload;
      
      if (versionName === 'original') {
        // Upload original as-is without any processing
        bufferToUpload = originalBuffer;
        console.log(`  📦 Using original file without processing`);
      } else {
        // Generate resized version (preserves aspect ratio and format)
        let sharpInstance = sharp(originalBuffer)
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
        
        bufferToUpload = await sharpInstance.toBuffer();
      }

      // Create versioned key
      // vsmall: products/123/image-vsmall.jpg
      // thumb: products/123/image-thumb.jpg
      // medium: products/123/image-medium.jpg
      // original: products/123/image.jpg (no suffix)
      const versionKey = config.suffix 
        ? baseKey.replace(/(\.[^.]+)$/, `${config.suffix}$1`)
        : baseKey;
      
      // Upload to R2
      const url = await uploadToR2(bufferToUpload, versionKey, contentType);
      
      if (versionName === 'original') {
        originalUrl = url; // Store original URL to return
      }
      
      console.log(`  ✅ Uploaded ${versionName}: ${url}`);
    } catch (error) {
      console.error(`  ❌ Failed to upload ${versionName}:`, error.message);
      throw error;
    }
  }

  // Return only the original URL
  // Frontend will convert: xyz.png → xyz-thumb.png when needed
  return originalUrl;
};

/**
 * Delete all versions of an image from R2
 * @param {string} baseKey - Base storage key (without version suffix)
 * @returns {Promise<Object>} - Deletion results
 */
const deleteImageVersions = async (baseKey) => {
  const suffixes = ['-thumb', '-medium', '-original'];
  const results = {};

  for (const suffix of suffixes) {
    const versionKey = baseKey.replace(/(\.[^.]+)$/, `${suffix}$1`);
    try {
      results[suffix] = await deleteFromR2(versionKey);
    } catch (error) {
      console.error(`Failed to delete ${suffix} version:`, error.message);
      results[suffix] = false;
    }
  }

  return results;
};

module.exports = {
  uploadToR2,
  deleteFromR2,
  generateImageKey,
  extractKeyFromUrl,
  isR2Enabled,
  r2Client,
  uploadImageVersions,
  deleteImageVersions
};
