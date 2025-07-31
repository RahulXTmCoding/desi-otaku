const express = require('express');
const router = express.Router();

const { requireSignin, isAuth, isAdmin } = require('../controllers/auth');
const { getUserById } = require('../controllers/user');
const {
  createInvoiceFromOrder,
  getInvoice,
  getInvoiceByOrderId,
  downloadInvoicePDF,
  getCustomerInvoices,
  getGuestInvoices,
  regenerateInvoicePDF,
  getAllInvoices,
  updateInvoiceStatus,
  bulkCreateInvoices
} = require('../controllers/invoice');

// Public routes for guest invoice access
router.get('/guest/invoices', getGuestInvoices);

// Protected routes (require authentication)
router.get('/customer/:userId/invoices', requireSignin, isAuth, getCustomerInvoices);

// Order-based routes
router.post('/order/:orderId/create', createInvoiceFromOrder);
router.get('/order/:orderId/invoice', getInvoiceByOrderId);

// Invoice management routes
router.get('/:invoiceId', getInvoice);
router.get('/:invoiceId/download', downloadInvoicePDF);
router.post('/:invoiceId/regenerate', regenerateInvoicePDF);

// Admin routes
router.get('/admin/invoices', requireSignin, isAdmin, getAllInvoices);
router.put('/admin/:invoiceId/status', requireSignin, isAdmin, updateInvoiceStatus);
router.post('/admin/bulk-create', requireSignin, isAdmin, bulkCreateInvoices);

// Parameter middleware
router.param('userId', getUserById);

module.exports = router;
