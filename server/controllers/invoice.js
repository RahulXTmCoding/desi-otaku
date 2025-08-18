const mongoose = require('mongoose');
const invoiceService = require('../services/invoiceService');
const Invoice = require('../models/invoice');
const { Order } = require('../models/order');
const path = require('path');
const fs = require('fs').promises;

// Create invoice from existing order
exports.createInvoiceFromOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log(`🔄 Creating invoice for order: ${orderId}`);
    
    // ✅ ROBUST ORDER LOOKUP: Try different ID formats
    let order = null;
    
    // Try as direct order ID first
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId).populate('user', 'name email phone');
      console.log(`   Direct order lookup: ${order ? 'found' : 'not found'}`);
    }
    
    // If not found and looks like payment ID, try finding by transaction_id
    if (!order && orderId.startsWith('pay_')) {
      order = await Order.findOne({ transaction_id: orderId }).populate('user', 'name email phone');
      console.log(`   Payment ID lookup: ${order ? 'found' : 'not found'}`);
    }
    
    // If still not found, try finding recent orders and log for debugging
    if (!order) {
      console.log(`❌ Order not found for ID: ${orderId}`);
      
      // Debug: Show recent orders
      const recentOrders = await Order.find({}).sort({ createdAt: -1 }).limit(5).select('_id transaction_id createdAt');
      console.log('Recent orders for debugging:', recentOrders.map(o => ({
        id: o._id.toString(),
        paymentId: o.transaction_id,
        created: o.createdAt
      })));
      
      return res.status(404).json({
        error: 'Order not found',
        debug: {
          searchedId: orderId,
          isValidObjectId: mongoose.Types.ObjectId.isValid(orderId),
          looksLikePaymentId: orderId.startsWith('pay_'),
          recentOrderIds: recentOrders.map(o => o._id.toString())
        }
      });
    }
    
    console.log(`✅ Order found: ${order._id}`);
    console.log(`   Order structure:`, {
      hasUser: !!order.user,
      hasGuestInfo: !!order.guestInfo,
      products: order.products?.length || 0,
      amount: order.amount,
      address: order.address ? 'present' : 'missing',
      paymentStatus: order.paymentStatus
    });
    
    // Check if invoice already exists
    const existingInvoice = await Invoice.findOne({ orderId: order._id });
    if (existingInvoice) {
      console.log(`⚠️ Invoice already exists: ${existingInvoice.invoiceNumber}`);
      return res.status(400).json({
        error: 'Invoice already exists for this order',
        invoiceId: existingInvoice._id,
        invoiceNumber: existingInvoice.invoiceNumber
      });
    }
    
    // Create invoice with enhanced error handling
    console.log(`🔄 Creating invoice with invoiceService...`);
    const invoice = await invoiceService.createInvoiceFromOrder(order);
    
    console.log(`✅ Invoice created successfully: ${invoice.invoiceNumber}`);
    
    res.json({
      success: true,
      message: 'Invoice created successfully',
      invoice: {
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        amount: invoice.amounts.grandTotal,
        pdfUrl: invoice.files.pdfUrl,
        status: invoice.status
      }
    });
    
  } catch (error) {
    console.error('❌ Create invoice error:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      error: 'Failed to create invoice',
      details: error.message,
      debug: {
        orderId: req.params.orderId,
        errorType: error.constructor.name,
        errorMessage: error.message
      }
    });
  }
};

// Get invoice by ID
exports.getInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    const invoice = await invoiceService.getInvoice(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({
        error: 'Invoice not found'
      });
    }
    
    res.json({
      success: true,
      invoice
    });
    
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      error: 'Failed to fetch invoice',
      details: error.message
    });
  }
};

// Get invoice by order ID
exports.getInvoiceByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const invoice = await Invoice.findOne({ orderId })
      .populate('orderId', 'status createdAt');
    
    if (!invoice) {
      return res.status(404).json({
        error: 'Invoice not found for this order'
      });
    }
    
    res.json({
      success: true,
      invoice
    });
    
  } catch (error) {
    console.error('Get invoice by order error:', error);
    res.status(500).json({
      error: 'Failed to fetch invoice',
      details: error.message
    });
  }
};

