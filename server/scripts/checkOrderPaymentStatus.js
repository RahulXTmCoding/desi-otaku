const mongoose = require("mongoose");
const { Order } = require("./models/order");
require("dotenv").config();

// Connect to database
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB CONNECTED FOR PAYMENT STATUS CHECK");
  })
  .catch((err) => {
    console.log("DB CONNECTION ERROR:", err);
  });

async function checkPaymentStatus() {
  try {
    console.log("\n=== Checking Order Payment Status ===\n");
    
    // Get all orders
    const allOrders = await Order.find({}).limit(20);
    console.log(`Total orders found: ${allOrders.length}\n`);
    
    // Count by payment status
    const statusCounts = {
      'Paid': 0,
      'Pending': 0,
      'Failed': 0,
      'Refunded': 0,
      'undefined': 0
    };
    
    allOrders.forEach(order => {
      const status = order.paymentStatus || 'undefined';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      
      console.log(`Order ${order._id}:`);
      console.log(`  - Payment Status: ${order.paymentStatus || 'NOT SET'}`);
      console.log(`  - Order Status: ${order.status}`);
      console.log(`  - Amount: ₹${order.amount}`);
      console.log(`  - Created: ${order.createdAt}`);
      
      // Check for custom designs
      let hasCustom = false;
      order.products.forEach(item => {
        if (item.isCustom || item.customization) {
          hasCustom = true;
        }
      });
      console.log(`  - Has Custom Design: ${hasCustom ? 'YES' : 'NO'}`);
      console.log('');
    });
    
    console.log("\n=== Payment Status Summary ===");
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`${status}: ${count} orders`);
    });
    
    // Fix orders without payment status
    console.log("\n=== Fixing Orders Without Payment Status ===");
    const ordersWithoutPaymentStatus = await Order.find({ paymentStatus: { $exists: false } });
    console.log(`Found ${ordersWithoutPaymentStatus.length} orders without paymentStatus field`);
    
    if (ordersWithoutPaymentStatus.length > 0) {
      console.log("\nWould you like to update these orders to have paymentStatus = 'Paid'?");
      console.log("Run: node server/fixPaymentStatus.js");
    }
    
  } catch (error) {
    console.error("Check Error:", error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the check
checkPaymentStatus();
