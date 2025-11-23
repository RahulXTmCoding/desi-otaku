const mongoose = require("mongoose");
const Product = require("./models/product");
const Category = require("./models/category");
const ProductType = require("./models/productType");
require("dotenv").config();

mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
}).then(() => {
  console.log("DB CONNECTED");
  testFilters();
}).catch((err) => {
  console.log("DB CONNECTION ERROR:", err);
});


async function testFilters() {
  try {
    // Get a sample category and product type
    const category = await Category.findOne();
    const productType = await ProductType.findOne();
    
    if (!category || !productType) {
      console.log("Please run seed scripts first to create categories and product types");
      process.exit(1);
    }
    
    // Create test products with different stock levels
    const testProducts = [
      {
        name: "In Stock All Sizes Product",
        description: "Test product with all sizes in stock",
        price: 999,
        category: category._id,
        productType: productType._id,
        sizeStock: { S: 10, M: 15, L: 20, XL: 5, XXL: 8 },
        availableSizes: ['S', 'M', 'L', 'XL', 'XXL']
      },
      {
        name: "Partial Stock Product",
        description: "Test product with only some sizes in stock",
        price: 1499,
        category: category._id,
        productType: productType._id,
        sizeStock: { S: 0, M: 5, L: 0, XL: 10, XXL: 0 },
        availableSizes: ['S', 'M', 'L', 'XL', 'XXL']
      },
      {
        name: "Out of Stock Product",
        description: "Test product with no stock",
        price: 1999,
        category: category._id,
        productType: productType._id,
        sizeStock: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
        availableSizes: ['S', 'M', 'L', 'XL', 'XXL']
      },
      {
        name: "Limited Sizes Product",
        description: "Test product with limited size options",
        price: 799,
        category: category._id,
        productType: productType._id,
        sizeStock: { S: 5, M: 10, L: 8 },
        availableSizes: ['S', 'M', 'L']
      }
    ];
    
    // Clear existing test products
    await Product.deleteMany({ name: { $regex: /^(In Stock All Sizes|Partial Stock|Out of Stock|Limited Sizes)/ } });
    
    // Create test products
    for (const productData of testProducts) {
      const product = new Product(productData);
      await product.save();
      console.log(`Created: ${product.name} - Total Stock: ${product.totalStock}`);
    }
    
    console.log("\n=== Testing Filters ===");
    
    // Test 1: Price range filter
    console.log("\n1. Testing price range filter (500-1000):");
    const priceFiltered = await Product.find({
      isDeleted: { $ne: true },
      price: { $gte: 500, $lte: 1000 }
    }).select('name price totalStock');
    console.log("Found:", priceFiltered.map(p => `${p.name} - ₹${p.price}`));
    
    // Test 2: Size filter (products that have size 'M' available)
    console.log("\n2. Testing size filter (Size M):");
    const sizeFiltered = await Product.find({
      isDeleted: { $ne: true },
      availableSizes: { $in: ['M'] }
    }).select('name availableSizes sizeStock');
    console.log("Found:", sizeFiltered.map(p => 
      `${p.name} - M stock: ${p.sizeStock.M}`
    ));
    
    // Test 3: Availability filter - In stock
    console.log("\n3. Testing availability filter (In Stock):");
    const inStockFiltered = await Product.find({
      isDeleted: { $ne: true },
      totalStock: { $gt: 0 }
    }).select('name totalStock');
    console.log("Found:", inStockFiltered.map(p => 
      `${p.name} - Total stock: ${p.totalStock}`
    ));
    
    // Test 4: Availability filter - Out of stock
    console.log("\n4. Testing availability filter (Out of Stock):");
    const outOfStockFiltered = await Product.find({
      isDeleted: { $ne: true },
      totalStock: { $eq: 0 }
    }).select('name totalStock');
    console.log("Found:", outOfStockFiltered.map(p => 
      `${p.name} - Total stock: ${p.totalStock}`
    ));
    
    // Test 5: Combined filters - Price + Size + In Stock
    console.log("\n5. Testing combined filters (Price < 1500 + Size L + In Stock):");
    const combinedFiltered = await Product.find({
      isDeleted: { $ne: true },
      price: { $lt: 1500 },
      availableSizes: { $in: ['L'] },
      totalStock: { $gt: 0 }
    }).select('name price availableSizes totalStock sizeStock');
    console.log("Found:", combinedFiltered.map(p => 
      `${p.name} - ₹${p.price} - L stock: ${p.sizeStock.L}`
    ));
    
    // Test 6: Multiple sizes filter
    console.log("\n6. Testing multiple sizes filter (XL or XXL):");
    const multipleSizesFiltered = await Product.find({
      isDeleted: { $ne: true },
      availableSizes: { $in: ['XL', 'XXL'] }
    }).select('name availableSizes sizeStock');
    console.log("Found:", multipleSizesFiltered.map(p => 
      `${p.name} - XL: ${p.sizeStock.XL || 0}, XXL: ${p.sizeStock.XXL || 0}`
    ));
    
    console.log("\n=== Test Complete ===");
    
  } catch (error) {
    console.error("Test error:", error);
  } finally {
    mongoose.connection.close();
  }
}
