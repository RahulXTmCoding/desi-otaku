const mongoose = require("mongoose");
const { Order } = require("./models/order");
const User = require("./models/user"); // Import User model
require("dotenv").config();

// Test script to check custom order data
async function testCustomOrderData() {
  try {
    await mongoose.connect(process.env.DATABASE, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Find the most recent order with custom products
    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email');

    console.log("\n=== Recent Orders with Custom Products ===\n");
    
    for (const order of recentOrders) {
      const customProducts = order.products.filter(p => p.isCustom);
      
      if (customProducts.length > 0) {
        console.log(`Order ID: ${order._id}`);
        console.log(`Created: ${order.createdAt}`);
        console.log(`User: ${order.user?.name || 'Guest'}`);
        console.log(`Custom Products:`);
        
        customProducts.forEach((product, index) => {
          console.log(`  Product ${index + 1}:`);
          console.log(`    - Name: ${product.name}`);
          console.log(`    - Custom Design: ${product.customDesign}`);
          console.log(`    - Color: ${product.color}`);
          console.log(`    - Color Value: ${product.colorValue}`);
          console.log(`    - Design ID: ${product.designId}`);
          console.log(`    - Design Image: ${product.designImage}`);
          console.log(`    - Size: ${product.size}`);
          console.log(`    - Price: ₹${product.price}`);
          console.log('');
        });
        
        console.log('---\n');
      }
    }

    // Check if any orders have the new fields
    const ordersWithColorData = await Order.find({
      'products.color': { $exists: true }
    }).count();
    
    console.log(`Total orders with color data: ${ordersWithColorData}`);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

testCustomOrderData();
