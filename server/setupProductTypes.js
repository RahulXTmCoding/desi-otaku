const mongoose = require("mongoose");
const ProductType = require("./models/productType");
require("dotenv").config();

const productTypesData = [
  { name: 'tshirt', displayName: 'T-Shirt', icon: '👔', order: 0 },
  { name: 'vest', displayName: 'Vest', icon: '🦺', order: 1 },
  { name: 'hoodie', displayName: 'Hoodie', icon: '🧥', order: 2 },
  { name: 'oversizedtee', displayName: 'Oversized Tee', icon: '👕', order: 3 },
  { name: 'acidwash', displayName: 'Acid Wash', icon: '🎨', order: 4 },
  { name: 'tanktop', displayName: 'Tank Top', icon: '🎽', order: 5 },
  { name: 'longsleeve', displayName: 'Long Sleeve', icon: '🥼', order: 6 },
  { name: 'croptop', displayName: 'Crop Top', icon: '👚', order: 7 },
  { name: 'other', displayName: 'Other', icon: '📦', order: 8 }
];

const setupProductTypes = async () => {
  try {
    await mongoose.connect(process.env.DATABASE, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log("Connected to MongoDB");
    
    // Clear existing product types
    console.log("Clearing existing product types...");
    await ProductType.deleteMany({});
    
    // Create new product types
    console.log("Creating product types...");
    for (const typeData of productTypesData) {
      const productType = await ProductType.create({
        ...typeData,
        isActive: true
      });
      console.log(`Created: ${productType.displayName} (name: ${productType.name})`);
    }
    
    console.log("\n✅ Product types setup completed!");
    
    // Display all product types
    const allTypes = await ProductType.find({}).sort('order');
    console.log("\nAll Product Types:");
    allTypes.forEach(type => {
      console.log(`- ${type.displayName} (${type.name}) - ID: ${type._id}`);
    });
    
  } catch (error) {
    console.error("Setup failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\nDatabase connection closed");
  }
};

// Run the setup
console.log("Setting up product types...");
setupProductTypes();
