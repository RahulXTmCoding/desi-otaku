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

async function testCartToOrderConversion() {
  try {
    console.log('\n=== Testing Cart to Order Data Conversion ===\n');
    
    // Create a test cart with custom design
    const testUserId = new mongoose.Types.ObjectId();
    
    const cartData = {
      user: testUserId,
      items: [
        {
          isCustom: true,
          customization: {
            frontDesign: {
              designId: 'design-123',
              designImage: 'https://example.com/design1.jpg',
              position: 'center',
              price: 150
            },
            backDesign: {
              designId: 'design-456',
              designImage: 'https://example.com/design2.jpg',
              position: 'center-bottom',
              price: 150
            }
          },
          name: 'Custom T-Shirt - Front: Design 1, Back: Design 2',
          size: 'L',
          color: 'Black',
          price: 799,
          quantity: 2
        }
      ]
    };
    
    console.log('1. Creating test cart with custom design data...');
    const cart = new Cart(cartData);
    await cart.save();
    console.log('✓ Cart created successfully');
    
    // Retrieve the cart
    const savedCart = await Cart.findById(cart._id);
    console.log('\n2. Cart data structure:');
    console.log(JSON.stringify(savedCart.items[0].customization, null, 2));
    
    // Convert cart to order format
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
      transaction_id: 'test-txn-123',
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
    
    console.log('\n3. Creating order from cart data...');
    const order = new Order(orderData);
    await order.save();
    console.log('✓ Order created successfully');
    
    // Retrieve and verify the order
    const savedOrder = await Order.findById(order._id);
    console.log('\n4. Order data structure:');
    console.log(JSON.stringify(savedOrder.products[0].customization, null, 2));
    
    // Verify data integrity
    console.log('\n5. Data Integrity Check:');
    const cartItem = savedCart.items[0];
    const orderItem = savedOrder.products[0];
    
    // Check front design
    if (cartItem.customization.frontDesign) {
      console.log('\nFront Design:');
      console.log(`  Cart  -> Position: ${cartItem.customization.frontDesign.position}, Price: ${cartItem.customization.frontDesign.price}`);
      console.log(`  Order -> Position: ${orderItem.customization.frontDesign.position}, Price: ${orderItem.customization.frontDesign.price}`);
      console.log(`  Match: ${cartItem.customization.frontDesign.position === orderItem.customization.frontDesign.position ? '✓' : '✗'}`);
    }
    
    // Check back design
    if (cartItem.customization.backDesign) {
      console.log('\nBack Design:');
      console.log(`  Cart  -> Position: ${cartItem.customization.backDesign.position}, Price: ${cartItem.customization.backDesign.price}`);
      console.log(`  Order -> Position: ${orderItem.customization.backDesign.position}, Price: ${orderItem.customization.backDesign.price}`);
      console.log(`  Match: ${cartItem.customization.backDesign.position === orderItem.customization.backDesign.position ? '✓' : '✗'}`);
    }
    
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
testCartToOrderConversion();
