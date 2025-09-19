// HTML to PDF converter utility for invoice generation
// This replaces server-side PhantomJS/Puppeteer with browser-based conversion

interface PDFOptions {
  filename?: string;
  format?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
}

class PDFGenerator {
  /**
   * Primary method: Generate and download PDF using jsPDF + html2canvas
   * This actually downloads a PDF file instead of opening print dialog
   */
  static async downloadHTMLAsPDF(
    htmlContent: string, 
    options: PDFOptions = {}
  ): Promise<void> {
    const {
      filename = 'invoice.pdf',
      format = 'A4',
      orientation = 'portrait'
    } = options;

    try {

      // Dynamic import for dependencies
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);

      // Create a new window/iframe for proper rendering
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '210mm'; // A4 width
      iframe.style.height = '297mm'; // A4 height
      iframe.style.border = 'none';
      iframe.style.visibility = 'hidden';
      
      document.body.appendChild(iframe);

      // Wait for iframe to load
      await new Promise<void>((resolve) => {
        iframe.onload = () => resolve();
        
        // Write complete HTML document to iframe
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          // Extract just the HTML content if it includes <html> tags
          let processedHTML = htmlContent;
          if (htmlContent.includes('<!DOCTYPE html>')) {
            // Full HTML document
            iframeDoc.open();
            iframeDoc.write(htmlContent);
            iframeDoc.close();
          } else {
            // Just HTML fragment - wrap it
            const wrappedHTML = `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <style>
                  body { 
                    margin: 0; 
                    padding: 20px; 
                    font-family: Arial, sans-serif; 
                    background: white;
                    color: black;
                  }
                </style>
              </head>
              <body>
                ${htmlContent}
              </body>
              </html>
            `;
            iframeDoc.open();
            iframeDoc.write(wrappedHTML);
            iframeDoc.close();
          }
        }
      });

      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get the body element from iframe
      const iframeBody = iframe.contentDocument?.body;
      if (!iframeBody) {
        throw new Error('Could not access iframe content');
      }


      // Convert iframe content to canvas with better options
      const canvas = await html2canvas(iframeBody, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        foreignObjectRendering: true,
        logging: true, // Enable logging for debugging
        width: iframeBody.scrollWidth,
        height: iframeBody.scrollHeight,
        windowWidth: 794, // A4 width in pixels
        windowHeight: 1123 // A4 height in pixels
      });

      // Check if canvas has content
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Generated canvas is empty - HTML content may not have rendered properly');
      }

      // Calculate PDF dimensions
      const imgWidth = format === 'A4' ? 210 : 216; // mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF document
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: format.toLowerCase()
      });

      // Add image to PDF
      const imgData = canvas.toDataURL('image/png', 0.95);
      
      // Handle multi-page PDFs if content is too long
      const pageHeight = format === 'A4' ? 297 : 279; // mm
      if (imgHeight <= pageHeight) {
        // Single page
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        // Multi-page
        let remainingHeight = imgHeight;
        let position = 0;
        
        while (remainingHeight > 0) {
          const pageImgHeight = Math.min(pageHeight, remainingHeight);
          
          if (position > 0) {
            pdf.addPage();
          }
          
          pdf.addImage(
            imgData, 
            'PNG', 
            0, 
            -position, 
            imgWidth, 
            imgHeight
          );
          
          remainingHeight -= pageHeight;
          position += pageHeight;
        }
      }
      
      // Download the PDF
      pdf.save(filename);

      // Clean up
      document.body.removeChild(iframe);


    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      console.error('Error details:', error);
      throw new Error('Failed to generate PDF. Please try again or contact support if the issue persists.');
    }
  }

  /**
   * Fallback method using browser's print-to-PDF (for modern browsers)
   */
  static async downloadHTMLAsPDFPrint(
    htmlContent: string,
    options: PDFOptions = {}
  ): Promise<void> {
    const { filename = 'invoice.pdf' } = options;

    try {

      // Check if browser supports print-to-PDF
      if (!window.print) {
        throw new Error('Browser does not support print functionality');
      }

      // Create a new window with the invoice content
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        throw new Error('Could not open print window');
      }

      // Write HTML content with print styles
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 10mm;
              }
              body {
                font-family: Arial, sans-serif;
                font-size: 12pt;
                line-height: 1.4;
                color: #000;
                background: #fff;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .no-print {
                display: none !important;
              }
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 14px;
              line-height: 1.4;
              color: #000;
              background: #fff;
              margin: 0;
              padding: 20px;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 1000);
              }, 500);
            };
          </script>
        </body>
        </html>
      `);
      
      printWindow.document.close();


    } catch (error) {
      console.error('❌ Print fallback failed:', error);
      throw error;
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

      const response = await fetch(invoiceUrl);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} - ${response.statusText}`);
      }

      // Get filename from headers if not provided
      const headerFilename = response.headers.get('X-Invoice-Filename');
      const invoiceNumber = response.headers.get('X-Invoice-Number');
      
      const finalFilename = filename || 
                           headerFilename || 
                           `invoice-${invoiceNumber || Date.now()}.pdf`;

      // Get HTML content
      const htmlContent = await response.text();

      // Validate that we received HTML content
      if (!htmlContent || !htmlContent.includes('invoice')) {
        throw new Error('Invalid invoice content received from server');
      }


      // Convert to PDF using primary method
      await this.downloadHTMLAsPDF(htmlContent, {
        filename: finalFilename
      });

    } catch (error) {
      console.error('❌ Invoice download failed:', error);
      
      // Provide user-friendly error message
      if (error.message.includes('Server error: 404')) {
        throw new Error('Invoice not found. Please try again in a few minutes or contact support.');
      } else if (error.message.includes('Server error: 500')) {
        throw new Error('Invoice generation error. Please try again or contact support.');
      } else {
        throw new Error(`Invoice download failed: ${error.message}`);
      }
    }
  }

  /**
   * Smart PDF download with automatic fallback
   */
  static async smartPDFDownload(
    htmlContent: string,
    options: PDFOptions = {}
  ): Promise<void> {
    try {
      // Try primary method (jsPDF + html2canvas)
      await this.downloadHTMLAsPDF(htmlContent, options);
    } catch (error) {
      try {
        // Fallback to browser print-to-PDF
        await this.downloadHTMLAsPDFPrint(htmlContent, options);
      } catch (fallbackError) {
        console.error('❌ All PDF generation methods failed');
        throw new Error('Unable to generate PDF. Please try refreshing the page or using a different browser.');
      }
    }
  }

  /**
   * Check if PDF generation is supported
   */
  static isSupported(): boolean {
    try {
      // Check for required browser APIs
      return (
        typeof document !== 'undefined' &&
        typeof window !== 'undefined' &&
        typeof fetch !== 'undefined' &&
        'createElement' in document
      );
    } catch {
      return false;
    }
  }
}

export default PDFGenerator;
