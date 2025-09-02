const crypto = require('crypto');

/**
 * Shiprocket Service for dynamic checkout integration
 * Handles cart transformation, HMAC generation, and order processing
 */
class ShiprocketService {
  constructor() {
    this.apiKey = process.env.SHIPROCKET_API_KEY;
    this.secretKey = process.env.SHIPROCKET_SECRET_KEY;
    this.baseUrl = process.env.SHIPROCKET_BASE_URL || 'https://checkout-api.shiprocket.com';
  }

  /**
   * Generate HMAC SHA256 signature for Shiprocket API
   */
  generateHMAC(requestBody) {
    const bodyString = typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody);
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(bodyString)
      .digest('base64');
  }

  /**
   * Generate random variant ID for dynamic products
   */
  generateVariantId() {
    return `dyn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get image URL for cart items
   */
  getItemImageUrl(item) {
    // Custom design items
    if (item.isCustom && item.customization) {
      // Generate or return mockup URL
      return this.generateCustomMockupUrl(item);
    }

    // Standard product images
    if (item.image && (item.image.startsWith('http') || item.image.startsWith('data:'))) {
      return item.image;
    }

    if (item.photoUrl && (item.photoUrl.startsWith('http') || item.photoUrl.startsWith('data:'))) {
      return item.photoUrl;
    }

    // Try backend image endpoint
    const productId = item.product?._id || item.product || item._id;
    if (productId && !productId.startsWith('temp_') && !productId.startsWith('custom')) {
      return `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/product/image/${productId}/0`;
    }

    // Fallback placeholder
    return 'https://via.placeholder.com/300x300?text=Product';
  }

  /**
   * Generate custom mockup URL
   */
  generateCustomMockupUrl(item) {
    // For now, return a placeholder. In production, this would generate/return actual mockup
    const frontId = item.customization.frontDesign?.designId || 'none';
    const backId = item.customization.backDesign?.designId || 'none';
    const color = item.color || 'white';
    const size = item.size || 'M';
    
    // TODO: Implement actual mockup generation
    return `https://via.placeholder.com/300x300?text=Custom-${frontId}-${backId}-${color}-${size}`;
  }

  /**
   * Build description for cart items
   */
  buildItemDescription(item) {
    if (item.isCustom) {
      return this.buildCustomDescription(item);
    }

    // Standard product description
    const parts = [item.name];
    if (item.size) parts.push(`Size: ${item.size}`);
    if (item.color) parts.push(`Color: ${item.color}`);
    
    return parts.join(' - ');
  }

  /**
   * Build custom design description with metadata
   */
  buildCustomDescription(item) {
    const parts = [`Custom T-Shirt`];
    
    if (item.size) parts.push(`Size: ${item.size}`);
    if (item.color) parts.push(`Color: ${item.color}`);

    const designParts = [];
    
    if (item.customization.frontDesign) {
      designParts.push(`Front: ${item.customization.frontDesign.designName || 'Custom Design'} at ${item.customization.frontDesign.position}`);
    }
    
    if (item.customization.backDesign) {
      designParts.push(`Back: ${item.customization.backDesign.designName || 'Custom Design'} at ${item.customization.backDesign.position}`);
    }

    if (designParts.length > 0) {
      parts.push(designParts.join(', '));
    }

    // Add custom metadata as JSON string for webhook processing
    const customMetadata = {
      type: 'custom_design',
      frontDesign: item.customization.frontDesign,
      backDesign: item.customization.backDesign,
      printingInstructions: this.generatePrintingInstructions(item),
      basePrice: item.basePrice || 499
    };

    parts.push(`CUSTOM_META: ${JSON.stringify(customMetadata)}`);
    
    return parts.join(' | ');
  }

  /**
   * Generate printing instructions for custom designs
   */
  generatePrintingInstructions(item) {
    const instructions = [];

    if (item.customization.frontDesign) {
      instructions.push({
        side: 'front',
        designId: item.customization.frontDesign.designId,
        position: item.customization.frontDesign.position,
        method: 'DTG' // Direct to garment printing
      });
    }

    if (item.customization.backDesign) {
      instructions.push({
        side: 'back',
        designId: item.customization.backDesign.designId,
        position: item.customization.backDesign.position,
        method: 'DTG'
      });
    }

    return instructions;
  }

  /**
   * Transform cart to Shiprocket format with dynamic catalog_data
   */
  processCartForShiprocket(cart, discounts = {}) {
    const items = cart.map(item => {
      const randomVariantId = this.generateVariantId();
      
      const catalogData = {
        price: parseFloat(item.price) || 0,
        name: item.name || 'Product',
        image_url: this.getItemImageUrl(item),
        description: this.buildItemDescription(item),
        sku: item.sku || `ITEM-${Date.now()}`,
        weight: 0.2 // Standard t-shirt weight in kg
      };

      return {
        variant_id: randomVariantId,
        quantity: parseInt(item.quantity) || 1,
        catalog_data: catalogData
      };
    });

    const payload = {
      cart_data: {
        items
      },
      redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order-confirmation`,
      timestamp: new Date().toISOString()
    };

    // Add cart discount if present
    if (discounts.total && discounts.total > 0) {
      payload.cart_data.cart_discount = {
        coupon_code: discounts.couponCode || "MULTI_DISCOUNT",
        amount: parseFloat(discounts.total)
      };
    }

    return payload;
  }

  /**
   * Calculate total discounts from cart and context
   */
  calculateDiscounts(cart, appliedDiscounts = {}) {
    let totalDiscount = 0;
    let couponCode = '';

    // AOV discount
    if (appliedDiscounts.quantity?.discount) {
      totalDiscount += appliedDiscounts.quantity.discount;
    }

    // Coupon discount
    if (appliedDiscounts.coupon?.discount) {
      totalDiscount += appliedDiscounts.coupon.discount;
      couponCode = appliedDiscounts.coupon.code;
    }

    // Reward points discount
    if (appliedDiscounts.rewardPoints?.discount) {
      totalDiscount += appliedDiscounts.rewardPoints.discount;
    }

    // Note: Online payment discount will be calculated by Shiprocket
    // as it depends on the payment method selected in their interface

    return {
      total: totalDiscount,
      couponCode,
      breakdown: {
        aov: appliedDiscounts.quantity?.discount || 0,
        coupon: appliedDiscounts.coupon?.discount || 0,
        rewards: appliedDiscounts.rewardPoints?.discount || 0
      }
    };
  }

  /**
   * Extract custom design data from order webhook
   */
  extractCustomMetadata(description) {
    try {
      const customMatch = description.match(/CUSTOM_META: ({.*})/);
      if (customMatch) {
        return JSON.parse(customMatch[1]);
      }
    } catch (error) {
      console.error('Failed to parse custom metadata:', error);
    }
    return null;
  }

  /**
   * Process incoming order webhook from Shiprocket
   */
  processOrderWebhook(shiprocketOrder) {
    const orderItems = shiprocketOrder.cart_data.items.map(item => {
      const customMetadata = this.extractCustomMetadata(item.catalog_data.description);
      
      return {
        shiprocketVariantId: item.variant_id,
        name: item.catalog_data.name,
        price: item.catalog_data.price,
        quantity: item.quantity,
        sku: item.catalog_data.sku,
        imageUrl: item.catalog_data.image_url,
        customization: customMetadata,
        isCustom: !!customMetadata
      };
    });

    return {
      shiprocketOrderId: shiprocketOrder.order_id,
      items: orderItems,
      customer: {
        phone: shiprocketOrder.phone,
        email: shiprocketOrder.email
      },
      paymentMethod: shiprocketOrder.payment_type,
      totalAmount: shiprocketOrder.total_amount_payable,
      status: shiprocketOrder.status === 'SUCCESS' ? 'confirmed' : 'pending',
      rawShiprocketData: shiprocketOrder
    };
  }
}

module.exports = new ShiprocketService();
