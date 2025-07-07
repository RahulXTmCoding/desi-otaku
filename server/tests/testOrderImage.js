require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/order');
const Product = require('./models/product');

mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
}).then(() => {
  console.log("DB CONNECTED");
  testOrderImages();
}).catch(err => {
  console.log("DB CONNECTION ERROR:", err);
});

async function testOrderImages() {
  try {
    // Find a recent order
    const order = await Order.findOne()
      .populate('products.product', 'name price photo photoUrl')
      .sort('-createdAt')
      .limit(1);
    
    if (!order) {
      console.log("No orders found");
      process.exit(0);
    }

    console.log("Order ID:", order._id);
    console.log("Order products:");
    
    order.products.forEach((item, index) => {
      console.log(`\nProduct ${index + 1}:`);
      console.log("- Name:", item.name);
      console.log("- Price:", item.price);
      console.log("- Has product reference:", !!item.product);
      
      if (item.product) {
        console.log("- Product ID:", item.product._id || item.product);
        console.log("- Product photoUrl:", item.product.photoUrl);
        console.log("- Product has photo data:", !!(item.product.photo && item.product.photo.data));
        
        // Check the actual product in database
        Product.findById(item.product._id || item.product)
          .select('name photoUrl photo')
          .then(product => {
            if (product) {
              console.log(`\n  Direct product query for ${product.name}:`);
              console.log("  - photoUrl:", product.photoUrl);
              console.log("  - has photo data:", !!(product.photo && product.photo.data));
            }
          });
      }
    });

    // Wait a bit for async operations
    setTimeout(() => {
      process.exit(0);
    }, 2000);

  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}
