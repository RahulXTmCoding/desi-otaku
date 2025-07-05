const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('DB CONNECTED'))
.catch(err => console.log('DB CONNECTION ERROR:', err));

const Cart = require('./models/cart');
const { Order } = require('./models/order');

async function testUrlDesignFlow() {
  try {
    console.log('\n=== Testing URL-based Design Flow ===\n');
    
    // Create a test cart with URL-based design
    const testUserId = new mongoose.Types.ObjectId();
    
    const cartData = {
      user: testUserId,
      items: [
        {
          isCustom: true,
          customization: {
            frontDesign: {
              designId: 'url-design-123',
              designImage: 'https://example.com/custom-design.jpg',
              position: 'center',
              price: 150
            },
            backDesign: {
              designId: 'url-design-456',
              designImage: 'https://another-example.com/back-design.png',
              position: 'center-bottom',
              price: 150
            }
          },
          name: 'Custom T-Shirt - URL Design Test',
          size: 'L',
          color: 'Black',
          price: 799,
          quantity: 1
        }
      ]
    };
    
    console.log('1. Creating cart with URL-based designs...');
    const cart = new Cart(cartData);
    await cart.save();
    console.log('✓ Cart created successfully');
    
    // Retrieve the cart
    const savedCart = await Cart.findById(cart._id);
    console.log('\n2. Cart design URLs:');
    console.log('Front Design URL:', savedCart.items[0].customization.frontDesign.designImage);
    console.log('Back Design URL:', savedCart.items[0].customization.backDesign.designImage);
    
    // Convert to order
    const orderData = {
      user: testUserId,
      products: savedCart.items.map(item => ({
        product: item.product,
        name: item.name,
        price: item.price,
        count: item.quantity,
        size: item.size,
        color: item.color,
        isCustom: item.isCustom,
        customization: item.customization
      })),
      transaction_id: 'test-url-txn-123',
      amount: savedCart.items.reduce((total, item) => total + (item.price * item.quantity), 0),
      address: '123 Test Street, Test City, Test State - 123456',
      status: 'Received',
      shipping: {
        name: 'Test User',
        phone: '9876543210',
        pincode: '123456',
        city: 'Test City',
        state: 'Test State',
        country: 'India',
        weight: 0.3,
        shippingCost: 79,
        courier: 'Standard'
      }
    };
    
    console.log('\n3. Creating order from cart...');
    const order = new Order(orderData);
    await order.save();
    console.log('✓ Order created successfully');
    
    // Retrieve and verify the order
    const savedOrder = await Order.findById(order._id);
    console.log('\n4. Order design URLs:');
    console.log('Front Design URL:', savedOrder.products[0].customization.frontDesign.designImage);
    console.log('Back Design URL:', savedOrder.products[0].customization.backDesign.designImage);
    
    // Verify URLs are preserved
    console.log('\n5. URL Preservation Check:');
    const cartFrontUrl = savedCart.items[0].customization.frontDesign.designImage;
    const orderFrontUrl = savedOrder.products[0].customization.frontDesign.designImage;
    const cartBackUrl = savedCart.items[0].customization.backDesign.designImage;
    const orderBackUrl = savedOrder.products[0].customization.backDesign.designImage;
    
    console.log('Front URL Match:', cartFrontUrl === orderFrontUrl ? '✓' : '✗');
    console.log('Back URL Match:', cartBackUrl === orderBackUrl ? '✓' : '✗');
    
    // Check if URLs are valid
    console.log('\n6. URL Format Check:');
    console.log('Front URL starts with http:', orderFrontUrl.startsWith('http') ? '✓' : '✗');
    console.log('Back URL starts with http:', orderBackUrl.startsWith('http') ? '✓' : '✗');
    
    // Clean up
    await Cart.findByIdAndDelete(cart._id);
    await Order.findByIdAndDelete(order._id);
    console.log('\n✓ Test cleanup completed');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testUrlDesignFlow();
