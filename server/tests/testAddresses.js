require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/user");

// Connect to MongoDB
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("✓ Connected to MongoDB");
    testAddressFeatures();
  })
  .catch((err) => {
    console.error("✗ MongoDB connection error:", err);
    process.exit(1);
  });

async function testAddressFeatures() {
  try {
    console.log("\n=== Testing Address Features ===\n");

    // Find a test user
    const testUser = await User.findOne({ email: "test@example.com" });
    
    if (!testUser) {
      console.log("✗ No test user found. Please create a user with email: test@example.com");
      process.exit(1);
    }

    console.log(`✓ Found test user: ${testUser.name} (${testUser.email})`);

    // Test 1: Add an address
    console.log("\n1. Adding a new address...");
    const newAddress = {
      fullName: "Test User",
      email: testUser.email,
      phone: "+91 9876543210",
      address: "123 Test Street, Apartment 4B",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      pinCode: "400001",
      isDefault: true
    };

    testUser.addresses.push(newAddress);
    await testUser.save();
    console.log("✓ Address added successfully");

    // Test 2: Add another address
    console.log("\n2. Adding a second address...");
    const secondAddress = {
      fullName: "Test User Office",
      email: testUser.email,
      phone: "+91 9876543211",
      address: "456 Business Park, Floor 2",
      city: "Bangalore",
      state: "Karnataka",
      country: "India",
      pinCode: "560001",
      isDefault: false
    };

    testUser.addresses.push(secondAddress);
    await testUser.save();
    console.log("✓ Second address added successfully");

    // Test 3: List all addresses
    console.log("\n3. Listing all addresses...");
    const userWithAddresses = await User.findById(testUser._id).select('addresses');
    console.log(`✓ Found ${userWithAddresses.addresses.length} addresses:`);
    userWithAddresses.addresses.forEach((addr, index) => {
      console.log(`  ${index + 1}. ${addr.fullName} - ${addr.city}, ${addr.state} ${addr.pinCode}${addr.isDefault ? ' (Default)' : ''}`);
    });

    // Test 4: Update an address
    console.log("\n4. Updating the second address to be default...");
    userWithAddresses.addresses.forEach(addr => {
      addr.isDefault = false;
    });
    userWithAddresses.addresses[1].isDefault = true;
    await userWithAddresses.save();
    console.log("✓ Address updated successfully");

    // Test 5: Delete an address
    console.log("\n5. Deleting the first address...");
    userWithAddresses.addresses.splice(0, 1);
    await userWithAddresses.save();
    console.log("✓ Address deleted successfully");
    console.log(`  Remaining addresses: ${userWithAddresses.addresses.length}`);

    console.log("\n=== All address tests passed! ===");
    
    // Clean up - remove test addresses
    console.log("\nCleaning up test data...");
    testUser.addresses = [];
    await testUser.save();
    console.log("✓ Test addresses removed");

  } catch (error) {
    console.error("\n✗ Test failed:", error);
  } finally {
    mongoose.disconnect();
    console.log("\n✓ Disconnected from MongoDB");
  }
}
