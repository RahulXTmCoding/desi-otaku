const express = require('express');
const router = express.Router();
const { Order } = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');
const EmailService = require('../services/emailService');
const { isSignedIn, isAuthenticated, isAdmin } = require('../controllers/auth');
const { getUserById } = require('../controllers/user');

// Param middleware
router.param("userId", getUserById);

// Get buyers from orders within a date range
router.get('/buyers/:userId', isSignedIn, isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate, filter } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Start date and end date are required'
      });
    }

    // Build the aggregation pipeline
    const pipeline = [
      // Match orders within date range
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          },
          status: { $ne: 'Cancelled' } // Exclude cancelled orders
        }
      },
      
      // Group by user to calculate buyer statistics
      {
        $group: {
          _id: {
            userId: '$user',
            userEmail: '$guestInfo.email', // For guest orders
            userName: '$guestInfo.name'
          },
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$amount' },
          lastOrderDate: { $max: '$createdAt' },
          orderIds: { $push: '$_id' }
        }
      },
      
      // Lookup user details for registered users
      {
        $lookup: {
          from: 'users',
          localField: '_id.userId',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      
      // Project final buyer data
      {
        $project: {
          _id: {
            $cond: [
              { $ne: ['$_id.userId', null] },
              '$_id.userId',
              { $concat: ['guest_', { $toString: '$_id.userEmail' }] }
            ]
          },
          name: {
            $cond: [
              { $ne: ['$_id.userId', null] },
              { $arrayElemAt: ['$userDetails.name', 0] },
              '$_id.userName'
            ]
          },
          email: {
            $cond: [
              { $ne: ['$_id.userId', null] },
              { $arrayElemAt: ['$userDetails.email', 0] },
              '$_id.userEmail'
            ]
          },
          totalOrders: 1,
          totalSpent: 1,
          lastOrderDate: 1,
          orderIds: 1
        }
      },
      
      // Sort by total spent (highest first)
      { $sort: { totalSpent: -1 } }
    ];

    const buyers = await Order.aggregate(pipeline);
    
    // Apply additional filters
    let filteredBuyers = buyers.filter(buyer => buyer.email); // Remove entries without email
    
    switch (filter) {
      case 'new':
        filteredBuyers = filteredBuyers.filter(buyer => buyer.totalOrders === 1);
        break;
      case 'repeat':
        filteredBuyers = filteredBuyers.filter(buyer => buyer.totalOrders > 1);
        break;
      case 'high-value':
        filteredBuyers = filteredBuyers.filter(buyer => buyer.totalSpent > 3000);
        break;
      default:
        // Keep all buyers
        break;
    }

    res.json({
      success: true,
      buyers: filteredBuyers,
      summary: {
        totalBuyers: filteredBuyers.length,
        totalRevenue: filteredBuyers.reduce((sum, buyer) => sum + buyer.totalSpent, 0),
        averageOrderValue: filteredBuyers.length > 0 
          ? filteredBuyers.reduce((sum, buyer) => sum + buyer.totalSpent, 0) / filteredBuyers.reduce((sum, buyer) => sum + buyer.totalOrders, 0)
          : 0
      }
    });

  } catch (error) {
    console.error('Error fetching buyers:', error);
    res.status(500).json({
      error: 'Failed to fetch buyers data'
    });
  }
});

