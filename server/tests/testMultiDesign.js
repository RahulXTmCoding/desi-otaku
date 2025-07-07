require("dotenv").config();
const mongoose = require("mongoose");
const Order = require("./models/order");

// Test data for multi-design custom product
const testOrderData = {
  products: [
    {
      // Regular product
      product: "507f1f77bcf86cd799439011",
      name: "Basic T-Shirt",
      count: 1,
      price: 499,
      size: "M"
    },
    {
      // Custom product with front and back designs
      name: "Custom T-Shirt - Front & Back Design",
      count: 1,
      price: 799, // 499 base + 150 front + 150 back
      size: "L",
      isCustom: true,
      category: "custom",
      color: "Black",
      colorValue: "#000000",
      // New customization structure
      customization: {
        frontDesign: {
          designId: "design123",
          designImage: "https://example.com/front-design.jpg",
          position: "center",
          price: 150
        },
        backDesign: {
          designId: "design456",
          designImage: "https://example.com/back-design.jpg",
          position: "center-bottom",
          price: 150
        }
      }
    }
  ],
  transaction_id: "test_multi_design_123",
  amount: 1298,
  subtotal: 1298,
  status: "Received",
  address: "Test Address, Mumbai 400001",
  shipping: {
    name: "Test User",
    phone: "9876543210",
    pincode: "400001",
    city: "Mumbai",
    state: "Maharashtra",
    shippingCost: 0
  },
  guestInfo: {
    id: "guest_test_123",
    name: "Test Guest",
    email: "test@example.com",
    phone: "9876543210"
  }
};

async function testMultiDesignOrder() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Create test order
    const order = new Order.Order(testOrderData);
    const savedOrder = await order.save();
    console.log("\n✅ Order created successfully!");
    console.log("Order ID:", savedOrder._id);

    // Retrieve and verify the order
    const retrievedOrder = await Order.Order.findById(savedOrder._id);
    console.log("\n📦 Order Details:");
    console.log("- Total Products:", retrievedOrder.products.length);
    
    // Check custom product
    const customProduct = retrievedOrder.products.find(p => p.isCustom);
    if (customProduct && customProduct.customization) {
      console.log("\n🎨 Custom Product Details:");
      console.log("- Product Name:", customProduct.name);
      console.log("- Color:", customProduct.color);
      console.log("- Size:", customProduct.size);
      console.log("- Total Price:", customProduct.price);
      
      if (customProduct.customization.frontDesign) {
        console.log("\n👕 Front Design:");
        console.log("  - Design ID:", customProduct.customization.frontDesign.designId);
        console.log("  - Position:", customProduct.customization.frontDesign.position);
        console.log("  - Price:", customProduct.customization.frontDesign.price);
      }
      
      if (customProduct.customization.backDesign) {
        console.log("\n👕 Back Design:");
        console.log("  - Design ID:", customProduct.customization.backDesign.designId);
        console.log("  - Position:", customProduct.customization.backDesign.position);
        console.log("  - Price:", customProduct.customization.backDesign.price);
      }
    }

    // Test querying orders with multi-design products
    const ordersWithCustomDesigns = await Order.Order.find({
      "products.customization": { $exists: true }
    });
    console.log("\n📊 Orders with custom designs:", ordersWithCustomDesigns.length);

    // Clean up - delete test order
    await Order.Order.findByIdAndDelete(savedOrder._id);
    console.log("\n🗑️  Test order deleted");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

// Run the test
testMultiDesignOrder();
