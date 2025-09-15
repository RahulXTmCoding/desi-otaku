const shiprocketService = require('../services/shiprocketService');
const crypto = require('crypto');
// Using built-in fetch (Node.js 18+)

/**
 * Shiprocket Controller
 * Handles Shiprocket integration endpoints
 */

/**
 * Verify webhook signature for security
 */
function verifyWebhookSignature(body, signature) {
  if (!signature || !process.env.SHIPROCKET_SECRET_KEY) {
    console.warn('⚠️ Webhook signature verification skipped - missing signature or secret key');
    return true; // Allow if not configured (for development)
  }

  try {
    const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
    const computedSignature = crypto
      .createHmac('sha256', process.env.SHIPROCKET_SECRET_KEY)
      .update(bodyString)
      .digest('base64');
    
    // Compare signatures securely
    const isValid = computedSignature === signature;
    
    if (!isValid) {
      console.error('❌ Signature mismatch:', {
        computed: computedSignature.substring(0, 10) + '...',
        received: signature.substring(0, 10) + '...'
      });
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ Error verifying webhook signature:', error);
    return false;
  }
}

// Minimal catalog APIs required by Shiprocket
exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    
    // Return minimal placeholder products since we use dynamic catalog_data
    const products = [
      {
        id: "placeholder-product",
        title: "Dynamic Product",
        body_html: "<p>All products handled dynamically via catalog_data</p>",
        vendor: "Your T-Shirt Brand",
        product_type: "Apparel",
        updated_at: new Date().toISOString(),
        status: "active",
        variants: [
          {
            id: "placeholder-variant",
            title: "Placeholder Variant",
            price: "499.00",
            quantity: 999,
            sku: "PLACEHOLDER-001",
            updated_at: new Date().toISOString(),
            image: {
              src: "https://via.placeholder.com/300x300?text=Dynamic+Product"
            },
            weight: 0.2
          }
        ],
        image: {
          src: "https://via.placeholder.com/300x300?text=Dynamic+Product"
        }
      }
    ];

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: products.length,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('Error fetching products for Shiprocket:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

exports.getCollections = async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    
    // Return minimal placeholder collections
    const collections = [
      {
        id: "placeholder-collection",
        updated_at: new Date().toISOString(),
        title: "All Products",
        body_html: "<p>Dynamic collection - all products handled via catalog_data</p>",
        image: {
          src: "https://via.placeholder.com/300x300?text=Dynamic+Collection"
        }
      }
    ];

    res.json({
      collections,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: collections.length,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('Error fetching collections for Shiprocket:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
};

exports.getProductsByCollection = async (req, res) => {
  try {
    const { collection_id } = req.params;
    const { page = 1, limit = 100 } = req.query;
    
    // Return empty since we handle everything dynamically
    res.json({
      products: [],
      collection_id,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        totalPages: 0
      },
      message: "Products handled dynamically via catalog_data"
    });
  } catch (error) {
    console.error('Error fetching products by collection for Shiprocket:', error);
    res.status(500).json({ error: 'Failed to fetch products by collection' });
  }
};

// Generate access token for Shiprocket checkout
exports.generateAccessToken = async (req, res) => {
  try {
    const { cart, discounts = {} } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'Cart is required and must contain items' });
    }

    // Calculate discounts
    const calculatedDiscounts = shiprocketService.calculateDiscounts(cart, discounts);
    
    // Transform cart to Shiprocket format
    const shiprocketPayload = shiprocketService.processCartForShiprocket(cart, calculatedDiscounts);
    
    console.log('🚀 Shiprocket Payload:', JSON.stringify(shiprocketPayload, null, 2));

    // Generate HMAC for authentication
    const hmac = shiprocketService.generateHMAC(shiprocketPayload);
    
    // Call Shiprocket API to generate token
    const response = await fetch(`${shiprocketService.baseUrl}/api/v1/access-token/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': `Bearer ${shiprocketService.apiKey}`,
        'X-Api-HMAC-SHA256': hmac
      },
      body: JSON.stringify(shiprocketPayload)
    });

    const data = await response.json();

    if (response.ok && data.result?.token) {
      console.log('✅ Shiprocket token generated successfully');
      res.json({
        success: true,
        token: data.result.token,
        order_id: data.result.order_id,
        payload: shiprocketPayload // For debugging
      });
    } else {
      console.error('❌ Shiprocket token generation failed:', data);
      res.status(400).json({
        error: 'Failed to generate checkout token',
        details: data
      });
    }
  } catch (error) {
    console.error('Error generating Shiprocket access token:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

// Handle order webhook from Shiprocket
exports.orderWebhook = async (req, res) => {
  try {
    const shiprocketOrder = req.body;
    const signature = req.headers['x-shiprocket-signature'] || req.headers['x-api-hmac-sha256'];
    
    console.log('📦 Received Shiprocket order webhook:', JSON.stringify(shiprocketOrder, null, 2));

    // Verify webhook signature for security
    if (!verifyWebhookSignature(req.body, signature)) {
      console.error('❌ Invalid webhook signature - possible security threat');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    if (!shiprocketOrder.order_id) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    // Process the order using our service
    const processedOrder = shiprocketService.processOrderWebhook(shiprocketOrder);
    
    // Create order in your database
    const Order = require('../models/order');
    
    const orderData = {
      shiprocketOrderId: processedOrder.shiprocketOrderId,
      orderItems: processedOrder.items.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        sku: item.sku,
        imageUrl: item.imageUrl,
        isCustom: item.isCustom,
        customization: item.customization
      })),
      user: null, // Shiprocket doesn't provide user ID, this could be guest order
      amount: processedOrder.totalAmount,
      address: {
        // Shiprocket should provide address in webhook
        phone: processedOrder.customer.phone,
        email: processedOrder.customer.email
      },
      paymentId: processedOrder.shiprocketOrderId,
      paymentStatus: processedOrder.status === 'confirmed' ? 'completed' : 'pending',
      orderStatus: 'confirmed',
      shippingStatus: 'pending',
      paymentMethod: processedOrder.paymentMethod === 'CASH_ON_DELIVERY' ? 'cod' : 'online',
      orderDate: new Date(),
      shiprocketData: processedOrder.rawShiprocketData
    };

    const savedOrder = await Order.create(orderData);
    
    console.log('✅ Order saved to database:', savedOrder._id);

    // Send to printing queue for custom items
    const customItems = processedOrder.items.filter(item => item.isCustom);
    if (customItems.length > 0) {
      console.log(`🎨 Found ${customItems.length} custom items, sending to printing queue`);
      // TODO: Implement printing queue integration
      for (const item of customItems) {
        console.log('🖨️ Custom item for printing:', {
          orderId: savedOrder._id,
          item: item.name,
          customization: item.customization
        });
      }
    }

    // Send confirmation email
    try {
      const emailService = require('../services/emailService');
      await emailService.sendOrderConfirmationWithTracking(savedOrder);
      console.log('📧 Order confirmation email sent');
    } catch (emailError) {
      console.error('❌ Failed to send confirmation email:', emailError);
    }

    res.json({ 
      success: true, 
      orderId: savedOrder._id,
      message: 'Order processed successfully'
    });

  } catch (error) {
    console.error('❌ Error processing Shiprocket order webhook:', error);
    res.status(500).json({ 
      error: 'Failed to process order',
      message: error.message 
    });
  }
};

// Product update webhook (called when your products change)
exports.productUpdateWebhook = async (req, res) => {
  try {
    const productData = req.body;
    
    console.log('🔄 Product update webhook received:', productData.id);

    // Since we use dynamic catalog_data, we don't need to sync individual products
    // Just acknowledge the webhook
    res.json({ 
      success: true, 
      message: 'Product update acknowledged - using dynamic catalog_data' 
    });

  } catch (error) {
    console.error('Error handling product update webhook:', error);
    res.status(500).json({ error: 'Failed to process product update' });
  }
};

// Collection update webhook
exports.collectionUpdateWebhook = async (req, res) => {
  try {
    const collectionData = req.body;
    
    console.log('🔄 Collection update webhook received:', collectionData.id);

    // Since we use dynamic catalog_data, we don't need to sync collections
    // Just acknowledge the webhook
    res.json({ 
      success: true, 
      message: 'Collection update acknowledged - using dynamic catalog_data' 
    });

  } catch (error) {
    console.error('Error handling collection update webhook:', error);
    res.status(500).json({ error: 'Failed to process collection update' });
  }
};

// Get order details (optional - for order tracking)
exports.getOrderDetails = async (req, res) => {
  try {
    const { order_id } = req.body;
    
    if (!order_id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Find order in database
    const Order = require('../models/order');
    const order = await Order.findOne({ shiprocketOrderId: order_id });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      success: true,
      order: {
        id: order._id,
        shiprocketOrderId: order.shiprocketOrderId,
        items: order.orderItems,
        total: order.amount,
        status: order.orderStatus,
        paymentStatus: order.paymentStatus,
        shippingStatus: order.shippingStatus,
        orderDate: order.orderDate
      }
    });

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
};
