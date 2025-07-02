require('dotenv').config();
const axios = require('axios');

const API = 'http://localhost:8000';

async function testGuestRazorpayOrder() {
  console.log('\n🧪 Testing Guest Razorpay Order Creation...\n');
  
  try {
    // Test 1: Create guest Razorpay order
    console.log('1️⃣ Creating guest Razorpay order...');
    const orderResponse = await axios.post(`${API}/api/razorpay/order/guest/create`, {
      amount: 599,
      currency: 'INR',
      receipt: `guest_test_${Date.now()}`,
      customerInfo: {
        name: 'Guest User',
        email: 'guest@example.com',
        phone: '9999999999'
      },
      notes: {
        items: 1,
        shipping_method: 'Standard'
      }
    });
    
    const orderData = orderResponse.data;
    console.log('Order Response:', orderData);
    
    console.log('✅ Guest order created successfully!');
    console.log('Order ID:', orderData.order.id);
    console.log('Amount:', orderData.order.amount / 100, 'INR');
    console.log('Key ID:', orderData.key_id);
    
    // Test 2: Skip payment verification (requires real payment signature)
    console.log('\n2️⃣ Skipping payment verification (requires real payment)...');
    console.log('ℹ️  In production, Razorpay provides the signature after actual payment');
    
    // Test 3: Create guest order in database
    console.log('\n3️⃣ Creating guest order in database...');
    const dbOrderResponse = await axios.post(`${API}/api/guest/order/create`, {
      products: [{
        product: '6123456789abcdef01234567',
        name: 'Test T-Shirt',
        price: 599,
        count: 1,
        size: 'M'
      }],
      transaction_id: `pay_test_${Date.now()}`,
      amount: 599,
      address: '123 Test Street, Test City, Test State - 123456, India',
      status: 'Received',
      shipping: {
        name: 'Guest User',
        phone: '9999999999',
        pincode: '123456',
        city: 'Test City',
        state: 'Test State',
        country: 'India',
        weight: 0.3,
        shippingCost: 60,
        courier: 'Standard Delivery'
      },
      guestInfo: {
        name: 'Guest User',
        email: 'guest@example.com',
        phone: '9999999999'
      }
    });
    
    const dbOrderData = dbOrderResponse.data;
    console.log('DB Order Response:', dbOrderData);
    
    console.log('✅ Guest order saved to database!');
    console.log('Order ID:', dbOrderData.order._id);
    
    console.log('\n🎉 All guest checkout tests passed!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Add test for checking Razorpay configuration
async function checkRazorpayConfig() {
  console.log('\n🔧 Checking Razorpay Configuration...\n');
  
  console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID || 'NOT SET');
  console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? '****' + process.env.RAZORPAY_KEY_SECRET.slice(-4) : 'NOT SET');
  console.log('API URL:', API);
  
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.log('\n⚠️  WARNING: Razorpay credentials not properly configured!');
    console.log('Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file');
  } else {
    console.log('\n✅ Razorpay credentials are configured');
  }
}

// Run tests
checkRazorpayConfig();
testGuestRazorpayOrder();
