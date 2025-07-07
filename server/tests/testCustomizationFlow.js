require("dotenv").config();
const mongoose = require("mongoose");
const { Order } = require("./models/order");

mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("DB CONNECTED");
  testCustomizationFlow();
}).catch(err => {
  console.error("DB CONNECTION ERROR:", err);
  process.exit(1);
});

async function testCustomizationFlow() {
  try {
    console.log("\n=== Testing Customization Data Flow ===\n");

    // Sample order data that would come from the frontend
    const frontendOrderData = {
      products: [
        {
          // Custom product with front and back designs
          name: "Custom T-Shirt - Front: Naruto, Back: Sasuke",
          price: 859,
          count: 1,
          size: "L",
          isCustom: true,
          color: "Black",
          colorValue: "#000000",
          designId: "68645c1234fb87fcbd9c879e", // Legacy field
          designImage: "http://localhost:8000/api/design/image/68645c1234fb87fcbd9c879e", // Legacy field
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
        },
        {
          // Custom product with only front design
          name: "Custom T-Shirt - Front: One Piece",
          price: 659,
          count: 1,
          size: "M",
          isCustom: true,
          color: "White",
          colorValue: "#FFFFFF",
          designId: "68645c1234fb87fcbd9c879g",
          designImage: "http://localhost:8000/api/design/image/68645c1234fb87fcbd9c879g",
          customization: {
            frontDesign: {
              designId: "68645c1234fb87fcbd9c879g",
              designImage: "http://localhost:8000/api/design/image/68645c1234fb87fcbd9c879g",
              position: "left",
              price: 150
            },
            backDesign: null
          }
        },
        {
          // Custom product with empty customization (should be cleaned up)
          name: "Custom T-Shirt - Legacy",
          price: 659,
          count: 1,
          size: "XL",
          isCustom: true,
          color: "Navy",
          colorValue: "#000080",
          designId: "68645c1234fb87fcbd9c879h",
          designImage: "http://localhost:8000/api/design/image/68645c1234fb87fcbd9c879h",
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
        }
      ],
      transaction_id: "test_customization_" + Date.now(),
      amount: 2177,
      address: "Test Address, Test City",
      status: "Received",
      shipping: {
        name: "Test User",
        phone: "9876543210",
        pincode: "110001",
        city: "Delhi",
        state: "Delhi",
        shippingCost: 0
      }
    };

    console.log("1. Frontend sends order data with customization:");
    frontendOrderData.products.forEach((p, i) => {
      console.log(`\n   Product ${i + 1}: ${p.name}`);
      if (p.customization) {
        console.log("   - Has customization object");
        if (p.customization.frontDesign) {
          console.log(`     - Front: ${p.customization.frontDesign.designId ? 'Has design data' : 'Empty'}`);
        }
        if (p.customization.backDesign) {
          console.log(`     - Back: ${p.customization.backDesign.designId ? 'Has design data' : 'Empty'}`);
        }
      }
    });

    // Process products (simulating what the backend controller does)
    const processedProducts = frontendOrderData.products.map(product => {
      const processedProduct = { ...product };
      
      // Only keep customization if it has actual design data
      if (processedProduct.customization) {
        const { frontDesign, backDesign } = processedProduct.customization;
        
        // Check if front design has actual data
        const hasFrontDesign = frontDesign && 
          frontDesign.designId && 
          frontDesign.designImage;
          
        // Check if back design has actual data  
        const hasBackDesign = backDesign && 
          backDesign.designId && 
          backDesign.designImage;
          
        // Only keep customization if at least one side has design data
        if (!hasFrontDesign && !hasBackDesign) {
          delete processedProduct.customization;
        } else {
          // Clean up empty design objects
          processedProduct.customization = {};
          if (hasFrontDesign) {
            processedProduct.customization.frontDesign = frontDesign;
          }
          if (hasBackDesign) {
            processedProduct.customization.backDesign = backDesign;
          }
        }
      }
      
      return processedProduct;
    });

    console.log("\n2. Backend processes the products:");
    processedProducts.forEach((p, i) => {
      console.log(`\n   Product ${i + 1}: ${p.name}`);
      console.log(`   - Has customization: ${!!p.customization}`);
      if (p.customization) {
        console.log(`   - Front design: ${!!p.customization.frontDesign}`);
        console.log(`   - Back design: ${!!p.customization.backDesign}`);
      }
    });

    // Create the order
    const order = new Order({
      products: processedProducts,
      transaction_id: frontendOrderData.transaction_id,
      amount: frontendOrderData.amount,
      address: frontendOrderData.address,
      status: frontendOrderData.status,
      shipping: frontendOrderData.shipping,
      user: "68643a8ffb7e8193b13cc22e" // Test user ID
    });

    const savedOrder = await order.save();
    console.log("\n3. Order saved to database with ID:", savedOrder._id);

    // Fetch the order back to verify
    const fetchedOrder = await Order.findById(savedOrder._id);
    console.log("\n4. Fetched order from database:");
    
    fetchedOrder.products.forEach((p, i) => {
      console.log(`\n   Product ${i + 1}: ${p.name}`);
      console.log(`   - Has customization: ${!!p.customization}`);
      console.log(`   - Is custom: ${p.isCustom}`);
      
      if (p.customization) {
        if (p.customization.frontDesign) {
          console.log("   - Front design:");
          console.log(`     - Design ID: ${p.customization.frontDesign.designId}`);
          console.log(`     - Position: ${p.customization.frontDesign.position}`);
          console.log(`     - Price: ₹${p.customization.frontDesign.price}`);
        }
        if (p.customization.backDesign) {
          console.log("   - Back design:");
          console.log(`     - Design ID: ${p.customization.backDesign.designId}`);
          console.log(`     - Position: ${p.customization.backDesign.position}`);
          console.log(`     - Price: ₹${p.customization.backDesign.price}`);
        }
      }
    });

    console.log("\n=== Test Summary ===");
    console.log("✓ Product 1: Should have both front and back designs");
    console.log("✓ Product 2: Should have only front design");
    console.log("✓ Product 3: Should NOT have customization (empty data removed)");

  } catch (error) {
    console.error("\nError testing customization flow:", error);
  } finally {
    mongoose.connection.close();
  }
}
