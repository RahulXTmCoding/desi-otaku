const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Create transporter based on environment
    if (process.env.EMAIL_SERVICE === 'gmail') {
      // Gmail configuration
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS // Use app password for Gmail
        }
      });
    } else if (process.env.EMAIL_SERVICE === 'sendgrid') {
      // SendGrid configuration
      this.transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      });
    } else {
      // Development/Test configuration
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: process.env.EMAIL_USER || 'test@example.com',
          pass: process.env.EMAIL_PASS || 'testpass'
        }
      });
    }

    this.from = process.env.EMAIL_FROM || 'Anime T-Shirt Shop <noreply@animetshirt.com>';
  }

  // Send email wrapper
  async sendEmail(to, subject, html, attachments = []) {
    try {
      const mailOptions = {
        from: this.from,
        to,
        subject,
        html,
        attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, error: error.message };
    }
  }

  // Email Templates

  // Welcome email for new users
  async sendWelcomeEmail(user) {
    const subject = 'Welcome to Anime T-Shirt Shop! 🎌';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1F2937; color: #ffffff; }
          .header { background-color: #FCD34D; color: #1F2937; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .button { display: inline-block; background-color: #FCD34D; color: #1F2937; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background-color: #111827; padding: 20px; text-align: center; font-size: 12px; color: #9CA3AF; }
          h1 { margin: 0; font-size: 28px; }
          h2 { color: #FCD34D; }
          .highlight { color: #FCD34D; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Anime T-Shirt Shop!</h1>
          </div>
          <div class="content">
            <h2>Hey ${user.name}! 👋</h2>
            <p>Welcome to the ultimate destination for anime-inspired fashion! We're thrilled to have you join our community of anime enthusiasts.</p>
            
            <h3 class="highlight">What you can do now:</h3>
            <ul>
              <li>Browse our exclusive anime t-shirt collection</li>
              <li>Create custom designs with your favorite characters</li>
              <li>Try our random design generator for surprise styles</li>
              <li>Enjoy fast shipping across India</li>
            </ul>
            
            <p>As a welcome gift, enjoy <strong class="highlight">10% OFF</strong> your first order with code: <strong>ANIME10</strong></p>
            
            <center>
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/shop" class="button">Start Shopping</a>
            </center>
            
            <p>Need help? Reply to this email or visit our contact page.</p>
            <p>Happy shopping!<br>The Anime T-Shirt Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Anime T-Shirt Shop. All rights reserved.</p>
            <p>You received this email because you signed up at animetshirt.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  // Order confirmation email
  async sendOrderConfirmation(order, user) {
    const subject = `Order Confirmed! #${order._id} 🛍️`;
    const orderItemsHtml = order.products.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #374151;">
          ${item.name} ${item.size ? `(${item.size})` : ''}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #374151; text-align: center;">
          ${item.count}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #374151; text-align: right;">
          ₹${item.price * item.count}
        </td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1F2937; color: #ffffff; }
          .header { background-color: #FCD34D; color: #1F2937; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .order-box { background-color: #374151; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background-color: #FCD34D; color: #1F2937; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background-color: #111827; padding: 20px; text-align: center; font-size: 12px; color: #9CA3AF; }
          table { width: 100%; border-collapse: collapse; }
          .highlight { color: #FCD34D; }
          h1 { margin: 0; font-size: 28px; }
          h2 { color: #FCD34D; }
          .status { display: inline-block; background-color: #10B981; color: white; padding: 4px 12px; border-radius: 4px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmed!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Thank you for your order</p>
          </div>
          <div class="content">
            <p>Hi ${user.name || 'Customer'},</p>
            <p>Great news! We've received your order and it's being processed. 🎉</p>
            
            <div class="order-box">
              <h3 style="margin-top: 0;">Order Details</h3>
              <p><strong>Order ID:</strong> #${order._id}</p>
              <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
              <p><strong>Status:</strong> <span class="status">${order.status}</span></p>
              ${order.shipping?.trackingId ? `<p><strong>Tracking ID:</strong> ${order.shipping.trackingId}</p>` : ''}
            </div>
            
            <h3 class="highlight">Order Items:</h3>
            <table>
              <thead>
                <tr style="background-color: #374151;">
                  <th style="padding: 10px; text-align: left;">Item</th>
                  <th style="padding: 10px; text-align: center;">Quantity</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${orderItemsHtml}
                ${order.shipping?.shippingCost ? `
                <tr>
                  <td colspan="2" style="padding: 10px; text-align: right;">Shipping:</td>
                  <td style="padding: 10px; text-align: right;">₹${order.shipping.shippingCost}</td>
                </tr>
                ` : ''}
                <tr>
                  <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; font-size: 18px;">Total:</td>
                  <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 18px; color: #FCD34D;">₹${order.amount}</td>
                </tr>
              </tbody>
            </table>
            
            <div class="order-box">
              <h3 style="margin-top: 0;">Shipping Address</h3>
              <p>${order.address}</p>
              ${order.shipping?.courier ? `<p><strong>Shipping Method:</strong> ${order.shipping.courier}</p>` : ''}
              ${order.shipping?.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${new Date(order.shipping.estimatedDelivery).toLocaleDateString('en-IN')}</p>` : ''}
            </div>
            
            <center>
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/user/dashboard" class="button">Track Your Order</a>
            </center>
            
            <h3 class="highlight">What's Next?</h3>
            <ul>
              <li>We'll prepare your order for shipping</li>
              <li>You'll receive a shipping confirmation once dispatched</li>
              <li>Track your order anytime from your dashboard</li>
            </ul>
            
            <p>If you have any questions, feel free to contact us.</p>
            <p>Thank you for shopping with us!<br>The Anime T-Shirt Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Anime T-Shirt Shop. All rights reserved.</p>
            <p>Order #${order._id} | ${user.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  // Shipping update email
  async sendShippingUpdate(order, user) {
    const subject = `Your Order #${order._id} Has Been Shipped! 📦`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1F2937; color: #ffffff; }
          .header { background-color: #FCD34D; color: #1F2937; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .tracking-box { background-color: #374151; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .button { display: inline-block; background-color: #FCD34D; color: #1F2937; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background-color: #111827; padding: 20px; text-align: center; font-size: 12px; color: #9CA3AF; }
          .highlight { color: #FCD34D; }
          h1 { margin: 0; font-size: 28px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Order is On Its Way! 🚚</h1>
          </div>
          <div class="content">
            <p>Hi ${user.name || 'Customer'},</p>
            <p>Good news! Your order has been shipped and is on its way to you.</p>
            
            <div class="tracking-box">
              <h2 style="color: #FCD34D; margin-top: 0;">Tracking Information</h2>
              <p style="font-size: 18px;"><strong>Order ID:</strong> #${order._id}</p>
              ${order.shipping?.trackingId ? `<p style="font-size: 18px;"><strong>Tracking Number:</strong> ${order.shipping.trackingId}</p>` : ''}
              ${order.shipping?.courier ? `<p style="font-size: 18px;"><strong>Carrier:</strong> ${order.shipping.courier}</p>` : ''}
              ${order.shipping?.awbCode ? `<p style="font-size: 18px;"><strong>AWB Number:</strong> ${order.shipping.awbCode}</p>` : ''}
              
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/track/${order._id}" class="button">Track Package</a>
            </div>
            
            <h3 class="highlight">Delivery Details:</h3>
            <p><strong>Delivery Address:</strong><br>${order.address}</p>
            ${order.shipping?.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${new Date(order.shipping.estimatedDelivery).toLocaleDateString('en-IN')}</p>` : ''}
            
            <h3 class="highlight">Delivery Tips:</h3>
            <ul>
              <li>Ensure someone is available to receive the package</li>
              <li>Keep your phone handy for delivery updates</li>
              <li>Check the package for any damage upon receipt</li>
            </ul>
            
            <p>Track your package anytime using the tracking number above or from your account dashboard.</p>
            
            <p>Can't wait to see you rock your new anime tee! 🎌</p>
            <p>The Anime T-Shirt Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Anime T-Shirt Shop. All rights reserved.</p>
            <p>Tracking updates for Order #${order._id}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  // Password reset email
  async sendPasswordResetEmail(user, resetToken) {
    const subject = 'Reset Your Password 🔐';
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1F2937; color: #ffffff; }
          .header { background-color: #FCD34D; color: #1F2937; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .button { display: inline-block; background-color: #FCD34D; color: #1F2937; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background-color: #111827; padding: 20px; text-align: center; font-size: 12px; color: #9CA3AF; }
          .warning { background-color: #EF4444; padding: 15px; border-radius: 8px; margin: 20px 0; }
          h1 { margin: 0; font-size: 28px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi ${user.name || 'there'},</p>
            <p>We received a request to reset your password for your Anime T-Shirt Shop account.</p>
            
            <p>Click the button below to reset your password:</p>
            
            <center>
              <a href="${resetUrl}" class="button">Reset Password</a>
            </center>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #FCD34D;">${resetUrl}</p>
            
            <div class="warning">
              <p style="margin: 0;"><strong>⚠️ Important:</strong></p>
              <ul style="margin: 10px 0 0 0;">
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this, please ignore this email</li>
                <li>Your password won't change until you create a new one</li>
              </ul>
            </div>
            
            <p>For security reasons, we recommend choosing a strong password that you don't use for other accounts.</p>
            
            <p>Need help? Contact our support team.</p>
            <p>Stay secure!<br>The Anime T-Shirt Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Anime T-Shirt Shop. All rights reserved.</p>
            <p>This is an automated security email for ${user.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  // Order status update email
  async sendOrderStatusUpdate(order, user, oldStatus) {
    const statusMessages = {
      'Processing': 'We\'re preparing your awesome anime tees! 👕',
      'Shipped': 'Your order is on its way! 📦',
      'Delivered': 'Your order has been delivered! 🎉',
      'Cancelled': 'Your order has been cancelled 😔'
    };

    const subject = `Order #${order._id} Status Update: ${order.status}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1F2937; color: #ffffff; }
          .header { background-color: #FCD34D; color: #1F2937; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .status-box { background-color: #374151; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .button { display: inline-block; background-color: #FCD34D; color: #1F2937; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background-color: #111827; padding: 20px; text-align: center; font-size: 12px; color: #9CA3AF; }
          h1 { margin: 0; font-size: 28px; }
          .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
          .status-received { background-color: #6B7280; }
          .status-processing { background-color: #3B82F6; }
          .status-shipped { background-color: #8B5CF6; }
          .status-delivered { background-color: #10B981; }
          .status-cancelled { background-color: #EF4444; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Status Update</h1>
          </div>
          <div class="content">
            <p>Hi ${user.name || 'Customer'},</p>
            
            <div class="status-box">
              <h2 style="color: #FCD34D; margin-top: 0;">Your Order Status Changed</h2>
              <p style="font-size: 20px;">
                <span class="status-badge status-${oldStatus.toLowerCase()}">${oldStatus}</span>
                <span style="margin: 0 10px;">→</span>
                <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
              </p>
              <p style="font-size: 18px; margin-top: 20px;">${statusMessages[order.status] || 'Your order status has been updated.'}</p>
            </div>
            
            <h3 style="color: #FCD34D;">Order Details:</h3>
            <p><strong>Order ID:</strong> #${order._id}</p>
            <p><strong>Total Amount:</strong> ₹${order.amount}</p>
            
            ${order.status === 'Shipped' && order.shipping?.trackingId ? `
              <h3 style="color: #FCD34D;">Tracking Information:</h3>
              <p><strong>Tracking Number:</strong> ${order.shipping.trackingId}</p>
              <p><strong>Carrier:</strong> ${order.shipping.courier || 'Standard Shipping'}</p>
            ` : ''}
            
            <center>
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/user/dashboard" class="button">View Order Details</a>
            </center>
            
            <p>Thank you for choosing Anime T-Shirt Shop!</p>
            <p>The Anime T-Shirt Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Anime T-Shirt Shop. All rights reserved.</p>
            <p>Status update for Order #${order._id}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  // Inventory alert email
  async sendInventoryAlert(admin, product, alertType) {
    const subject = alertType === 'out-of-stock' 
      ? `🚨 Out of Stock Alert: ${product.name}`
      : `⚠️ Low Stock Alert: ${product.name}`;
    
    // Get size-wise stock details
    let stockDetails = '';
    for (const size of ['S', 'M', 'L', 'XL', 'XXL']) {
      if (product.inventory[size]) {
        const available = product.inventory[size].stock - product.inventory[size].reserved;
        stockDetails += `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #374151;">${size}</td>
            <td style="padding: 8px; border-bottom: 1px solid #374151; text-align: center;">${available}</td>
            <td style="padding: 8px; border-bottom: 1px solid #374151; text-align: center;">${product.inventory[size].reserved}</td>
            <td style="padding: 8px; border-bottom: 1px solid #374151; text-align: center;">${product.inventory[size].sold}</td>
          </tr>
        `;
      }
    }
    
    const alertColor = alertType === 'out-of-stock' ? '#EF4444' : '#F59E0B';
    const alertBg = alertType === 'out-of-stock' ? '#EF4444' : '#F59E0B';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1F2937; color: #ffffff; }
          .header { background-color: ${alertBg}; color: #1F2937; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .alert-box { background-color: ${alertBg}20; border: 2px solid ${alertColor}; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background-color: #FCD34D; color: #1F2937; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background-color: #111827; padding: 20px; text-align: center; font-size: 12px; color: #9CA3AF; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background-color: #374151; padding: 10px; text-align: left; }
          h1 { margin: 0; font-size: 28px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${alertType === 'out-of-stock' ? 'Out of Stock Alert!' : 'Low Stock Warning!'}</h1>
          </div>
          <div class="content">
            <p>Hi ${admin.name || 'Admin'},</p>
            
            <div class="alert-box">
              <h2 style="margin-top: 0; color: ${alertColor};">
                ${alertType === 'out-of-stock' 
                  ? '🚨 This product is completely out of stock!' 
                  : '⚠️ This product is running low on stock!'}
              </h2>
              <p><strong>Product:</strong> ${product.name}</p>
              <p><strong>Product ID:</strong> #${product._id}</p>
              <p><strong>Total Stock:</strong> ${product.stock} units</p>
              <p><strong>Low Stock Threshold:</strong> ${product.lowStockThreshold} units</p>
            </div>
            
            <h3 style="color: #FCD34D;">Size-wise Inventory Status:</h3>
            <table>
              <thead>
                <tr>
                  <th style="padding: 10px;">Size</th>
                  <th style="padding: 10px; text-align: center;">Available</th>
                  <th style="padding: 10px; text-align: center;">Reserved</th>
                  <th style="padding: 10px; text-align: center;">Sold</th>
                </tr>
              </thead>
              <tbody>
                ${stockDetails}
              </tbody>
            </table>
            
            <h3 style="color: #FCD34D;">Recommended Actions:</h3>
            <ul>
              ${alertType === 'out-of-stock' ? `
                <li>Immediately restock this product to avoid lost sales</li>
                <li>Consider marking the product as "Out of Stock" on the website</li>
                <li>Contact your supplier for urgent restocking</li>
              ` : `
                <li>Plan to restock this product soon</li>
                <li>Monitor sales velocity to prevent stockout</li>
                <li>Consider increasing the reorder quantity</li>
              `}
            </ul>
            
            <center>
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/admin/products/manage" class="button">
                Manage Inventory
              </a>
            </center>
            
            <p>This is an automated alert from your inventory management system.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Anime T-Shirt Shop. All rights reserved.</p>
            <p>Inventory Alert for Product #${product._id}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(admin.email, subject, html);
  }

  // Test email functionality
  async sendTestEmail(to) {
    const subject = 'Test Email from Anime T-Shirt Shop';
    const html = `
      <h1>Test Email</h1>
      <p>This is a test email to verify that the email service is working correctly.</p>
      <p>If you received this email, the email configuration is set up properly!</p>
      <p>Timestamp: ${new Date().toISOString()}</p>
    `;

    return await this.sendEmail(to, subject, html);
  }
}

// Export singleton instance
module.exports = new EmailService();
