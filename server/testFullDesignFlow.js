const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('DB CONNECTED'))
.catch(err => console.log('DB CONNECTION ERROR:', err));

const Design = require('./models/design');
const Cart = require('./models/cart');
const { Order } = require('./models/order');

async function testFullDesignFlow() {
  try {
    console.log('\n=== Testing Full Design Flow ===\n');
    
    // 1. Check existing designs
    console.log('1. Checking existing designs...');
    const designs = await Design.find().select('name imageUrl image.contentType').limit(5);
    console.log(`Found ${designs.length} designs`);
    
    designs.forEach(design => {
      console.log(`- ${design.name}:`);
      console.log(`  Has imageUrl: ${!!design.imageUrl}`);
      console.log(`  Has image data: ${!!(design.image && design.image.contentType)}`);
      if (design.imageUrl) {
        console.log(`  Image URL type: ${design.imageUrl.startsWith('data:') ? 'Data URL' : 'External URL'}`);
      }
    });
    
    // 2. Find a design with imageUrl
    const designWithUrl = await Design.findOne({ imageUrl: { $exists: true, $ne: null } });
    
    if (!designWithUrl) {
      console.log('\nNo designs with imageUrl found. Creating test design...');
      // Create a test design with data URL
      const newDesign = new Design({
        name: 'Test Design with Data URL',
        description: 'Test design for verifying image display',
        imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        category: new mongoose.Types.ObjectId(),
        price: 150,
        isActive: true
      });
      await newDesign.save();
      console.log('Created test design with data URL');
      return;
    }
    
    console.log(`\n2. Using design: ${designWithUrl.name} (${designWithUrl._id})`);
    
    // 3. Create cart with this design
    const testUserId = new mongoose.Types.ObjectId();
    
    const cartData = {
      user: testUserId,
      items: [{
        isCustom: true,
        customization: {
          frontDesign: {
            designId: designWithUrl._id.toString(),
            designImage: designWithUrl.imageUrl || `http://localhost:8000/api/design/image/${designWithUrl._id}`,
            position: 'center',
            price: designWithUrl.price || 150
          }
        },
        name: `Custom T-Shirt - Front: ${designWithUrl.name}`,
        size: 'L',
        color: 'Black',
        colorValue: '#000000',
        price: 499 + (designWithUrl.price || 150),
        quantity: 1
      }]
    };
    
    console.log('\n3. Creating cart...');
    const cart = new Cart(cartData);
    await cart.save();
    console.log('Cart created successfully');
    console.log('Cart item customization:', JSON.stringify(cart.items[0].customization, null, 2));
    
    // 4. Create order from cart
    const orderData = {
      user: testUserId,
      products: cart.items.map(item => ({
        name: item.name,
        price: item.price,
        count: item.quantity,
        size: item.size,
        color: item.color,
        colorValue: item.colorValue,
        isCustom: item.isCustom,
        customization: item.customization
      })),
      transaction_id: `test-${Date.now()}`,
      amount: cart.items.reduce((total, item) => total + (item.price * item.quantity), 0),
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
    
    console.log('\n4. Creating order...');
    const order = new Order(orderData);
    await order.save();
    console.log('Order created successfully');
    console.log('Order product customization:', JSON.stringify(order.products[0].customization, null, 2));
    
    // 5. Verify data integrity
    console.log('\n5. Verifying data integrity...');
    const savedOrder = await Order.findById(order._id);
    const orderCustomization = savedOrder.products[0].customization;
    
    console.log('Design image URL preserved:', orderCustomization.frontDesign.designImage === cartData.items[0].customization.frontDesign.designImage);
    console.log('Design ID preserved:', orderCustomization.frontDesign.designId === cartData.items[0].customization.frontDesign.designId);
    console.log('Position preserved:', orderCustomization.frontDesign.position === cartData.items[0].customization.frontDesign.position);
    console.log('Price preserved:', orderCustomization.frontDesign.price === cartData.items[0].customization.frontDesign.price);
    
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
testFullDesignFlow();
