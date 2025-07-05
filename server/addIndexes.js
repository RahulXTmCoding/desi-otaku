const mongoose = require("mongoose");
require("dotenv").config();

// Connect to database
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("DB CONNECTED FOR INDEX MIGRATION");
  })
  .catch((err) => {
    console.log("DB CONNECTION ERROR:", err);
  });

// Import models to ensure indexes are created
const Product = require("./models/product");
const { Order } = require("./models/order");
const Design = require("./models/design");
const User = require("./models/user");

async function addIndexes() {
  console.log("Starting index creation...");
  
  try {
    // Ensure all indexes are created
    console.log("Creating Product indexes...");
    await Product.ensureIndexes();
    
    console.log("Creating Order indexes...");
    await Order.ensureIndexes();
    
    console.log("Creating Design indexes...");
    await Design.ensureIndexes();
    
    console.log("Creating User indexes...");
    await User.ensureIndexes();
    
    // List all indexes for verification
    console.log("\n=== Product Indexes ===");
    const productIndexes = await Product.collection.getIndexes();
    console.log(JSON.stringify(productIndexes, null, 2));
    
    console.log("\n=== Order Indexes ===");
    const orderIndexes = await Order.collection.getIndexes();
    console.log(JSON.stringify(orderIndexes, null, 2));
    
    console.log("\n=== Design Indexes ===");
    const designIndexes = await Design.collection.getIndexes();
    console.log(JSON.stringify(designIndexes, null, 2));
    
    console.log("\n=== User Indexes ===");
    const userIndexes = await User.collection.getIndexes();
    console.log(JSON.stringify(userIndexes, null, 2));
    
    console.log("\n✅ All indexes created successfully!");
    
  } catch (error) {
    console.error("Error creating indexes:", error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the migration
addIndexes();
