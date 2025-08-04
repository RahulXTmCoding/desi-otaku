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
    }c
    
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

// Download invoice PDF by order ID
exports.downloadInvoiceByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    let invoice = null;
    
    // ✅ FIX: Check if orderId looks like a payment ID FIRST to avoid ObjectId cast error
    if (orderId.startsWith('pay_')) {
      console.log('Order ID looks like payment ID, searching by transaction_id...');
      console.log('Searching for order with transaction_id:', orderId);
      
      // ✅ DEBUG: Check more orders to see what transaction_ids exist
      const allOrders = await Order.find({}).select('transaction_id _id createdAt').sort({ createdAt: -1 }).limit(20);
      console.log('Recent 20 orders in database:', allOrders.map(o => ({ 
        id: o._id, 
        transaction_id: o.transaction_id,
        created: o.createdAt 
      })));
      
      // ✅ ENHANCED SEARCH: Try to find by partial payment ID or similar
      const similarOrders = await Order.find({
        transaction_id: { $regex: 'pay_R0W', $options: 'i' }
      }).select('transaction_id _id');
      console.log('Orders with similar payment ID:', similarOrders);
      
      let order = await Order.findOne({ transaction_id: orderId });
      
      // ✅ TIMING FIX: If order not found, wait and retry (order might still be creating)
      if (!order) {
        console.log('Order not found immediately, waiting 2 seconds and retrying...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        order = await Order.findOne({ transaction_id: orderId });
      }
      
      if (order) {
        console.log('✅ Found order by payment ID:', order._id);
        invoice = await Invoice.findOne({ orderId: order._id });
        console.log('Invoice found for order:', invoice ? invoice._id : 'No invoice found');
        
        // If no invoice exists, try to create one
        if (!invoice) {
          console.log('No invoice found, creating one...');
          try {
            const populatedOrder = await Order.findById(order._id)
              .populate('user', 'name email phone');
            invoice = await invoiceService.createInvoiceFromOrder(populatedOrder);
            console.log('✅ Invoice created successfully:', invoice.invoiceNumber);
          } catch (createError) {
            console.error('Failed to create invoice:', createError);
            return res.status(500).json({
              error: 'Invoice not found and could not be created',
              details: createError.message
            });
          }
        }
      } else {
        console.log('❌ No order found with transaction_id:', orderId);
        console.log('This might be a timing issue - order may still be creating');
        return res.status(404).json({
          error: 'Order not found for this payment ID. If you just completed payment, please wait a moment and try again.',
          details: 'Order may still be processing'
        });
      }
    } else {
      // Only try to find by orderId if it's not a payment ID (should be valid ObjectId)
      try {
        invoice = await Invoice.findOne({ orderId });
      } catch (castError) {
        console.log('Invalid ObjectId format for orderId:', orderId);
        return res.status(400).json({
          error: 'Invalid order ID format',
          details: 'Order ID must be a valid ObjectId or payment ID'
        });
      }
    }
    
    if (!invoice) {
      return res.status(404).json({
        error: 'Invoice not found for this order'
      });
    }
    
    // ✅ ENHANCED: Try to generate PDF first, fallback to HTML
    if (!invoice.files.pdfPath || !invoice.files.pdfUrl) {
      console.log('📄 PDF not available, attempting to generate...');
      try {
        const invoiceService = require('../services/invoiceService');
        const pdfResult = await invoiceService.generatePDF(invoice);
        
        if (pdfResult.warning) {
          // PDF generation failed, send HTML instead
          console.log('⚠️ PDF generation failed, sending HTML download');
          
          const invoiceHTML = invoiceService.generateInvoiceHTML(invoice);
          const fileName = `invoice-${invoice.invoiceNumber}.html`;
          
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
          res.setHeader('Cache-Control', 'no-cache');
          
          const printableHTML = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Invoice ${invoice.invoiceNumber}</title>
            <style>
              @media screen {
                body { 
                  margin: 20px;
                  background: #f5f5f5;
                }
                .print-instruction {
                  background: #007bff;
                  color: white;
                  padding: 15px;
                  margin-bottom: 20px;
                  border-radius: 5px;
                  text-align: center;
                  font-family: Arial, sans-serif;
                }
                .print-button {
                  background: #28a745;
                  color: white;
                  padding: 10px 20px;
                  border: none;
                  border-radius: 5px;
                  cursor: pointer;
                  font-size: 16px;
                  margin: 10px;
                }
              }
              @media print {
                .print-instruction { display: none; }
                body { margin: 0; background: white; }
              }
            </style>
          </head>
          <body>
            <div class="print-instruction">
              <h3>📄 Invoice ${invoice.invoiceNumber}</h3>
              <p>Click the button below to print this invoice, or use Ctrl+P (Cmd+P on Mac)</p>
              <button class="print-button" onclick="window.print()">🖨️ Print Invoice</button>
              <button class="print-button" onclick="window.close()">✖️ Close</button>
            </div>
            ${invoiceHTML}
            <script>
              // Auto-open print dialog
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 1000);
              };
            </script>
          </body>
          </html>`;
          
          return res.send(printableHTML);
        }
        
        // PDF generated successfully, continue to serve it
        console.log('✅ PDF generated successfully, serving PDF file');
        
      } catch (error) {
        console.error('Failed to generate PDF:', error);
        // Fall back to HTML
        const invoiceService = require('../services/invoiceService');
        const invoiceHTML = invoiceService.generateInvoiceHTML(invoice);
        const fileName = `invoice-${invoice.invoiceNumber}.html`;
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Cache-Control', 'no-cache');
        
        return res.send(invoiceHTML);
      }
    }
    
    // Check if PDF file exists
    try {
      await fs.access(invoice.files.pdfPath);
    } catch (error) {
      return res.status(404).json({
        error: 'Invoice PDF file not found on server'
      });
    }
    
    // ✅ SERVE ACTUAL PDF FILE
    console.log('📄 Serving PDF file for download');
    const fileName = `invoice-${invoice.invoiceNumber}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Stream the PDF file
    const fileBuffer = await fs.readFile(invoice.files.pdfPath);
    console.log('✅ PDF file sent successfully');
    res.send(fileBuffer);
    
  } catch (error) {
    console.error('Download invoice by order ID error:', error);
    res.status(500).json({
      error: 'Failed to download invoice',
      details: error.message
    });
  }
};
