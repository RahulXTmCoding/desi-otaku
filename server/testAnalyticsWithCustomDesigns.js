const mongoose = require("mongoose");
const { Order } = require("./models/order");
require("dotenv").config();

// Connect to database
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("DB CONNECTED FOR ANALYTICS TEST");
  })
  .catch((err) => {
    console.log("DB CONNECTION ERROR:", err);
  });

async function testAnalytics() {
  try {
    console.log("\n=== Testing Analytics with Custom Design Orders ===\n");
    
    // Get some sample orders
    const orders = await Order.find({ paymentStatus: 'Paid' })
      .populate('products.product')
      .limit(10);
    
    console.log(`Found ${orders.length} paid orders\n`);
    
    // Check for custom design orders
    let customDesignCount = 0;
    let regularProductCount = 0;
    let totalRevenue = 0;
    let customRevenue = 0;
    
    orders.forEach(order => {
      console.log(`Order ${order._id}:`);
      order.products.forEach(item => {
        totalRevenue += (item.price * (item.count || 1));
        
        if (item.isCustom || item.customization) {
          customDesignCount++;
          customRevenue += (item.price * (item.count || 1));
          console.log(`  - CUSTOM DESIGN: ${item.name || 'Custom T-Shirt'} - ₹${item.price}`);
          if (item.customization) {
            if (item.customization.frontDesign?.designImage) {
              console.log(`    Front Design: ${item.customization.frontDesign.designImage.substring(0, 50)}...`);
            }
            if (item.customization.backDesign?.designImage) {
              console.log(`    Back Design: ${item.customization.backDesign.designImage.substring(0, 50)}...`);
            }
          }
        } else if (item.product) {
          regularProductCount++;
          console.log(`  - Regular Product: ${item.product.name} - ₹${item.price}`);
        } else {
          console.log(`  - Unknown item type: ${JSON.stringify(item)}`);
        }
      });
      console.log('');
    });
    
    console.log("\n=== Summary ===");
    console.log(`Custom Design Products: ${customDesignCount}`);
    console.log(`Regular Products: ${regularProductCount}`);
    console.log(`Total Revenue: ₹${totalRevenue}`);
    console.log(`Custom Design Revenue: ₹${customRevenue} (${((customRevenue/totalRevenue)*100).toFixed(1)}%)`);
    
    // Test the analytics endpoints
    console.log("\n=== Testing Analytics Endpoints ===");
    console.log("To test the analytics, make sure your server is running and visit:");
    console.log("http://localhost:8000/api/analytics/dashboard?period=month");
    console.log("\nThe response should now include:");
    console.log("1. 'Custom Design T-Shirts' in topProducts");
    console.log("2. 'Custom Designs' in categoryBreakdown");
    console.log("3. 'Custom T-Shirt' in productTypeBreakdown");
    
  } catch (error) {
    console.error("Test Error:", error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testAnalytics();
