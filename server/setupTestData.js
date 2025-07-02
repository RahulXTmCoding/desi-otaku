require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/user");
const Product = require("./models/product");
const Category = require("./models/category");

// Connect to MongoDB
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ DB CONNECTED");
    setupTestData();
  })
  .catch((err) => {
    console.log("❌ DB CONNECTION FAILED:", err);
    process.exit(1);
  });

async function setupTestData() {
  try {
    console.log("\n📦 Setting up test data...\n");

    // 1. Create test users
    console.log("👥 Creating test users...");
    
    const testUsers = [
      {
        name: "Admin",
        lastname: "User",
        email: "admin@tshirtshop.com",
        password: "admin123",
        role: 1,
        phone: "9876543210",
        addresses: [{
          fullName: "Admin User",
          email: "admin@tshirtshop.com",
          phone: "9876543210",
          address: "123 Admin Street",
          city: "Mumbai",
          state: "Maharashtra",
          country: "India",
          pinCode: "400001",
          isDefault: true
        }]
      },
      {
        name: "Test",
        lastname: "Customer",
        email: "user@tshirtshop.com",
        password: "user123",
        role: 0,
        phone: "9876543211",
        addresses: [{
          fullName: "Test Customer",
          email: "user@tshirtshop.com",
          phone: "9876543211",
          address: "456 Customer Lane",
          city: "Delhi",
          state: "Delhi",
          country: "India",
          pinCode: "110001",
          isDefault: true
        }]
      },
      {
        name: "John",
        lastname: "Doe",
        email: "john@example.com",
        password: "john123",
        role: 0,
        phone: "9876543212",
        addresses: [
          {
            fullName: "John Doe",
            email: "john@example.com",
            phone: "9876543212",
            address: "789 User Road",
            city: "Bangalore",
            state: "Karnataka",
            country: "India",
            pinCode: "560001",
            isDefault: true
          },
          {
            fullName: "John Doe",
            email: "john@example.com",
            phone: "9876543212",
            address: "321 Office Park",
            city: "Chennai",
            state: "Tamil Nadu",
            country: "India",
            pinCode: "600001",
            isDefault: false
          }
        ]
      }
    ];

    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`✅ Created ${userData.role === 1 ? 'Admin' : 'User'}: ${userData.email}`);
      } else {
        console.log(`⏭️  User already exists: ${userData.email}`);
      }
    }

    // 2. Create test categories
    console.log("\n📁 Creating test categories...");
    
    const categories = [
      { name: "T-Shirts" },
      { name: "Anime" },
      { name: "Gaming" },
      { name: "Movies" }
    ];

    for (const cat of categories) {
      const existing = await Category.findOne({ name: cat.name });
      if (!existing) {
        const category = new Category(cat);
        await category.save();
        console.log(`✅ Created category: ${cat.name}`);
      } else {
        console.log(`⏭️  Category already exists: ${cat.name}`);
      }
    }

    // 3. Create test products
    console.log("\n🛍️  Creating test products...");
    
    const animeCategory = await Category.findOne({ name: "Anime" });
    
    const testProducts = [
      {
        name: "Naruto Sage Mode T-Shirt",
        description: "Premium quality t-shirt featuring Naruto in Sage Mode",
        price: 599,
        stock: 100,
        sold: 25,
        category: animeCategory?._id,
        sizes: ["S", "M", "L", "XL"],
        colors: ["Black", "White", "Navy"],
        photo: {
          data: Buffer.from("placeholder"),
          contentType: "image/png"
        }
      },
      {
        name: "Attack on Titan Wings T-Shirt",
        description: "Show your dedication with the Wings of Freedom design",
        price: 649,
        stock: 50,
        sold: 15,
        category: animeCategory?._id,
        sizes: ["S", "M", "L", "XL"],
        colors: ["Black", "White", "Green"],
        photo: {
          data: Buffer.from("placeholder"),
          contentType: "image/png"
        }
      },
      {
        name: "Dragon Ball Z Power Level T-Shirt",
        description: "It's over 9000! Classic DBZ design",
        price: 699,
        stock: 75,
        sold: 30,
        category: animeCategory?._id,
        sizes: ["S", "M", "L", "XL", "XXL"],
        colors: ["Black", "Orange", "Blue"],
        photo: {
          data: Buffer.from("placeholder"),
          contentType: "image/png"
        }
      },
      {
        name: "One Piece Straw Hat Pirates T-Shirt",
        description: "Join Luffy's crew with this awesome design",
        price: 549,
        stock: 60,
        sold: 20,
        category: animeCategory?._id,
        sizes: ["S", "M", "L", "XL"],
        colors: ["Black", "Red", "White"],
        photo: {
          data: Buffer.from("placeholder"),
          contentType: "image/png"
        }
      }
    ];

    for (const productData of testProducts) {
      const existing = await Product.findOne({ name: productData.name });
      if (!existing) {
        const product = new Product(productData);
        await product.save();
        console.log(`✅ Created product: ${productData.name} - ₹${productData.price}`);
      } else {
        console.log(`⏭️  Product already exists: ${productData.name}`);
      }
    }

    console.log("\n🎉 Test data setup complete!");
    console.log("\n📧 Test Accounts:");
    console.log("\n🔐 Admin Account:");
    console.log("Email: admin@tshirtshop.com");
    console.log("Password: admin123");
    console.log("\n👤 Customer Accounts:");
    console.log("Email: user@tshirtshop.com");
    console.log("Password: user123");
    console.log("\nEmail: john@example.com");
    console.log("Password: john123 (has 2 addresses)");
    
    console.log("\n🛍️  Test Products Created:");
    console.log("- Naruto Sage Mode T-Shirt (₹599)");
    console.log("- Attack on Titan Wings T-Shirt (₹649)");
    console.log("- Dragon Ball Z Power Level T-Shirt (₹699)");
    console.log("- One Piece Straw Hat Pirates T-Shirt (₹549)");
    
    console.log("\n✅ You can now test the complete flow with real data!");
    console.log("1. Sign in with test credentials");
    console.log("2. Products are in stock and ready to purchase");
    console.log("3. Users have pre-configured addresses");
    console.log("4. Test the complete checkout flow");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error setting up test data:", error);
    process.exit(1);
  }
}
