// Meta Pixel Purchase Event Test
// Run this in your browser console on any page to test if Purchase events work

console.log('🧪 Testing Meta Pixel Purchase Event...\n');

// Check if fbq exists
if (typeof fbq === 'undefined') {
  console.error('❌ ERROR: fbq is not defined!');
  console.log('Make sure you are on attars.club and the pixel is loaded');
} else {
  console.log('✅ fbq is loaded\n');
  
  // Test Purchase event
  const testPurchaseData = {
    content_ids: ['test_product_123', 'test_product_456'],
    content_type: 'product',
    contents: [
      {
        id: 'test_product_123',
        quantity: 1,
        item_price: 599
      },
      {
        id: 'test_product_456',
        quantity: 2,
        item_price: 799
      }
    ],
    currency: 'INR',
    value: 2197, // 599 + (799 * 2)
    transaction_id: 'TEST_ORDER_' + Date.now(),
    num_items: 3
  };
  
  console.log('📦 Test Purchase Data:', testPurchaseData);
  console.log('\n📤 Sending Purchase event to Meta Pixel...');
  
  fbq('track', 'Purchase', testPurchaseData);
  
  console.log('\n✅ Purchase event sent!');
  console.log('\n📋 Next steps:');
  console.log('1. Check Meta Pixel Helper extension (should show Purchase event)');
  console.log('2. Check Events Manager > Test Events (should show within 30 seconds)');
  console.log('3. Check browser Network tab for requests to facebook.com/tr');
  console.log('   - Look for: tr?id=1133467228701583&ev=Purchase');
  console.log('   - Status should be 200 OK');
  console.log('\n⏱️  If Test Events shows the event but main dashboard doesn\'t:');
  console.log('   - Test Mode might be active (End Test Activity)');
  console.log('   - Or wait 20 mins - 24 hours for dashboard to update');
}
