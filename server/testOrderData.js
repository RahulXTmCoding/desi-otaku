require("dotenv").config();
const mongoose = require("mongoose");
const { Order } = require("./models/order");
const Product = require("./models/product");

mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("DB CONNECTED");
  checkOrderData();
}).catch(err => {
  console.error("DB CONNECTION ERROR:", err);
  process.exit(1);
});

async function checkOrderData() {
  try {
    // Find recent orders (don't populate to avoid issues)
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log(`\nFound ${orders.length} recent orders\n`);
    
    orders.forEach((order, orderIndex) => {
      console.log(`\n========== ORDER ${orderIndex + 1} ==========`);
      console.log(`Order ID: ${order._id}`);
      console.log(`Created: ${order.createdAt}`);
      console.log(`Status: ${order.status}`);
      console.log(`\nProducts (${order.products.length}):`);
      
      order.products.forEach((product, productIndex) => {
        console.log(`\n  --- Product ${productIndex + 1} ---`);
        console.log(`  Name: ${product.name}`);
        console.log(`  Has Product Ref: ${!!product.product}`);
        console.log(`  Product ID: ${product.product?._id || 'N/A'}`);
        console.log(`  Is Custom: ${product.isCustom || false}`);
        console.log(`  Color: ${product.color || 'N/A'}`);
        console.log(`  Size: ${product.size || 'N/A'}`);
        console.log(`  Price: ₹${product.price}`);
        console.log(`  Count: ${product.count}`);
        
        // Check for custom design fields
        if (product.designId || product.designImage || product.customDesign) {
          console.log(`  \n  Custom Design Info:`);
          console.log(`    Design ID: ${product.designId || 'N/A'}`);
          console.log(`    Design Image: ${product.designImage || 'N/A'}`);
          console.log(`    Custom Design Name: ${product.customDesign || 'N/A'}`);
        }
        
        // Check for new customization structure
        if (product.customization) {
          console.log(`  \n  Customization:`);
          if (product.customization.frontDesign) {
            console.log(`    Front Design:`);
            console.log(`      - ID: ${product.customization.frontDesign.designId}`);
            console.log(`      - Image: ${product.customization.frontDesign.designImage}`);
            console.log(`      - Position: ${product.customization.frontDesign.position}`);
            console.log(`      - Price: ₹${product.customization.frontDesign.price}`);
          }
          if (product.customization.backDesign) {
            console.log(`    Back Design:`);
            console.log(`      - ID: ${product.customization.backDesign.designId}`);
            console.log(`      - Image: ${product.customization.backDesign.designImage}`);
            console.log(`      - Position: ${product.customization.backDesign.position}`);
            console.log(`      - Price: ₹${product.customization.backDesign.price}`);
          }
        }
        
        // Summary
        const isActuallyCustom = !product.product && (
          product.isCustom || 
          product.designId || 
          product.customDesign ||
          product.customization
        );
        console.log(`  \n  >> Should show as custom: ${isActuallyCustom}`);
      });
    });
    
  } catch (error) {
    console.error("Error checking order data:", error);
  } finally {
    mongoose.connection.close();
  }
}
