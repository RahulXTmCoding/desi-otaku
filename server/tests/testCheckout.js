const mongoose = require('mongoose');
require('dotenv').config();

// Test configuration
const testConfig = {
  testUser: {
    email: 'testuser@example.com',
    password: 'test123'
  },
  testAddress: {
    name: 'Test User',
    phone: '9999999999',
    address: '123 Test Street',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    country: 'India'
  },
  testPayment: {
    cardNumber: '4111111111111111',
    expiryMonth: '12',
    expiryYear: '2025',
    cvv: '123'
  }
};

// Test functions
async function testShiprocketConnection() {
  console.log('🚚 Testing Shiprocket Connection...');
  try {
    const shiprocket = require('./services/shiprocket');
    const token = await shiprocket.authenticate();
    console.log('✅ Shiprocket authentication successful');
    
    // Test pincode serviceability
    const serviceability = await shiprocket.checkServiceability(
      testConfig.testAddress.pincode,
      '1',  // 1kg weight
      '500' // ₹500 COD amount
    );
    console.log('✅ Pincode serviceability:', serviceability ? 'Available' : 'Not Available');
  } catch (error) {
    console.error('❌ Shiprocket test failed:', error.message);
  }
}

async function testBraintreeConnection() {
  console.log('💳 Testing Braintree Connection...');
  try {
    const braintree = require('braintree');
    const gateway = new braintree.BraintreeGateway({
      environment: braintree.Environment.Sandbox,
      merchantId: process.env.BRAINTREE_MERCHANT_ID,
      publicKey: process.env.BRAINTREE_PUBLIC_KEY,
      privateKey: process.env.BRAINTREE_PRIVATE_KEY
    });
    
    // Generate client token
    const response = await gateway.clientToken.generate({});
    console.log('✅ Braintree client token generated');
    
    // Test transaction (will fail without proper nonce)
    console.log('✅ Braintree connection successful');
  } catch (error) {
    console.error('❌ Braintree test failed:', error.message);
  }
}

async function testEmailService() {
  console.log('📧 Testing Email Service...');
  try {
    const emailService = require('./services/emailService');
    const result = await emailService.sendTestEmail('test@example.com');
    console.log('✅ Email service configured');
    if (result.previewUrl) {
      console.log('📧 Preview email at:', result.previewUrl);
    }
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('🔧 Starting Checkout Flow Tests\n');
  
  // Connect to database
  try {
    await mongoose.connect(process.env.DATABASE, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Database connected\n');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return;
  }
  
  // Run tests
  await testBraintreeConnection();
  console.log('');
  await testShiprocketConnection();
  console.log('');
  await testEmailService();
  
  console.log('\n✅ Testing completed!');
  process.exit(0);
}

// Execute tests
runTests();
