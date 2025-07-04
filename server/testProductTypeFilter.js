const mongoose = require("mongoose");
const Product = require("./models/product");
const ProductType = require("./models/productType");
require("dotenv").config();

const testProductTypeFilter = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log("Connected to MongoDB");
    
    // 1. First, let's see what ProductTypes we have
    console.log("\n1. ProductTypes in database:");
    const productTypes = await ProductType.find({});
    productTypes.forEach(pt => {
      console.log(`- ${pt.displayName} (ID: ${pt._id}, value: ${pt.value})`);
    });
    
    // 2. Let's check some products and their productType field
    console.log("\n2. Sample products and their productType:");
    const sampleProducts = await Product.find({}).limit(10);
    
    // Check raw values without populate
    console.log("\nRaw productType values:");
    for (const p of sampleProducts) {
      const rawDoc = await Product.findById(p._id).lean();
      console.log(`- ${p.name}: ${JSON.stringify(rawDoc.productType)} (type: ${typeof rawDoc.productType})`);
    }
    
    // Now check with populate
    console.log("\nPopulated values:");
    const populatedProducts = await Product.find({}).limit(10).populate('productType');
    populatedProducts.forEach(p => {
      if (p.productType) {
        if (typeof p.productType === 'object' && p.productType._id) {
          console.log(`- ${p.name}: ${p.productType.displayName} (ObjectId reference)`);
        } else {
          console.log(`- ${p.name}: "${p.productType}" (string value)`);
        }
      } else {
        console.log(`- ${p.name}: No productType`);
      }
    });
    
    // 3. Test filtering with a ProductType ID
    if (productTypes.length > 0) {
      const testTypeId = productTypes[0]._id.toString();
      console.log(`\n3. Testing filter with ProductType ID: ${testTypeId}`);
      
      // Build the filter as the controller does
      const filter = {};
      const orConditions = [
        { productType: testTypeId },
        { productType: productTypes[0].value },
        { productType: productTypes[0].displayName },
        { productType: productTypes[0].displayName.toLowerCase() },
        { productType: productTypes[0].displayName.toLowerCase().replace(/\s+/g, '-') },
        { productType: productTypes[0].displayName.toLowerCase().replace(/\s+/g, '') }
      ];
      
      if (productTypes[0].displayName === 'T-Shirt') {
        orConditions.push(
          { productType: 't-shirt' },
          { productType: 'tshirt' },
          { productType: 'Tshirt' },
          { productType: 'TShirt' }
        );
      }
      
      filter.$or = orConditions;
      
      console.log("Filter object:", JSON.stringify(filter, null, 2));
      
      const filteredProducts = await Product.find(filter).limit(5);
      console.log(`\nFound ${filteredProducts.length} products with this filter`);
      filteredProducts.forEach(p => {
        console.log(`- ${p.name} (productType: ${p.productType})`);
      });
    }
    
    // 4. Test the actual endpoint logic
    console.log("\n4. Testing combined search and productType filter:");
    const searchFilter = {
      $or: [
        { name: { $regex: 'shirt', $options: 'i' } },
        { description: { $regex: 'shirt', $options: 'i' } }
      ]
    };
    
    if (productTypes.length > 0) {
      const productTypeFilter = {
        $or: [
          { productType: productTypes[0]._id.toString() },
          { productType: 'tshirt' },
          { productType: 't-shirt' }
        ]
      };
      
      // Combine filters as the controller does
      const combinedFilter = {
        $and: [
          { $or: searchFilter.$or },
          { $or: productTypeFilter.$or }
        ]
      };
      
      console.log("Combined filter:", JSON.stringify(combinedFilter, null, 2));
      
      const results = await Product.find(combinedFilter).limit(5);
      console.log(`\nFound ${results.length} products with combined filter`);
    }
    
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\nDatabase connection closed");
  }
};

// Run the test
console.log("Testing ProductType filter...");
testProductTypeFilter();
