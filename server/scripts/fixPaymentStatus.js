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
    console.log("DB CONNECTED FOR PAYMENT STATUS FIX");
  })
  .catch((err) => {
    console.log("DB CONNECTION ERROR:", err);
  });

async function fixPaymentStatus() {
  try {
    console.log("\n=== Fixing Order Payment Status ===\n");
    
    // Find orders without paymentStatus
    const ordersWithoutPaymentStatus = await Order.find({ 
      paymentStatus: { $exists: false } 
    });
    
    console.log(`Found ${ordersWithoutPaymentStatus.length} orders without paymentStatus field\n`);
    
    if (ordersWithoutPaymentStatus.length === 0) {
      console.log("All orders already have paymentStatus field!");
      return;
    }
    
    // Update orders based on their status
    let updatedCount = 0;
    
    for (const order of ordersWithoutPaymentStatus) {
      // Determine payment status based on order status
      let paymentStatus = 'Pending';
      
      // If order is in any of these statuses, consider it paid
      if (['Delivered', 'Shipped', 'Processing', 'Received'].includes(order.status)) {
        paymentStatus = 'Paid';
      } else if (order.status === 'Cancelled') {
        paymentStatus = 'Failed';
      }
      
      // If order has a transaction_id, it's likely paid
      if (order.transaction_id && order.transaction_id !== '') {
        paymentStatus = 'Paid';
      }
      
      // Update the order
      order.paymentStatus = paymentStatus;
      await order.save();
      
      updatedCount++;
      console.log(`Updated Order ${order._id}: paymentStatus = ${paymentStatus} (status: ${order.status})`);
    }
    
    console.log(`\n✅ Updated ${updatedCount} orders with payment status`);
    
    // Show summary
    const summary = await Order.aggregate([
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log("\n=== Payment Status Summary After Fix ===");
    summary.forEach(item => {
      console.log(`${item._id || 'undefined'}: ${item.count} orders`);
    });
    
    // Check custom design orders specifically
    const paidOrders = await Order.find({ paymentStatus: 'Paid' });
    let customDesignCount = 0;
    
    paidOrders.forEach(order => {
      order.products.forEach(item => {
        if (item.isCustom || item.customization) {
          customDesignCount++;
        }
      });
    });
    
    console.log(`\n✅ Found ${customDesignCount} custom design products in paid orders`);
    console.log("\nAnalytics should now show data! Try refreshing the admin analytics page.");
    
  } catch (error) {
    console.error("Fix Error:", error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the fix
fixPaymentStatus();