// Download invoice as HTML for frontend PDF conversion
exports.downloadInvoicePDF = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    const invoice = await Invoice.findById(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({
        error: 'Invoice not found'
      });
    }
    
    console.log(`🔄 Serving invoice HTML for frontend conversion: ${invoice.invoiceNumber}`);
    
    // Generate fresh HTML content
    const invoiceHTML = invoiceService.generateInvoiceHTML(invoice);
    
    // Set headers for frontend PDF conversion
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Invoice-Number', invoice.invoiceNumber);
    res.setHeader('X-Invoice-Filename', `invoice-${invoice.invoiceNumber}.pdf`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Send HTML for frontend conversion
    res.send(invoiceHTML);
    
  } catch (error) {
    console.error('Download invoice HTML error:', error);
    res.status(500).json({
      error: 'Failed to generate invoice',
      details: error.message
    });
  }
};

// Get customer invoices (for authenticated users)
exports.getCustomerInvoices = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Get user email
    const User = require('../models/user');
    const user = await User.findById(userId).select('email');
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    const invoices = await invoiceService.getCustomerInvoices(user.email);
    
    res.json({
      success: true,
      invoices: invoices.map(invoice => ({
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        orderId: invoice.orderId,
        amount: invoice.amounts.grandTotal,
        status: invoice.status,
        pdfUrl: invoice.files.pdfUrl,
        createdAt: invoice.createdAt
      }))
    });
    
  } catch (error) {
    console.error('Get customer invoices error:', error);
    res.status(500).json({
      error: 'Failed to fetch customer invoices',
      details: error.message
    });
  }
};

// Get guest customer invoices by email
exports.getGuestInvoices = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }
    
    const invoices = await invoiceService.getCustomerInvoices(email);
    
    res.json({
      success: true,
      invoices: invoices.map(invoice => ({
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        orderId: invoice.orderId,
        amount: invoice.amounts.grandTotal,
        status: invoice.status,
        pdfUrl: invoice.files.pdfUrl,
        createdAt: invoice.createdAt
      }))
    });
    
  } catch (error) {
    console.error('Get guest invoices error:', error);
    res.status(500).json({
      error: 'Failed to fetch invoices',
      details: error.message
    });
  }
};

// Regenerate invoice PDF
exports.regenerateInvoicePDF = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    const result = await invoiceService.regeneratePDF(invoiceId);
    
    res.json({
      success: true,
      message: 'Invoice PDF regenerated successfully',
      pdfUrl: result.pdfUrl,
      fileName: result.fileName
    });
    
  } catch (error) {
    console.error('Regenerate PDF error:', error);
    res.status(500).json({
      error: 'Failed to regenerate invoice PDF',
      details: error.message
    });
  }
};

// Admin: Get all invoices with pagination
exports.getAllInvoices = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.profile || req.profile.role !== 1) {
      return res.status(403).json({
        error: 'Access denied. Admin only.'
      });
    }
    
    const {
      page = 1,
      limit = 20,
      status,
      search,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query
    let query = {};
    
    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate);
      if (endDate) query.invoiceDate.$lte = new Date(endDate);
    }
    
    // Search filter (invoice number or customer email)
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Execute query
    const [invoices, totalCount] = await Promise.all([
      Invoice.find(query)
        .populate('orderId', 'status createdAt')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Invoice.countDocuments(query)
    ]);
    
    // Calculate stats
    const stats = await Invoice.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amounts.grandTotal' }
        }
      }
    ]);
    
    res.json({
      success: true,
      invoices,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalInvoices: totalCount,
        hasMore: skip + invoices.length < totalCount
      },
      stats
    });
    
  } catch (error) {
    console.error('Get all invoices error:', error);
    res.status(500).json({
      error: 'Failed to fetch invoices',
      details: error.message
    });
  }
};

// Admin: Update invoice status
exports.updateInvoiceStatus = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.profile || req.profile.role !== 1) {
      return res.status(403).json({
        error: 'Access denied. Admin only.'
      });
    }
    
    const { invoiceId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        validStatuses
      });
    }
    
    const invoice = await Invoice.findByIdAndUpdate(
      invoiceId,
      { status },
      { new: true }
    );
    
    if (!invoice) {
      return res.status(404).json({
        error: 'Invoice not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Invoice status updated successfully',
      invoice: {
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status
      }
    });
    
  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({
      error: 'Failed to update invoice status',
      details: error.message
    });
  }
};

