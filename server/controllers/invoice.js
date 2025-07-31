const invoiceService = require('../services/invoiceService');
const Invoice = require('../models/invoice');
const { Order } = require('../models/order');
const path = require('path');
const fs = require('fs').promises;

// Create invoice from existing order
exports.createInvoiceFromOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Find the order
    const order = await Order.findById(orderId)
      .populate('user', 'name email phone');
    
    if (!order) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }
    
    // Check if invoice already exists
    const existingInvoice = await Invoice.findOne({ orderId: order._id });
    if (existingInvoice) {
      return res.status(400).json({
        error: 'Invoice already exists for this order',
        invoiceId: existingInvoice._id,
        invoiceNumber: existingInvoice.invoiceNumber
      });
    }
    
    // Create invoice
    const invoice = await invoiceService.createInvoiceFromOrder(order);
    
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
    console.error('Create invoice error:', error);
    res.status(500).json({
      error: 'Failed to create invoice',
      details: error.message
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

// Download invoice PDF
exports.downloadInvoicePDF = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    const invoice = await Invoice.findById(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({
        error: 'Invoice not found'
      });
    }
    
    if (!invoice.files.pdfPath || !invoice.files.pdfUrl) {
      return res.status(404).json({
        error: 'PDF not available for this invoice'
      });
    }
    
    // Check if file exists
    try {
      await fs.access(invoice.files.pdfPath);
    } catch (error) {
      // File doesn't exist, regenerate it
      console.log('PDF file not found, regenerating...');
      await invoiceService.regeneratePDF(invoiceId);
    }
    
    const fileName = `invoice-${invoice.invoiceNumber}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Stream the file
    const fileBuffer = await fs.readFile(invoice.files.pdfPath);
    res.send(fileBuffer);
    
  } catch (error) {
    console.error('Download PDF error:', error);
    res.status(500).json({
      error: 'Failed to download invoice PDF',
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

module.exports = exports;
