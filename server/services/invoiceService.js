const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const Invoice = require('../models/invoice');

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

  // Generate HTML template for invoice
  generateInvoiceHTML(invoice) {
    const formatCurrency = (amount) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    const formatDate = (date) => new Date(date).toLocaleDateString('en-IN');

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #333;
          background: #fff;
        }
        
        .invoice-container {
          max-width: 800px;
          margin: 20px auto;
          padding: 20px;
          background: white;
          border: 1px solid #ddd;
        }
        
        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #FCD34D;
        }
        
        .company-info h1 {
          color: #1F2937;
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .company-info p {
          color: #6B7280;
          margin-bottom: 3px;
        }
        
        .invoice-details {
          text-align: right;
        }
        
        .invoice-details h2 {
          color: #DC2626;
          font-size: 28px;
          margin-bottom: 10px;
        }
        
        .invoice-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        
        .billing-section {
          width: 48%;
        }
        
        .section-title {
          font-weight: bold;
          color: #1F2937;
          margin-bottom: 10px;
          padding-bottom: 5px;
          border-bottom: 1px solid #E5E7EB;
        }
        
        .address-block p {
          margin-bottom: 3px;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        
        .items-table th {
          background-color: #F9FAFB;
          border: 1px solid #E5E7EB;
          padding: 12px 8px;
          text-align: left;
          font-weight: bold;
          color: #374151;
        }
        
        .items-table td {
          border: 1px solid #E5E7EB;
          padding: 10px 8px;
          vertical-align: top;
        }
        
        .items-table .text-right {
          text-align: right;
        }
        
        .items-table .text-center {
          text-align: center;
        }
        
        .totals-section {
          margin-left: auto;
          width: 300px;
          margin-bottom: 30px;
        }
        
        .totals-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .totals-table td {
          padding: 8px 12px;
          border-bottom: 1px solid #E5E7EB;
        }
        
        .totals-table .total-label {
          font-weight: bold;
          text-align: right;
          width: 60%;
        }
        
        .totals-table .total-amount {
          text-align: right;
          width: 40%;
        }
        
        .grand-total {
          background-color: #FEF3C7;
          font-weight: bold;
          font-size: 14px;
          color: #92400E;
        }
        
        .tax-breakdown {
          background-color: #F0FDF4;
        }
        
        .footer-section {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #E5E7EB;
        }
        
        .payment-info {
          margin-bottom: 20px;
        }
        
        .terms {
          font-size: 11px;
          color: #6B7280;
          line-height: 1.5;
        }
        
        .stamp-section {
          text-align: right;
          margin-top: 30px;
        }
        
        .digital-stamp {
          display: inline-block;
          border: 2px solid #DC2626;
          padding: 15px;
          color: #DC2626;
          font-weight: bold;
          text-align: center;
        }
        
        .thank-you {
          text-align: center;
          margin-top: 30px;
          font-size: 14px;
          color: #059669;
          font-weight: bold;
        }
        
        @media print {
          .invoice-container {
            margin: 0;
            border: none;
            padding: 15px;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header -->
        <div class="invoice-header">
          <div class="company-info">
            <h1>${invoice.company.name}</h1>
            <p>📧 ${invoice.company.email}</p>
            <p>📞 ${invoice.company.phone}</p>
            <p>🌐 ${invoice.company.website}</p>
            <p>📍 ${invoice.company.address}</p>
            ${invoice.company.gstNumber ? `<p><strong>GST No:</strong> ${invoice.company.gstNumber}</p>` : ''}
          </div>
          <div class="invoice-details">
            <h2>INVOICE</h2>
            <p><strong>Invoice No:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Date:</strong> ${formatDate(invoice.invoiceDate)}</p>
            <p><strong>Order ID:</strong> ${invoice.orderId}</p>
          </div>
        </div>

        <!-- Billing Information -->
        <div class="invoice-meta">
          <div class="billing-section">
            <div class="section-title">Bill To:</div>
            <div class="address-block">
              <p><strong>${invoice.billingAddress.fullName}</strong></p>
              <p>${invoice.billingAddress.address}</p>
              <p>${invoice.billingAddress.city}, ${invoice.billingAddress.state}</p>
              <p>${invoice.billingAddress.pinCode}, ${invoice.billingAddress.country}</p>
              <p>📧 ${invoice.customer.email}</p>
              ${invoice.customer.phone ? `<p>📞 ${invoice.customer.phone}</p>` : ''}
            </div>
          </div>
          
          ${invoice.shippingAddress && invoice.shippingAddress.address ? `
          <div class="billing-section">
            <div class="section-title">Ship To:</div>
            <div class="address-block">
              <p><strong>${invoice.shippingAddress.fullName}</strong></p>
              <p>${invoice.shippingAddress.address}</p>
              <p>${invoice.shippingAddress.city}, ${invoice.shippingAddress.state}</p>
              <p>${invoice.shippingAddress.pinCode}, ${invoice.shippingAddress.country}</p>
            </div>
          </div>
          ` : ''}
        </div>

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 5%">#</th>
              <th style="width: 35%">Item Description</th>
              <th style="width: 12%">HSN Code</th>
              <th style="width: 8%" class="text-center">Qty</th>
              <th style="width: 15%" class="text-right">Unit Price</th>
              <th style="width: 15%" class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map((item, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td>
                  <strong>${item.name}</strong>
                  ${item.description ? `<br><small>${item.description}</small>` : ''}
                  ${item.isCustom && item.customization ? `
                    <br><small style="color: #059669;">🎨 Custom Design:</small>
                    ${item.customization.frontDesign ? `<br><small>• Front Design (+₹${item.customization.frontDesign.price})</small>` : ''}
                    ${item.customization.backDesign ? `<br><small>• Back Design (+₹${item.customization.backDesign.price})</small>` : ''}
                  ` : ''}
                </td>
                <td class="text-center">${item.hsnCode}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                <td class="text-right">${formatCurrency(item.totalPrice)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Totals Section -->
        <div class="totals-section">
          <table class="totals-table">
            <tr>
              <td class="total-label">Subtotal:</td>
              <td class="total-amount">${formatCurrency(invoice.amounts.subtotal)}</td>
            </tr>
            ${invoice.amounts.shippingCost > 0 ? `
            <tr>
              <td class="total-label">Shipping:</td>
              <td class="total-amount">${formatCurrency(invoice.amounts.shippingCost)}</td>
            </tr>
            ` : ''}
            ${invoice.amounts.discount > 0 ? `
            <tr>
              <td class="total-label">Discount:</td>
              <td class="total-amount">-${formatCurrency(invoice.amounts.discount)}</td>
            </tr>
            ` : ''}
            <tr>
              <td class="total-label">Taxable Amount:</td>
              <td class="total-amount">${formatCurrency(invoice.amounts.taxableAmount)}</td>
            </tr>
            ${invoice.tax.isGstApplicable ? `
            <tr class="tax-breakdown">
              <td class="total-label">CGST (${invoice.tax.gstRate/2}%):</td>
              <td class="total-amount">${formatCurrency(invoice.amounts.cgst)}</td>
            </tr>
            <tr class="tax-breakdown">
              <td class="total-label">SGST (${invoice.tax.gstRate/2}%):</td>
              <td class="total-amount">${formatCurrency(invoice.amounts.sgst)}</td>
            </tr>
            ${invoice.amounts.igst > 0 ? `
            <tr class="tax-breakdown">
              <td class="total-label">IGST (${invoice.tax.gstRate}%):</td>
              <td class="total-amount">${formatCurrency(invoice.amounts.igst)}</td>
            </tr>
            ` : ''}
            ` : ''}
            <tr class="grand-total">
              <td class="total-label">Grand Total:</td>
              <td class="total-amount">${formatCurrency(invoice.amounts.grandTotal)}</td>
            </tr>
          </table>
        </div>

        <!-- Footer Section -->
        <div class="footer-section">
          <div class="payment-info">
            <div class="section-title">Payment Information</div>
            <p><strong>Payment Method:</strong> ${invoice.payment.method.toUpperCase()}</p>
            ${invoice.payment.transactionId ? `<p><strong>Transaction ID:</strong> ${invoice.payment.transactionId}</p>` : ''}
            <p><strong>Payment Status:</strong> <span style="color: #059669; font-weight: bold;">${invoice.payment.status}</span></p>
            <p><strong>Amount Paid:</strong> ${formatCurrency(invoice.payment.paidAmount)}</p>
          </div>

          ${invoice.notes ? `
          <div style="margin-bottom: 20px;">
            <div class="section-title">Notes</div>
            <p>${invoice.notes}</p>
          </div>
          ` : ''}

          <div class="terms">
            <div class="section-title">Terms & Conditions</div>
            <p>${invoice.terms}</p>
          </div>

          <div class="stamp-section">
            <div class="digital-stamp">
              ${invoice.company.name}<br>
              <small>Digitally Generated Invoice</small><br>
              <small>${formatDate(new Date())}</small>
            </div>
          </div>

          <div class="thank-you">
            🙏 Thank you for your business! 🙏
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Generate PDF from HTML
  async generatePDF(invoice) {
    const html = this.generateInvoiceHTML(invoice);
    const fileName = `invoice-${invoice.invoiceNumber}.pdf`;
    const filePath = path.join(this.invoicesDir, fileName);

    let browser;
    try {
      // Launch puppeteer with minimal options for server environment
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process'
        ]
      });

      const page = await browser.newPage();
      await page.setContent(html, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Generate PDF with proper formatting
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        },
        printBackground: true,
        preferCSSPageSize: true
      });

      // Save PDF to file
      await fs.writeFile(filePath, pdfBuffer);

      // Update invoice with file information
      invoice.files.pdfPath = filePath;
      invoice.files.pdfUrl = `/invoices/${fileName}`;
      await invoice.save();

      console.log(`✅ Invoice PDF generated: ${fileName}`);
      return {
        success: true,
        filePath,
        fileName,
        pdfUrl: invoice.files.pdfUrl
      };

    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  // Create invoice from order
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

      // Process invoice items
      const items = order.products.map(product => {
        const item = {
          name: product.name,
          description: product.size ? `Size: ${product.size}` : '',
          hsnCode: '61091000', // HSN code for T-shirts
          quantity: product.count,
          unitPrice: product.price,
          totalPrice: product.price * product.count,
          isCustom: product.isCustom || false
        };

        // Add customization details if present
        if (product.customization) {
          item.customization = product.customization;
          if (product.customization.frontDesign) {
            item.description += product.customization.frontDesign.price ? 
              `, Front Design (+₹${product.customization.frontDesign.price})` : '';
          }
          if (product.customization.backDesign) {
            item.description += product.customization.backDesign.price ? 
              `, Back Design (+₹${product.customization.backDesign.price})` : '';
          }
        }

        return item;
      });

      // Calculate amounts
      const subtotal = order.originalAmount || order.amount;
      const shippingCost = order.shipping?.shippingCost || 0;
      const discount = order.discount || 0;

      // Create invoice
      const invoice = new Invoice({
        invoiceNumber,
        financialYear,
        orderId: order._id,
        customer,
        billingAddress,
        shippingAddress: billingAddress, // Same as billing for now
        items,
        amounts: {
          subtotal,
          shippingCost,
          discount,
          discountDescription: order.coupon?.code ? `Coupon: ${order.coupon.code}` : '',
          taxableAmount: subtotal + shippingCost - discount,
          grandTotal: order.amount
        },
        tax: {
          isGstApplicable: false, // Enable when GST registration obtained
          gstRate: 0,
          placeOfSupply: billingAddress.state
        },
        payment: {
          method: 'razorpay',
          transactionId: order.transaction_id,
          status: order.paymentStatus === 'Paid' ? 'Paid' : 'Pending',
          paidAmount: order.amount,
          paymentDate: order.createdAt
        }
      });

      // Calculate GST if applicable
      invoice.calculateGST();

      // Save invoice
      await invoice.save();

      // Generate PDF
      await this.generatePDF(invoice);

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
