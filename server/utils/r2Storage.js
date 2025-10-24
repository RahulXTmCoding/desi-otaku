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

module.exports = {
  uploadToR2,
  deleteFromR2,
  generateImageKey,
  extractKeyFromUrl,
  isR2Enabled,
  r2Client
};
