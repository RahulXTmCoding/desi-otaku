const mongoose = require("mongoose");
const Product = require("./models/product");
const ProductType = require("./models/productType");
require("dotenv").config();

// Old to new product type mapping - including variations
const productTypeMapping = {
  't-shirt': 'T-Shirt',
  'tshirt': 'T-Shirt',  // Without hyphen
  'Tshirt': 'T-Shirt',  // Capitalized
  'TShirt': 'T-Shirt',  // Camel case
  'vest': 'Vest', 
  'hoodie': 'Hoodie',
  'oversized-tee': 'Oversized Tee',
  'oversizedtee': 'Oversized Tee',
  'acid-wash': 'Acid Wash',
  'acidwash': 'Acid Wash',
  'tank-top': 'Tank Top',
  'tanktop': 'Tank Top',
  'long-sleeve': 'Long Sleeve',
  'longsleeve': 'Long Sleeve',
  'crop-top': 'Crop Top',
  'croptop': 'Crop Top',
  'other': 'Other'
};

// Normalize product type string
const normalizeProductType = (type) => {
  if (!type) return 't-shirt';
  
  // Convert to lowercase and remove spaces
  const normalized = type.toLowerCase().replace(/\s+/g, '');
  
  // Check direct mapping
  if (productTypeMapping[normalized]) {
    return normalized;
  }
  
  // Check with hyphen
  const withHyphen = normalized.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  if (productTypeMapping[withHyphen]) {
    return withHyphen;
  }
  
  // Default to t-shirt
  return 't-shirt';
};

const migrateProductTypes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    });
    
    console.log("Connected to MongoDB");
    
    // First, ensure all product types exist in the database
    console.log("\n1. Checking/Creating ProductTypes...");
    const productTypeIds = {};
    
    // Get unique display names
    const uniqueDisplayNames = [...new Set(Object.values(productTypeMapping))];
    
    for (const displayName of uniqueDisplayNames) {
      // Find the first key that maps to this display name
      const primaryKey = Object.entries(productTypeMapping).find(([key, val]) => val === displayName)?.[0] || '';
      
      let productType = await ProductType.findOne({ displayName: displayName });
      
      if (!productType) {
        console.log(`Creating ProductType: ${displayName}`);
        productType = await ProductType.create({
          value: primaryKey.replace('-', ''),  // Store without hyphen
          displayName: displayName,
          icon: getIconForType(primaryKey),
          isActive: true,
          order: uniqueDisplayNames.indexOf(displayName)
        });
      }
      
      // Map all variations to the same ID
      Object.entries(productTypeMapping).forEach(([key, val]) => {
        if (val === displayName) {
          productTypeIds[key] = productType._id;
        }
      });
      
      console.log(`ProductType "${displayName}" mapped to ID: ${productType._id}`);
    }
    
    // Now update all products
    console.log("\n2. Updating products...");
    const products = await Product.find({});
    console.log(`Found ${products.length} products to update`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const product of products) {
      // Check if productType is already an ObjectId
      if (product.productType && mongoose.Types.ObjectId.isValid(product.productType)) {
        console.log(`Product "${product.name}" already has valid productType ID`);
        skipped++;
        continue;
      }
      
      // Get the old productType value (string) and normalize it
      const oldType = normalizeProductType(product.productType);
      const newTypeId = productTypeIds[oldType];
      
      if (newTypeId) {
        product.productType = newTypeId;
        await product.save();
        console.log(`Updated product "${product.name}" from "${oldType}" to ID: ${newTypeId}`);
        updated++;
      } else {
        console.log(`Warning: No mapping found for product "${product.name}" with type "${oldType}"`);
        // Default to t-shirt
        product.productType = productTypeIds['t-shirt'];
        await product.save();
        updated++;
      }
    }
    
    console.log("\n3. Migration Summary:");
    console.log(`- Total products: ${products.length}`);
    console.log(`- Updated: ${updated}`);
    console.log(`- Skipped (already migrated): ${skipped}`);
    
    // Verify by fetching a few products with populated productType
    console.log("\n4. Verification - Sample products:");
    const sampleProducts = await Product.find({}).limit(5).populate('productType');
    sampleProducts.forEach(product => {
      console.log(`- ${product.name}: ${product.productType?.displayName || 'No type'}`);
    });
    
    console.log("\n✅ Migration completed successfully!");
    
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\nDatabase connection closed");
  }
};

function getIconForType(type) {
  const icons = {
    't-shirt': '👔',
    'vest': '🦺',
    'hoodie': '🧥',
    'oversized-tee': '👕',
    'acid-wash': '🎨',
    'tank-top': '🎽',
    'long-sleeve': '🥼',
    'crop-top': '👚',
    'other': '📦'
  };
  return icons[type] || '📦';
}

// Run the migration
console.log("Starting ProductType migration...");
migrateProductTypes();
