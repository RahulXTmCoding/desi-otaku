require("dotenv").config();
const mongoose = require("mongoose");
const { Order } = require("./models/order");

// Connect to MongoDB
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("✓ Connected to MongoDB");
    testSimpleOrder();
  })
  .catch((err) => {
    console.error("✗ MongoDB connection error:", err);
    process.exit(1);
  });

async function testSimpleOrder() {
  try {
    console.log("\n=== Testing Simple Order Creation ===\n");

    // Create a simple order without product reference
    const simpleOrder = new Order({
      products: [{
        // No product ID - simulating custom design
        name: "Custom T-Shirt Design",
        count: 1,
        price: 799,
        size: "L",
        isCustom: true,
        customDesign: "My Custom Design"
      }],
      transaction_id: `SIMPLE-TEST-${Date.now()}`,
      amount: 799,
      address: "Test Address",
      status: "Received",
      // For now, we'll add a dummy user ID
      user: "507f1f77bcf86cd799439011", // Dummy ObjectId
      shipping: {
        name: "Test User",
        phone: "1234567890",
        pincode: "400001",
        city: "Mumbai",
        state: "Maharashtra",
        shippingCost: 60
      }
    });

    console.log("Attempting to save order...");
    const savedOrder = await simpleOrder.save();
    console.log("✓ Order saved successfully!");
    console.log("Order ID:", savedOrder._id);
    console.log("Products:", savedOrder.products);

    // Clean up
    await Order.deleteOne({ _id: savedOrder._id });
    console.log("✓ Test order cleaned up");

  } catch (error) {
    console.error("\n✗ Test failed:", error.message);
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`  - ${key}: ${error.errors[key].message}`);
      });
    }
  } finally {
    mongoose.disconnect();
    console.log("\n✓ Disconnected from MongoDB");
  }
}
