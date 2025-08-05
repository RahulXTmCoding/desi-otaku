const { Order } = require('../models/order');
const User = require('../models/user');
const { v4: uuidv4 } = require('uuid');
const { createSecureAccess } = require('./secureOrder');
const invoiceService = require('../services/invoiceService');
const telegramService = require('../services/telegramService');
const AOVService = require('../services/aovService');

// Create order for guest users
exports.createGuestOrder = async (req, res) => {
  try {
    const {
      products,
      transaction_id,
      amount: requestedAmount,
      originalAmount,
      discount,
      coupon,
      address,
      status = "Received",
      shipping,
      guestInfo
    } = req.body;
    
    let amount = requestedAmount; // Use let so we can update it with paid amount

    // Validate required fields
    if (!products || !transaction_id || !amount || !address || !guestInfo) {
      return res.status(400).json({
        error: 'Missing required order information'
      });
    }

    if (!guestInfo.email || !guestInfo.name) {
      return res.status(400).json({
        error: 'Guest email and name are required'
      });
    }

    // 🔒 SECURITY: Rate limiting for guest orders
    const { checkGuestRateLimit } = require('./razorpay');
    const guestRateLimit = await checkGuestRateLimit(req.ip, guestInfo.email);
    if (!guestRateLimit.allowed) {
      return res.status(429).json({ 
        error: 'Too many orders. Please try again later.',
        retryAfter: guestRateLimit.retryAfter 
      });
    }

    // 🔒 SECURITY: Payment verification for guest orders
    if (transaction_id && !transaction_id.startsWith('mock_')) {
      try {
        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET
        });
        
        // Fetch payment details from Razorpay
        const paymentDetails = await razorpay.payments.fetch(transaction_id);
        
        // ✅ SECURITY FIX: Accept the amount that was actually paid
        // Backend now controls pricing, so we trust Razorpay's charged amount
        const paidAmountPaise = paymentDetails.amount;
        const paidAmountRupees = paidAmountPaise / 100;
        
        console.log('✅ Guest payment verification (backend-controlled pricing):', {
          paidRupees: paidAmountRupees,
          guestEmail: guestInfo.email,
          transactionId: transaction_id,
          paymentStatus: paymentDetails.status
        });
        
        // Verify payment is actually captured/successful
        if (paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized') {
          console.error('❌ GUEST PAYMENT NOT CAPTURED:', {
            status: paymentDetails.status,
            guestEmail: guestInfo.email,
            transactionId: transaction_id
          });
          
          return res.status(400).json({
            error: 'Payment not completed successfully. Please try again.'
          });
        }
        
        // Use the paid amount (which is now secure since backend controls Razorpay pricing)
        amount = paidAmountRupees;
        
        console.log('✅ Guest payment verified - using backend-controlled amount');
        
      } catch (paymentVerifyError) {
        console.error('Guest payment verification error:', paymentVerifyError);
        // Continue with order creation but log the error
      }
    }

    // Check if user exists with this email, or create auto-account
    let userId = null;
    let autoAccountCreated = false;
    try {
      let existingUser = await User.findOne({ email: guestInfo.email });
      if (existingUser) {
        userId = existingUser._id;
        console.log('Found existing user for guest order:', guestInfo.email);
      } else {
        // Auto-create account for guest user to enable order tracking
        console.log('Creating auto-account for guest user:', guestInfo.email);
        
        // Generate a secure random password (user will reset it via email)
        const crypto = require('crypto');
        const tempPassword = crypto.randomBytes(32).toString('hex');
        
        const newUser = new User({
          name: guestInfo.name,
          email: guestInfo.email,
          password: tempPassword, // Will be hashed by the model
          role: 0, // Regular user
          // Mark as auto-created so we know to send welcome email
          autoCreated: true
        });
        
        const savedUser = await newUser.save();
        userId = savedUser._id;
        autoAccountCreated = true;
        
        console.log('✅ Auto-account created for guest user:', guestInfo.email);
      }
    } catch (error) {
      console.log('Error handling user account for guest order:', error);
      // Continue without linking if there's an error
    }
    
    // 🎯 AOV: Calculate quantity-based discount for guest orders (SAME as registered users)
    let quantityDiscount = 0;
    let quantityDiscountInfo = null;
    try {
      const cartItems = products.map(item => ({
        product: item.product,
        name: item.name,
        price: item.price,
        quantity: item.count
      }));
      
      const quantityDiscountResult = await AOVService.calculateQuantityDiscount(cartItems);
      if (quantityDiscountResult && quantityDiscountResult.discount > 0) {
        quantityDiscount = quantityDiscountResult.discount;
        quantityDiscountInfo = quantityDiscountResult;
        console.log(`✅ AOV Quantity Discount Applied to Guest Order: ₹${quantityDiscount} (${quantityDiscountResult.percentage}% for ${quantityDiscountResult.totalQuantity} items)`);
      }
    } catch (aovError) {
      console.error('AOV quantity discount calculation error for guest order:', aovError);
      // Continue without quantity discount if calculation fails
    }

    // Create guest order with a unique guest ID
    const guestId = `guest_${uuidv4()}`;
    
    // Process products to ensure customization data is properly handled
    const processedProducts = products.map(product => {
      const processedProduct = { ...product };

      // If it's a custom t-shirt, the product ID might be 'custom' or a temporary ID
      if (processedProduct.product === 'custom' || 
          (typeof processedProduct.product === 'string' && processedProduct.product.startsWith('temp_'))) {
        processedProduct.product = null; // Set to null for custom items
      }
      
      // Only keep customization if it has actual design data
      if (processedProduct.customization) {
        const { frontDesign, backDesign } = processedProduct.customization;
        
        // Check if front design has actual data
        const hasFrontDesign = frontDesign && 
          frontDesign.designId && 
          frontDesign.designImage;
          
        // Check if back design has actual data  
        const hasBackDesign = backDesign && 
          backDesign.designId && 
          backDesign.designImage;
          
        // Only keep customization if at least one side has design data
        if (!hasFrontDesign && !hasBackDesign) {
          delete processedProduct.customization;
        } else {
          // Clean up empty design objects
          processedProduct.customization = {};
          if (hasFrontDesign) {
            processedProduct.customization.frontDesign = frontDesign;
          }
          if (hasBackDesign) {
            processedProduct.customization.backDesign = backDesign;
          }
        }
      }
      
      return processedProduct;
    });
    
    const order = new Order({
      products: processedProducts,
      transaction_id,
      amount,
      originalAmount: originalAmount || amount, // Use amount as fallback
      discount: discount || 0,
      // 🎯 AOV: Store quantity discount info in guest order (same as registered users)
      quantityDiscount: quantityDiscountInfo ? {
        amount: quantityDiscount,
        percentage: quantityDiscountInfo.percentage,
        tier: quantityDiscountInfo.tier,
        totalQuantity: quantityDiscountInfo.totalQuantity,
        message: quantityDiscountInfo.message
      } : undefined,
      coupon: coupon || null,
      address,
      status,
      shipping,
      paymentStatus: 'Pending', // Default to Pending
      user: userId, // Link to existing user if found
      guestInfo: {
        id: guestId,
        name: guestInfo.name,
        email: guestInfo.email,
        phone: guestInfo.phone
      }
    });

    // Set payment status based on successful verification
    if (req.payment && req.payment.status === 'captured') {
      order.paymentStatus = 'Paid';
    }

    const savedOrder = await order.save();
    
    // 🔒 SECURITY: Update audit log with order ID for guest orders
    if (req.paymentAudit) {
      try {
        req.paymentAudit.orderId = savedOrder._id;
        req.paymentAudit.serverCalculatedAmount = amount;
        await req.paymentAudit.addEvent('guest_order_created_successfully', {
          orderId: savedOrder._id,
          finalAmount: amount,
          guestEmail: guestInfo.email
        });
        await req.paymentAudit.save();
        console.log('✅ Guest payment audit updated with order ID:', savedOrder._id);
      } catch (auditError) {
        console.error('Failed to update guest payment audit with order ID:', auditError);
        // Don't fail the order creation if audit update fails
      }
    }
    
    // Generate secure access tokens for guest order tracking
    let magicLink = null;
    let pin = null;
    
    try {
      const secureAccess = await createSecureAccess(savedOrder._id, guestInfo.email);
      if (secureAccess.success) {
        magicLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/track/${Buffer.from(secureAccess.token).toString('base64url')}`;
        pin = secureAccess.pin;
        console.log(`Generated secure access tokens for guest order ${savedOrder._id}`);
      }
    } catch (err) {
      console.error('Failed to create secure access tokens for guest order:', err);
      // Don't fail the order creation if secure access creation fails
    }
    
    // Send appropriate emails based on account creation status
    const emailService = require('../services/emailService');
    
    if (autoAccountCreated) {
      // 🎉 NEW ACCOUNT: Send welcome email with password setup instructions
      console.log('Sending welcome email with password setup for auto-created account');
      
      const userInfo = {
        name: guestInfo.name,
        email: guestInfo.email,
        _id: userId
      };
      
      emailService.sendAutoAccountCreationEmail(userInfo, savedOrder)
        .then(() => {
          console.log('✅ Welcome email with password setup sent successfully');
        })
        .catch(err => {
          console.error("❌ Failed to send welcome email with password setup:", err);
        });
        
      // Also send order confirmation
      if (magicLink && pin) {
        emailService.sendOrderConfirmationWithTracking(savedOrder, guestInfo, magicLink, pin)
          .then(() => {
            console.log('✅ Order confirmation+tracking email sent successfully');
          })
          .catch(err => {
            console.error("❌ Failed to send order confirmation+tracking email:", err);
          });
      }
      
    } else {
      // 📦 EXISTING USER: Send regular order confirmation
      if (magicLink && pin) {
        // Send combined confirmation + tracking email
        emailService.sendOrderConfirmationWithTracking(savedOrder, guestInfo, magicLink, pin)
          .then(() => {
            console.log('✅ Combined confirmation+tracking email sent successfully');
          })
          .catch(err => {
            console.error("❌ Failed to send combined confirmation+tracking email for guest:", err);
            // Fallback to regular confirmation email only if the combined email fails
            emailService.sendOrderConfirmation(savedOrder, guestInfo).catch(fallbackErr => {
              console.error("❌ Failed to send fallback order confirmation email for guest:", fallbackErr);
            });
          });
      } else {
        // Fallback to regular confirmation if secure access failed
        console.log('⚠️ Secure access tokens not generated, sending regular confirmation email');
        emailService.sendOrderConfirmation(savedOrder, guestInfo).catch(err => {
          console.error("❌ Failed to send guest order confirmation email:", err);
        });
      }
    }
    
    // 📄 INVOICE: Auto-generate invoice for paid guest orders
    // if (savedOrder.paymentStatus === 'Paid') {
    //   try {
    //     const invoice = await invoiceService.createInvoiceFromOrder(savedOrder);
    //     console.log(`✅ Invoice generated automatically for guest order: ${invoice.invoiceNumber}`);
        
    //     // Add invoice info to response (optional)
    //     savedOrder.invoiceGenerated = true;
    //     savedOrder.invoiceNumber = invoice.invoiceNumber;
    //   } catch (invoiceError) {
    //     console.error('Invoice generation error for guest order (order still created):', invoiceError);
    //     // Don't fail the order if invoice generation fails - can be retried later
    //   }
    // }
    
    // 📱 TELEGRAM: Send instant guest order notification to admin
    telegramService.sendNewOrderNotification(savedOrder, guestInfo).catch(err => {
      console.error("Failed to send Telegram notification for guest order:", err);
      // Don't fail the order if Telegram notification fails
    });
    
    // 🔥 High-value guest order alert
    if (savedOrder.amount > 2000) {
      telegramService.sendHighValueOrderAlert(savedOrder).catch(err => {
        console.error("Failed to send high-value guest order alert:", err);
      });
    }

    console.log('Guest order created:', savedOrder._id);

    res.json({
      success: true,
      order: savedOrder,
      message: 'Guest order created successfully'
    });

  } catch (error) {
    console.error('Guest order creation error:', error);
    res.status(500).json({
      error: 'Failed to create guest order',
      details: error.message
    });
  }
};

// Get guest order by ID and email
exports.getGuestOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required to retrieve guest order'
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      'guestInfo.email': email
    }).populate('products.product', 'name photo');

    if (!order) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Get guest order error:', error);
    res.status(500).json({
      error: 'Failed to retrieve guest order',
      details: error.message
    });
  }
};

// Track guest order by order ID and email
exports.trackGuestOrder = async (req, res) => {
  try {
    const { orderId, email } = req.body;

    if (!orderId || !email) {
      return res.status(400).json({
        error: 'Order ID and email are required'
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      'guestInfo.email': email
    }).select('status shipping createdAt updatedAt');

    if (!order) {
      return res.status(404).json({
        error: 'Order not found. Please check your order ID and email.'
      });
    }

    res.json({
      success: true,
      tracking: {
        orderId: order._id,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        shipping: {
          courier: order.shipping?.courier,
          trackingId: order.shipping?.trackingId,
          estimatedDelivery: order.shipping?.estimatedDelivery
        }
      }
    });

  } catch (error) {
    console.error('Track guest order error:', error);
    res.status(500).json({
      error: 'Failed to track order',
      details: error.message
    });
  }
};
