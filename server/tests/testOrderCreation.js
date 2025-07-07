require("dotenv").config();
const mongoose = require("mongoose");
const { Order } = require("./models/order");
const User = require("./models/user");
const Product = require("./models/product");

// Connect to MongoDB
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("✓ Connected to MongoDB");
    testOrderCreation();
  })
  .catch((err) => {
    console.error("✗ MongoDB connection error:", err);
    process.exit(1);
  });

async function testOrderCreation() {
  try {
    console.log("\n=== Testing Order Creation ===\n");

    // Find a test user
    const testUser = await User.findOne({ email: "test@example.com" });
    if (!testUser) {
      console.log("✗ No test user found. Creating one...");
      const newUser = new User({
        name: "Test User",
        email: "test@example.com",
        password: "test123"
      });
      await newUser.save();
      console.log("✓ Test user created");
    }

    // Find a real product
    const realProduct = await Product.findOne();
    
    // Test 1: Create order with regular product
    if (realProduct) {
      console.log("\n1. Creating order with regular product...");
      const regularOrder = new Order({
        products: [{
          product: realProduct._id,
          name: realProduct.name,
          count: 1,
          price: realProduct.price,
          size: "M",
          isCustom: false
        }],
        transaction_id: `TEST-TXN-${Date.now()}`,
        amount: realProduct.price,
        address: "123 Test Street, Test City, Test State - 400001",
        user: testUser._id,
        shipping: {
          name: "Test User",
          phone: "+91 9876543210",
          pincode: "400001",
          city: "Mumbai",
          state: "Maharashtra",
          shippingCost: 60
        }
      });

      const savedRegularOrder = await regularOrder.save();
      console.log("✓ Regular product order created:", savedRegularOrder._id);
    }

    // Test 2: Create order with custom design (no product ID)
    console.log("\n2. Creating order with custom design...");
    const customOrder = new Order({
      products: [{
        // No product ID for custom design
        name: "Custom T-Shirt Design",
        count: 1,
        price: 799,
        size: "L",
        isCustom: true,
        customDesign: "My Awesome Design"
      }],
      transaction_id: `TEST-CUSTOM-TXN-${Date.now()}`,
      amount: 799,
      address: "456 Custom Street, Design City, Art State - 560001",
      user: testUser._id,
      shipping: {
        name: "Test User",
        phone: "+91 9876543210",
        pincode: "560001",
        city: "Bangalore",
        state: "Karnataka",
        shippingCost: 80
      }
    });

    const savedCustomOrder = await customOrder.save();
    console.log("✓ Custom design order created:", savedCustomOrder._id);

    // Test 3: Create mixed order (both regular and custom)
    console.log("\n3. Creating mixed order...");
    const mixedOrder = new Order({
      products: [
        {
          product: realProduct ? realProduct._id : undefined,
          name: realProduct ? realProduct.name : "Regular T-Shirt",
          count: 1,
          price: 599,
          size: "M",
          isCustom: false
        },
        {
          // No product ID for custom design
          name: "Custom Anime Design",
          count: 2,
          price: 899,
          size: "XL",
          isCustom: true,
          customDesign: "Naruto Custom Art"
        }
      ],
      transaction_id: `TEST-MIXED-TXN-${Date.now()}`,
      amount: 599 + (899 * 2),
      address: "789 Mixed Street, Combo City, Hybrid State - 110001",
      user: testUser._id,
      shipping: {
        name: "Test User",
        phone: "+91 9876543210",
        pincode: "110001",
        city: "Delhi",
        state: "Delhi",
        shippingCost: 100
      }
    });

    const savedMixedOrder = await mixedOrder.save();
    console.log("✓ Mixed order created:", savedMixedOrder._id);

    // Verify orders
    console.log("\n4. Verifying saved orders...");
    const orders = await Order.find({ user: testUser._id })
      .populate('products.product', 'name')
      .populate('user', 'name email');
    
    console.log(`✓ Found ${orders.length} orders for test user`);
    orders.forEach((order, index) => {
      console.log(`\n  Order ${index + 1} (${order._id}):`);
      console.log(`  - Amount: ₹${order.amount}`);
      console.log(`  - Products: ${order.products.length}`);
      order.products.forEach(p => {
        console.log(`    • ${p.name} (${p.isCustom ? 'Custom' : 'Regular'}) - ₹${p.price} x ${p.count}`);
      });
    });

    console.log("\n=== All tests passed! ===");

    // Clean up test orders
    console.log("\nCleaning up test orders...");
    await Order.deleteMany({ 
      transaction_id: { $regex: /^TEST-/ }
    });
    console.log("✓ Test orders removed");

  } catch (error) {
    console.error("\n✗ Test failed:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    mongoose.disconnect();
    console.log("\n✓ Disconnected from MongoDB");
  }
}
