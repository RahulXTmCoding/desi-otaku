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
    console.log("DB CONNECTED FOR UPDATING PROCESSING ORDERS");
  })
  .catch((err) => {
    console.log("DB CONNECTION ERROR:", err);
  });

async function updateProcessingOrders() {
  try {
    console.log("\n=== Updating Processing Orders to Paid ===\n");
    
    // Find orders that are Processing but not Paid
    const processingOrders = await Order.find({ 
      status: { $in: ['Processing', 'Shipped', 'Delivered', 'Received'] },
      paymentStatus: { $ne: 'Paid' }
    });
    
    console.log(`Found ${processingOrders.length} orders that should be marked as Paid\n`);
    
    if (processingOrders.length === 0) {
      console.log("No orders need updating!");
      return;
    }
    
    // Update each order
    let updatedCount = 0;
    
    for (const order of processingOrders) {
      const oldPaymentStatus = order.paymentStatus;
      order.paymentStatus = 'Paid';
      await order.save();
      
      updatedCount++;
      console.log(`Updated Order ${order._id}:`);
      console.log(`  - Order Status: ${order.status}`);
      console.log(`  - Payment Status: ${oldPaymentStatus} → Paid`);
      console.log(`  - Amount: ₹${order.amount}`);
      
      // Check for custom designs
      let customCount = 0;
      order.products.forEach(item => {
        if (item.isCustom || item.customization) {
          customCount++;
        }
      });
      if (customCount > 0) {
        console.log(`  - Contains ${customCount} custom design(s)`);
      }
      console.log('');
    }
    
    console.log(`\n✅ Updated ${updatedCount} orders to Paid status`);
    
    // Show final summary
    const summary = await Order.aggregate([
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log("\n=== Payment Status Summary After Update ===");
    summary.forEach(item => {
      console.log(`${item._id || 'undefined'}: ${item.count} orders`);
    });
    
    // Check custom design orders in paid orders
    const paidOrders = await Order.find({ paymentStatus: 'Paid' });
    let customDesignCount = 0;
    let totalPaidAmount = 0;
    
    paidOrders.forEach(order => {
      totalPaidAmount += order.amount;
      order.products.forEach(item => {
        if (item.isCustom || item.customization) {
          customDesignCount++;
        }
      });
    });
    
    console.log(`\n✅ Analytics Summary:`);
    console.log(`  - Total Paid Orders: ${paidOrders.length}`);
    console.log(`  - Total Revenue: ₹${totalPaidAmount}`);
    console.log(`  - Custom Design Products: ${customDesignCount}`);
    console.log("\nAnalytics should now show data! Refresh your admin analytics page.");
    
  } catch (error) {
    console.error("Update Error:", error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the update
updateProcessingOrders();
