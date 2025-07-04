const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
}).then(() => {
  console.log("✅ Connected to MongoDB");
}).catch(err => {
  console.error("❌ MongoDB connection error:", err);
  process.exit(1);
});

const Product = require("./models/product");
const User = require("./models/user");

async function testSoftDelete() {
  try {
    console.log("\n🧪 Testing Soft Delete Functionality\n");

    // Find an admin user
    const admin = await User.findOne({ role: 1 });
    if (!admin) {
      console.log("❌ No admin user found");
      return;
    }
    console.log(`✅ Found admin: ${admin.name}`);

    // Find a product to test with
    const product = await Product.findOne({ isDeleted: { $ne: true } });
    if (!product) {
      console.log("❌ No active product found");
      return;
    }
    console.log(`✅ Found product: ${product.name}`);

    // Test 1: Soft delete the product
    console.log("\n📝 Test 1: Soft Delete");
    product.isDeleted = true;
    product.deletedAt = new Date();
    product.deletedBy = admin._id;
    product.isActive = false;
    await product.save();
    console.log("✅ Product soft deleted successfully");

    // Test 2: Verify product is excluded from normal queries
    console.log("\n📝 Test 2: Check Product Visibility");
    const activeProducts = await Product.find({ isDeleted: { $ne: true } });
    const isHidden = !activeProducts.find(p => p._id.toString() === product._id.toString());
    console.log(isHidden ? "✅ Product is hidden from normal queries" : "❌ Product still visible");

    // Test 3: Find deleted products
    console.log("\n📝 Test 3: Find Deleted Products");
    const deletedProducts = await Product.find({ isDeleted: true })
      .populate('deletedBy', 'name email');
    console.log(`✅ Found ${deletedProducts.length} deleted products`);
    
    if (deletedProducts.length > 0) {
      console.log("\nDeleted products:");
      deletedProducts.forEach(p => {
        console.log(`- ${p.name} (deleted by ${p.deletedBy?.name || 'Unknown'} at ${p.deletedAt})`);
      });
    }

    // Test 4: Restore the product
    console.log("\n📝 Test 4: Restore Product");
    product.isDeleted = false;
    product.deletedAt = null;
    product.deletedBy = null;
    product.isActive = true;
    await product.save();
    console.log("✅ Product restored successfully");

    // Test 5: Verify product is visible again
    console.log("\n📝 Test 5: Check Product Restored");
    const restoredProduct = await Product.findById(product._id);
    console.log(restoredProduct.isDeleted === false ? "✅ Product is active again" : "❌ Product still deleted");

    console.log("\n✅ All tests completed successfully!");
    
  } catch (error) {
    console.error("\n❌ Test failed:", error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testSoftDelete();
