const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('DB CONNECTED'))
.catch(err => console.log('DB CONNECTION ERROR:', err));

const Product = require('./models/product');
const Cart = require('./models/cart');
const { Order } = require('./models/order');

async function testProductPhotoUrl() {
  try {
    console.log('\n=== Testing Product PhotoUrl Flow ===\n');
    
    // 1. Check if there are products with photoUrl
    console.log('1. Checking products with photoUrl...');
    const productsWithUrl = await Product.find({ photoUrl: { $exists: true, $ne: null } }).limit(5);
    console.log(`Found ${productsWithUrl.length} products with photoUrl`);
    
    if (productsWithUrl.length === 0) {
      console.log('\nNo products with photoUrl found. Creating test product...');
      
      // Create a test product with photoUrl
      const testProduct = new Product({
        name: 'Test T-Shirt with URL Image',
        description: 'A test product using external image URL',
        price: 599,
        photoUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
        category: new mongoose.Types.ObjectId(),
        productType: new mongoose.Types.ObjectId(),
        stock: 100,
        inventory: {
          S: { stock: 20 },
          M: { stock: 30 },
          L: { stock: 25 },
          XL: { stock: 15 },
          XXL: { stock: 10 }
        }
      });
      
      await testProduct.save();
      console.log('Created test product with photoUrl:', testProduct.photoUrl);
      
      // Create another with data URL
      const dataUrlProduct = new Product({
        name: 'Test T-Shirt with Data URL',
        description: 'A test product using data URL',
        price: 699,
        photoUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwABgf/9k=',
        category: new mongoose.Types.ObjectId(),
        productType: new mongoose.Types.ObjectId(),
        stock: 50,
        inventory: {
          S: { stock: 10 },
          M: { stock: 15 },
          L: { stock: 15 },
          XL: { stock: 5 },
          XXL: { stock: 5 }
        }
      });
      
      await dataUrlProduct.save();
      console.log('Created test product with data URL');
      
      productsWithUrl.push(testProduct, dataUrlProduct);
    }
    
    // Display products with photoUrl
    productsWithUrl.forEach(product => {
      console.log(`\nProduct: ${product.name}`);
      console.log(`ID: ${product._id}`);
      console.log(`PhotoUrl: ${product.photoUrl?.substring(0, 50)}${product.photoUrl?.length > 50 ? '...' : ''}`);
      console.log(`Has photo data: ${!!(product.photo && product.photo.data)}`);
    });
    
    // 2. Test cart with photoUrl product
    if (productsWithUrl.length > 0) {
      const testProduct = productsWithUrl[0];
      const testUserId = new mongoose.Types.ObjectId();
      
      console.log('\n2. Creating cart with photoUrl product...');
      const cartData = {
        user: testUserId,
        items: [{
          product: testProduct._id,
          name: testProduct.name,
          price: testProduct.price,
          photoUrl: testProduct.photoUrl, // Include photoUrl in cart
          size: 'M',
          color: 'White',
          quantity: 2
        }]
      };
      
      const cart = new Cart(cartData);
      await cart.save();
      console.log('Cart created successfully');
      console.log('Cart item photoUrl:', cart.items[0].photoUrl?.substring(0, 50));
      
      // 3. Create order from cart
      console.log('\n3. Creating order from cart...');
      const orderData = {
        user: testUserId,
        products: cart.items.map(item => ({
          product: item.product,
          name: item.name,
          price: item.price,
          photoUrl: item.photoUrl, // Include photoUrl in order
          count: item.quantity,
          size: item.size,
          color: item.color
        })),
        transaction_id: `test-photourl-${Date.now()}`,
        amount: cart.items.reduce((total, item) => total + (item.price * item.quantity), 0),
        address: '123 Test Street, Test City, Test State - 123456',
        status: 'Received'
      };
      
      const order = new Order(orderData);
      await order.save();
      console.log('Order created successfully');
      console.log('Order product photoUrl:', order.products[0].photoUrl?.substring(0, 50));
      
      // 4. Verify data flow
      console.log('\n4. Verifying data flow...');
      const savedOrder = await Order.findById(order._id);
      console.log('PhotoUrl preserved in order:', savedOrder.products[0].photoUrl === testProduct.photoUrl);
      
      // Clean up
      await Cart.findByIdAndDelete(cart._id);
      await Order.findByIdAndDelete(order._id);
      console.log('\n✓ Test cleanup completed');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testProductPhotoUrl();
