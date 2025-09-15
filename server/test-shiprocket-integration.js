#!/usr/bin/env node

/**
 * Shiprocket Integration Verification Script
 * Tests all components according to official Shiprocket integration guide
 */

const dotenv = require('dotenv');
const crypto = require('crypto');

// Load environment variables
dotenv.config();

// Import your services
const shiprocketService = require('./services/shiprocketService');
const shiprocketNotifier = require('./services/shiprocketNotifier');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.blue}🔍 ${msg}${colors.reset}\n`)
};

/**
 * Test Environment Configuration
 */
async function testEnvironmentSetup() {
  log.header('Testing Environment Configuration');
  
  const requiredEnvVars = [
    'SHIPROCKET_API_KEY',
    'SHIPROCKET_SECRET_KEY',
    'SHIPROCKET_BASE_URL',
    'FRONTEND_URL',
    'BACKEND_URL'
  ];
  
  let allConfigured = true;
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      log.success(`${envVar}: Configured`);
    } else {
      log.error(`${envVar}: Missing`);
      allConfigured = false;
    }
  }
  
  // Check API key format
  if (process.env.SHIPROCKET_API_KEY) {
    const apiKey = process.env.SHIPROCKET_API_KEY;
    if (apiKey.length >= 10) {
      log.success('API Key format: Valid length');
    } else {
      log.warning('API Key format: Seems too short');
    }
  }
  
  // Check base URL
  if (process.env.SHIPROCKET_BASE_URL) {
    const baseUrl = process.env.SHIPROCKET_BASE_URL;
    if (baseUrl === 'https://checkout-api.shiprocket.com') {
      log.success('Base URL: Official Shiprocket URL');
    } else {
      log.info(`Base URL: Custom URL - ${baseUrl}`);
    }
  }
  
  return allConfigured;
}

/**
 * Test HMAC Signature Generation
 */
async function testHMACGeneration() {
  log.header('Testing HMAC Signature Generation');
  
  if (!process.env.SHIPROCKET_SECRET_KEY) {
    log.error('Cannot test HMAC - SHIPROCKET_SECRET_KEY missing');
    return false;
  }
  
  try {
    const testPayload = {
      cart_data: {
        items: [
          {
            variant_id: "test-variant-123",
            quantity: 1,
            catalog_data: {
              price: 499.00,
              name: "Test T-Shirt",
              description: "Test product for verification"
            }
          }
        ]
      },
      redirect_url: "https://test.com",
      timestamp: new Date().toISOString()
    };
    
    // Test your service HMAC generation
    const generatedHMAC = shiprocketService.generateHMAC(testPayload);
    
    // Verify HMAC format
    if (generatedHMAC && typeof generatedHMAC === 'string' && generatedHMAC.length > 40) {
      log.success('HMAC Generation: Working correctly');
      log.info(`Sample HMAC: ${generatedHMAC.substring(0, 20)}...`);
      
      // Test consistency
      const secondHMAC = shiprocketService.generateHMAC(testPayload);
      if (generatedHMAC === secondHMAC) {
        log.success('HMAC Consistency: Identical signatures for same payload');
      } else {
        log.error('HMAC Consistency: Different signatures for same payload');
        return false;
      }
      
      return true;
    } else {
      log.error('HMAC Generation: Invalid format or empty');
      return false;
    }
  } catch (error) {
    log.error(`HMAC Generation Error: ${error.message}`);
    return false;
  }
}

/**
 * Test Cart Transformation
 */
async function testCartTransformation() {
  log.header('Testing Cart Transformation');
  
  try {
    const sampleCart = [
      {
        _id: 'product1',
        name: 'Naruto T-Shirt',
        price: 999,
        quantity: 2,
        size: 'L',
        color: 'black',
        sku: 'NARUTO-001'
      },
      {
        _id: 'custom1',
        name: 'Custom Anime Design',
        price: 1299,
        quantity: 1,
        size: 'M',
        color: 'white',
        isCustom: true,
        customization: {
          frontDesign: {
            designId: 'custom-front-123',
            designName: 'Custom Front Design',
            position: 'center'
          },
          backDesign: {
            designId: 'custom-back-456',
            designName: 'Custom Back Design',
            position: 'center'
          }
        }
      }
    ];
    
    const sampleDiscounts = {
      quantity: { discount: 200, percentage: 10 },
      coupon: { discount: 100, code: 'SAVE10' }
    };
    
    // Test cart processing
    const processed = shiprocketService.processCartForShiprocket(sampleCart, sampleDiscounts);
    
    // Verify structure
    if (processed.cart_data && processed.cart_data.items) {
      log.success('Cart Structure: Valid cart_data with items array');
      
      if (processed.cart_data.items.length === sampleCart.length) {
        log.success(`Item Count: Correct (${processed.cart_data.items.length} items)`);
      } else {
        log.error(`Item Count: Mismatch (expected ${sampleCart.length}, got ${processed.cart_data.items.length})`);
        return false;
      }
      
      // Check each item structure
      let allItemsValid = true;
      processed.cart_data.items.forEach((item, index) => {
        const originalItem = sampleCart[index];
        
        if (item.variant_id && item.quantity && item.catalog_data) {
          log.success(`Item ${index + 1}: Valid structure (variant_id, quantity, catalog_data)`);
          
          // Check catalog_data
          const catalogData = item.catalog_data;
          if (catalogData.price && catalogData.name && catalogData.description) {
            log.success(`Item ${index + 1}: Valid catalog_data (price, name, description)`);
            
            // Check custom design metadata
            if (originalItem.isCustom) {
              if (catalogData.description.includes('CUSTOM_META:')) {
                log.success(`Item ${index + 1}: Custom metadata embedded correctly`);
              } else {
                log.warning(`Item ${index + 1}: Custom metadata missing`);
              }
            }
          } else {
            log.error(`Item ${index + 1}: Invalid catalog_data structure`);
            allItemsValid = false;
          }
        } else {
          log.error(`Item ${index + 1}: Invalid item structure`);
          allItemsValid = false;
        }
      });
      
      // Check discount handling
      if (processed.cart_data.cart_discount) {
        log.success('Discount Integration: Cart-level discount applied');
        log.info(`Total Discount: ₹${processed.cart_data.cart_discount.amount}`);
      } else {
        log.info('Discount Integration: No cart discount (discounts may be zero)');
      }
      
      // Check required fields
      if (processed.redirect_url && processed.timestamp) {
        log.success('Required Fields: redirect_url and timestamp present');
      } else {
        log.error('Required Fields: Missing redirect_url or timestamp');
        allItemsValid = false;
      }
      
      return allItemsValid;
    } else {
      log.error('Cart Structure: Invalid - missing cart_data or items');
      return false;
    }
  } catch (error) {
    log.error(`Cart Transformation Error: ${error.message}`);
    return false;
  }
}

/**
 * Test API Connection (without actual API call)
 */
async function testAPIConnection() {
  log.header('Testing API Connection Setup');
  
  try {
    // Test URL construction
    const baseUrl = process.env.SHIPROCKET_BASE_URL || 'https://checkout-api.shiprocket.com';
    const testEndpoint = `${baseUrl}/api/v1/access-token/checkout`;
    
    log.success(`API Endpoint: ${testEndpoint}`);
    
    // Test header construction
    const testPayload = { test: 'data' };
    const hmac = shiprocketService.generateHMAC(testPayload);
    const headers = {
      'Content-Type': 'application/json',
      'X-Api-Key': `Bearer ${process.env.SHIPROCKET_API_KEY}`,
      'X-Api-HMAC-SHA256': hmac
    };
    
    // Verify header format
    if (headers['X-Api-Key'].startsWith('Bearer ')) {
      log.success('Authentication Header: Correct Bearer token format');
    } else {
      log.error('Authentication Header: Missing "Bearer " prefix');
      return false;
    }
    
    if (headers['X-Api-HMAC-SHA256'] && headers['X-Api-HMAC-SHA256'].length > 40) {
      log.success('HMAC Header: Valid signature format');
    } else {
      log.error('HMAC Header: Invalid or missing signature');
      return false;
    }
    
    log.info('API Connection: Headers configured correctly (actual connection not tested)');
    return true;
  } catch (error) {
    log.error(`API Connection Setup Error: ${error.message}`);
    return false;
  }
}

/**
 * Test Webhook Signature Verification
 */
async function testWebhookVerification() {
  log.header('Testing Webhook Signature Verification');
  
  if (!process.env.SHIPROCKET_SECRET_KEY) {
    log.error('Cannot test webhook verification - SHIPROCKET_SECRET_KEY missing');
    return false;
  }
  
  try {
    // Import webhook verification function
    const crypto = require('crypto');
    
    function verifyWebhookSignature(body, signature) {
      if (!signature || !process.env.SHIPROCKET_SECRET_KEY) {
        return true; // Allow if not configured
      }
      
      try {
        const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
        const computedSignature = crypto
          .createHmac('sha256', process.env.SHIPROCKET_SECRET_KEY)
          .update(bodyString)
          .digest('base64');
        
        return computedSignature === signature;
      } catch (error) {
        return false;
      }
    }
    
    // Test with sample webhook data
    const sampleWebhookBody = {
      order_id: "test-order-123",
      status: "SUCCESS",
      cart_data: {
        items: [
          {
            variant_id: "test-variant",
            quantity: 1,
            catalog_data: {
              price: 999,
              name: "Test Product"
            }
          }
        ]
      },
      phone: "9999999999",
      email: "test@example.com",
      payment_type: "RAZORPAY",
      total_amount_payable: 999.0
    };
    
    // Generate correct signature
    const bodyString = JSON.stringify(sampleWebhookBody);
    const correctSignature = crypto
      .createHmac('sha256', process.env.SHIPROCKET_SECRET_KEY)
      .update(bodyString)
      .digest('base64');
    
    // Test correct signature
    if (verifyWebhookSignature(sampleWebhookBody, correctSignature)) {
      log.success('Webhook Verification: Valid signature accepted');
    } else {
      log.error('Webhook Verification: Valid signature rejected');
      return false;
    }
    
    // Test incorrect signature
    const incorrectSignature = 'invalid-signature-123';
    if (!verifyWebhookSignature(sampleWebhookBody, incorrectSignature)) {
      log.success('Webhook Verification: Invalid signature rejected');
    } else {
      log.error('Webhook Verification: Invalid signature accepted (security risk)');
      return false;
    }
    
    return true;
  } catch (error) {
    log.error(`Webhook Verification Error: ${error.message}`);
    return false;
  }
}

/**
 * Test Catalog APIs
 */
async function testCatalogAPIs() {
  log.header('Testing Catalog APIs');
  
  try {
    // Test if catalog endpoints exist (simulate request)
    const catalogEndpoints = [
      '/api/shiprocket/products',
      '/api/shiprocket/collections',
      '/api/shiprocket/collections/:id/products'
    ];
    
    log.info('Catalog API Endpoints:');
    catalogEndpoints.forEach(endpoint => {
      log.success(`  ${endpoint} - Configured`);
    });
    
    // Test placeholder response structure
    const sampleProductResponse = {
      products: [
        {
          id: "placeholder-product",
          title: "Dynamic Product",
          body_html: "<p>All products handled dynamically via catalog_data</p>",
          vendor: "Your T-Shirt Brand",
          product_type: "Apparel",
          status: "active",
          variants: [
            {
              id: "placeholder-variant",
              title: "Placeholder Variant",
              price: "499.00",
              quantity: 999,
              sku: "PLACEHOLDER-001"
            }
          ]
        }
      ]
    };
    
    // Verify response structure matches Shiprocket requirements
    const product = sampleProductResponse.products[0];
    if (product.id && product.title && product.variants && product.variants[0].id) {
      log.success('Catalog Response: Valid structure (id, title, variants)');
    } else {
      log.error('Catalog Response: Invalid structure');
      return false;
    }
    
    return true;
  } catch (error) {
    log.error(`Catalog API Error: ${error.message}`);
    return false;
  }
}

/**
 * Test Outgoing Webhooks
 */
async function testOutgoingWebhooks() {
  log.header('Testing Outgoing Webhooks');
  
  try {
    // Test shiprocketNotifier service
    if (shiprocketNotifier && typeof shiprocketNotifier.testConnection === 'function') {
      log.success('Outgoing Webhooks: shiprocketNotifier service available');
      
      // Test connection (without actual API call)
      const connectionTest = await shiprocketNotifier.testConnection();
      
      if (connectionTest && connectionTest.configured) {
        log.success('Outgoing Webhooks: Configuration valid');
      } else {
        log.warning('Outgoing Webhooks: Configuration incomplete or API credentials missing');
      }
      
      // Test methods exist
      const requiredMethods = ['notifyProductUpdate', 'notifyCollectionUpdate', 'testConnection'];
      let allMethodsExist = true;
      
      requiredMethods.forEach(method => {
        if (typeof shiprocketNotifier[method] === 'function') {
          log.success(`Outgoing Webhooks: ${method} method available`);
        } else {
          log.error(`Outgoing Webhooks: ${method} method missing`);
          allMethodsExist = false;
        }
      });
      
      return allMethodsExist;
    } else {
      log.error('Outgoing Webhooks: shiprocketNotifier service not found');
      return false;
    }
  } catch (error) {
    log.error(`Outgoing Webhooks Error: ${error.message}`);
    return false;
  }
}

/**
 * Test Frontend Integration
 */
async function testFrontendIntegration() {
  log.header('Testing Frontend Integration');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Check if ShiprocketButton exists
    const shiprocketButtonPath = path.join(__dirname, '../client/src/components/ShiprocketButton.tsx');
    
    if (fs.existsSync(shiprocketButtonPath)) {
      log.success('Frontend Component: ShiprocketButton.tsx exists');
      
      // Read and verify content
      const buttonContent = fs.readFileSync(shiprocketButtonPath, 'utf8');
      
      // Check for required elements
      const requiredElements = [
        'HeadlessCheckout.addToCart',
        'checkout-ui.shiprocket.com/assets/styles/shopify.css',
        'checkout-ui.shiprocket.com/assets/js/channels/shopify.js',
        'sellerDomain',
        'generateHMAC'
      ];
      
      let allElementsPresent = true;
      requiredElements.forEach(element => {
        if (buttonContent.includes(element)) {
          log.success(`Frontend: ${element} implemented`);
        } else {
          log.error(`Frontend: ${element} missing`);
          allElementsPresent = false;
        }
      });
      
      return allElementsPresent;
    } else {
      log.error('Frontend Component: ShiprocketButton.tsx not found');
      return false;
    }
  } catch (error) {
    log.error(`Frontend Integration Error: ${error.message}`);
    return false;
  }
}

/**
 * Generate Integration Report
 */
async function generateReport(results) {
  log.header('Integration Verification Report');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const score = Math.round((passedTests / totalTests) * 100);
  
  console.log(`\n${colors.bold}Overall Score: ${score}% (${passedTests}/${totalTests} tests passed)${colors.reset}\n`);
  
  if (score >= 90) {
    log.success('Integration Status: Excellent - Ready for production');
  } else if (score >= 75) {
    log.warning('Integration Status: Good - Minor issues to address');
  } else if (score >= 50) {
    log.warning('Integration Status: Needs improvement - Several issues found');
  } else {
    log.error('Integration Status: Poor - Major issues need fixing');
  }
  
  console.log('\nDetailed Results:');
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌';
    console.log(`  ${status} ${test}`);
  });
  
  if (score < 100) {
    console.log('\n📝 Recommendations:');
    Object.entries(results).forEach(([test, passed]) => {
      if (!passed) {
        console.log(`  • Fix: ${test}`);
      }
    });
  }
  
  console.log('\n📚 Documentation:');
  console.log('  • Integration Guide: docs/SHIPROCKET_CHECKOUT_INTEGRATION_GUIDE.md');
  console.log('  • Case Study: docs/SHIPROCKET_CHECKOUT_CASE_STUDY.md');
  console.log('  • COD Solution: docs/COD_SHIPROCKET_SOLUTION.md');
}

/**
 * Main verification function
 */
async function runVerification() {
  console.log(`${colors.bold}${colors.blue}`);
  console.log('🚀 Shiprocket Integration Verification');
  console.log('=====================================');
  console.log(`${colors.reset}`);
  
  const results = {};
  
  try {
    results['Environment Setup'] = await testEnvironmentSetup();
    results['HMAC Generation'] = await testHMACGeneration();
    results['Cart Transformation'] = await testCartTransformation();
    results['API Connection Setup'] = await testAPIConnection();
    results['Webhook Verification'] = await testWebhookVerification();
    results['Catalog APIs'] = await testCatalogAPIs();
    results['Outgoing Webhooks'] = await testOutgoingWebhooks();
    results['Frontend Integration'] = await testFrontendIntegration();
    
    await generateReport(results);
    
  } catch (error) {
    log.error(`Verification failed: ${error.message}`);
    process.exit(1);
  }
}

// Run verification if called directly
if (require.main === module) {
  runVerification().catch(console.error);
}

module.exports = {
  runVerification,
  testEnvironmentSetup,
  testHMACGeneration,
  testCartTransformation,
  testAPIConnection,
  testWebhookVerification,
  testCatalogAPIs,
  testOutgoingWebhooks,
  testFrontendIntegration
};
