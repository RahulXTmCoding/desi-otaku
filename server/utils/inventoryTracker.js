const telegramService = require('../services/telegramService');

/**
 * Process inventory changes and send low stock alerts
 * @param {Array} stockChanges - Array of stock change objects from product.decreaseStock()
 * @param {String} orderId - The order ID that triggered the inventory change
 */
async function processInventoryChanges(stockChanges, orderId) {
  if (!stockChanges || stockChanges.length === 0) {
    return;
  }

  console.log(`📊 Processing inventory changes for order ${orderId}:`, stockChanges.length, 'items');

  // Filter for low stock items (1 or less)
  const lowStockItems = stockChanges.filter(change => 
    change.currentStock <= 1
  );

  if (lowStockItems.length > 0) {
    console.log(`⚠️ Low stock detected for ${lowStockItems.length} items after order ${orderId}`);
    
    // Send Telegram alert
    try {
      const result = await telegramService.sendLowStockAlert(lowStockItems);
      if (result.success) {
        console.log(`✅ Low stock alert sent to Telegram for order ${orderId}`);
      } else {
        console.log(`❌ Failed to send low stock alert: ${result.reason || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`❌ Error sending low stock alert for order ${orderId}:`, error);
    }

    // Log critical stock items (completely out of stock)
    const outOfStockItems = lowStockItems.filter(item => item.currentStock === 0);
    if (outOfStockItems.length > 0) {
      console.log(`🚨 CRITICAL: ${outOfStockItems.length} items are now OUT OF STOCK after order ${orderId}:`);
      outOfStockItems.forEach(item => {
        console.log(`  - ${item.productName} (Size: ${item.size}) - SOLD OUT`);
      });
    }

    // Log low stock items (only 1 left)
    const veryLowStockItems = lowStockItems.filter(item => item.currentStock === 1);
    if (veryLowStockItems.length > 0) {
      console.log(`📉 WARNING: ${veryLowStockItems.length} items have only 1 left after order ${orderId}:`);
      veryLowStockItems.forEach(item => {
        console.log(`  - ${item.productName} (Size: ${item.size}) - Only 1 remaining`);
      });
    }
  } else {
    console.log(`✅ No low stock issues detected after order ${orderId}`);
  }
}

/**
 * Process inventory decreases for an entire order
 * @param {Array} orderProducts - Array of order products
 * @param {String} orderId - The order ID
 */
async function processOrderInventoryChanges(orderProducts, orderId) {
  const Product = require('../models/product');
  const stockChanges = [];

  try {
    // Process each product in the order
    for (const item of orderProducts) {
      // Skip custom products (they don't affect inventory)
      if (!item.product || item.product === 'custom' || item.isCustom) {
        console.log(`⚪ Skipping custom product: ${item.name}`);
        continue;
      }

      try {
        // Get the product from database
        const product = await Product.findById(item.product);
        if (!product || product.isDeleted) {
          console.error(`❌ Product not found or deleted: ${item.product}`);
          continue;
        }

        // Decrease stock and get change information
        const result = product.decreaseStock(item.size, item.count || item.quantity || 1);
        
        if (result.success) {
          // Save the product with updated stock
          await product.save();
          
          // Add to stock changes for tracking
          stockChanges.push(result.stockChange);
          
          console.log(`📦 Updated inventory: ${product.name} (${item.size}) - ${result.stockChange.previousStock} → ${result.stockChange.currentStock}`);
        } else {
          console.error(`❌ Failed to decrease stock for ${product.name} (${item.size}) - insufficient inventory`);
        }
      } catch (error) {
        console.error(`❌ Error processing inventory for product ${item.product}:`, error);
      }
    }

    // Process all stock changes and send alerts if needed
    await processInventoryChanges(stockChanges, orderId);

    return {
      success: true,
      stockChanges,
      lowStockAlert: stockChanges.some(change => change.currentStock <= 1)
    };

  } catch (error) {
    console.error(`❌ Error processing order inventory changes for ${orderId}:`, error);
    return {
      success: false,
      error: error.message,
      stockChanges: []
    };
  }
}

module.exports = {
  processInventoryChanges,
  processOrderInventoryChanges
};
