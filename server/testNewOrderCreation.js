require("dotenv").config();
const mongoose = require("mongoose");
const { Order } = require("./models/order");
const Product = require("./models/product");
const User = require("./models/user");

mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("DB CONNECTED");
  testOrderCreation();
}).catch(err => {
  console.error("DB CONNECTION ERROR:", err);
  process.exit(1);
});

async function testOrderCreation() {
  try {
    // Find a test user
    const user = await User.findOne({ email: "abc@gmail.com" });
    if (!user) {
      console.error("Test user not found");
      return;
    }

    // Find a regular product
    const regularProduct = await Product.findOne({ isDeleted: false });
    if (!regularProduct) {
      console.error("No active products found");
      return;
    }

    console.log("\n=== Creating test order with mixed products ===");

    // Create test order data
    const orderData = {
      user: user._id,
      products: [
        // Regular product (should NOT have customization)
        {
          product: regularProduct._id,
          name: regularProduct.name,
          price: regularProduct.price,
          count: 1,
          size: "L"
        },
        // Custom product with legacy structure (should use designId/designImage)
        {
          isCustom: true,
          name: "Custom T-Shirt - Legacy Design",
          price: 659,
          count: 1,
          size: "M",
          color: "Black",
          colorValue: "#000000",
          designId: "68645c1234fb87fcbd9c879e",
          designImage: "http://localhost:8000/api/design/image/68645c1234fb87fcbd9c879e",
          customDesign: "Custom T-Shirt - Legacy Design"
        },
        // Custom product with empty customization (should NOT have customization field)
        {
          isCustom: true,
          name: "Custom T-Shirt - Empty Customization",
          price: 659,
          count: 1,
          size: "XL",
          color: "White",
          colorValue: "#FFFFFF",
          customization: {
            frontDesign: {
              position: "center",
              price: 0
            },
            backDesign: {
              position: "center",
              price: 0
            }
          }
        },
        // Custom product with valid front/back design (should have full customization)
        {
          isCustom: true,
          name: "Custom T-Shirt - Front & Back",
          price: 859,
          count: 1,
          size: "L",
          color: "Navy",
          colorValue: "#000080",
          customization: {
            frontDesign: {
              designId: "68645c1234fb87fcbd9c879e",
              designImage: "http://localhost:8000/api/design/image/68645c1234fb87fcbd9c879e",
              position: "center",
              price: 150
            },
            backDesign: {
              designId: "68645c1234fb87fcbd9c879f",
              designImage: "http://localhost:8000/api/design/image/68645c1234fb87fcbd9c879f",
              position: "center-bottom",
              price: 150
            }
          }
        }
      ],
      amount: regularProduct.price + 659 + 659 + 859,
      transaction_id: "test_" + Date.now(),
      status: "Received",
      address: "Test Address, Test City",
      shipping: {
        name: user.name,
        phone: "9876543210",
        pincode: "110001",
        city: "Delhi",
        state: "Delhi",
        shippingCost: 0
      }
    };

    const order = new Order(orderData);
    const savedOrder = await order.save();

    console.log("\n=== Order Created Successfully ===");
    console.log("Order ID:", savedOrder._id);
    
    // Check each product
    console.log("\n=== Checking Product Data ===");
    savedOrder.products.forEach((product, index) => {
      console.log(`\nProduct ${index + 1}: ${product.name}`);
      console.log("- Has product ref:", !!product.product);
      console.log("- Is custom:", product.isCustom);
      console.log("- Has customization:", !!product.customization);
      
      if (product.customization) {
        console.log("- Customization details:");
        if (product.customization.frontDesign) {
          console.log("  - Front design:", {
            hasDesignId: !!product.customization.frontDesign.designId,
            hasDesignImage: !!product.customization.frontDesign.designImage
          });
        }
        if (product.customization.backDesign) {
          console.log("  - Back design:", {
            hasDesignId: !!product.customization.backDesign.designId,
            hasDesignImage: !!product.customization.backDesign.designImage
          });
        }
      }
      
      // Expected results
      const expected = getExpectedResult(index);
      const actual = {
        hasCustomization: !!product.customization,
        isCustom: product.isCustom
      };
      
      console.log(`- Expected: ${JSON.stringify(expected)}`);
      console.log(`- Actual: ${JSON.stringify(actual)}`);
      console.log(`- Result: ${JSON.stringify(expected) === JSON.stringify(actual) ? '✓ PASS' : '✗ FAIL'}`);
    });

  } catch (error) {
    console.error("Error creating test order:", error);
  } finally {
    mongoose.connection.close();
  }
}

function getExpectedResult(index) {
  switch(index) {
    case 0: // Regular product
      return { hasCustomization: false, isCustom: false };
    case 1: // Legacy custom
      return { hasCustomization: false, isCustom: true };
    case 2: // Empty customization
      return { hasCustomization: false, isCustom: true };
    case 3: // Valid front/back
      return { hasCustomization: true, isCustom: true };
    default:
      return {};
  }
}
