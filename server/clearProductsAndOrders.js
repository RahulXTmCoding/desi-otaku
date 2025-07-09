require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/product');
const { Order } = require('./models/order');

// Connect to MongoDB
mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('DB CONNECTED');
  clearData();
}).catch(err => {
  console.error('DB CONNECTION ERROR:', err);
  console.log('\nMake sure you have a .env file with DATABASE variable set.');
  console.log('Example: DATABASE=mongodb://localhost:27017/tshirtstore');
  process.exit(1);
});

async function clearData() {
  try {
    console.log('\n🗑️  Starting to clear all products and orders...\n');
    
    // Count existing documents
    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    
    console.log(`Found ${productCount} products`);
    console.log(`Found ${orderCount} orders`);
    
    if (productCount === 0 && orderCount === 0) {
      console.log('\n✅ Database is already clean - no products or orders to remove.');
      mongoose.connection.close();
      return;
    }
    
    console.log('\nClearing data...');
    
    // Delete all products
    if (productCount > 0) {
      const productResult = await Product.deleteMany({});
      console.log(`✅ Deleted ${productResult.deletedCount} products`);
    }
    
    // Delete all orders
    if (orderCount > 0) {
      const orderResult = await Order.deleteMany({});
      console.log(`✅ Deleted ${orderResult.deletedCount} orders`);
    }
    
    // Verify deletion
    const remainingProducts = await Product.countDocuments();
    const remainingOrders = await Order.countDocuments();
    
    console.log('\n📊 Final counts:');
    console.log(`- Products: ${remainingProducts}`);
    console.log(`- Orders: ${remainingOrders}`);
    
    if (remainingProducts === 0 && remainingOrders === 0) {
      console.log('\n✅ Successfully cleared all products and orders!');
      console.log('🎉 Database is now ready for fresh data with the new product model.');
    } else {
      console.log('\n⚠️  Warning: Some documents may not have been deleted.');
    }
    
  } catch (error) {
    console.error('\n❌ Error clearing data:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n👋 Database connection closed.');
  }
}
