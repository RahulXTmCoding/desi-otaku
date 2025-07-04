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

const { Order } = require("./models/order");
const User = require("./models/user");
const Product = require("./models/product");

async function testCustomOrder() {
  try {
    console.log("\n🧪 Testing Custom Product Order Creation\n");

    // Find a user
    const user = await User.findOne();
    if (!user) {
      console.log("❌ No user found");
      return;
    }
    console.log(`✅ Found user: ${user.name}`);

    // Find a regular product for comparison
    const regularProduct = await Product.findOne({ isDeleted: { $ne: true } });
    if (!regularProduct) {
      console.log("❌ No product found");
      return;
    }
    console.log(`✅ Found product: ${regularProduct.name}`);

    // Create test order with both regular and custom products
    const orderData = {
      products: [
        {
          product: regularProduct._id,
          name: regularProduct.name,
          price: regularProduct.price,
          count: 1,
          size: "M"
        },
        {
          // Custom product - no product ID
          isCustom: true,
          customDesign: "One Piece Custom Design",
          name: "Custom T-Shirt - One Piece",
          price: 659, // This will be recalculated server-side
          count: 1,
          size: "XL"
        }
      ],
      transaction_id: "test_" + Date.now(),
      amount: 1209, // This will be recalculated
      address: "Test Address, Bangalore, Karnataka - 560095",
      status: "Received",
      shipping: {
        name: user.name,
        phone: "9999999999",
        pincode: "560095",
        city: "Bangalore",
        state: "Karnataka",
        country: "India",
        weight: 0.6,
        shippingCost: 0,
        courier: "Standard Delivery"
      },
      user: user._id
    };

    console.log("\n📝 Creating order with mixed products...");
    const order = new Order(orderData);
    
    // Save order
    const savedOrder = await order.save();
    console.log("✅ Order created successfully!");
    console.log(`   Order ID: ${savedOrder._id}`);
    console.log(`   Total Amount: ₹${savedOrder.amount}`);
    console.log("\n📦 Products in order:");
    savedOrder.products.forEach((p, index) => {
      console.log(`   ${index + 1}. ${p.name}`);
      console.log(`      - Price: ₹${p.price}`);
      console.log(`      - Size: ${p.size}`);
      console.log(`      - Custom: ${p.isCustom ? 'Yes' : 'No'}`);
      if (p.product) {
        console.log(`      - Product ID: ${p.product}`);
      } else {
        console.log(`      - Custom Design: ${p.customDesign}`);
      }
    });

    // Verify order can be retrieved
    console.log("\n📝 Retrieving order...");
    const retrievedOrder = await Order.findById(savedOrder._id)
      .populate('products.product')
      .populate('user');
    
    console.log("✅ Order retrieved successfully!");
    console.log("   Products with details:");
    retrievedOrder.products.forEach((p, index) => {
      if (p.product) {
        console.log(`   ${index + 1}. ${p.product.name} (from DB)`);
      } else {
        console.log(`   ${index + 1}. ${p.name} (custom)`);
      }
    });

    // Clean up - delete the test order
    await Order.findByIdAndDelete(savedOrder._id);
    console.log("\n🧹 Test order cleaned up");

    console.log("\n✅ All tests passed! Custom orders work correctly.");
    
  } catch (error) {
    console.error("\n❌ Test failed:", error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testCustomOrder();
