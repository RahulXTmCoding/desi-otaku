const telegramService = require('../services/telegramService');

/**
 * Submit return/exchange request
 */
exports.submitReturnExchangeRequest = async (req, res) => {
  try {
    const { 
      orderId, 
      name, 
      email, 
      phone, 
      requestType, // 'return' or 'exchange'
      reason,
      issueDescription,
      productDetails // optional: which specific product(s) from the order
    } = req.body;

    // Validation
    if (!orderId || !name || !email || !phone || !requestType || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: orderId, name, email, phone, requestType, and reason are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate phone format (Indian mobile numbers)
    let cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');
    // Strip country code if present
    if (cleanPhone.startsWith('91') && cleanPhone.length > 10) {
      cleanPhone = cleanPhone.substring(2);
    } else if (cleanPhone.startsWith('0') && cleanPhone.length > 10) {
      cleanPhone = cleanPhone.substring(1);
    }
    
    if (cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: `Invalid phone number. Please provide exactly 10 digits (you entered ${cleanPhone.length})`
      });
    }
    
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Indian phone number. Must start with 6, 7, 8, or 9'
      });
    }

    // Validate request type
    if (!['return', 'exchange'].includes(requestType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request type. Must be "return" or "exchange"'
      });
    }

    // Prepare request data
    const requestData = {
      orderId,
      name,
      email,
      phone,
      requestType: requestType.toLowerCase(),
      reason,
      issueDescription: issueDescription || 'No additional details provided',
      productDetails: productDetails || 'All products in order',
      timestamp: new Date(),
      userId: req.user?._id || null, // If user is logged in
      isGuest: !req.user
    };

    // Send Telegram notification
    const telegramResult = await telegramService.sendReturnExchangeRequest(requestData);

    if (telegramResult.success) {
      return res.status(200).json({
        success: true,
        message: `${requestType === 'return' ? 'Return' : 'Exchange'} request submitted successfully. We will contact you within 24 hours.`,
        data: {
          orderId,
          requestType,
          submittedAt: requestData.timestamp
        }
      });
    } else {
      // Even if Telegram fails, we should log it but still acknowledge the request
      const errorMsg = telegramResult.error || telegramResult.reason || 'Unknown error';
      console.error('Telegram notification failed, but request was received:', errorMsg);
      
      return res.status(200).json({
        success: true,
        message: `${requestType === 'return' ? 'Return' : 'Exchange'} request received. We will contact you within 24 hours.`,
        data: {
          orderId,
          requestType,
          submittedAt: requestData.timestamp
        },
        warning: 'Request received but notification system is temporarily unavailable'
      });
    }

  } catch (error) {
    console.error('Error submitting return/exchange request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit request. Please try again or contact support directly.',
      error: error.message
    });
  }
};

/**
 * Get return policy info (optional endpoint)
 */
exports.getReturnPolicy = async (req, res) => {
  try {
    const policy = {
      returnWindow: 5, // days
      conditions: [
        'Returns accepted only for defective products',
        'Must report within 5 days of delivery',
        'Product must be unused with original tags',
        'Free return for our mistakes',
        'Original invoice must be included'
      ],
      exchangeInfo: {
        freeExchange: 'Available for defective products, wrong size delivered, or damaged items',
        paidExchange: 'Size exchange available for ₹80-120 delivery charges if you ordered wrong size'
      },
      contactEmail: 'hello@attars.club',
      processingTime: '24-48 hours'
    };

    return res.status(200).json({
      success: true,
      data: policy
    });
  } catch (error) {
    console.error('Error fetching return policy:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch return policy'
    });
  }
};
