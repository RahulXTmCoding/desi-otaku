require("dotenv").config();
const mongoose = require("mongoose");
const ProductType = require("./models/productType");

mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("DB CONNECTED");
    
    try {
      const defaultTypes = [
        {
          name: "T-Shirt",
          displayName: "Classic T-Shirt",
          description: "Regular fit cotton t-shirt",
          icon: "👕",
          order: 1
        },
        {
          name: "Hoodie",
          displayName: "Hooded Sweatshirt",
          description: "Warm and comfortable hoodie",
          icon: "🧥",
          order: 2
        },
        {
          name: "Tank Top",
          displayName: "Tank Top",
          description: "Sleeveless tank top for summer",
          icon: "🎽",
          order: 3
        },
        {
          name: "Long Sleeve",
          displayName: "Long Sleeve Shirt",
          description: "Full sleeve cotton shirt",
          icon: "👔",
          order: 4
        },
        {
          name: "Oversized Tee",
          displayName: "Oversized T-Shirt",
          description: "Relaxed fit oversized t-shirt",
          icon: "👚",
          order: 5
        },
        {
          name: "Crop Top",
          displayName: "Crop Top",
          description: "Trendy cropped t-shirt",
          icon: "👗",
          order: 6
        },
        {
          name: "Polo Shirt",
          displayName: "Polo Shirt",
          description: "Classic polo with collar",
          icon: "🏌️",
          order: 7
        },
        {
          name: "V-Neck",
          displayName: "V-Neck T-Shirt",
          description: "V-neck style t-shirt",
          icon: "👕",
          order: 8
        }
      ];
      
      // Clear existing product types
      await ProductType.deleteMany({});
      console.log("Cleared existing product types");
      
      // Create new product types one by one to trigger pre-save hook
      const createdTypes = [];
      for (const typeData of defaultTypes) {
        const productType = new ProductType(typeData);
        const saved = await productType.save();
        createdTypes.push(saved);
        console.log(`Created: ${saved.icon} ${saved.displayName} (slug: ${saved.slug})`);
      }
      
      console.log(`\nCreated ${createdTypes.length} product types successfully!`);
      
    } catch (error) {
      console.error("Error seeding product types:", error);
    }
    
    process.exit();
  })
  .catch((err) => {
    console.error("DB CONNECTION ERROR:", err);
    process.exit(1);
  });
