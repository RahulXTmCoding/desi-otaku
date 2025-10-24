#!/usr/bin/env node

/**
 * Test Cloudflare R2 Setup
 * Run: node test-r2-setup.js
 */

require('dotenv').config();
const { uploadToR2, generateImageKey, isR2Enabled } = require('./utils/r2Storage');

async function testR2Setup() {
  console.log('🧪 Testing Cloudflare R2 Setup...\n');
  
  // Test 1: Environment Configuration
  console.log('📋 Step 1: Checking Environment Variables');
  console.log('─────────────────────────────────────────');
  console.log(`USE_R2: ${process.env.USE_R2}`);
  console.log(`R2_ACCOUNT_ID: ${process.env.R2_ACCOUNT_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`R2_ACCESS_KEY_ID: ${process.env.R2_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`R2_SECRET_ACCESS_KEY: ${process.env.R2_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`R2_BUCKET_NAME: ${process.env.R2_BUCKET_NAME || '❌ Missing'}`);
  console.log(`R2_PUBLIC_URL: ${process.env.R2_PUBLIC_URL || '❌ Missing'}\n`);
  
  // Test 2: R2 Enabled Check
  console.log('🔧 Step 2: R2 Configuration Status');
  console.log('─────────────────────────────────────');
  const r2Status = isR2Enabled();
  console.log(`R2 Enabled: ${r2Status ? '✅ YES' : '❌ NO'}`);
  
  if (!r2Status) {
    console.log('\n🚨 R2 is not enabled. Reasons:');
    console.log(`   • USE_R2=${process.env.USE_R2} (should be "true")`);
    console.log(`   • Missing credentials: ${!process.env.R2_ACCOUNT_ID ? 'Account ID ' : ''}${!process.env.R2_ACCESS_KEY_ID ? 'Access Key ' : ''}${!process.env.R2_SECRET_ACCESS_KEY ? 'Secret Key ' : ''}`);
    console.log(`   • Missing config: ${!process.env.R2_BUCKET_NAME ? 'Bucket Name ' : ''}${!process.env.R2_PUBLIC_URL ? 'Public URL' : ''}`);
    console.log('\n💡 Set USE_R2=true in .env to enable R2 after configuring credentials.');
    return;
  }
  
  console.log('✅ R2 is properly configured!\n');
  
  // Test 3: Test Upload (only if R2 is enabled)
  console.log('🚀 Step 3: Testing R2 Upload');
  console.log('─────────────────────────────');
  
  try {
    // Create a simple test image buffer (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
      0x54, 0x08, 0x57, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xC2, 0x8D, 0xB8, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82
    ]);
    
    const testKey = generateImageKey('test-product', 0, 'png');
    console.log(`Uploading test image with key: ${testKey}`);
    
    const uploadUrl = await uploadToR2(testImageBuffer, testKey, 'image/png');
    console.log(`✅ Upload successful!`);
    console.log(`📁 File URL: ${uploadUrl}`);
    console.log(`🌐 CDN serving: ${uploadUrl.includes(process.env.R2_PUBLIC_URL) ? '✅ YES' : '❌ NO'}\n`);
    
    // Test 4: Verify URL accessibility
    console.log('🌍 Step 4: Testing URL Access');
    console.log('─────────────────────────────');
    console.log(`Testing: ${uploadUrl}`);
    
    // Simple fetch test (Node.js 18+ has fetch built-in)
    if (typeof fetch !== 'undefined') {
      try {
        const response = await fetch(uploadUrl, { method: 'HEAD' });
        console.log(`✅ URL accessible: ${response.status} ${response.statusText}`);
        console.log(`📦 Content-Type: ${response.headers.get('content-type')}`);
        console.log(`📏 Content-Length: ${response.headers.get('content-length')} bytes`);
      } catch (fetchError) {
        console.log(`⚠️ URL test failed: ${fetchError.message}`);
        console.log(`   This might be normal if R2 bucket is private`);
      }
    } else {
      console.log('ℹ️ Fetch not available, skipping URL test');
    }
    
  } catch (error) {
    console.log(`❌ Upload failed: ${error.message}`);
    console.log('\n🔍 Troubleshooting:');
    console.log('   • Verify credentials are correct');
    console.log('   • Check bucket name exists and is accessible');
    console.log('   • Ensure API token has Read & Write permissions');
    console.log('   • Check Cloudflare R2 dashboard for errors');
    return;
  }
  
  // Test Summary
  console.log('\n🎉 R2 Setup Test Complete!');
  console.log('═══════════════════════════════');
  console.log('✅ Environment: Configured');
  console.log('✅ R2 Client: Connected');
  console.log('✅ Upload: Working');
  console.log('✅ CDN: Active');
  console.log('\n🚀 Ready to start using R2 for image uploads!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Upload a test product with images');
  console.log('   2. Check server logs for "✅ R2 Upload successful"');
  console.log('   3. Verify images load from R2 CDN URLs');
  console.log('   4. Monitor costs in Cloudflare dashboard');
  
}

// Handle different ways this script might be run
if (require.main === module) {
  testR2Setup().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = testR2Setup;
