const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Check if an index with similar keys already exists
const indexExists = async (collection, keys) => {
  const indexes = await collection.listIndexes().toArray();
  return indexes.some(index => {
    const indexKeys = Object.keys(index.key);
    const targetKeys = Object.keys(keys);
    return indexKeys.length === targetKeys.length && 
           indexKeys.every(key => keys.hasOwnProperty(key));
  });
};

// Add optimized indexes for similar products performance
const addOptimizedIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    const productCollection = db.collection('products');

    console.log('🔧 Adding optimized indexes for similar products...\n');

    // List current indexes first
    console.log('📋 Current indexes on products collection:');
    const existingIndexes = await productCollection.listIndexes().toArray();
    existingIndexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name || 'unnamed'}: ${JSON.stringify(index.key)}`);
    });
    console.log('');

    const indexesToCreate = [
      {
        keys: { 
          isDeleted: 1, 
          isActive: 1, 
          totalStock: 1, 
          category: 1, 
          productType: 1,
          sold: -1,
          createdAt: -1 
        },
        name: 'similar_products_core_index',
        description: 'Core compound index'
      },
      {
        keys: { 
          isDeleted: 1, 
          isActive: 1, 
          totalStock: 1, 
          category: 1,
          sold: -1 
        },
        name: 'similar_products_category_index',
        description: 'Same category index'
      },
      {
        keys: { 
          isDeleted: 1, 
          isActive: 1, 
          totalStock: 1, 
          productType: 1,
          sold: -1 
        },
        name: 'similar_products_type_index',
        description: 'Same product type index'
      },
      {
        keys: { 
          isDeleted: 1, 
          isActive: 1, 
          totalStock: 1, 
          sold: -1 
        },
        name: 'similar_products_popular_index',
        description: 'Popular products index'
      }
    ];

    for (const indexConfig of indexesToCreate) {
      console.log(`Adding ${indexConfig.description}...`);
      
      const exists = await indexExists(productCollection, indexConfig.keys);
      if (exists) {
        console.log(`⚠️ Similar index already exists, skipping ${indexConfig.name}`);
        continue;
      }

      try {
        await productCollection.createIndex(indexConfig.keys, { 
          name: indexConfig.name,
          background: true 
        });
        console.log(`✅ ${indexConfig.description} created successfully`);
      } catch (error) {
        if (error.code === 85) { // IndexOptionsConflict
          console.log(`⚠️ Index with similar keys already exists, skipping ${indexConfig.name}`);
        } else {
          console.log(`❌ Error creating ${indexConfig.name}:`, error.message);
        }
      }
    }

    console.log('\n🎉 Index optimization completed!');
    
    // Show final indexes
    console.log('\n📋 Final indexes on products collection:');
    const finalIndexes = await productCollection.listIndexes().toArray();
    finalIndexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name || 'unnamed'}: ${JSON.stringify(index.key)}`);
    });

  } catch (error) {
    console.error('❌ Error during index optimization:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await addOptimizedIndexes();
  await mongoose.connection.close();
  console.log('\n✅ Database connection closed');
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
