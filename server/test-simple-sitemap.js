const http = require('http');

// Simple test without external dependencies
async function testDynamicSitemap() {
  console.log('🔍 Testing Dynamic Sitemap Integration');
  console.log('=====================================\n');

  // Test 1: Check if sitemap routes are registered
  console.log('1. Testing sitemap route structure...');
  try {
    const sitemapRoutes = require('./routes/sitemap.js');
    console.log('✅ Sitemap routes module loaded successfully');
  } catch (error) {
    console.log('❌ Failed to load sitemap routes:', error.message);
    return;
  }

  // Test 2: Verify dynamic data endpoint response structure
  console.log('\n2. Testing dynamic data endpoint...');
  const options = {
    hostname: 'localhost',
    port: process.env.PORT || 5000,
    path: '/api/sitemap/dynamic-data',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options);
    const data = JSON.parse(response);
    
    console.log('✅ Dynamic data endpoint responded');
    console.log('📊 Response structure:');
    console.log(`   - Categories: ${data.categories ? data.categories.length : 0} items`);
    console.log(`   - Product Types: ${data.productTypes ? data.productTypes.length : 0} items`);
    console.log(`   - Sizes: ${data.sizes ? data.sizes.length : 0} items`);
    console.log(`   - Search Terms: ${data.searchTerms ? data.searchTerms.length : 0} items`);
    
    // Validate structure
    if (!data.categories || !Array.isArray(data.categories)) {
      console.log('⚠️  Warning: categories should be an array');
    }
    if (!data.productTypes || !Array.isArray(data.productTypes)) {
      console.log('⚠️  Warning: productTypes should be an array');
    }
    
  } catch (error) {
    console.log('❌ Failed to test dynamic data endpoint:', error.message);
    console.log('💡 Make sure the server is running on port', options.port);
  }

  // Test 3: Check sitemap index
  console.log('\n3. Testing sitemap index...');
  try {
    const indexOptions = { ...options, path: '/api/sitemap/sitemap-index.xml' };
    const indexResponse = await makeRequest(indexOptions);
    
    if (indexResponse.includes('<sitemapindex')) {
      console.log('✅ Sitemap index XML is valid');
      
      // Check for dynamic sitemap references
      if (indexResponse.includes('sitemap-products-')) {
        console.log('✅ Dynamic product sitemaps are referenced');
      } else {
        console.log('⚠️  Warning: No dynamic product sitemaps found in index');
      }
    } else {
      console.log('❌ Invalid sitemap index XML format');
    }
    
  } catch (error) {
    console.log('❌ Failed to test sitemap index:', error.message);
  }

  // Test 4: Verify frontend sitemap generator
  console.log('\n4. Testing frontend sitemap generator...');
  try {
    const fs = require('fs');
    const sitemapGenPath = '../client/src/utils/sitemapGenerator.ts';
    
    if (fs.existsSync(sitemapGenPath)) {
      const content = fs.readFileSync(sitemapGenPath, 'utf8');
      
      // Check for dynamic implementation
      if (content.includes('fetchDynamicCategoryPages')) {
        console.log('✅ Dynamic fetch function found');
      } else {
        console.log('❌ Missing fetchDynamicCategoryPages function');
      }
      
      // Check for hardcoded values removal
      if (content.includes('productTypePages') && content.includes('hardcoded')) {
        console.log('⚠️  Warning: Still contains hardcoded references');
      } else {
        console.log('✅ No hardcoded values detected');
      }
      
      // Check for API endpoint usage
      if (content.includes('/api/sitemap/dynamic-data')) {
        console.log('✅ Uses dynamic data API endpoint');
      } else {
        console.log('❌ Missing API endpoint call');
      }
      
    } else {
      console.log('❌ Sitemap generator file not found');
    }
    
  } catch (error) {
    console.log('❌ Failed to test frontend sitemap generator:', error.message);
  }

  console.log('\n🎯 Test Summary');
  console.log('================');
  console.log('Dynamic sitemap integration test completed.');
  console.log('Check the results above for any issues that need attention.');
}

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Run the test
if (require.main === module) {
  testDynamicSitemap().catch(console.error);
}

module.exports = { testDynamicSitemap };
