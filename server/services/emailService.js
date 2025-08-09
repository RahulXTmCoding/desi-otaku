const nodemailer = require('nodemailer');
const DiscountCalculator = require('../utils/discountCalculator');

class EmailService {
  constructor() {
    // Check if Brevo should be used and if the package is available
    if (process.env.EMAIL_SERVICE === 'brevo') {
      this.isBrevoAPI = this.initializeBrevo();
    } else {
      this.isBrevoAPI = false;
    }
    
    // Initialize nodemailer if Brevo is not available
    if (!this.isBrevoAPI) {
      this.initializeNodemailer();
    }

    this.from = process.env.EMAIL_FROM || 'Attars <noreply@attarsclothing.com>';
  }

  initializeBrevo() {
    try {
      // Check if API key is provided first
      if (!process.env.BREVO_API_KEY) {
        console.log('BREVO_API_KEY not found in environment variables.');
        console.log('Falling back to nodemailer...');
        return false;
      }

      // Check if Brevo package is installed and initialize
      let SibApiV3Sdk;
      try {
        SibApiV3Sdk = require('@getbrevo/brevo');
      } catch (requireError) {
        console.log('Brevo package not installed. Run "npm install @getbrevo/brevo" to use Brevo API.');
        console.log('Falling back to nodemailer...');
        return false;
      }

      // ✅ CORRECT: Using the exact Brevo SDK pattern
      this.brevoEmailAPI = new SibApiV3Sdk.TransactionalEmailsApi();
      let apiKey = this.brevoEmailAPI.authentications['apiKey'];
      apiKey.apiKey = process.env.BREVO_API_KEY;
      
      // Store SDK reference for creating emails
      this.SibApiV3Sdk = SibApiV3Sdk;
      
      this.senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@attarsclothing.com';
      this.senderName = process.env.BREVO_SENDER_NAME || 'Attars';
      
      console.log('✅ Brevo API initialized successfully with key:', process.env.BREVO_API_KEY.substring(0, 8) + '...');
      
      return true;
      
    } catch (error) {
      console.error('❌ Brevo API initialization failed:', error.message);
      console.log('Falling back to nodemailer...');
      return false;
    }
  }

  initializeNodemailer() {
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
  }

