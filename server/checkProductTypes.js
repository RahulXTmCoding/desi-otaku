const mongoose = require("mongoose");
const Product = require("./models/product");
require("dotenv").config();

const checkProductTypes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    });
    
    console.log("Connected to MongoDB");
    
    // Get all unique productType values
    const products = await Product.find({});
    const productTypes = {};
    
    products.forEach(product => {
      const type = product.productType || 'null/undefined';
      if (!productTypes[type]) {
        productTypes[type] = 0;
      }
      productTypes[type]++;
    });
    
    console.log("\nCurrent productType values in database:");
    console.log("=====================================");
    Object.entries(productTypes).forEach(([type, count]) => {
      console.log(`"${type}": ${count} products`);
    });
    
    // Show some sample products
    console.log("\nSample products:");
    console.log("================");
    const samples = await Product.find({}).limit(10);
    samples.forEach(product => {
      console.log(`- ${product.name}: productType = "${product.productType}"`);
    });
    
  } catch (error) {
    console.error("Check failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\nDatabase connection closed");
  }
};

// Run the check
console.log("Checking productType values in database...");
checkProductTypes();
