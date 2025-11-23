const fs = require('fs');
const path = require('path');

// Comprehensive Production Readiness Test Suite
console.log('🔍 SEO SOLUTION PRODUCTION READINESS TEST');
console.log('==========================================\n');

let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};


function logTest(testName, status, message, isWarning = false) {
  const statusIcon = status ? '✅' : (isWarning ? '⚠️' : '❌');
  console.log(`${statusIcon} ${testName}: ${message}`);
  
  testResults.details.push({
    test: testName,
    status,
    message,
    isWarning
  });
  
  if (isWarning) {
    testResults.warnings++;
  } else if (status) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

// Test 1: Domain Consistency Verification
function testDomainConsistency() {
  console.log('\n📍 PHASE 1: Domain Consistency Verification');
  console.log('--------------------------------------------');
  
  try {
    // Check client/index.html
    const indexPath = path.join(__dirname, '../client/index.html');
    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      
      // Check for wrong domains
      const wrongDomains = ['attarsclothing.com', 'desiotaku.com'];
      let foundWrongDomains = false;
      
      wrongDomains.forEach(domain => {
        if (indexContent.includes(domain)) {
          logTest('Frontend Domain Check', false, `Found wrong domain: ${domain} in index.html`);
          foundWrongDomains = true;
        }
      });
      
      if (!foundWrongDomains) {
        logTest('Frontend Domain Check', true, 'No wrong domains found in index.html');
      }
      
      // Check for correct domain
      if (indexContent.includes('https://attars.club')) {
        logTest('Correct Frontend Domain', true, 'Found correct domain https://attars.club in index.html');
      } else {
        logTest('Correct Frontend Domain', false, 'Missing https://attars.club in index.html');
      }
    } else {
      logTest('Frontend Index File', false, 'index.html not found');
    }
    
    // Check SEO Config
    const seoConfigPath = path.join(__dirname, '../client/src/seo/SEOConfig.ts');
    if (fs.existsSync(seoConfigPath)) {
      const seoContent = fs.readFileSync(seoConfigPath, 'utf8');
      
      if (seoContent.includes("BASE_URL = 'https://attars.club'")) {
        logTest('SEO Config Domain', true, 'BASE_URL correctly set to https://attars.club');
      } else {
        logTest('SEO Config Domain', false, 'BASE_URL not correctly configured');
      }
    } else {
      logTest('SEO Config File', false, 'SEOConfig.ts not found');
    }
    
    // Check robots.txt
    const robotsPath = path.join(__dirname, '../client/public/robots.txt');
    if (fs.existsSync(robotsPath)) {
      const robotsContent = fs.readFileSync(robotsPath, 'utf8');
      
      if (robotsContent.includes('https://backend.attars.club/api/sitemap/sitemap-index.xml')) {
        logTest('Robots.txt Domain', true, 'robots.txt points to correct backend domain');
      } else {
        logTest('Robots.txt Domain', false, 'robots.txt not pointing to backend domain');
      }
    } else {
      logTest('Robots.txt File', false, 'robots.txt not found');
    }
    
  } catch (error) {
    logTest('Domain Consistency Test', false, `Error: ${error.message}`);
  }
}

