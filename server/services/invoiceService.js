const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const Invoice = require('../models/invoice');
const DiscountCalculator = require('../utils/discountCalculator');
const { brandConfig } = require('../config/brandConfig');

// Company configuration from environment variables (with brand config fallbacks)
const COMPANY_CONFIG = {
  name: process.env.COMPANY_NAME || brandConfig.shortName,
  address: process.env.COMPANY_ADDRESS || brandConfig.business.address || 'India',
  gstNumber: process.env.COMPANY_GST || brandConfig.business.gstNumber || null,
  email: process.env.COMPANY_EMAIL || brandConfig.email,
  phone: process.env.COMPANY_PHONE || null
};

class InvoiceService {
  constructor() {
    this.invoicesDir = path.join(__dirname, '../public/invoices');
    this.ensureInvoicesDirectory();
  }

  async ensureInvoicesDirectory() {
    try {
      await fs.access(this.invoicesDir);
    } catch (error) {
      await fs.mkdir(this.invoicesDir, { recursive: true });
    }
  }

  // Generate HTML template for invoice (GST-inclusive format)
  generateInvoiceHTML(invoice) {
    const formatCurrency = (amount) => `Rs ${amount.toFixed(2)}`;
    const formatDate = (date) => new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short', 
      year: 'numeric'
    });

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tax Invoice ${invoice.invoiceNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          font-size: 11px;
          line-height: 1.3;
          color: #000;
          background: #fff;
        }
        
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 15px;
          background: white;
          border: 1px solid #000;
        }
        
        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          border-bottom: 1px solid #000;
          padding-bottom: 10px;
        }
        
        .invoice-title {
          font-size: 18px;
          font-weight: bold;
          color: #000;
        }
        
        .barcode-section {
          text-align: right;
          font-family: monospace;
          font-size: 24px;
          line-height: 1;
        }
        
        .invoice-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 15px;
          font-size: 10px;
        }
        
        .invoice-info {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 5px 10px;
        }
        
        .label {
          font-weight: bold;
        }
        
        .company-details {
          margin-bottom: 15px;
          font-size: 10px;
        }
        
        .address-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 15px;
          font-size: 10px;
        }
        
        .section-title {
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 10px;
        }
        
        .items-table th,
        .items-table td {
          border: 1px solid #000;
          padding: 5px;
          text-align: left;
          vertical-align: top;
        }
        
        .items-table th {
          background-color: #f0f0f0;
          font-weight: bold;
          text-align: center;
        }
        
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        
        .totals-table {
          margin-left: auto;
          width: 400px;
          border-collapse: collapse;
          font-size: 10px;
        }
        
        .totals-table td {
          padding: 3px 8px;
          border: 1px solid #000;
        }
        
        .total-label {
          font-weight: bold;
          text-align: left;
          background-color: #f0f0f0;
        }
        
        .total-amount {
          text-align: right;
          width: 120px;
        }
        
        .footer-section {
          margin-top: 20px;
          font-size: 10px;
        }
        
        .declaration {
          margin-top: 15px;
          font-size: 9px;
          border-top: 1px solid #000;
          padding-top: 10px;
        }
        
        .company-name {
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .signature-section {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
        }
        
        .qr-placeholder {
          width: 80px;
          height: 80px;
          border: 1px solid #000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
        }
        
        @media print {
          .invoice-container {
            margin: 0;
            border: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header -->
        <div class="invoice-header">
          <div class="invoice-title">Tax Invoice</div>
        </div>

        <!-- Invoice Details -->
        <div class="invoice-details">
          <div class="invoice-info">
            <span class="label">Invoice Number:</span>
            <span>${invoice.invoiceNumber}</span>
            <span class="label">Order Number:</span>
            <span>${invoice.orderId}</span>
            <span class="label">Nature of Transaction:</span>
            <span>Intra-State</span>
            <span class="label">Place of Supply:</span>
            <span>${invoice.billingAddress.state}</span>
          </div>
          <div class="invoice-info">
            <span class="label">PacketID:</span>
            <span>83921986969</span>
            <span class="label">Invoice Date:</span>
            <span>${formatDate(invoice.invoiceDate)}</span>
            <span class="label">Order Date:</span>
            <span>${formatDate(invoice.invoiceDate)}</span>
            <span class="label">Nature of Supply:</span>
            <span>Goods</span>
          </div>
        </div>

        <!-- Addresses -->
        <div class="address-section">
          <div>
            <div class="section-title">Bill to / Ship to:</div>
            <div>${invoice.billingAddress.fullName}</div>
            <div>${invoice.billingAddress.address}</div>
            <div>${invoice.billingAddress.city} - ${invoice.billingAddress.pinCode} ${invoice.billingAddress.state}, India</div>
            <div style="margin-top: 5px;"><span class="label">Customer Type:</span> Unregistered</div>
          </div>
          <div>
            <div class="section-title">Bill From: / Ship From:</div>
            <div>${invoice.company.name}</div>
            <div>${invoice.company.address}</div>
            ${invoice.company.gstNumber ? `<div><span class="label">GSTIN Number:</span> ${invoice.company.gstNumber}</div>` : ''}
          </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th>Qty</th>
              <th>Gross Amount</th>
              <th>Discount</th>
              <th>Other Charges</th>
              <th>Taxable Amount</th>
              <th>CGST</th>
              <th>SGST/ UGST</th>
              <th>IGST</th>
              <th>Cess Total Amount</th>
            </tr>
          </thead>
          <tbody>
            ${(() => {
              // ✅ CRITICAL FIX: Calculate discounted per-item amounts that sum to grand total
              const originalItemsTotal = invoice.items.reduce((sum, item) => sum + item.totalPrice, 0);
              const finalTotal = invoice.amounts.grandTotal;
              const totalDiscountApplied = originalItemsTotal - finalTotal;
              
              console.log(`📊 Invoice Items Math Check:`);
              console.log(`   Original Items Total: ₹${originalItemsTotal}`);
              console.log(`   Final Grand Total: ₹${finalTotal}`);
              console.log(`   Total Discount Applied: ₹${totalDiscountApplied}`);
              
              return invoice.items.map((item, index) => {
                // Calculate item's proportion of original total
                const itemProportion = item.totalPrice / originalItemsTotal;
                
                // Apply discounts proportionally to get actual paid amount per item
                const itemDiscountShare = totalDiscountApplied * itemProportion;
                const actualItemPaid = item.totalPrice - itemDiscountShare;
                
                // Distribute invoice totals proportionally based on what was actually paid
                const paidProportion = actualItemPaid / finalTotal;
                
                const itemGrossAmount = (invoice.amounts.grossAmount || 0) * paidProportion;
                const itemDiscount = (invoice.amounts.discount || 0) * paidProportion;
                const itemOtherCharges = (invoice.amounts.otherCharges || 0) * paidProportion;
                const itemTaxableAmount = (invoice.amounts.taxableAmount || 0) * paidProportion;
                const itemCGST = (invoice.amounts.cgst || 0) * paidProportion;
                const itemSGST = (invoice.amounts.sgst || 0) * paidProportion;
                const itemIGST = (invoice.amounts.igst || 0) * paidProportion;
                
                console.log(`   ${item.name}: ₹${item.totalPrice} → ₹${actualItemPaid.toFixed(2)} (discount: ₹${itemDiscountShare.toFixed(2)})`);
                
                return `
                <tr>
                  <td colspan="9" style="font-weight: bold; background-color: #f0f0f0;">
                    ${item.name} - ${item.description || 'Standard'}<br>
                    HSN: ${item.hsnCode}, ${invoice.tax.gstRate}% CGST, ${(invoice.tax.gstRate/2)}% SGST/UGST,
                  </td>
                </tr>
                <tr>
                  <td class="text-center">${item.quantity}</td>
                  <td class="text-right">${formatCurrency(itemGrossAmount)}</td>
                  <td class="text-right">${formatCurrency(itemDiscount)}</td>
                  <td class="text-right">${formatCurrency(itemOtherCharges)}</td>
                  <td class="text-right">${formatCurrency(itemTaxableAmount)}</td>
                  <td class="text-right">${formatCurrency(itemCGST)}</td>
                  <td class="text-right">${formatCurrency(itemSGST)}</td>
                  <td class="text-right">${formatCurrency(itemIGST)}</td>
                  <td class="text-right">${formatCurrency(actualItemPaid)}</td>
                </tr>`;
              }).join('');
            })()}
            <tr style="font-weight: bold; background-color: #f0f0f0;">
              <td class="text-center">TOTAL</td>
              <td class="text-right">${formatCurrency(invoice.amounts.grossAmount)}</td>
              <td class="text-right">${formatCurrency(invoice.amounts.discount)}</td>
              <td class="text-right">${formatCurrency(invoice.amounts.otherCharges)}</td>
              <td class="text-right">${formatCurrency(invoice.amounts.taxableAmount)}</td>
              <td class="text-right">${formatCurrency(invoice.amounts.cgst)}</td>
              <td class="text-right">${formatCurrency(invoice.amounts.sgst)}</td>
              <td class="text-right">${formatCurrency(invoice.amounts.igst)}</td>
              <td class="text-right">${formatCurrency(invoice.amounts.grandTotal)}</td>
            </tr>
          </tbody>
        </table>

        <!-- Footer -->
        <div class="footer-section">
          <div class="company-name">${invoice.company.name}</div>
          
          <div class="signature-section">
            <div style="width: 200px;">
              <div style="margin-top: 40px; border-top: 1px solid #000; text-align: center; padding-top: 5px;">
                Authorized Signatory
              </div>
            </div>
          </div>

          <div class="declaration">
            <div class="label">DECLARATION</div>
            <div>The goods sold as part of this shipment are intended for end-user consumption and are not for retail sale</div>
            <div style="text-align: right; margin-top: 10px;">
              <div class="label">Purchase made on</div>
            </div>
            <div style="margin-top: 10px; font-size: 8px;">
              <div class="label">Reg. Address:</div> ${invoice.company.name}, ${invoice.company.address}
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Generate invoice HTML for frontend PDF conversion
  async generateInvoiceData(invoice) {
    console.log(`🔄 Preparing invoice ${invoice.invoiceNumber} for frontend PDF generation`);
    
    // Generate HTML content
    const html = this.generateInvoiceHTML(invoice);
    
    // Update invoice with metadata (no PDF file yet)
    invoice.files.pdfPath = null;
    invoice.files.pdfUrl = null;
    invoice.status = 'Sent'; // Mark as sent, PDF will be created on frontend
    await invoice.save();

    console.log(`✅ Invoice HTML prepared for frontend: ${invoice.invoiceNumber}`);
    return {
      success: true,
      html: html,
      invoiceNumber: invoice.invoiceNumber,
      fileName: `invoice-${invoice.invoiceNumber}.pdf`,
      method: 'frontend-conversion'
    };
  }

  // Legacy method name for compatibility - now returns HTML for frontend conversion
  async generatePDF(invoice) {
    return await this.generateInvoiceData(invoice);
  }

  // Create invoice from order (GST-inclusive pricing with product MRP)
  async createInvoiceFromOrder(order) {
    try {
      // Generate unique invoice number
      const { invoiceNumber, financialYear } = await Invoice.generateInvoiceNumber();

      // Extract customer information
      const customer = {
        name: order.user?.name || order.guestInfo?.name || 'Customer',
        email: order.user?.email || order.guestInfo?.email,
        phone: order.user?.phone || order.guestInfo?.phone,
        isGuest: !order.user
      };

      // Parse address from order
      const addressParts = order.address.split(', ');
      const billingAddress = {
        fullName: customer.name,
        address: addressParts[0] || 'N/A',
        city: addressParts[1] || 'N/A',
        state: addressParts[2]?.split(' - ')[0] || 'N/A',
        pinCode: addressParts[2]?.split(' - ')[1] || 'N/A',
        country: addressParts[3] || 'India'
      };

      // Fetch actual product details for accurate pricing
      const Product = require('../models/product');
      let totalGrossAmount = 0;
      let totalActualDiscount = 0;

      // Process invoice items with actual product data
      const items = await Promise.all(
        order.products.map(async (orderProduct) => {
          const item = {
            name: orderProduct.name,
            description: orderProduct.size ? `Size: ${orderProduct.size}` : '',
            hsnCode: '61091000', // HSN code for T-shirts
            quantity: orderProduct.count,
            unitPrice: orderProduct.price,
            totalPrice: orderProduct.price * orderProduct.count,
            isCustom: orderProduct.isCustom || false
          };

          // Try to fetch actual product for MRP data
          try {
            const product = await Product.findById(orderProduct._id);
            if (product) {
              const pricing = product.getPricingDisplay();
              const itemGrossAmount = pricing.grossAmount * orderProduct.count;
              const itemDiscount = (pricing.grossAmount - orderProduct.price) * orderProduct.count;
              
              totalGrossAmount += itemGrossAmount;
              totalActualDiscount += itemDiscount;
            } else {
              // Fallback if product not found
              const fallbackGross = orderProduct.price * 1.5 * orderProduct.count;
              totalGrossAmount += fallbackGross;
              totalActualDiscount += (fallbackGross - (orderProduct.price * orderProduct.count));
            }
          } catch (err) {
            console.log('Could not fetch product details, using fallback pricing');
            const fallbackGross = orderProduct.price * 1.5 * orderProduct.count;
            totalGrossAmount += fallbackGross;
            totalActualDiscount += (fallbackGross - (orderProduct.price * orderProduct.count));
          }

          // Add customization details if present
          if (orderProduct.customization) {
            item.customization = orderProduct.customization;
            if (orderProduct.customization.frontDesign) {
              item.description += orderProduct.customization.frontDesign.price ? 
                `, Front Design (+₹${orderProduct.customization.frontDesign.price})` : '';
            }
            if (orderProduct.customization.backDesign) {
              item.description += orderProduct.customization.backDesign.price ? 
                `, Back Design (+₹${orderProduct.customization.backDesign.price})` : '';
            }
          }

          return item;
        })
      );

      // ✅ CRITICAL FIX: Use universal discount calculator for consistent amounts
      console.log('🔄 INVOICE: Using DiscountCalculator for consistent pricing');
      const discountBreakdown = DiscountCalculator.calculateOrderDiscounts(order);
      
      console.log('💰 INVOICE: Discount breakdown from universal calculator:', discountBreakdown);
      
      // Use calculated amounts that match frontend exactly
      const grossAmount = discountBreakdown.subtotal + discountBreakdown.shippingCost;
      const finalPrice = discountBreakdown.finalAmount;
      const totalDiscountApplied = discountBreakdown.totalSavings;

      // Create invoice with GST-inclusive pricing structure
      const invoice = new Invoice({
        invoiceNumber,
        financialYear,
        orderId: order._id,
        customer,
        billingAddress,
        shippingAddress: billingAddress, // Same as billing for now
        items,
        // ✅ Use configurable company details instead of hardcoded values
        company: COMPANY_CONFIG,
        amounts: {
          // ✅ FIXED: Use discount calculator amounts for consistency
          grossAmount: grossAmount,
          discount: totalDiscountApplied,
          grandTotal: finalPrice,
          otherCharges: 0,
          discountDescription: discountBreakdown.couponDiscount > 0 ? 
            `${Math.round((totalDiscountApplied/grossAmount)*100)}% Off + Coupon: ${discountBreakdown.couponCode}` : 
            `${Math.round((totalDiscountApplied/grossAmount)*100)}% Off - Special Offer`,
          
          // Legacy fields for compatibility
          subtotal: discountBreakdown.subtotal,
          shippingCost: discountBreakdown.shippingCost
        },
        tax: {
          isGstApplicable: true, // Enable GST by default for proper invoice display
          gstRate: 12, // 12% for textiles (6% CGST + 6% SGST)
          placeOfSupply: billingAddress.state
        },
        payment: {
          method: order.paymentMethod || 'razorpay',
          transactionId: order.transaction_id,
          status: order.paymentStatus === 'Paid' ? 'Paid' : 'Pending',
          paidAmount: finalPrice,
          paymentDate: order.createdAt
        }
      });

      // Calculate GST using reverse calculation (starts with final price)
      invoice.calculateGSTInclusive();

      // Save invoice
      await invoice.save();

      // Generate PDF
      await this.generatePDF(invoice);

      console.log(`✅ GST-inclusive invoice created: ${invoice.invoiceNumber}`);
      console.log(`   Final Price: ₹${finalPrice}`);
      console.log(`   Gross Amount: ₹${invoice.amounts.grossAmount} (from universal calculator)`);
      console.log(`   Discount: ₹${invoice.amounts.discount} (${Math.round((totalDiscountApplied/grossAmount)*100)}%)`);
      console.log(`   Taxable Amount: ₹${invoice.amounts.taxableAmount}`);
      console.log(`   CGST: ₹${invoice.amounts.cgst}`);
      console.log(`   SGST: ₹${invoice.amounts.sgst}`);

      return invoice;

    } catch (error) {
      console.error('Invoice creation error:', error);
      throw error;
    }
  }

  // Get invoice by ID
  async getInvoice(invoiceId) {
    return await Invoice.findById(invoiceId).populate('orderId');
  }

  // Get invoices for a customer
  async getCustomerInvoices(email) {
    return await Invoice.find({ 'customer.email': email })
      .sort({ createdAt: -1 })
      .populate('orderId');
  }

  // Regenerate PDF for existing invoice
  async regeneratePDF(invoiceId) {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return await this.generatePDF(invoice);
  }
}

module.exports = new InvoiceService();
