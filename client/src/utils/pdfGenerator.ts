// HTML to PDF converter utility for invoice generation
// This replaces server-side PhantomJS/Puppeteer with browser-based conversion

interface PDFOptions {
  filename?: string;
  format?: 'A4' | 'Letter';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

class PDFGenerator {
  /**
   * Convert HTML content to PDF and download it
   * Uses browser's print capabilities for reliable PDF generation
   */
  static async downloadHTMLAsPDF(
    htmlContent: string, 
    options: PDFOptions = {}
  ): Promise<void> {
    const {
      filename = 'invoice.pdf',
      format = 'A4',
      margin = { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
    } = options;

    try {
      console.log('🔄 Converting HTML to PDF using browser API...');

      // Create a hidden iframe for PDF generation
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '210mm'; // A4 width
      iframe.style.height = '297mm'; // A4 height
      document.body.appendChild(iframe);

      // Wait for iframe to load
      await new Promise<void>((resolve) => {
        iframe.onload = () => resolve();
        
        // Write HTML content to iframe
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(htmlContent);
          iframeDoc.close();
        }
      });

      // Add print styles for better PDF output
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        const printStyles = iframeDoc.createElement('style');
        printStyles.textContent = `
          @media print {
            @page {
              size: ${format};
              margin: ${margin.top} ${margin.right} ${margin.bottom} ${margin.left};
            }
            body { 
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .invoice-container {
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
            }
          }
        `;
        iframeDoc.head.appendChild(printStyles);
      }

      // Give browser time to render
      await new Promise(resolve => setTimeout(resolve, 500));

      // Focus the iframe and trigger print
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();

      // Clean up after a delay
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);

      console.log('✅ PDF download initiated successfully');

    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      throw new Error('Failed to generate PDF. Please try again.');
    }
  }

  /**
   * Alternative method using jsPDF for environments where print() doesn't work
   * Requires html2canvas and jsPDF dependencies
   */
  static async downloadHTMLAsPDFAlternative(
    htmlContent: string,
    options: PDFOptions = {}
  ): Promise<void> {
    const { filename = 'invoice.pdf' } = options;

    try {
      // Dynamic import for optional dependencies
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);

      console.log('🔄 Converting HTML to PDF using jsPDF + html2canvas...');

      // Create temporary div for rendering
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.top = '-9999px';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '794px'; // A4 width in pixels at 96 DPI
      tempDiv.style.background = 'white';
      document.body.appendChild(tempDiv);

      // Convert to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Download
      pdf.save(filename);

      // Clean up
      document.body.removeChild(tempDiv);

      console.log('✅ PDF downloaded successfully with jsPDF');

    } catch (error) {
      console.error('❌ Alternative PDF generation failed:', error);
      // Fallback to browser print
      await this.downloadHTMLAsPDF(htmlContent, options);
    }
  }

  /**
   * Fetch invoice HTML from server and convert to PDF
   */
  static async downloadInvoiceFromServer(
    invoiceUrl: string,
    filename?: string
  ): Promise<void> {
    try {
      console.log('🔄 Fetching invoice HTML from server...');

      const response = await fetch(invoiceUrl);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Get filename from headers if not provided
      const headerFilename = response.headers.get('X-Invoice-Filename');
      const invoiceNumber = response.headers.get('X-Invoice-Number');
      
      const finalFilename = filename || 
                           headerFilename || 
                           `invoice-${invoiceNumber || 'download'}.pdf`;

      // Get HTML content
      const htmlContent = await response.text();

      // Convert to PDF
      await this.downloadHTMLAsPDF(htmlContent, {
        filename: finalFilename
      });

    } catch (error) {
      console.error('❌ Invoice download failed:', error);
      throw error;
    }
  }

  /**
   * Smart PDF download - tries browser print first, falls back to jsPDF
   */
  static async smartPDFDownload(
    htmlContent: string,
    options: PDFOptions = {}
  ): Promise<void> {
    try {
      // Try browser print first (most reliable)
      await this.downloadHTMLAsPDF(htmlContent, options);
    } catch (error) {
      console.log('⚠️ Browser print failed, trying alternative method...');
      try {
        await this.downloadHTMLAsPDFAlternative(htmlContent, options);
      } catch (altError) {
        console.error('❌ All PDF generation methods failed');
        throw new Error('Unable to generate PDF. Please try using a different browser or contact support.');
      }
    }
  }
}

export default PDFGenerator;