  // Send email wrapper - handles both Brevo API and nodemailer
  async sendEmail(to, subject, html, attachments = []) {
    try {
      if (this.isBrevoAPI) {
        return await this.sendEmailViaBrevo(to, subject, html, attachments);
      } else {
        return await this.sendEmailViaNodemailer(to, subject, html, attachments);
      }
    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, error: error.message };
    }
  }

  // Brevo API email sending
  async sendEmailViaBrevo(to, subject, html, attachments = []) {
    try {
      // ✅ CORRECT: Using the exact Brevo SDK pattern
      let sendSmtpEmail = new this.SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = html;
      sendSmtpEmail.sender = {
        name: this.senderName,
        email: this.senderEmail
      };
      sendSmtpEmail.to = [{ email: to }];

      // Add attachments if provided
      if (attachments && attachments.length > 0) {
        sendSmtpEmail.attachment = attachments.map(att => ({
          content: att.content,
          name: att.filename
        }));
      }

      const response = await this.brevoEmailAPI.sendTransacEmail(sendSmtpEmail);
      console.log('✅ Brevo email sent successfully:', response.messageId || 'Success');
      
      return { 
        success: true, 
        messageId: response.messageId || `brevo_${Date.now()}`,
        provider: 'brevo'
      };
    } catch (error) {
      console.error('❌ Brevo email error:', error);
      throw error;
    }
  }

  // Nodemailer email sending (fallback)
  async sendEmailViaNodemailer(to, subject, html, attachments = []) {
    try {
      const mailOptions = {
        from: this.from,
        to,
        subject,
        html,
        attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Nodemailer email sent:', info.messageId);
      
      return { 
        success: true, 
        messageId: info.messageId,
        provider: 'nodemailer'
      };
    } catch (error) {
      console.error('Nodemailer email error:', error);
      throw error;
    }
  }

  // Add contact to Brevo (if using Brevo API)
  async addContact(email, name, attributes = {}) {
    if (!this.isBrevoAPI) {
      console.log('Contact management only available with Brevo API');
      return { success: false, message: 'Contact management not available' };
    }

    try {
      const brevo = require('@getbrevo/brevo');
      const contactsApi = new brevo.ContactsApi();
      
      const contactData = {
        email: email,
        attributes: {
          FIRSTNAME: name,
          ...attributes
        },
        updateEnabled: true // Update if contact exists
      };

      const response = await contactsApi.createContact(contactData);
      console.log('Contact added to Brevo:', email);
      
      return { success: true, response };
    } catch (error) {
      // Don't fail if contact already exists
      if (error.status === 400 && error.response?.body?.message?.includes('already exists')) {
        console.log('Contact already exists in Brevo:', email);
        return { success: true, message: 'Contact already exists' };
      }
      
      console.error('Brevo contact creation error:', error);
      return { success: false, error: error.message };
    }
  }

  // Email Templates

  // Welcome email for new users
  async sendWelcomeEmail(user) {
    const subject = 'Welcome to Attars! 🎉';
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
            <h1>Welcome to Attars!</h1>
          </div>
          <div class="content">
            <h2>Hey ${user.name}! 👋</h2>
            <p>Welcome to your premium fashion destination! We're thrilled to have you join our community of fashion enthusiasts.</p>
            
            <h3 class="highlight">What you can do now:</h3>
            <ul>
              <li>Browse our exclusive premium fashion collection</li>
              <li>Create custom designs with your favorite styles</li>
              <li>Explore our premium collections and limited editions</li>
              <li>Enjoy fast shipping across India</li>
            </ul>
            
            <p>As a welcome gift, enjoy <strong class="highlight">10% OFF</strong> your first order with code: <strong>WELCOME10</strong></p>
            
            <center>
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/shop" class="button">Start Shopping</a>
            </center>
            
            <p>Need help? Reply to this email or visit our contact page.</p>
            <p>Happy shopping!<br>The Attars Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Attars. All rights reserved.</p>
            <p>You received this email because you signed up at attarsclothing.com</p>
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
              </tbody>
            </table>
            
            <h3 class="highlight">Order Summary:</h3>
            <table style="background-color: #374151; border-radius: 8px; overflow: hidden;">
              <tbody>
                ${DiscountCalculator.generateDiscountHTML(order)}
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
            <p>Thank you for shopping with us!<br>The Attars Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Attars. All rights reserved.</p>
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
            
            <p>Can't wait to see you rock your new outfit! 🎉</p>
            <p>The Attars Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Attars. All rights reserved.</p>
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
            <p>We received a request to reset your password for your Attars account.</p>
            
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
            <p>Stay secure!<br>The Attars Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Attars. All rights reserved.</p>
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
      'Processing': 'We\'re preparing your awesome clothing! 👕',
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
            
            <p>Thank you for choosing Attars!</p>
            <p>The Attars Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Attars. All rights reserved.</p>
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
            <p>&copy; 2025 Attars. All rights reserved.</p>
            <p>Inventory Alert for Product #${product._id}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(admin.email, subject, html);
  }

  // Auto-account creation email for guest users
  async sendAutoAccountCreationEmail(user, order) {
    const subject = 'Account Created - Set Your Password 🎉';
    const passwordSetupUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/forgot-password`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1F2937; color: #ffffff; }
          .header { background-color: #FCD34D; color: #1F2937; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .info-box { background-color: #374151; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background-color: #FCD34D; color: #1F2937; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background-color: #111827; padding: 20px; text-align: center; font-size: 12px; color: #9CA3AF; }
          h1 { margin: 0; font-size: 28px; }
          h2 { color: #FCD34D; }
          .highlight { color: #FCD34D; font-weight: bold; }
          .benefits { background-color: #10B981; background-opacity: 0.1; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #10B981; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Attars! 🎉</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Your account has been created</p>
          </div>
          <div class="content">
            <p>Hi ${user.name || 'Fashion Enthusiast'},</p>
            <p>Great news! We've automatically created an account for you after your recent purchase. This makes it easier to track your order and shop faster next time!</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #FCD34D;">Your Account Details:</h3>
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>Order Number:</strong> #${order._id}</p>
              <p><strong>Status:</strong> Account Active ✅</p>
            </div>
            
            <h2>🔐 Set Your Password</h2>
            <p>To access your account and track your order, you'll need to set a password. It's quick and easy!</p>
            
            <center>
              <a href="${passwordSetupUrl}" class="button">Set My Password</a>
            </center>
            
            <p>Simply enter your email (${user.email}) and follow the password reset process.</p>
            
            <div class="benefits">
              <h3 style="margin-top: 0; color: #10B981;">✨ Your Account Benefits:</h3>
              <ul style="margin: 10px 0;">
                <li>Track your order in real-time</li>
                <li>View order history and reorder easily</li>
                <li>Save multiple shipping addresses</li>
                <li>Faster checkout on future orders</li>
                <li>Exclusive member discounts and early access</li>
                <li>Wishlist to save your favorite designs</li>
              </ul>
            </div>
            
            <h3 class="highlight">What's Next?</h3>
            <ol>
              <li>Click the button above to set your password</li>
              <li>Sign in to your account</li>
              <li>Track your current order (#${order._id})</li>
              <li>Explore more awesome anime designs!</li>
            </ol>
            
            <p>If you have any questions or need help accessing your account, just reply to this email and we'll assist you right away!</p>
            
            <p>Welcome to the Attars family! 🎉<br>The Attars Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Attars. All rights reserved.</p>
            <p>This account was created for ${user.email} after order #${order._id}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  // Combined order confirmation + account creation email
  async sendOrderConfirmationWithAccount(order, user, accountCreated = false) {
    const subject = `Order Confirmed! #${order._id} ${accountCreated ? '+ Account Created 🎉' : '🛍️'}`;
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

    const passwordSetupUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/forgot-password`;

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
          .account-box { background-color: #3B82F6; background-opacity: 0.2; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #3B82F6; }
          .button { display: inline-block; background-color: #FCD34D; color: #1F2937; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .button-secondary { display: inline-block; background-color: #3B82F6; color: #ffffff; padding: 10px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px; }
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
            <p>Hi ${user.name || 'Valued Customer'},</p>
            <p>Great news! We've received your order and it's being processed. 🎉</p>
            
            ${accountCreated ? `
            <div class="account-box">
              <h3 style="margin-top: 0; color: #60A5FA;">🎊 Account Created Automatically!</h3>
              <p>We've created an account for you to make tracking your order easier.</p>
              <p><strong>Your login email:</strong> ${user.email}</p>
              <p>To access your account, simply set a password:</p>
              <center>
                <a href="${passwordSetupUrl}" class="button-secondary">Set Password</a>
              </center>
            </div>
            ` : ''}
            
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
              </tbody>
            </table>
            
            <h3 class="highlight">Order Summary:</h3>
            <table style="background-color: #374151; border-radius: 8px; overflow: hidden;">
              <tbody>
                ${DiscountCalculator.generateDiscountHTML(order)}
              </tbody>
            </table>
            
            <div class="order-box">
              <h3 style="margin-top: 0;">Shipping Address</h3>
              <p>${order.address}</p>
              ${order.shipping?.courier ? `<p><strong>Shipping Method:</strong> ${order.shipping.courier}</p>` : ''}
              ${order.shipping?.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${new Date(order.shipping.estimatedDelivery).toLocaleDateString('en-IN')}</p>` : ''}
            </div>
            
            <center>
              ${accountCreated ? `
                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/forgot-password" class="button">Track Order & Set Password</a>
              ` : `
                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/user/dashboard" class="button">Track Your Order</a>
              `}
            </center>
            
            <h3 class="highlight">What's Next?</h3>
            <ul>
              <li>We'll prepare your order for shipping</li>
              <li>You'll receive a shipping confirmation once dispatched</li>
              ${accountCreated ? '<li>Set your password to access order tracking anytime</li>' : '<li>Track your order anytime from your dashboard</li>'}
            </ul>
            
            <p>If you have any questions, feel free to contact us.</p>
            <p>Thank you for shopping with us!<br>The Attars Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Attars. All rights reserved.</p>
            <p>Order #${order._id} | ${user.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  // Combined order confirmation + tracking email (Magic link + PIN)
  async sendOrderConfirmationWithTracking(order, customerInfo, magicLink, pin) {
    const subject = `Order Confirmed! #${order._id} 📦 - Track Your Order Instantly`;
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
          .tracking-box { background-color: #10B981; background-opacity: 0.2; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #10B981; }
          .pin-box { background-color: #3B82F6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .button { display: inline-block; background-color: #FCD34D; color: #1F2937; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 10px; text-decoration: none; }
          .button-secondary { display: inline-block; background-color: #6B7280; color: #ffffff; padding: 10px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px; }
          .footer { background-color: #111827; padding: 20px; text-align: center; font-size: 12px; color: #9CA3AF; }
          table { width: 100%; border-collapse: collapse; }
          .highlight { color: #FCD34D; }
          .pin-code { font-size: 24px; font-weight: bold; color: #FCD34D; letter-spacing: 3px; font-family: 'Courier New', monospace; background-color: #1F2937; padding: 12px; border-radius: 8px; margin: 10px 0; }
          .security-notice { background-color: #374151; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981; }
          h1 { margin: 0; font-size: 28px; }
          h2 { color: #FCD34D; margin-top: 0; }
          .status { display: inline-block; background-color: #10B981; color: white; padding: 4px 12px; border-radius: 4px; font-size: 14px; }
          .link-expired { color: #9CA3AF; font-size: 14px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmed! 🎉</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Thank you for your order + instant tracking inside!</p>
          </div>
          <div class="content">
            <p>Hi ${customerInfo.name || 'Valued Customer'},</p>
            <p>Great news! We've received your order and it's being processed. Plus, we've made tracking super easy for you! 📦</p>
            
            <div class="tracking-box">
              <h2 style="color: #10B981; margin-top: 0;">🚀 Track Your Order Instantly</h2>
              <p style="color: #111827; font-weight: bold;">Click the button below for secure one-click order tracking:</p>
              <a href="${magicLink}" class="button">📱 Track My Order Now</a>
              <p style="color: #374151; font-size: 14px; margin-top: 10px;">This secure link works for 7 days and can be bookmarked.</p>
            </div>
            
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
              </tbody>
            </table>
            
            <h3 class="highlight">Order Summary:</h3>
            <table style="background-color: #374151; border-radius: 8px; overflow: hidden;">
              <tbody>
                ${DiscountCalculator.generateDiscountHTML(order)}
              </tbody>
            </table>
            
            <div class="order-box">
              <h3 style="margin-top: 0;">Shipping Address</h3>
              <p>${order.address}</p>
              ${order.shipping?.courier ? `<p><strong>Shipping Method:</strong> ${order.shipping.courier}</p>` : ''}
              ${order.shipping?.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${new Date(order.shipping.estimatedDelivery).toLocaleDateString('en-IN')}</p>` : ''}
            </div>
            
            <div class="pin-box">
              <h2 style="color: #ffffff; margin-top: 0;">📋 Backup Tracking Method</h2>
              <p style="color: #ffffff;">If the tracking link doesn't work, use this PIN code:</p>
              <div class="pin-code">${pin}</div>
              <p style="color: #E5E7EB; font-size: 14px;">Visit our website → Order Tracking → Enter Order ID + Email + PIN</p>
            </div>
            
            <div class="security-notice">
              <h3 style="margin-top: 0; color: #10B981;">🔒 Your Order is Secure</h3>
              <ul style="margin: 10px 0; text-align: left;">
                <li>Your tracking link is encrypted and unique to your order</li>
                <li>Links automatically expire after 7 days for security</li>
                <li>Only accessible with your email verification</li>
                <li>PIN code provided as secure backup access</li>
              </ul>
            </div>
            
            <h3 class="highlight">What's Next?</h3>
            <ul>
              <li>We'll prepare your order for shipping (usually within 1-2 business days)</li>
              <li>You'll receive updates when your order ships</li>
              <li>Use your tracking link anytime to check order status</li>
              <li>Contact us if you have any questions</li>
            </ul>
            
            <center>
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/track-order" class="button-secondary">Manual Tracking Page</a>
            </center>
            
            <p>Thank you for choosing Attars! 🎉</p>
            <p>The Attars Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Attars. All rights reserved.</p>
            <p>Order #${order._id} | ${customerInfo.email || customerInfo.user?.email}</p>
            <p style="color: #6B7280;">This email contains secure tracking credentials. Keep it safe for easy order access.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(customerInfo.email || customerInfo.user?.email, subject, html);
  }

  // Order tracking link email (Magic link + PIN)
  async sendOrderTrackingLink(order, customerInfo, magicLink, pin) {
    const subject = `Track Your Order #${order._id} 📦 - Secure Access Link`;
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
          .pin-box { background-color: #3B82F6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .button { display: inline-block; background-color: #FCD34D; color: #1F2937; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 10px; text-decoration: none; }
          .button-secondary { display: inline-block; background-color: #6B7280; color: #ffffff; padding: 10px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px; }
          .footer { background-color: #111827; padding: 20px; text-align: center; font-size: 12px; color: #9CA3AF; }
          .highlight { color: #FCD34D; }
          .pin-code { font-size: 32px; font-weight: bold; color: #FCD34D; letter-spacing: 3px; font-family: 'Courier New', monospace; background-color: #1F2937; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .security-notice { background-color: #374151; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981; }
          h1 { margin: 0; font-size: 28px; }
          h2 { color: #FCD34D; margin-top: 0; }
          .link-expired { color: #9CA3AF; font-size: 14px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Secure Order Tracking</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Your personal tracking link is ready!</p>
          </div>
          <div class="content">
            <p>Hi ${customerInfo.name || 'Valued Customer'},</p>
            <p>Here's your secure link to track order <strong>#${order._id}</strong>. We've made it easy and secure! 🎉</p>
            
            <div class="tracking-box">
              <h2>🚀 One-Click Tracking</h2>
              <p>Click the button below for instant access to your order details:</p>
              <a href="${magicLink}" class="button">📱 Track My Order</a>
              <p class="link-expired">This link works for 7 days and can be bookmarked for easy access.</p>
            </div>
            
            <div class="pin-box">
              <h2 style="color: #ffffff; margin-top: 0;">📋 Backup Access Method</h2>
              <p style="color: #ffffff;">If the link above doesn't work, use this PIN code:</p>
              <div class="pin-code">${pin}</div>
              <p style="color: #E5E7EB; font-size: 14px;">Visit our website → Order Tracking → Enter Order ID + Email + PIN</p>
            </div>
            
            <div class="security-notice">
              <h3 style="margin-top: 0; color: #10B981;">🔒 Security Features</h3>
              <ul style="margin: 10px 0; text-align: left;">
                <li>Your tracking link is unique and encrypted</li>
                <li>Links automatically expire after 7 days for security</li>
                <li>Only accessible with your email verification</li>
                <li>PIN code as secure backup access method</li>
              </ul>
            </div>
            
            <h3 class="highlight">Quick Order Summary:</h3>
            <p><strong>Order ID:</strong> #${order._id}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Total:</strong> ₹${order.amount}</p>
            <p><strong>Placed:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
            
            <h3 class="highlight">Need Help?</h3>
            <ul>
              <li><strong>Lost your link?</strong> Visit our tracking page and we'll send a new one</li>
              <li><strong>Questions?</strong> Reply to this email or contact support</li>
              <li><strong>Want updates?</strong> We'll notify you when your order ships</li>
            </ul>
            
            <center>
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/track-order" class="button-secondary">Manual Tracking Page</a>
            </center>
            
            <p>Thank you for choosing Attars! 🎉</p>
            <p>The Attars Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Attars. All rights reserved.</p>
            <p>Secure tracking for Order #${order._id} | ${customerInfo.email}</p>
            <p style="color: #6B7280;">This email contains secure access credentials. Do not share with others.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(customerInfo.email, subject, html);
  }

  // Test email functionality
  async sendTestEmail(to) {
    const subject = 'Test Email from Attars';
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
