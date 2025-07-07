require("dotenv").config();
const mongoose = require("mongoose");
const Cart = require("./models/cart");
const User = require("./models/user");
const Product = require("./models/product");

// Connect to MongoDB
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB CONNECTED FOR CART TESTING");
  })
  .catch((err) => {
    console.error("DB CONNECTION ERROR:", err);
  });

const testCart = async () => {
  try {
    console.log("\n=== Cart Persistence Test ===\n");

    // Find a test user
    const user = await User.findOne({ email: "admin@tshirtshop.com" });
    if (!user) {
      console.log("❌ Test user not found. Please run seedUsers.js first.");
      return;
    }
    console.log("✅ Found test user:", user.email);

    // Find a test product
    const product = await Product.findOne();
    if (!product) {
      console.log("❌ No products found. Please add some products first.");
      return;
    }
    console.log("✅ Found test product:", product.name);

    // Clear existing cart
    await Cart.findOneAndDelete({ user: user._id });
    console.log("✅ Cleared existing cart");

    // Create new cart with regular product
    const cart = new Cart({
      user: user._id,
      items: [
        {
          product: product._id,
          name: product.name,
          size: "M",
          color: "Black",
          price: product.price,
          quantity: 2
        }
      ]
    });

    await cart.save();
    console.log("\n✅ Created cart with regular product:");
    console.log("  - Product:", cart.items[0].name);
    console.log("  - Size:", cart.items[0].size);
    console.log("  - Color:", cart.items[0].color);
    console.log("  - Quantity:", cart.items[0].quantity);
    console.log("  - Price:", cart.items[0].price);

    // Add custom design item
    const customItem = {
      isCustom: true,
      name: "Custom T-Shirt",
      size: "L",
      color: "White",
      price: 599,
      quantity: 1,
      customization: {
        frontDesign: {
          designImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
          position: { x: 100, y: 150 },
          scale: 1.5,
          rotation: 45
        },
        backDesign: {
          designImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
          position: { x: 120, y: 180 },
          scale: 1.2,
          rotation: 0
        },
        selectedProduct: product._id
      }
    };

    cart.items.push(customItem);
    await cart.save();
    
    console.log("\n✅ Added custom design item:");
    console.log("  - Name:", customItem.name);
    console.log("  - Size:", customItem.size);
    console.log("  - Color:", customItem.color);
    console.log("  - Front Design Position:", customItem.customization.frontDesign.position);
    console.log("  - Front Design Scale:", customItem.customization.frontDesign.scale);
    console.log("  - Front Design Rotation:", customItem.customization.frontDesign.rotation);
    console.log("  - Back Design Position:", customItem.customization.backDesign.position);
    console.log("  - Back Design Scale:", customItem.customization.backDesign.scale);

    // Test cart methods
    console.log("\n✅ Testing cart methods:");
    console.log("  - Total amount:", cart.getTotal());
    console.log("  - Total items:", cart.getItemCount());

    // Test merging cart items
    const guestItems = [
      {
        product: product._id,
        name: product.name,
        size: "S",
        color: "Red",
        price: product.price,
        quantity: 1
      }
    ];

    cart.mergeCart(guestItems);
    await cart.save();
    console.log("\n✅ Merged guest cart items");
    console.log("  - Total items after merge:", cart.getItemCount());

    // Retrieve and populate cart
    const populatedCart = await Cart.findOne({ user: user._id })
      .populate('items.product', 'name price')
      .populate('items.customization.selectedProduct', 'name price');

    console.log("\n✅ Retrieved populated cart:");
    populatedCart.items.forEach((item, index) => {
      console.log(`\n  Item ${index + 1}:`);
      console.log(`    - Name: ${item.name}`);
      console.log(`    - Custom: ${item.isCustom}`);
      console.log(`    - Size: ${item.size}`);
      console.log(`    - Color: ${item.color}`);
      console.log(`    - Quantity: ${item.quantity}`);
      if (item.isCustom && item.customization) {
        console.log(`    - Has Front Design: ${!!item.customization.frontDesign.designImage}`);
        console.log(`    - Has Back Design: ${!!item.customization.backDesign.designImage}`);
      }
    });

    console.log("\n✅ Cart persistence test completed successfully!");

  } catch (error) {
    console.error("\n❌ Test failed:", error);
  } finally {
    mongoose.connection.close();
  }
};

testCart();
