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
    const customerPhone = customer?.phone || 'No phone';
    const orderTotal = order.amount || 0;
    const orderDate = new Date(order.createdAt).toLocaleString('en-IN');
    const itemCount = order.products?.length || 0;

    // Check for custom items
    const hasCustomItems = order.products?.some(item => 
      item.isCustom || item.customization || item.product === null
    );

    // Generate items list
    const itemsList = this.generateItemsList(order.products);

    // Priority indicators
    const priorityEmoji = orderTotal > 2000 ? '🔥' : hasCustomItems ? '🎨' : '📦';
    const priorityText = orderTotal > 2000 ? 'HIGH VALUE' : hasCustomItems ? 'CUSTOM DESIGN' : 'STANDARD';

    // Links
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const adminOrderUrl = `${clientUrl}/admin/orders`;
    const trackingUrl = `${clientUrl}/track/${Buffer.from(order._id.toString()).toString('base64url')}`;

    return `
${priorityEmoji} <b>${priorityText} ORDER ALERT!</b>

📋 <b>Order Details:</b>
• Order ID: <code>#${order._id}</code>
• Date: ${orderDate}
• Amount: <b>₹${orderTotal.toLocaleString('en-IN')}</b>
• Items: ${itemCount}
• Status: ${order.status} ✅

👤 <b>Customer Info:</b>
• Name: ${customerName}${isGuest ? ' (Guest)' : ''}
• Email: ${customerEmail}
• Phone: ${customerPhone}

🛒 <b>Items to Prepare:</b>
${itemsList}

📍 <b>Shipping Address:</b>
${order.address || 'Address not provided'}

💳 <b>Payment:</b> ${order.paymentStatus || 'Pending'}
${order.shipping?.shippingCost ? `📦 <b>Shipping:</b> ₹${order.shipping.shippingCost}` : '📦 <b>Shipping:</b> FREE'}

${hasCustomItems ? '⚠️ <b>CUSTOM ORDER - EXTRA ATTENTION REQUIRED!</b>' : ''}

🔗 <b>Quick Actions:</b>
• <a href="${adminOrderUrl}">Admin Panel</a>
• <a href="${trackingUrl}">Order Tracking</a>

⏰ <b>TIME TO PREPARE!</b> 🎌
    `.trim();
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

      // Add product link if it's a regular product
      if (item.product && item.product !== 'custom') {
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const productUrl = `${clientUrl}/product/${item.product}`;
        itemDetails += `\n   🔗 <a href="${productUrl}">View Product</a>`;
      }

      // Add custom design indicators
      if (item.isCustom || item.customization || item.product === null) {
        itemDetails += `\n   🎨 <b>CUSTOM DESIGN</b>`;
        
        if (item.customization) {
          if (item.customization.frontDesign) {
            itemDetails += ` - Front Design ✓`;
          }
          if (item.customization.backDesign) {
            itemDetails += ` - Back Design ✓`;
          }
        }
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
        // For custom items, send design images
        if (item.isCustom || item.customization || item.product === null) {
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

  // Send custom design visuals
  async sendCustomDesignVisuals(item, itemNumber, orderId) {
    try {
      const caption = `🎨 Item ${itemNumber}: ${item.name || 'Custom Design'}`;
      
      if (item.customization) {
        // Send front design if available
        if (item.customization.frontDesign?.designImage) {
          await this.sendImageFromUrl(
            item.customization.frontDesign.designImage,
            `${caption} - Front Design`
          );
        }

        // Send back design if available  
        if (item.customization.backDesign?.designImage) {
          await this.sendImageFromUrl(
            item.customization.backDesign.designImage,
            `${caption} - Back Design`
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
        `🔗 <b>Custom Design Details:</b>\n<a href="${adminUrl}">View in Admin Panel</a>`,
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
}

// Export singleton instance
module.exports = new TelegramService();
