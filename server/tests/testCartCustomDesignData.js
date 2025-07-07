require('dotenv').config();
const mongoose = require('mongoose');
const Cart = require('./models/cart');
const Order = require('./models/order').Order;
const User = require('./models/user');

mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("DB CONNECTED");
  testCartCustomDesignData();
}).catch(err => {
  console.error("DB CONNECTION ERROR:", err);
});

async function testCartCustomDesignData() {
  try {
    // Find a test user
    const user = await User.findOne({ email: 'testuser@example.com' });
    if (!user) {
      console.log('Test user not found');
      process.exit(1);
    }

    // Create a test cart with custom design
    const testCustomItem = {
      isCustom: true,
      customization: {
        frontDesign: {
          designId: '507f1f77bcf86cd799439011',
          designImage: 'https://example.com/design1.png',
          position: 'center',
          price: 150
        },
        backDesign: {
          designId: '507f1f77bcf86cd799439012',
          designImage: 'https://example.com/design2.png',
          position: 'center-bottom',
          price: 150
        },
        selectedProduct: '507f1f77bcf86cd799439013'
      },
      name: 'Custom T-Shirt',
      size: 'L',
      color: 'Black',
      price: 849,
      quantity: 1
    };

    // Clear existing cart
    await Cart.findOneAndDelete({ user: user._id });

    // Create new cart with custom item
    const cart = new Cart({
      user: user._id,
      items: [testCustomItem]
    });

    const savedCart = await cart.save();
    console.log('\n=== Cart with Custom Design ===');
    console.log(JSON.stringify(savedCart.items[0], null, 2));

    // Now create an order with the same custom design data
    const orderData = {
      user: user._id,
      products: [{
        isCustom: true,
        customization: testCustomItem.customization,
        name: testCustomItem.name,
        size: testCustomItem.size,
        color: testCustomItem.color,
        price: testCustomItem.price,
        count: testCustomItem.quantity
      }],
      amount: testCustomItem.price,
      address: {
        name: 'Test User',
        mobile: '9876543210',
        pincode: '400001',
        locality: 'Test Area',
        address: '123 Test Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        landmark: 'Near Test',
        alternatePhone: ''
      },
      paymentMethod: 'Razorpay',
      paymentStatus: 'Paid',
      transactionId: 'test_' + Date.now()
    };

    const order = new Order(orderData);
    const savedOrder = await order.save();
    
    console.log('\n=== Order with Custom Design ===');
    console.log(JSON.stringify(savedOrder.products[0], null, 2));

    // Compare structures
    console.log('\n=== Comparison ===');
    console.log('Cart customization structure:');
    console.log(JSON.stringify(savedCart.items[0].customization, null, 2));
    
    console.log('\nOrder customization structure:');
    console.log(JSON.stringify(savedOrder.products[0].customization, null, 2));

    // Fetch cart and order to see how they're retrieved
    const fetchedCart = await Cart.findById(savedCart._id);
    const fetchedOrder = await Order.findById(savedOrder._id);

    console.log('\n=== Fetched Cart Item ===');
    console.log(JSON.stringify(fetchedCart.items[0].customization, null, 2));

    console.log('\n=== Fetched Order Product ===');
    console.log(JSON.stringify(fetchedOrder.products[0].customization, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDB connection closed');
  }
}
