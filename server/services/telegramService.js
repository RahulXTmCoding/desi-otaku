const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

class TelegramService {
  constructor() {
    this.bot = null;
    this.adminChatId = null;
    this.isEnabled = false;
    this.initialize();
  }

  initialize() {
    try {
      // Check if Telegram is enabled and configured
      if (process.env.TELEGRAM_NOTIFICATIONS_ENABLED !== 'true') {
        console.log('Telegram notifications disabled');
        return;
      }

      if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_ADMIN_CHAT_ID) {
        console.log('Telegram configuration missing - notifications disabled');
        console.log('Required: TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID');
        return;
      }

      // Initialize bot with polling disabled (we only send messages)
      this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
      this.adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
      this.isEnabled = true;

      console.log('✅ Telegram notification service initialized');

      // Test connection
      this.testConnection();

    } catch (error) {
      console.error('❌ Telegram service initialization failed:', error.message);
      this.isEnabled = false;
    }
  }

  async testConnection() {
    try {
      const me = await this.bot.getMe();
      console.log(`✅ Telegram bot connected: @${me.username}`);
    } catch (error) {
      console.error('❌ Telegram bot connection test failed:', error.message);
      this.isEnabled = false;
    }
  }

  // Send new order notification with visual content
  async sendNewOrderNotification(order, customerInfo = null) {
    if (!this.isEnabled) {
      console.log('Telegram notifications disabled - skipping order notification');
      return { success: false, reason: 'disabled' };
    }

    try {
      // Determine if it's a guest order
      const isGuest = !order.user && order.guestInfo;
      const customer = customerInfo || order.user || order.guestInfo;

      // Generate message text
      const messageText = this.generateOrderMessage(order, customer, isGuest);

      // Send main message
      await this.bot.sendMessage(this.adminChatId, messageText, {
        parse_mode: 'HTML',
        disable_web_page_preview: false
      });

      // Send product images and custom design files
      await this.sendOrderVisuals(order);

      console.log(`✅ Telegram order notification sent for #${order._id}`);
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to send Telegram order notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate comprehensive order message
  generateOrderMessage(order, customer, isGuest = false) {
    const customerName = customer?.name || 'Customer';
    const customerEmail = customer?.email || 'No email';
    const orderTotal = order.amount || 0;
    const orderDate = new Date(order.createdAt).toLocaleString('en-IN');
    const itemCount = order.products?.length || 0;

    // Check if it's a COD order
    const isCODOrder = order.paymentMethod?.toLowerCase() === 'cod';
    
    // Get comprehensive phone number info for COD orders
    const customerPhone = order.shipping?.phone || customer?.phone || 
                         order.guestInfo?.phone ||  
                         'No phone';

    // Generate items list
    const itemsList = this.generateItemsList(order.products);

    // Enhanced priority indicators for COD orders
    let priorityEmoji, priorityText;
    if (isCODOrder && orderTotal > 2000) {
      priorityEmoji = '🔥💰';
      priorityText = 'HIGH VALUE COD ORDER';
    } else if (isCODOrder) {
      priorityEmoji = '💰📦';
      priorityText = 'COD ORDER - CALL CUSTOMER';
    } else if (orderTotal > 2000) {
      priorityEmoji = '🔥';
      priorityText = 'HIGH VALUE ORDER';
    } else {
      priorityEmoji = '📦';
      priorityText = 'NEW ORDER';
    }

    // Generate shipping address info
    const shippingInfo = this.generateShippingInfo(order);

    // Links
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const adminOrderUrl = `${clientUrl}/admin/orders`;
    const trackingUrl = `${clientUrl}/track/${Buffer.from(order._id.toString()).toString('base64url')}`;

    return `
${priorityEmoji} <b>${priorityText} ALERT!</b>

📋 <b>Order Details:</b>
• Order ID: <code>#${order._id}</code>
• Date: ${orderDate}
• Amount: <b>₹${orderTotal.toLocaleString('en-IN')}</b>
• Items: ${itemCount}
• Status: ${order.status} ✅

${isCODOrder ? `
💰 <b>⚠️ CASH ON DELIVERY ⚠️</b>
📞 <b>CALL CUSTOMER TO CONFIRM ORDER!</b>
📱 <b>Customer Phone: ${customerPhone}</b>
💵 <b>Amount to Collect: ₹${orderTotal.toLocaleString('en-IN')}</b>

` : ''}👤 <b>Customer Info:</b>
• Name: ${customerName}${isGuest ? ' (Guest)' : ''}
• Email: ${customerEmail}
• Phone: ${customerPhone}

🛒 <b>Items to Prepare:</b>
${itemsList}

${shippingInfo}

💳 <b>Payment:</b> ${isCODOrder ? 'Cash on Delivery 💰' : (order.paymentStatus || 'Pending')}
${order.shipping?.shippingCost ? `📦 <b>Shipping:</b> ₹${order.shipping.shippingCost}` : '📦 <b>Shipping:</b> FREE'}

🔗 <b>Quick Actions:</b>
• <a href="${adminOrderUrl}">Admin Panel</a>
• <a href="${trackingUrl}">Order Tracking</a>

⏰ <b>TIME TO PREPARE!</b> 🎌
    `.trim();
  }
  
  // Generate detailed shipping information
  generateShippingInfo(order) {
    const shipping = order.shipping;
    
    if (shipping && (shipping.name || shipping.city || shipping.state)) {
      let shippingText = `📍 <b>Delivery Address: 📍${order?.address} </b>\n`;
      
      if (shipping.name) {
        shippingText += `• Name: ${shipping.name}\n`;
      }
      
      if (shipping.city && shipping.state) {
        shippingText += `• Location: ${shipping.city}, ${shipping.state}\n`;
      }
      
      if (shipping.pincode) {
        shippingText += `• PIN Code: ${shipping.pincode}\n`;
      }
      
      if (shipping.phone) {
        shippingText += `• Phone: ${shipping.phone}\n`;
      }
      
      return shippingText.trim();
    } else if (order.address) {
      return `📍 <b>Shipping Address:</b>\n${order.address}`;
    } else {
      return `📍 <b>Shipping Address:</b>\nAddress not provided`;
    }
  }

  // Generate detailed items list
  generateItemsList(products) {
    if (!products || products.length === 0) {
      return '• No items found';
    }

    return products.map((item, index) => {
      const itemNumber = index + 1;
      const itemName = item.name || 'Unnamed Item';
      const itemSize = item.size || 'One Size';
      const itemColor = item.color || item.selectedColor || 'Default';
      const itemPrice = item.price || 0;
      const itemQuantity = item.count || item.quantity || 1;
      const itemTotal = itemPrice * itemQuantity;

      let itemDetails = `${itemNumber}️⃣ <b>${itemName}</b>\n`;
      itemDetails += `   📏 Size: ${itemSize} | 🎨 Color: ${itemColor}\n`;
      itemDetails += `   💰 ₹${itemPrice} x ${itemQuantity} = ₹${itemTotal}`;

      // Add product link if it's a regular product with valid ID
      // Handle both populated (object) and non-populated (string) product references
      const productId = typeof item.product === 'object' && item.product?._id 
        ? item.product._id 
        : item.product;
      
      if (productId && 
          productId !== 'custom' && 
          productId !== null && 
          productId !== undefined && 
          productId !== '' &&
          typeof productId === 'string' &&
          productId.length >= 20) { // MongoDB ObjectId is 24 chars, but allow some flexibility
        
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const productUrl = `${clientUrl}/product/${productId}`;
        itemDetails += `\n   🔗 <a href="${productUrl}">View Product</a>`;
      } else if (!item.isCustom && !item.customization && item.product !== 'custom') {
        // For regular products without valid IDs, show placeholder
        itemDetails += `\n   📦 Product Link: Not Available`;
      }

      // ✅ IMPROVED: Use consistent custom product detection
      if (this.isCustomProduct(item)) {
        itemDetails += `\n   🎨 <b>CUSTOM DESIGN DETAILS:</b>`;
        
        // Design ID
        if (item.designId) {
          itemDetails += `\n   • Design ID: <code>${item.designId}</code>`;
        }
        
        // Design Name
        if (item.customDesign) {
          itemDetails += `\n   • Design Name: ${item.customDesign}`;
        }
        
        // Position/Placement
        if (item.customization?.position) {
          itemDetails += `\n   • Position: ${item.customization.position}`;
        }
        if (item.customization?.placement) {
          itemDetails += `\n   • Placement: ${item.customization.placement}`;
        }
        
        // Front/Back Design Details
        if (item.customization) {
          if (item.customization.frontDesign) {
            itemDetails += `\n   • <b>Front Design:</b>`;
            if (item.customization.frontDesign.designId) {
              itemDetails += `\n     - Design ID: <code>${item.customization.frontDesign.designId}</code>`;
            }
            if (item.customization.frontDesign.position) {
              itemDetails += `\n     - Position: ${item.customization.frontDesign.position}`;
            }
            if (item.customization.frontDesign.price) {
              itemDetails += `\n     - Design Cost: ₹${item.customization.frontDesign.price}`;
            }
            if (item.customization.frontDesign.designImage) {
              itemDetails += `\n     - Image: ✓ Provided`;
              itemDetails += `\n     - URL: ${item.customization.frontDesign.designImage}`;
            }
          }
          if (item.customization.backDesign) {
            itemDetails += `\n   • <b>Back Design:</b>`;
            if (item.customization.backDesign.designId) {
              itemDetails += `\n     - Design ID: <code>${item.customization.backDesign.designId}</code>`;
            }
            if (item.customization.backDesign.position) {
              itemDetails += `\n     - Position: ${item.customization.backDesign.position}`;
            }
            if (item.customization.backDesign.price) {
              itemDetails += `\n     - Design Cost: ₹${item.customization.backDesign.price}`;
            }
            if (item.customization.backDesign.designImage) {
              itemDetails += `\n     - Image: ✓ Provided`;
              itemDetails += `\n     - URL: ${item.customization.backDesign.designImage}`;
            }
          }
        }
        
        // Design Image indicators
        if (item.designImage || item.image) {
          itemDetails += `\n   • Custom Image: ✓ Provided`;
        }
        
        itemDetails += `\n   ⚠️ <b>SPECIAL HANDLING REQUIRED</b>`;
      }

      return itemDetails;
    }).join('\n\n');
  }

  // Send product images and custom design files
  async sendOrderVisuals(order) {
    if (!order.products || order.products.length === 0) {
      return;
    }

    for (const [index, item] of order.products.entries()) {
      try {
        // ✅ IMPROVED: More robust custom product detection
        const isCustomProduct = this.isCustomProduct(item);
        
        if (isCustomProduct) {
          await this.sendCustomDesignVisuals(item, index + 1, order._id);
        } else {
          // For regular products, send product images
          await this.sendProductVisuals(item, index + 1);
        }
      } catch (error) {
        console.error(`Failed to send visuals for item ${index + 1}:`, error.message);
        // Continue with other items even if one fails
      }
    }
  }

  // ✅ NEW: Robust custom product detection method
  isCustomProduct(item) {
    // Check explicit custom flag
    if (item.isCustom === true) {
      return true;
    }
    
    // Check if product is null (custom products have null product reference)
    if (item.product === null) {
      return true;
    }
    
    // Check if customization exists and has actual design data
    if (item.customization && 
        (item.customization.frontDesign || item.customization.backDesign)) {
      return true;
    }
    
    // Check for legacy custom design fields
    if (item.designId || item.designImage || item.customDesign) {
      return true;
    }
    
    // Check for temporary/invalid product IDs that indicate custom products
    const productId = typeof item.product === 'object' && item.product?._id 
      ? item.product._id 
      : item.product;
      
    if (productId && typeof productId === 'string') {
      // Invalid ObjectId patterns that indicate custom products
      if (productId === 'custom' || 
          productId.startsWith('temp_') || 
          productId.startsWith('custom') ||
          productId.length < 12 ||
          !/^[0-9a-fA-F]{24}$/.test(productId)) {
        return true;
      }
    }
    
    // If none of the above conditions are met, it's a regular product
    return false;
  }

  // Send custom design visuals
  async sendCustomDesignVisuals(item, itemNumber, orderId) {
    try {
      const caption = `🎨 Item ${itemNumber}: ${item.name || 'Custom Design'}`;
      
      // Generate detailed design information message
      let designDetails = `🎨 <b>CUSTOM DESIGN BREAKDOWN - Item ${itemNumber}</b>\n\n`;
      designDetails += `📦 <b>Product:</b> ${item.name || 'Custom Design'}\n`;
      
      // Add overall design info
      if (item.designId) {
        designDetails += `🆔 <b>Main Design ID:</b> <code>${item.designId}</code>\n`;
      }
      if (item.customDesign) {
        designDetails += `📝 <b>Design Name:</b> ${item.customDesign}\n`;
      }
      
      if (item.customization) {
        if (item.customization.position) {
          designDetails += `📍 <b>Overall Position:</b> ${item.customization.position}\n`;
        }
        if (item.customization.placement) {
          designDetails += `📌 <b>Placement:</b> ${item.customization.placement}\n`;
        }
        
        designDetails += `\n`;
        
        // Front Design Details
        if (item.customization.frontDesign) {
          designDetails += `🔥 <b>FRONT DESIGN SPECIFICATIONS:</b>\n`;
          if (item.customization.frontDesign.designId) {
            designDetails += `   • Design ID: <code>${item.customization.frontDesign.designId}</code>\n`;
          }
          if (item.customization.frontDesign.position) {
            designDetails += `   • Position: ${item.customization.frontDesign.position}\n`;
          }
          if (item.customization.frontDesign.price) {
            designDetails += `   • Design Cost: ₹${item.customization.frontDesign.price}\n`;
          }
          if (item.customization.frontDesign.designImage) {
            designDetails += `   • Image Status: ✅ Ready for Production\n`;
            designDetails += `   • Image URL: ${item.customization.frontDesign.designImage}\n`;
          }
          designDetails += `\n`;
        }
        
        // Back Design Details
        if (item.customization.backDesign) {
          designDetails += `🔙 <b>BACK DESIGN SPECIFICATIONS:</b>\n`;
          if (item.customization.backDesign.designId) {
            designDetails += `   • Design ID: <code>${item.customization.backDesign.designId}</code>\n`;
          }
          if (item.customization.backDesign.position) {
            designDetails += `   • Position: ${item.customization.backDesign.position}\n`;
          }
          if (item.customization.backDesign.price) {
            designDetails += `   • Design Cost: ₹${item.customization.backDesign.price}\n`;
          }
          if (item.customization.backDesign.designImage) {
            designDetails += `   • Image Status: ✅ Ready for Production\n`;
            designDetails += `   • Image URL: ${item.customization.backDesign.designImage}\n`;
          }
          designDetails += `\n`;
        }
      }
      
      // Legacy design support
      if (item.designImage || item.image) {
        designDetails += `🖼️ <b>LEGACY DESIGN IMAGE:</b>\n`;
        designDetails += `   • URL: ${item.designImage || item.image}\n\n`;
      }
      
      designDetails += `⚠️ <b>PRODUCTION ALERT:</b> Custom design requires special handling\n`;
      designDetails += `🎯 <b>Priority:</b> Verify all design specifications before printing\n`;
      
      // Send detailed design information
      await this.bot.sendMessage(this.adminChatId, designDetails, {
        parse_mode: 'HTML',
        disable_web_page_preview: true
      });
      
      // Send actual design images
      if (item.customization) {
        // Send front design image
        if (item.customization.frontDesign?.designImage) {
          await this.sendImageFromUrl(
            item.customization.frontDesign.designImage,
            `🔥 Front Design - Item ${itemNumber}: ${item.name || 'Custom Design'}`
          );
        }

        // Send back design image
        if (item.customization.backDesign?.designImage) {
          await this.sendImageFromUrl(
            item.customization.backDesign.designImage,
            `🔙 Back Design - Item ${itemNumber}: ${item.name || 'Custom Design'}`
          );
        }
      } else if (item.designImage || item.image) {
        // Legacy single design image
        await this.sendImageFromUrl(
          item.designImage || item.image,
          caption
        );
      }

      // Send admin link for detailed view
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const adminUrl = `${clientUrl}/admin/orders`;
      
      await this.bot.sendMessage(this.adminChatId, 
        `🔗 <b>Complete Design Details:</b>\n<a href="${adminUrl}">View Full Order in Admin Panel</a>\n\n📋 Order ID: <code>#${orderId}</code>`,
        { parse_mode: 'HTML' }
      );

    } catch (error) {
      console.error('Failed to send custom design visuals:', error);
    }
  }

  // Send product visuals
  async sendProductVisuals(item, itemNumber) {
    try {
      const Product = require('../models/product');
      
      // Try to get product details
      let product = null;
      if (item.product) {
        try {
          product = await Product.findById(item.product);
        } catch (err) {
          console.log('Product not found in database');
        }
      }

      const caption = `📦 Item ${itemNumber}: ${item.name}`;
      
      // Send product image if available
      if (product && product.photoUrl) {
        await this.sendImageFromUrl(product.photoUrl, caption);
      } else if (item.photoUrl) {
        await this.sendImageFromUrl(item.photoUrl, caption);
      } else {
        // Send text-only notification if no image
        await this.bot.sendMessage(this.adminChatId, 
          `📦 Item ${itemNumber}: ${item.name}\n🔍 No image available`,
          { parse_mode: 'HTML' }
        );
      }

      // Send product page link
      if (item.product && item.product !== 'custom') {
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const productUrl = `${clientUrl}/product/${item.product}`;
        
        await this.bot.sendMessage(this.adminChatId, 
          `🔗 <b>Product Link:</b>\n<a href="${productUrl}">View on Website</a>`,
          { parse_mode: 'HTML' }
        );
      }

    } catch (error) {
      console.error('Failed to send product visuals:', error);
    }
  }

  // Send image from URL
  async sendImageFromUrl(imageUrl, caption = '') {
    try {
      if (!imageUrl) {
        return;
      }

      // Handle different URL formats
      let fullUrl = imageUrl;
      if (imageUrl.startsWith('/')) {
        // Relative URL - construct full URL
        const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        fullUrl = `${baseUrl}${imageUrl}`;
      } else if (!imageUrl.startsWith('http')) {
        // Data URL or base64 - skip for now
        console.log('Skipping data URL image');
        return;
      }

      // Send photo directly from URL
      await this.bot.sendPhoto(this.adminChatId, fullUrl, {
        caption: caption || 'Order Item Image',
        parse_mode: 'HTML'
      });

    } catch (error) {
      console.error('Failed to send image from URL:', error.message);
      
      // Fallback: send text notification
      await this.bot.sendMessage(this.adminChatId, 
        `🖼️ Image: ${caption}\n🔗 ${imageUrl}`,
        { parse_mode: 'HTML' }
      );
    }
  }

  // Send order status update notification
  async sendOrderStatusUpdate(order, oldStatus, newStatus) {
    if (!this.isEnabled) {
      return { success: false, reason: 'disabled' };
    }

    try {
      const statusEmojis = {
        'Received': '📥',
        'Processing': '⚙️',
        'Shipped': '🚚',
        'Delivered': '✅',
        'Cancelled': '❌'
      };

      const message = `
📊 <b>ORDER STATUS UPDATE</b>

📋 Order: <code>#${order._id}</code>
💰 Amount: ₹${order.amount?.toLocaleString('en-IN')}

📈 Status Changed:
${statusEmojis[oldStatus] || '📋'} ${oldStatus} → ${statusEmojis[newStatus] || '📋'} <b>${newStatus}</b>

${newStatus === 'Shipped' ? '🚚 Order is now on its way to customer!' : ''}
${newStatus === 'Delivered' ? '🎉 Order delivered successfully!' : ''}
${newStatus === 'Cancelled' ? '⚠️ Order has been cancelled.' : ''}

⏰ Updated: ${new Date().toLocaleString('en-IN')}
      `.trim();

      await this.bot.sendMessage(this.adminChatId, message, {
        parse_mode: 'HTML'
      });

      return { success: true };

    } catch (error) {
      console.error('Failed to send status update notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Send daily sales summary
  async sendDailySummary(summaryData) {
    if (!this.isEnabled) {
      return { success: false, reason: 'disabled' };
    }

    try {
      const { totalOrders, totalRevenue, topProducts, customOrders } = summaryData;
      const today = new Date().toLocaleDateString('en-IN');

      const message = `
📊 <b>DAILY SALES SUMMARY</b>
📅 ${today}

💰 <b>Revenue:</b> ₹${totalRevenue?.toLocaleString('en-IN') || 0}
🛍️ <b>Orders:</b> ${totalOrders || 0}
🎨 <b>Custom Orders:</b> ${customOrders || 0}

${topProducts && topProducts.length > 0 ? `
🏆 <b>Top Products:</b>
${topProducts.map((product, index) => 
  `${index + 1}. ${product.name} (${product.count} sold)`
).join('\n')}
` : ''}

🎌 Keep up the great work!
      `.trim();

      await this.bot.sendMessage(this.adminChatId, message, {
        parse_mode: 'HTML'
      });

      return { success: true };

    } catch (error) {
      console.error('Failed to send daily summary:', error);
      return { success: false, error: error.message };
    }
  }

  // Send high-value order alert
  async sendHighValueOrderAlert(order) {
    if (!this.isEnabled || !order.amount || order.amount < 2000) {
      return;
    }

    try {
      const message = `
🔥 <b>HIGH VALUE ORDER ALERT!</b>

💎 Order: <code>#${order._id}</code>
💰 Amount: <b>₹${order.amount.toLocaleString('en-IN')}</b>

🎯 <b>Special attention required!</b>
⚡ Priority processing recommended
🎁 Consider adding premium packaging

⏰ Received: ${new Date(order.createdAt).toLocaleString('en-IN')}
      `.trim();

      await this.bot.sendMessage(this.adminChatId, message, {
        parse_mode: 'HTML'
      });

    } catch (error) {
      console.error('Failed to send high-value order alert:', error);
    }
  }

  // Send low stock alert notification
  async sendLowStockAlert(lowStockItems) {
    if (!this.isEnabled || !lowStockItems || lowStockItems.length === 0) {
      return { success: false, reason: 'disabled or no items' };
    }

    try {
      const criticalCount = lowStockItems.filter(item => item.currentStock === 0).length;
      const lowCount = lowStockItems.filter(item => item.currentStock === 1).length;
      
      let alertLevel = '📉';
      let alertText = 'LOW STOCK ALERT';
      
      if (criticalCount > 0) {
        alertLevel = '🚨⚠️';
        alertText = 'CRITICAL STOCK ALERT - OUT OF STOCK!';
      }

      let message = `
${alertLevel} <b>${alertText}</b>

⚠️ <b>INVENTORY ACTION REQUIRED!</b>
📊 Products affected: ${lowStockItems.length}
${criticalCount > 0 ? `🚨 Out of stock: ${criticalCount}` : ''}
${lowCount > 0 ? `📉 Only 1 left: ${lowCount}` : ''}

📋 <b>AFFECTED PRODUCTS:</b>
`;

      lowStockItems.forEach((item, index) => {
        const stockEmoji = item.currentStock === 0 ? '🚨' : '📉';
        const urgency = item.currentStock === 0 ? 'OUT OF STOCK!' : `Only ${item.currentStock} left`;
        
        message += `
${index + 1}. ${stockEmoji} <b>${item.productName}</b>
   • Size: ${item.size}
   • Current Stock: <b>${item.currentStock}</b> ${item.currentStock === 0 ? '(SOLD OUT)' : ''}
   • Previous Stock: ${item.previousStock}
   • Status: <b>${urgency}</b>`;

        // Add product link if available
        if (item.productId) {
          const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
          const productUrl = `${clientUrl}/product/${item.productId}`;
          message += `\n   • <a href="${productUrl}">View Product</a>`;
        }
        
        message += '\n';
      });

      // Add action items
      message += `
🎯 <b>IMMEDIATE ACTIONS:</b>
${criticalCount > 0 ? '🚨 Update out-of-stock products immediately' : ''}
📦 Restock low inventory items
📧 Consider notifying customers about availability
🛒 Review upcoming orders for affected products

⏰ Alert Time: ${new Date().toLocaleString('en-IN')}
🎌 Keep inventory flowing!
      `.trim();

      await this.bot.sendMessage(this.adminChatId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: false
      });

      return { success: true };

    } catch (error) {
      console.error('Failed to send low stock alert:', error);
      return { success: false, error: error.message };
    }
  }

  // Send error notification
  async sendErrorNotification(error, context = '') {
    if (!this.isEnabled) {
      return;
    }

    try {
      const message = `
⚠️ <b>SYSTEM ERROR ALERT</b>

🐛 <b>Error:</b> ${error.message || 'Unknown error'}
📍 <b>Context:</b> ${context || 'No context provided'}
⏰ <b>Time:</b> ${new Date().toLocaleString('en-IN')}

🔧 Please check the server logs for more details.
      `.trim();

      await this.bot.sendMessage(this.adminChatId, message, {
        parse_mode: 'HTML'
      });

    } catch (telegramError) {
      console.error('Failed to send error notification via Telegram:', telegramError);
    }
  }

  // Test notification
  async sendTestNotification() {
    if (!this.isEnabled) {
      return { success: false, reason: 'Telegram notifications disabled' };
    }

    try {
      const message = `
🧪 <b>TEST NOTIFICATION</b>

✅ Telegram Bot is working correctly!
⏰ ${new Date().toLocaleString('en-IN')}

🎌 Your anime t-shirt order notifications are ready!
      `.trim();

      await this.bot.sendMessage(this.adminChatId, message, {
        parse_mode: 'HTML'
      });

      return { success: true };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Send return/exchange request notification
  async sendReturnExchangeRequest(requestData) {
    if (!this.isEnabled) {
      console.log('Telegram notifications disabled - skipping return/exchange notification');
      return { success: false, reason: 'disabled', error: 'Telegram notifications are not enabled' };
    }

    try {
      const {
        orderId,
        name,
        email,
        phone,
        requestType,
        reason,
        issueDescription,
        productDetails,
        timestamp,
        isGuest
      } = requestData;

      const requestTypeEmoji = requestType === 'return' ? '🔄' : '🔁';
      const requestTypeText = requestType === 'return' ? 'RETURN' : 'EXCHANGE';
      const userTypeEmoji = isGuest ? '👤' : '👨‍💼';
      const userType = isGuest ? 'Guest' : 'Registered User';

      const messageText = `
${requestTypeEmoji} <b>${requestTypeText} REQUEST</b>

📦 <b>Order ID:</b> ${orderId}
⏰ <b>Request Time:</b> ${new Date(timestamp).toLocaleString('en-IN')}

${userTypeEmoji} <b>Customer Info:</b>
👤 Name: ${name}
📧 Email: ${email}
📱 Phone: ${phone}
🔐 Type: ${userType}

📝 <b>Request Details:</b>
🎯 Type: <b>${requestTypeText}</b>
⚠️ Reason: ${reason}

💬 <b>Issue Description:</b>
${issueDescription}

📦 <b>Product(s):</b>
${productDetails}

━━━━━━━━━━━━━━━━━━━━━
⏱️ <b>Action Required:</b> Please contact customer within 24 hours

📧 Email customer at: ${email}
📱 Call/WhatsApp: ${phone}
      `.trim();

      await this.bot.sendMessage(this.adminChatId, messageText, {
        parse_mode: 'HTML',
        disable_web_page_preview: true
      });

      console.log(`✅ Telegram ${requestType} request notification sent for order #${orderId}`);
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to send Telegram return/exchange notification:', error);
      return { success: false, error: error?.message || error?.toString() || 'Unknown error occurred' };
    }
  }
}

// Export singleton instance
module.exports = new TelegramService();