// Bulk create invoices for orders without invoices
exports.bulkCreateInvoices = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.profile || req.profile.role !== 1) {
      return res.status(403).json({
        error: 'Access denied. Admin only.'
      });
    }
    
    // Find orders without invoices
    const ordersWithoutInvoices = await Order.find({
      paymentStatus: 'Paid'
    }).populate('user', 'name email phone');
    
    // Get existing invoice order IDs
    const existingInvoiceOrderIds = await Invoice.find({}).distinct('orderId');
    
    // Filter orders that don't have invoices
    const ordersToProcess = ordersWithoutInvoices.filter(
      order => !existingInvoiceOrderIds.some(id => id.toString() === order._id.toString())
    );
    
    if (ordersToProcess.length === 0) {
      return res.json({
        success: true,
        message: 'All paid orders already have invoices',
        created: 0
      });
    }
    
    const results = {
      created: 0,
      failed: 0,
      errors: []
    };
    
    // Create invoices for each order
    for (const order of ordersToProcess) {
      try {
        await invoiceService.createInvoiceFromOrder(order);
        results.created++;
        console.log(`✅ Invoice created for order ${order._id}`);
      } catch (error) {
        results.failed++;
        results.errors.push({
          orderId: order._id,
          error: error.message
        });
        console.error(`❌ Failed to create invoice for order ${order._id}:`, error.message);
      }
    }
    
    res.json({
      success: true,
      message: `Bulk invoice creation completed`,
      results: {
        totalOrders: ordersToProcess.length,
        created: results.created,
        failed: results.failed,
        errors: results.errors
      }
    });
    
  } catch (error) {
    console.error('Bulk create invoices error:', error);
    res.status(500).json({
      error: 'Failed to bulk create invoices',
      details: error.message
    });
  }
};

// Download invoice HTML by order ID for frontend PDF conversion
exports.downloadInvoiceByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    let invoice = null;
    let order = null;
    
    console.log(`🔄 Downloading invoice for ID: ${orderId}`);
    
    // ✅ FIXED: Check if it's a payment ID first to avoid casting errors
    if (orderId.startsWith('pay_')) {
      console.log('   Detected payment ID, looking up order...');
      order = await Order.findOne({ transaction_id: orderId });
      
      if (order) {
        console.log(`   Found order ${order._id} for payment ID`);
        invoice = await Invoice.findOne({ orderId: order._id });
        
        // If no invoice exists, try to create one
        if (!invoice) {
          console.log('   No invoice found, creating one...');
          const populatedOrder = await Order.findById(order._id).populate('user', 'name email phone');
          invoice = await invoiceService.createInvoiceFromOrder(populatedOrder);
        }
      } else {
        console.log('   No order found for payment ID');
      }
    } else if (mongoose.Types.ObjectId.isValid(orderId)) {
      // It's a valid ObjectId, try finding invoice directly
      console.log('   Detected ObjectId, looking up invoice directly...');
      invoice = await Invoice.findOne({ orderId });
      
      if (!invoice) {
        console.log('   No invoice found, looking up order...');
        order = await Order.findById(orderId);
        
        if (order) {
          console.log(`   Found order, creating invoice...`);
          const populatedOrder = await Order.findById(order._id).populate('user', 'name email phone');
          invoice = await invoiceService.createInvoiceFromOrder(populatedOrder);
        }
      }
    } else {
      console.log('   Invalid ID format - not payment ID or ObjectId');
      return res.status(400).json({
        error: 'Invalid order ID format',
        debug: {
          providedId: orderId,
          isPaymentId: orderId.startsWith('pay_'),
          isValidObjectId: mongoose.Types.ObjectId.isValid(orderId)
        }
      });
    }
    
    if (!invoice) {
      return res.status(404).json({
        error: 'Invoice not found for this order'
      });
    }
    
    console.log(`🔄 Serving invoice HTML for frontend conversion: ${invoice.invoiceNumber}`);
    
    // Generate fresh HTML content for frontend conversion
    const invoiceHTML = invoiceService.generateInvoiceHTML(invoice);
    
    // Set headers for frontend PDF conversion
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Invoice-Number', invoice.invoiceNumber);
    res.setHeader('X-Invoice-Filename', `invoice-${invoice.invoiceNumber}.pdf`);
    res.setHeader('X-Order-Id', orderId);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Send HTML for frontend conversion
    res.send(invoiceHTML);
    
  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({
      error: 'Failed to generate invoice',
      details: error.message
    });
  }
};
