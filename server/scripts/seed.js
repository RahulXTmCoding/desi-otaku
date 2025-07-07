require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("./models/category");
const Product = require("./models/Product");
const User = require("./models/user");

// Connect to MongoDB
mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
}).then(() => {
  console.log("DB CONNECTED");
}).catch(err => {
  console.log("DB CONNECTION ERROR:", err);
});

// Sample categories
const categories = [
  { name: "Anime" },
  { name: "Brand" },
  { name: "Limited Edition" },
  { name: "Summer Collection" }
];

// Sample products
const products = [
  {
    name: "Naruto Sage Mode Premium",
    description: "Premium quality t-shirt featuring Naruto in Sage Mode. Made from 100% cotton with vibrant print quality.",
    price: 599,
    category: "Anime", // Will be replaced with actual category ID
    stock: 25,
    sold: 45
  },
  {
    name: "Attack on Titan Wings",
    description: "Show your dedication with the Wings of Freedom design. Comfortable fit with lasting print quality.",
    price: 649,
    category: "Anime",
    stock: 15,
    sold: 30
  },
  {
    name: "Brand Logo Classic",
    description: "Our classic brand logo t-shirt. Minimalist design for everyday wear.",
    price: 449,
    category: "Brand",
    stock: 50,
    sold: 20
  },
  {
    name: "Demon Slayer Pattern",
    description: "Intricate pattern design inspired by Demon Slayer. Premium fabric with detailed printing.",
    price: 699,
    category: "Anime",
    stock: 5,
    sold: 60
  },
  {
    name: "One Piece Straw Hat",
    description: "Join the Straw Hat crew with this iconic design. Comfortable and stylish.",
    price: 549,
    category: "Anime",
    stock: 30,
    sold: 35
  },
  {
    name: "Neon Brand Limited",
    description: "Limited edition neon design. Only 100 pieces available worldwide.",
    price: 899,
    category: "Limited Edition",
    stock: 3,
    sold: 97
  },
  {
    name: "Summer Vibes Collection",
    description: "Light and breezy design perfect for summer. Made with moisture-wicking fabric.",
    price: 499,
    category: "Summer Collection",
    stock: 40,
    sold: 15
  },
  {
    name: "My Hero Academia Plus Ultra",
    description: "Go beyond with this Plus Ultra design. Show your hero spirit!",
    price: 599,
    category: "Anime",
    stock: 0,
    sold: 50
  },
  {
    name: "Tokyo Ghoul Mask",
    description: "Mysterious and stylish Tokyo Ghoul mask design. Dark theme for anime fans.",
    price: 679,
    category: "Anime",
    stock: 20,
    sold: 25
  },
  {
    name: "Brand Minimalist Black",
    description: "Simple yet elegant black t-shirt with subtle branding. Perfect for any occasion.",
    price: 399,
    category: "Brand",
    stock: 100,
    sold: 10
  }
];

// Sample users
const users = [
  {
    name: "Admin User",
    email: "admin@example.com",
    password: "admin123",
    role: 1 // Admin
  },
  {
    name: "Test User",
    email: "user@example.com",
    password: "user123",
    role: 0 // Regular user
  }
];

async function seedDatabase() {
  try {
    // Clear existing data
    await Category.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
    
    console.log("Cleared existing data");

    // Create categories
    const createdCategories = await Category.create(categories);
    console.log(`Created ${createdCategories.length} categories`);

    // Create category map
    const categoryMap = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    // Update products with category IDs and create them
    const productsWithCategoryIds = products.map(product => ({
      ...product,
      category: categoryMap[product.category]
    }));

    const createdProducts = await Product.create(productsWithCategoryIds);
    console.log(`Created ${createdProducts.length} products`);

    // Create users
    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      const salt = await user.makeSalt();
      user.encry_password = await user.securePassword(userData.password, salt);
      user.salt = salt;
      await user.save();
      createdUsers.push(user);
    }
    console.log(`Created ${createdUsers.length} users`);

    console.log("\n=== Database seeded successfully! ===");
    console.log("\nTest credentials:");
    console.log("Admin: admin@example.com / admin123");
    console.log("User: user@example.com / user123");
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seeder
seedDatabase();