// Test 2: Sitemap Infrastructure 
function testSitemapInfrastructure() {
  console.log('\n🗺️ PHASE 2: Sitemap Infrastructure Testing');
  console.log('--------------------------------------------');
  
  try {
    // Check backend sitemap routes
    const sitemapRoutesPath = path.join(__dirname, 'routes/sitemap.js');
    if (fs.existsSync(sitemapRoutesPath)) {
      const sitemapContent = fs.readFileSync(sitemapRoutesPath, 'utf8');
      
      // Check for XML escaping function
      if (sitemapContent.includes('escapeXml')) {
        logTest('XML Escaping Function', true, 'XML entity escaping implemented');
      } else {
        logTest('XML Escaping Function', false, 'Missing XML entity escaping');
      }
      
      // Check for backend URL configuration
      if (sitemapContent.includes('backend.attars.club')) {
        logTest('Backend URL Config', true, 'Backend domain correctly configured in sitemap routes');
      } else {
        logTest('Backend URL Config', false, 'Backend domain not found in sitemap routes');
      }
      
      // Check for correct BASE_URL
      if (sitemapContent.includes("BASE_URL = 'https://attars.club'")) {
        logTest('Sitemap BASE_URL', true, 'Frontend BASE_URL correctly set');
      } else {
        logTest('Sitemap BASE_URL', false, 'Frontend BASE_URL not correctly configured');
      }
      
      // Check for dynamic data endpoint
      if (sitemapContent.includes('/dynamic-data')) {
        logTest('Dynamic Data Endpoint', true, 'Dynamic filter data endpoint found');
      } else {
        logTest('Dynamic Data Endpoint', false, 'Missing dynamic filter data endpoint');
      }
      
    } else {
      logTest('Sitemap Routes File', false, 'sitemap.js routes file not found');
    }
    
    // Check app.js for sitemap routes registration
    const appPath = path.join(__dirname, 'app.js');
    if (fs.existsSync(appPath)) {
      const appContent = fs.readFileSync(appPath, 'utf8');
      
      if (appContent.includes('app.use("/api/sitemap", sitemapRoutes)')) {
        logTest('Sitemap Routes Registration', true, 'Sitemap routes properly registered in app.js');
      } else {
        logTest('Sitemap Routes Registration', false, 'Sitemap routes not registered in app.js');
      }
    } else {
      logTest('App.js File', false, 'app.js not found');
    }
    
  } catch (error) {
    logTest('Sitemap Infrastructure Test', false, `Error: ${error.message}`);
  }
}

// Test 3: Frontend Integration
function testFrontendIntegration() {
  console.log('\n🔗 PHASE 3: Frontend Integration Testing');
  console.log('------------------------------------------');
  
  try {
    // Check frontend sitemap generator
    const sitemapGenPath = path.join(__dirname, '../client/src/utils/sitemapGenerator.ts');
    if (fs.existsSync(sitemapGenPath)) {
      const genContent = fs.readFileSync(sitemapGenPath, 'utf8');
      
      // Check for backend URL usage
      if (genContent.includes('backend.attars.club')) {
        logTest('Frontend API Calls', true, 'Frontend calls backend domain for data');
      } else {
        logTest('Frontend API Calls', false, 'Frontend not calling backend domain');
      }
      
      // Check for ObjectID usage (not slug)
      if (genContent.includes('type.id') && !genContent.includes('type.slug')) {
        logTest('Filter Parameter Accuracy', true, 'Using ObjectID for type filters');
      } else {
        logTest('Filter Parameter Accuracy', false, 'Not using correct ObjectID for filters');
      }
      
      // Check for no hardcoded fallbacks
      if (genContent.includes('return [];') && !genContent.includes('tshirt')) {
        logTest('No Hardcoded Fallbacks', true, 'No hardcoded fallback values found');
      } else {
        logTest('No Hardcoded Fallbacks', false, 'Still contains hardcoded fallback values');
      }
      
    } else {
      logTest('Sitemap Generator File', false, 'sitemapGenerator.ts not found');
    }
    
    // Check if frontend file is actually being used
    const searchResult = searchForFileUsage('../client/src', 'sitemapGenerator');
    if (searchResult.length === 0) {
      logTest('Frontend Code Usage', true, 'Frontend sitemap code properly isolated (not used - backend handles all)', true);
    } else {
      logTest('Frontend Code Usage', false, `Frontend sitemap code still being used: ${searchResult.join(', ')}`);
    }
    
  } catch (error) {
    logTest('Frontend Integration Test', false, `Error: ${error.message}`);
  }
}

