#!/usr/bin/env node

/**
 * Database Truncation Script
 * 
 * This script allows you to clear data from MongoDB collections (tables)
 * Use with extreme caution - this will permanently delete data!
 * 
 * Usage:
 * node server/scripts/truncateData.js --collection orders
 * node server/scripts/truncateData.js --collection all --confirm
 * node server/scripts/truncateData.js --help
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const models = {
  Cart: require('../models/cart'),
  Category: require('../models/category'), 
  Coupon: require('../models/coupon'),
  Design: require('../models/design'),
  Invoice: require('../models/invoice'),
  Order: require('../models/order').Order,
  PaymentAudit: require('../models/paymentAudit'),
  Product: require('../models/product'),
  ProductType: require('../models/productType'),
  Review: require('../models/review'),
  RewardTransaction: require('../models/rewardTransaction'),
  Settings: require('../models/settings'),
  User: require('../models/user'),
  Wishlist: require('../models/wishlist')
};

// Available collections/tables
const AVAILABLE_COLLECTIONS = Object.keys(models).map(name => name.toLowerCase());

// Sensitive collections that require extra confirmation
const SENSITIVE_COLLECTIONS = ['user', 'order', 'product', 'invoice'];

// Get command line arguments
const args = process.argv.slice(2);
const argMap = {};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].substring(2);
    const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
    argMap[key] = value;
    if (value !== true) i++; // Skip next arg if it was used as value
  }
}

// Help function
function showHelp() {
  console.log(`
🗄️  Database Truncation Script

USAGE:
  node server/scripts/truncateData.js [OPTIONS]

OPTIONS:
  --collection <name>     Specify collection to truncate
                         Available: ${AVAILABLE_COLLECTIONS.join(', ')}, all
  
  --confirm              Required for sensitive operations
  
  --dry-run              Show what would be deleted without actually deleting
  
  --help                 Show this help message

EXAMPLES:
  # Clear all cart data
  node server/scripts/truncateData.js --collection cart

  # Clear all order data (requires confirmation)
  node server/scripts/truncateData.js --collection order --confirm

  # Clear all collections (DANGEROUS - requires confirmation)
  node server/scripts/truncateData.js --collection all --confirm

  # Dry run to see what would be deleted
  node server/scripts/truncateData.js --collection order --dry-run

⚠️  WARNING: This will permanently delete data. Always backup your database first!
`);
}

// Validation function
function validateArgs() {
  if (argMap.help) {
    showHelp();
    process.exit(0);
  }

  if (!argMap.collection) {
    console.error('❌ Error: --collection argument is required');
    console.log('Use --help for usage information');
    process.exit(1);
  }

  const collection = argMap.collection.toLowerCase();
  
  if (collection !== 'all' && !AVAILABLE_COLLECTIONS.includes(collection)) {
    console.error(`❌ Error: Invalid collection "${argMap.collection}"`);
    console.log(`Available collections: ${AVAILABLE_COLLECTIONS.join(', ')}, all`);
    process.exit(1);
  }

  // Check for confirmation on sensitive operations
  const isSensitive = collection === 'all' || SENSITIVE_COLLECTIONS.includes(collection);
  if (isSensitive && !argMap.confirm && !argMap['dry-run']) {
    console.error(`❌ Error: Collection "${collection}" requires --confirm flag`);
    console.log('This is a sensitive operation that could cause data loss.');
    console.log('Add --confirm to proceed or --dry-run to preview.');
    process.exit(1);
  }

  return { collection, isDryRun: !!argMap['dry-run'] };
}

// Connect to database
async function connectDatabase() {
  try {
    const dbUri = process.env.DATABASE || process.env.MONGODB_URI || 'mongodb://localhost:27017/tshirt';
    
    console.log('🔌 Connecting to database...');
    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to database');
    
    return dbUri;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    process.exit(1);
  }
}

// Get document count for a model
async function getDocumentCount(model) {
  try {
    return await model.countDocuments();
  } catch (error) {
    console.warn(`⚠️  Could not count documents for ${model.modelName}:`, error.message);
    return 0;
  }
}

// Truncate a single collection
async function truncateCollection(collectionName, isDryRun = false) {
  const modelName = collectionName.charAt(0).toUpperCase() + collectionName.slice(1).toLowerCase();
  const Model = models[modelName];
  
  if (!Model) {
    console.error(`❌ Model not found for collection: ${collectionName}`);
    return false;
  }

  try {
    const count = await getDocumentCount(Model);
    
    if (count === 0) {
      console.log(`📭 Collection "${collectionName}" is already empty`);
      return true;
    }

    if (isDryRun) {
      console.log(`🔍 DRY RUN: Would delete ${count} documents from "${collectionName}"`);
      return true;
    }

    console.log(`🗑️  Truncating "${collectionName}" (${count} documents)...`);
    const result = await Model.deleteMany({});
    console.log(`✅ Successfully deleted ${result.deletedCount} documents from "${collectionName}"`);
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to truncate "${collectionName}":`, error.message);
    return false;
  }
}

// Truncate all collections
async function truncateAllCollections(isDryRun = false) {
  console.log('🗂️  Processing all collections...\n');
  
  let successCount = 0;
  let totalDocuments = 0;
  
  for (const collectionName of AVAILABLE_COLLECTIONS) {
    const modelName = collectionName.charAt(0).toUpperCase() + collectionName.slice(1).toLowerCase();
    const Model = models[modelName];
    
    if (Model) {
      const count = await getDocumentCount(Model);
      totalDocuments += count;
      
      if (await truncateCollection(collectionName, isDryRun)) {
        successCount++;
      }
      console.log(); // Empty line for readability
    }
  }
  
  if (isDryRun) {
    console.log(`🔍 DRY RUN SUMMARY: Would delete ${totalDocuments} total documents from ${successCount} collections`);
  } else {
    console.log(`📊 SUMMARY: Successfully processed ${successCount}/${AVAILABLE_COLLECTIONS.length} collections`);
    console.log(`🗑️  Total documents deleted: ${totalDocuments}`);
  }
  
  return successCount === AVAILABLE_COLLECTIONS.length;
}

// Main execution function
async function main() {
  console.log('🗄️  Database Truncation Script Starting...\n');
  
  // Validate arguments
  const { collection, isDryRun } = validateArgs();
  
  // Connect to database
  const dbUri = await connectDatabase();
  console.log(`📍 Database: ${dbUri.replace(/\/\/.*@/, '//***@')}\n`); // Hide credentials
  
  // Show warning for non-dry-run operations
  if (!isDryRun) {
    console.log('⚠️  WARNING: This will permanently delete data!');
    console.log('💡 Consider running with --dry-run first to preview changes\n');
  }
  
  let success = false;
  
  try {
    if (collection === 'all') {
      success = await truncateAllCollections(isDryRun);
    } else {
      success = await truncateCollection(collection, isDryRun);
    }
    
    if (success) {
      console.log('\n✅ Operation completed successfully!');
    } else {
      console.log('\n❌ Operation completed with errors');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Unexpected error:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    console.log('\n🔌 Closing database connection...');
    await mongoose.connection.close();
    console.log('👋 Done!');
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled Rejection:', error.message);
  process.exit(1);
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
  console.log('\n\n⏹️  Operation cancelled by user');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  process.exit(0);
});

// Run the script
main();
