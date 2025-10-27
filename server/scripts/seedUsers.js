require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/user");

// Connect to MongoDB
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB CONNECTED");
    seedUsers();
  })
  .catch((err) => {
    console.log("DB CONNECTION FAILED:", err);
    process.exit(1);
  });

const testUsers = [
  {
    name: "Admin",
    lastname: "User",
    email: "admin@tshirtshop.com",
    password: "admin123",
    role: 1, // Admin role
    phone: "9876543210",
    address: "123 Admin Street",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    pincode: "400001"
  },
  {
    name: "Test",
    lastname: "Customer",
    email: "user@tshirtshop.com",
    password: "user123",
    role: 0, // Regular user role
    phone: "9876543211",
    address: "456 Customer Lane",
    city: "Delhi",
    state: "Delhi",
    country: "India",
    pincode: "110001"
  },
  {
    name: "John",
    lastname: "Doe",
    email: "john@example.com",
    password: "john123",
    role: 0, // Regular user role
    phone: "9876543212",
    address: "789 User Road",
    city: "Bangalore",
    state: "Karnataka",
    country: "India",
    pincode: "560001"
  }
];

async function seedUsers() {
  try {
    // Check if users already exist
    const adminExists = await User.findOne({ email: "admin@tshirtshop.com" });
    const userExists = await User.findOne({ email: "user@tshirtshop.com" });

    if (adminExists || userExists) {
      console.log("Test users already exist. Skipping seed...");
      console.log("\n📧 Existing Test Accounts:");
      if (adminExists) {
        console.log("\n🔐 Admin Account:");
        console.log("Email: admin@tshirtshop.com");
        console.log("Password: admin123");
      }
      if (userExists) {
        console.log("\n👤 User Account:");
        console.log("Email: user@tshirtshop.com");
        console.log("Password: user123");
      }
      process.exit(0);
    }

    // Create users
    for (const userData of testUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`✅ Created ${userData.role === 1 ? 'Admin' : 'User'}: ${userData.email}`);
    }

    console.log("\n🎉 Test users created successfully!");
    console.log("\n📧 Test Accounts:");
    console.log("\n🔐 Admin Account:");
    console.log("Email: admin@tshirtshop.com");
    console.log("Password: admin123");
    console.log("\n👤 User Accounts:");
    console.log("Email: user@tshirtshop.com");
    console.log("Password: user123");
    console.log("\nEmail: john@example.com");
    console.log("Password: john123");
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding users:", error);
    process.exit(1);
  }
}
