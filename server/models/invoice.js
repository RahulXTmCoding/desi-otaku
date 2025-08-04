const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  // Invoice identification
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  invoiceDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  // Related order
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  
  // Customer information
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    isGuest: { type: Boolean, default: false }
  },
  
  // Billing address
  billingAddress: {
    fullName: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pinCode: { type: String, required: true },
    country: { type: String, default: 'India' }
  },
  
  // Shipping address (if different)
  shippingAddress: {
    fullName: String,
    address: String,
    city: String,
    state: String,
    pinCode: String,
    country: { type: String, default: 'India' }
  },
  
  // Company details
  company: {
    name: { type: String, default: 'Anime T-Shirt Store' },
    address: { type: String, default: 'Mumbai, Maharashtra, India' },
    email: { type: String, default: 'orders@animeshop.com' },
    phone: { type: String, default: '+91-9876543210' },
    website: { type: String, default: 'www.animeshop.com' },
    gstNumber: String, // Add when GST registration obtained
    logo: String // URL to company logo
  },
  
  // Invoice items
  items: [{
    name: { type: String, required: true },
    description: String,
    hsnCode: { type: String, default: '61091000' }, // HSN code for T-shirts
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    isCustom: { type: Boolean, default: false },
    customization: {
      frontDesign: {
        designId: String,
        designImage: String,
        price: Number
      },
      backDesign: {
        designId: String,
        designImage: String,
        price: Number
      }
    }
  }],
  
  // Amount calculations (GST-inclusive pricing model)
  amounts: {
    grossAmount: { type: Number, required: true }, // Higher MRP-like price
    discount: { type: Number, default: 0 }, // Discount amount
    discountDescription: String,
    otherCharges: { type: Number, default: 0 }, // Additional charges
    
    // GST breakdown (reverse calculated from final price)
    taxableAmount: { type: Number, required: true }, // Amount before GST
    cgst: { type: Number, default: 0 }, // Central GST
    sgst: { type: Number, default: 0 }, // State GST  
    igst: { type: Number, default: 0 }, // Integrated GST
    totalTax: { type: Number, default: 0 },
    
    grandTotal: { type: Number, required: true }, // Final price (GST inclusive)
    
    // Legacy fields for backward compatibility
    subtotal: { type: Number },
    shippingCost: { type: Number, default: 0 }
  },
  
  // Tax details
  tax: {
    isGstApplicable: { type: Boolean, default: false },
    gstRate: { type: Number, default: 0 }, // 18% for textiles typically
    placeOfSupply: String, // State code for GST
    reverseCharge: { type: Boolean, default: false }
  },
  
  // Payment information
  payment: {
    method: { type: String, required: true }, // razorpay, cod, etc.
    transactionId: String,
    status: { type: String, default: 'Paid' },
    paidAmount: { type: Number, required: true },
    paymentDate: Date
  },
  
  // Invoice status
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'],
    default: 'Sent'
  },
  
  // File paths
  files: {
    pdfPath: String, // Path to generated PDF
    pdfUrl: String,  // Public URL to PDF
    emailSent: { type: Boolean, default: false },
    emailSentAt: Date
  },
  
  // Additional information
  notes: String,
  terms: {
    type: String,
    default: 'Thank you for your business! For any queries, contact us at orders@animeshop.com'
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  financialYear: String, // e.g., "2024-25"
  
}, {
  timestamps: true
});

// Generate invoice number
invoiceSchema.statics.generateInvoiceNumber = async function() {
  const currentYear = new Date().getFullYear();
  const financialYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
  
  // Find the latest invoice for current financial year
  const latestInvoice = await this.findOne({
    financialYear: financialYear
  }).sort({ createdAt: -1 });
  
  let sequenceNumber = 1;
  if (latestInvoice) {
    // Extract sequence number from invoice number (format: INV-2024-25-0001)
    const matches = latestInvoice.invoiceNumber.match(/INV-\d{4}-\d{2}-(\d+)/);
    if (matches) {
      sequenceNumber = parseInt(matches[1]) + 1;
    }
  }
  
  // Format: INV-2024-25-0001
  const invoiceNumber = `INV-${financialYear}-${sequenceNumber.toString().padStart(4, '0')}`;
  
  return { invoiceNumber, financialYear };
};

// Calculate GST using reverse calculation (GST-inclusive pricing)
invoiceSchema.methods.calculateGSTInclusive = function() {
  const gstRate = 12; // 12% for textiles (6% CGST + 6% SGST)
  const finalPrice = this.amounts.grandTotal; // This is the hook price (e.g., ₹1199)
  
  if (this.tax.isGstApplicable) {
    // Reverse calculation: Start with final price and work backwards
    // Formula: taxableAmount = finalPrice / (1 + gstRate/100)
    const taxableAmount = Math.round(finalPrice / (1 + gstRate / 100));
    
    // Calculate individual GST components
    const halfGstRate = gstRate / 2; // 6% each for CGST and SGST
    const cgstAmount = Math.round((taxableAmount * halfGstRate) / 100);
    const sgstAmount = Math.round((taxableAmount * halfGstRate) / 100);
    
    // Set tax details
    this.tax.gstRate = gstRate;
    this.amounts.taxableAmount = taxableAmount;
    this.amounts.cgst = cgstAmount;
    this.amounts.sgst = sgstAmount;
    this.amounts.igst = 0; // For intra-state supply
    this.amounts.totalTax = cgstAmount + sgstAmount;
    
    // Create attractive pricing display
    if (!this.amounts.grossAmount) {
      // Set higher gross amount (like MRP) for marketing appeal
      this.amounts.grossAmount = Math.round(finalPrice * 1.5); // 50% higher than final price
      this.amounts.discount = this.amounts.grossAmount - finalPrice;
      this.amounts.discountDescription = this.amounts.discountDescription || 'Special Discount';
    }
    
  } else {
    // No GST applicable
    this.amounts.taxableAmount = finalPrice;
    this.amounts.cgst = 0;
    this.amounts.sgst = 0;
    this.amounts.igst = 0;
    this.amounts.totalTax = 0;
    
    // Still show attractive pricing without GST
    if (!this.amounts.grossAmount) {
      this.amounts.grossAmount = Math.round(finalPrice * 1.3);
      this.amounts.discount = this.amounts.grossAmount - finalPrice;
      this.amounts.discountDescription = this.amounts.discountDescription || 'Launch Offer';
    }
  }
};

// Legacy method for backward compatibility
invoiceSchema.methods.calculateGST = function() {
  return this.calculateGSTInclusive();
};

// Indexes for better performance
invoiceSchema.index({ orderId: 1 });
invoiceSchema.index({ 'customer.email': 1 });
invoiceSchema.index({ invoiceDate: -1 });
invoiceSchema.index({ financialYear: 1, createdAt: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
