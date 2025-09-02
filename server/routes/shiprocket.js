const express = require('express');
const router = express.Router();
const shiprocketController = require('../controllers/shiprocket');

/**
 * Shiprocket Integration Routes
 */

// ============================================
// SELLER CATALOG APIs (Required by Shiprocket)
// ============================================

// Fetch all products (called by Shiprocket for catalog sync)
router.get('/products', shiprocketController.getProducts);

// Fetch all collections/categories
router.get('/collections', shiprocketController.getCollections);

// Fetch products by collection
router.get('/collections/:collection_id/products', shiprocketController.getProductsByCollection);

// ============================================
// CHECKOUT APIs (Called by your frontend)
// ============================================

// Generate access token for Shiprocket checkout
router.post('/generate-token', shiprocketController.generateAccessToken);

// Get order details (optional)
router.post('/order-details', shiprocketController.getOrderDetails);

// ============================================
// WEBHOOK ENDPOINTS (Called by Shiprocket)
// ============================================

// Order webhook - receives completed orders from Shiprocket
router.post('/order-webhook', shiprocketController.orderWebhook);

// Product update webhook - called when products are updated
router.post('/product-update-webhook', shiprocketController.productUpdateWebhook);

// Collection update webhook - called when collections are updated
router.post('/collection-update-webhook', shiprocketController.collectionUpdateWebhook);

// ============================================
// HEALTH CHECK
// ============================================

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Shiprocket integration is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      catalog: {
        products: '/api/shiprocket/products',
        collections: '/api/shiprocket/collections',
        productsByCollection: '/api/shiprocket/collections/:id/products'
      },
      checkout: {
        generateToken: '/api/shiprocket/generate-token',
        orderDetails: '/api/shiprocket/order-details'
      },
      webhooks: {
        orders: '/api/shiprocket/order-webhook',
        products: '/api/shiprocket/product-update-webhook',
        collections: '/api/shiprocket/collection-update-webhook'
      }
    }
  });
});

module.exports = router;