// Send marketing campaign
router.post('/campaign/send/:userId', isSignedIn, isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { name, subject, products, buyers, manualEmails, dateRange } = req.body;
    
    if (!name || !subject || !products?.length || (!buyers?.length && !manualEmails?.length)) {
      return res.status(400).json({
        error: 'Campaign name, subject, products, and recipients (buyers or manual emails) are required'
      });
    }

    // Fetch product details
    const productDetails = await Product.find({
      _id: { $in: products },
      isActive: true
    }).select('name price photoUrl images category');

    if (productDetails.length === 0) {
      return res.status(400).json({
        error: 'No valid products found'
      });
    }

    // Collect all email recipients
    let allRecipients = [];
    
    // Process buyer details if provided
    if (buyers && buyers.length > 0) {
      const userBuyers = buyers.filter(id => !id.toString().startsWith('guest_'));
      const guestEmails = buyers
        .filter(id => id.toString().startsWith('guest_'))
        .map(id => id.toString().replace('guest_', ''));

      // Get registered users
      if (userBuyers.length > 0) {
        const users = await User.find({
          _id: { $in: userBuyers }
        }).select('name email');
        allRecipients.push(...users);
      }
      
      // Add guest buyers
      if (guestEmails.length > 0) {
        const guestBuyerDetails = guestEmails.map(email => ({
          _id: `guest_${email}`,
          email: email,
          name: 'Valued Customer' // Default name for guests
        }));
        allRecipients.push(...guestBuyerDetails);
      }
    }
    
    // Add manual emails if provided
    if (manualEmails && manualEmails.length > 0) {
      const manualRecipients = manualEmails.map(email => ({
        _id: `manual_${email}`,
        email: email,
        name: 'Valued Customer' // Default name for manual emails
      }));
      allRecipients.push(...manualRecipients);
    }

    if (allRecipients.length === 0) {
      return res.status(400).json({
        error: 'No valid recipients found'
      });
    }

    // Create campaign record
    const campaignData = {
      name,
      subject,
      products: productDetails.map(p => p._id),
      targetRecipients: allRecipients.length,
      dateRange,
      status: 'sending',
      createdBy: req.params.userId,
      createdAt: new Date()
    };

    // Send emails to all recipients
    let successCount = 0;
    let failureCount = 0;
    
    for (const recipient of allRecipients) {
      try {
        await EmailService.sendMarketingEmail(recipient, subject, productDetails);
        successCount++;
      } catch (emailError) {
        console.error(`Failed to send email to ${recipient.email}:`, emailError);
        failureCount++;
      }
    }

    // Update campaign status
    campaignData.status = 'sent';
    campaignData.sentAt = new Date();
    campaignData.analytics = {
      sent: successCount,
      delivered: successCount, // Assume delivered for now
      opened: 0,
      clicked: 0
    };

    // In a real implementation, you'd save this to a campaigns collection
    // For now, we'll just return the results

    res.json({
      success: true,
      campaign: campaignData,
      results: {
        totalTargeted: allRecipients.length,
        successful: successCount,
        failed: failureCount
      }
    });

  } catch (error) {
    console.error('Error sending marketing campaign:', error);
    res.status(500).json({
      error: 'Failed to send marketing campaign'
    });
  }
});

// Get campaign history
router.get('/campaigns/:userId', isSignedIn, isAuthenticated, isAdmin, async (req, res) => {
  try {
    // In a real implementation, you'd fetch from a campaigns collection
    // For now, return an empty array as campaigns aren't persisted
    res.json({
      success: true,
      campaigns: []
    });
    
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      error: 'Failed to fetch campaigns'
    });
  }
});

// Get marketing analytics
router.get('/analytics/:userId', isSignedIn, isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Calculate basic analytics from orders
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            $lte: endDate ? new Date(endDate) : new Date()
          },
          status: { $ne: 'Cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalOrders: { $sum: 1 },
          uniqueCustomers: { $addToSet: { $ifNull: ['$user', '$guestInfo.email'] } }
        }
      }
    ];

    const analytics = await Order.aggregate(pipeline);
    const result = analytics[0] || { totalRevenue: 0, totalOrders: 0, uniqueCustomers: [] };

    res.json({
      success: true,
      analytics: {
        totalRevenue: result.totalRevenue,
        totalOrders: result.totalOrders,
        uniqueCustomers: result.uniqueCustomers.length,
        averageOrderValue: result.totalOrders > 0 ? result.totalRevenue / result.totalOrders : 0
      }
    });

  } catch (error) {
    console.error('Error fetching marketing analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics'
    });
  }
});

// Test marketing email
router.post('/test-email/:userId', isSignedIn, isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { email, subject, products } = req.body;
    
    if (!email || !subject || !products?.length) {
      return res.status(400).json({
        error: 'Email, subject, and products are required'
      });
    }

    // Fetch product details
    const productDetails = await Product.find({
      _id: { $in: products }
    }).select('name price photoUrl images category');

    // Send test email
    const testBuyer = {
      name: 'Test Recipient',
      email: email
    };

    await EmailService.sendMarketingEmail(testBuyer, subject, productDetails);

    res.json({
      success: true,
      message: `Test email sent to ${email}`
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      error: 'Failed to send test email'
    });
  }
});

module.exports = router;
