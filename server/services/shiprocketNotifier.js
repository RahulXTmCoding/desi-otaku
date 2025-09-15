const crypto = require('crypto');

/**
 * Shiprocket Notifier Service
 * Handles outgoing webhooks to notify Shiprocket when products/collections are updated
 */
class ShiprocketNotifier {
  constructor() {
    this.apiKey = process.env.SHIPROCKET_API_KEY;
    this.secretKey = process.env.SHIPROCKET_SECRET_KEY;
    this.baseUrl = process.env.SHIPROCKET_BASE_URL || 'https://checkout-api.shiprocket.com';
    
    if (!this.apiKey || !this.secretKey) {
      console.warn('⚠️ Shiprocket credentials not found. Outgoing webhooks will be disabled.');
    }
  }

  /**
   * Generate HMAC SHA256 signature for Shiprocket API
   */
  generateHMAC(requestBody) {
    if (!this.secretKey) return '';
    
    const bodyString = typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody);
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(bodyString)
      .digest('base64');
  }

  /**
   * Transform MongoDB product to Shiprocket format
   */
  transformProductToShiprocket(product) {
    return {
      id: product._id.toString(),
      title: product.name || 'Product',
      body_html: product.description || '',
      vendor: process.env.BRAND_NAME || 'Your T-Shirt Brand',
      product_type: product.category || 'Apparel',
      updated_at: product.updatedAt ? product.updatedAt.toISOString() : new Date().toISOString(),
      status: product.isDeleted ? 'inactive' : 'active',
      variants: [
        {
          id: product._id.toString(),
          title: product.name || 'Default',
          price: (product.price || 0).toString(),
          quantity: 999, // Assume good stock
          sku: product.sku || product._id.toString(),
          updated_at: product.updatedAt ? product.updatedAt.toISOString() : new Date().toISOString(),
          image: {
            src: this.getProductImageUrl(product)
          },
          weight: 0.2 // Standard t-shirt weight in kg
        }
      ],
      image: {
        src: this.getProductImageUrl(product)
      }
    };
  }

  /**
   * Get product image URL
   */
  getProductImageUrl(product) {
    // Check for new images array format
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
      if (primaryImage && primaryImage.url) {
        return primaryImage.url;
      }
    }

    // Fallback to photoUrl
    if (product.photoUrl) {
      if (product.photoUrl.startsWith('http')) {
        return product.photoUrl;
      }
      // Construct full URL for relative paths
      return `${process.env.BACKEND_URL || 'http://localhost:8000'}${product.photoUrl}`;
    }

    // API endpoint fallback
    return `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/product/image/${product._id}/0`;
  }

  /**
   * Transform MongoDB category to Shiprocket collection format
   */
  transformCategoryToShiprocket(category) {
    return {
      id: category._id.toString(),
      updated_at: category.updatedAt ? category.updatedAt.toISOString() : new Date().toISOString(),
      title: category.name || 'Category',
      body_html: category.description || `<p>${category.name} collection</p>`,
      image: {
        src: category.image || 'https://via.placeholder.com/300x300?text=Category'
      }
    };
  }

  /**
   * Notify Shiprocket about product update
   */
  async notifyProductUpdate(product) {
    if (!this.apiKey || !this.secretKey) {
      console.log('⚠️ Skipping Shiprocket product notification - credentials not configured');
      return { success: false, reason: 'credentials_missing' };
    }

    try {
      const productData = this.transformProductToShiprocket(product);
      const hmac = this.generateHMAC(productData);

      console.log(`🔄 Notifying Shiprocket about product update: ${product.name}`);

      const response = await fetch('https://checkout-api.shiprocket.com/wh/v1/custom/product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': `Bearer ${this.apiKey}`,
          'X-Api-HMAC-SHA256': hmac
        },
        body: JSON.stringify(productData)
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ Shiprocket product update notification sent successfully');
        return { success: true, data: result };
      } else {
        console.error('❌ Shiprocket product update notification failed:', result);
        return { success: false, error: result };
      }
    } catch (error) {
      console.error('❌ Error sending product update to Shiprocket:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notify Shiprocket about collection update
   */
  async notifyCollectionUpdate(category) {
    if (!this.apiKey || !this.secretKey) {
      console.log('⚠️ Skipping Shiprocket collection notification - credentials not configured');
      return { success: false, reason: 'credentials_missing' };
    }

    try {
      const collectionData = this.transformCategoryToShiprocket(category);
      const hmac = this.generateHMAC(collectionData);

      console.log(`🔄 Notifying Shiprocket about collection update: ${category.name}`);

      const response = await fetch('https://checkout-api.shiprocket.com/wh/v1/custom/collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': `Bearer ${this.apiKey}`,
          'X-Api-HMAC-SHA256': hmac
        },
        body: JSON.stringify(collectionData)
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ Shiprocket collection update notification sent successfully');
        return { success: true, data: result };
      } else {
        console.error('❌ Shiprocket collection update notification failed:', result);
        return { success: false, error: result };
      }
    } catch (error) {
      console.error('❌ Error sending collection update to Shiprocket:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Batch notify multiple products (useful for bulk operations)
   */
  async notifyProductsBatch(products) {
    const results = [];
    
    for (const product of products) {
      const result = await this.notifyProductUpdate(product);
      results.push({ productId: product._id, ...result });
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }

  /**
   * Test webhook connectivity
   */
  async testConnection() {
    if (!this.apiKey || !this.secretKey) {
      return { success: false, error: 'Credentials not configured' };
    }

    try {
      // Create a test product
      const testProduct = {
        _id: 'test-product-id',
        name: 'Test Product',
        description: 'Test product for Shiprocket connectivity',
        price: 499,
        category: 'Test',
        isDeleted: false,
        updatedAt: new Date(),
        photoUrl: 'https://via.placeholder.com/300x300?text=Test'
      };

      const result = await this.notifyProductUpdate(testProduct);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new ShiprocketNotifier();
