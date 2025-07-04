const mongoose = require("mongoose");
const Product = require("./models/product");
const ProductType = require("./models/productType");
require("dotenv").config();

async function testProductTypes() {
  try {
    await mongoose.connect(process.env.DATABASE, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB\n");

    // Check ProductType documents
    console.log("=== ProductType Documents ===");
    const productTypes = await ProductType.find();
    productTypes.forEach(pt => {
      console.log(`ID: ${pt._id}, Name: ${pt.name}, DisplayName: ${pt.displayName}`);
    });

    // Check a few products to see their productType field
    console.log("\n=== Sample Products ===");
    const products = await Product.find().limit(5).select('name productType');
    
    for (const product of products) {
      console.log(`\nProduct: ${product.name}`);
      console.log(`ProductType value: ${product.productType}`);
      console.log(`ProductType type: ${typeof product.productType}`);
      
      // Check if it's an ObjectId
      if (product.productType && mongoose.Types.ObjectId.isValid(product.productType)) {
        console.log("Valid ObjectId: Yes");
        try {
          const pt = await ProductType.findById(product.productType);
          console.log(`Resolved to: ${pt ? pt.displayName : 'Not found'}`);
        } catch (e) {
          console.log("Error resolving ProductType");
        }
      } else {
        console.log("Valid ObjectId: No (string value)");
      }
    }

    // Count products by type
    console.log("\n=== Product Counts by Type ===");
    const stringTypes = await Product.distinct('productType', { 
      productType: { $type: 'string' } 
    });
    console.log("String productType values found:", stringTypes);
    
    const objectIdCount = await Product.countDocuments({ 
      productType: { $type: 'objectId' } 
    });
    console.log("Products with ObjectId productType:", objectIdCount);
    
    const stringCount = await Product.countDocuments({ 
      productType: { $type: 'string' } 
    });
    console.log("Products with string productType:", stringCount);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

testProductTypes();