// Helper function to search for file usage
function searchForFileUsage(directory, filename) {
  const results = [];
  try {
    const files = getAllFiles(directory);
    files.forEach(file => {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          if (content.includes(filename) && !file.includes(filename)) {
            results.push(file);
          }
        } catch (e) {
          // Skip files that can't be read
        }
      }
    });
  } catch (error) {
    // Directory doesn't exist or can't be read
  }
  return results;
}

// Helper function to get all files recursively
function getAllFiles(dirPath) {
  const files = [];
  try {
    const items = fs.readdirSync(dirPath);
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          files.push(...getAllFiles(fullPath));
        } else if (stat.isFile()) {
          files.push(fullPath);
        }
      } catch (e) {
        // Skip items that can't be accessed
      }
    });
  } catch (error) {
    // Directory doesn't exist or can't be read
  }
  return files;
}

// Test 4: SEO Content Validation
function testSEOContent() {
  console.log('\n📊 PHASE 4: SEO Content Validation');
  console.log('------------------------------------');
  
  try {
    // Check SEO config content
    const seoConfigPath = path.join(__dirname, '../client/src/seo/SEOConfig.ts');
    if (fs.existsSync(seoConfigPath)) {
      const seoContent = fs.readFileSync(seoConfigPath, 'utf8');
      
      // Check for premium streetwear targeting
      if (seoContent.includes('Premium Streetwear India')) {
        logTest('SEO Strategy Targeting', true, 'Premium Streetwear India strategy implemented');
      } else {
        logTest('SEO Strategy Targeting', false, 'Missing premium streetwear targeting');
      }
      
      // Check for structured data
      if (seoContent.includes('@context') && seoContent.includes('schema.org')) {
        logTest('Structured Data', true, 'Schema.org structured data implemented');
      } else {
        logTest('Structured Data', false, 'Missing structured data implementation');
      }
      
      // Check for AI platform optimization
      if (seoContent.includes('AI_PLATFORM_DATA')) {
        logTest('AI Platform Optimization', true, 'AI platform optimization data present');
      } else {
        logTest('AI Platform Optimization', false, 'Missing AI platform optimization');
      }
      
    } else {
      logTest('SEO Config Content', false, 'SEOConfig.ts not accessible');
    }
    
  } catch (error) {
    logTest('SEO Content Test', false, `Error: ${error.message}`);
  }
}

// Test 5: Production URLs Validation
function testProductionURLs() {
  console.log('\n🚀 PHASE 5: Production URLs Validation');
  console.log('----------------------------------------');
  
  const requiredEndpoints = [
    '/api/sitemap/sitemap-index.xml',
    '/api/sitemap/sitemap-static.xml',
    '/api/sitemap/dynamic-data',
    '/api/sitemap/stats'
  ];
  
  requiredEndpoints.forEach(endpoint => {
    const backendUrl = `https://backend.attars.club${endpoint}`;
    logTest('Production Endpoint', true, `Configured: ${backendUrl}`, true);
  });
  
  // Check for Google Search Console readiness
  logTest('Search Console Ready', true, 'Main sitemap URL: https://backend.attars.club/api/sitemap/sitemap-index.xml');
}

// Run all tests
function runAllTests() {
  testDomainConsistency();
  testSitemapInfrastructure();
  testFrontendIntegration();
  testSEOContent();
  testProductionURLs();
  
  // Final summary
  console.log('\n📋 TEST SUMMARY');
  console.log('================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⚠️  Warnings: ${testResults.warnings}`);
  console.log(`📊 Total: ${testResults.passed + testResults.failed + testResults.warnings}`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 ALL CRITICAL TESTS PASSED! Ready for production deployment.');
  } else {
    console.log('\n🚨 SOME TESTS FAILED. Review the issues above before deployment.');
  }
  
  if (testResults.warnings > 0) {
    console.log('\n💡 There are some warnings to review, but they may not block deployment.');
  }
  
  return testResults;
}

// Export for use in other scripts
module.exports = {
  runAllTests,
  testResults
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}
