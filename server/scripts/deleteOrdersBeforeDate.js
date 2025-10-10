#!/usr/bin/env node

/**
 * Date-Based Order Deletion Script
 * 
 * This script allows you to delete orders created before a specific date
 * Use with extreme caution - this will permanently delete order data!
 * 
 * Usage:
 * node server/scripts/deleteOrdersBeforeDate.js --date 2024-09-20
 * node server/scripts/deleteOrdersBeforeDate.js --date 2024-09-20 --confirm
 * node server/scripts/deleteOrdersBeforeDate.js --help
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import Order model
const { Order } = require('../models/order');

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
🗓️  Date-Based Order Deletion Script

USAGE:
  node server/scripts/deleteOrdersBeforeDate.js [OPTIONS]

OPTIONS:
  --date <YYYY-MM-DD>    Specify cutoff date (delete orders before this date)
                         Example: 2024-09-20 for September 20, 2024
  
  --confirm              Required to actually delete orders
  
  --dry-run              Show what would be deleted without actually deleting
  
  --help                 Show this help message

EXAMPLES:
  # Delete all orders before September 20, 2024 (requires confirmation)
  node server/scripts/deleteOrdersBeforeDate.js --date 2024-09-20 --confirm

  # Dry run to see what would be deleted
  node server/scripts/deleteOrdersBeforeDate.js --date 2024-09-20 --dry-run

  # Delete orders before January 1, 2024
  node server/scripts/deleteOrdersBeforeDate.js --date 2024-01-01 --confirm

⚠️  WARNING: This will permanently delete order data. Always backup your database first!
`);
}

// Validation function
function validateArgs() {
  if (argMap.help) {
    showHelp();
    process.exit(0);
  }

  if (!argMap.date) {
    console.error('❌ Error: --date argument is required');
    console.log('Use --help for usage information');
    process.exit(1);
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(argMap.date)) {
    console.error('❌ Error: Invalid date format. Use YYYY-MM-DD format');
    console.log('Example: 2024-09-20');
    process.exit(1);
  }

  const cutoffDate = new Date(argMap.date);
  if (isNaN(cutoffDate.getTime())) {
    console.error('❌ Error: Invalid date provided');
    process.exit(1);
  }

  // Check if date is in the future
  const now = new Date();
  if (cutoffDate > now) {
    console.error('❌ Error: Cannot delete orders from the future');
    console.log('Please provide a date in the past');
    process.exit(1);
  }

  // Check for confirmation on actual deletion
  if (!argMap.confirm && !argMap['dry-run']) {
    console.error('❌ Error: Order deletion requires --confirm flag');
    console.log('This is a destructive operation that will permanently delete order data.');
    console.log('Add --confirm to proceed or --dry-run to preview.');
    process.exit(1);
  }

  return { 
    cutoffDate, 
    isDryRun: !!argMap['dry-run'],
    dateString: argMap.date
  };
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

// Get order statistics for the cutoff date
async function getOrderStatistics(cutoffDate) {
  try {
    console.log('📊 Analyzing order data...\n');
    
    // Count total orders
    const totalOrders = await Order.countDocuments();
    
    // Count orders before cutoff date
    const ordersToDelete = await Order.countDocuments({
      createdAt: { $lt: cutoffDate }
    });
    
    // Count orders to keep (after cutoff date)
    const ordersToKeep = await Order.countDocuments({
      createdAt: { $gte: cutoffDate }
    });
    
    // Get date range of orders to delete
    const oldestOrder = await Order.findOne({
      createdAt: { $lt: cutoffDate }
    }).sort({ createdAt: 1 }).select('createdAt');
    
    const newestOrderToDelete = await Order.findOne({
      createdAt: { $lt: cutoffDate }
    }).sort({ createdAt: -1 }).select('createdAt');
    
    // Calculate total amount of orders to delete
    const orderAmounts = await Order.aggregate([
      { $match: { createdAt: { $lt: cutoffDate } } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ]);
    
    const totalAmount = orderAmounts.length > 0 ? orderAmounts[0].totalAmount : 0;
    
    return {
      totalOrders,
      ordersToDelete,
      ordersToKeep,
      oldestOrder,
      newestOrderToDelete,
      totalAmount
    };
  } catch (error) {
    console.error('❌ Failed to analyze order data:', error.message);
    return null;
  }
}

// Display order statistics
function displayStatistics(stats, cutoffDate, dateString) {
  console.log('📈 ORDER ANALYSIS RESULTS:');
  console.log('═'.repeat(50));
  console.log(`📅 Cutoff Date: ${dateString}`);
  console.log(`📦 Total Orders in Database: ${stats.totalOrders}`);
  console.log(`🗑️  Orders to Delete (before ${dateString}): ${stats.ordersToDelete}`);
  console.log(`✅ Orders to Keep (from ${dateString} onwards): ${stats.ordersToKeep}`);
  
  if (stats.ordersToDelete > 0) {
    console.log(`💰 Total Value of Orders to Delete: ₹${stats.totalAmount?.toFixed(2) || '0.00'}`);
    
    if (stats.oldestOrder) {
      console.log(`📆 Oldest Order to Delete: ${stats.oldestOrder.createdAt.toLocaleDateString('en-IN')}`);
    }
    
    if (stats.newestOrderToDelete) {
      console.log(`📆 Newest Order to Delete: ${stats.newestOrderToDelete.createdAt.toLocaleDateString('en-IN')}`);
    }
  }
  
  console.log('═'.repeat(50));
  console.log(`⚖️  Impact: ${((stats.ordersToDelete / stats.totalOrders) * 100).toFixed(1)}% of total orders will be deleted\n`);
}

// Delete orders before cutoff date
async function deleteOrdersBeforeDate(cutoffDate, isDryRun = false) {
  try {
    // Get statistics first
    const stats = await getOrderStatistics(cutoffDate);
    if (!stats) return false;
    
    displayStatistics(stats, cutoffDate, argMap.date);
    
    if (stats.ordersToDelete === 0) {
      console.log(`✅ No orders found before ${argMap.date}`);
      return true;
    }
    
    if (isDryRun) {
      console.log(`🔍 DRY RUN: Would delete ${stats.ordersToDelete} orders worth ₹${stats.totalAmount?.toFixed(2) || '0.00'}`);
      console.log('💡 Run with --confirm to actually delete these orders');
      return true;
    }
    
    // Show final warning
    console.log('⚠️  FINAL WARNING: About to permanently delete order data!');
    console.log(`🗑️  This will delete ${stats.ordersToDelete} orders worth ₹${stats.totalAmount?.toFixed(2) || '0.00'}`);
    console.log('⏳ Starting deletion in 3 seconds...\n');
    
    // 3 second delay for safety
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🗑️  Deleting orders...');
    const result = await Order.deleteMany({
      createdAt: { $lt: cutoffDate }
    });
    
    console.log(`✅ Successfully deleted ${result.deletedCount} orders`);
    
    // Verify deletion
    const remainingOldOrders = await Order.countDocuments({
      createdAt: { $lt: cutoffDate }
    });
    
    if (remainingOldOrders === 0) {
      console.log('✅ Verification: No old orders remaining');
    } else {
      console.warn(`⚠️  Warning: ${remainingOldOrders} old orders still remain`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to delete orders:', error.message);
    return false;
  }
}

// Main execution function
async function main() {
  console.log('🗓️  Date-Based Order Deletion Script Starting...\n');
  
  // Validate arguments
  const { cutoffDate, isDryRun, dateString } = validateArgs();
  
  // Connect to database
  const dbUri = await connectDatabase();
  console.log(`📍 Database: ${dbUri.replace(/\/\/.*@/, '//***@')}\n`); // Hide credentials
  
  // Show operation details
  console.log(`🎯 Operation: Delete orders created before ${dateString}`);
  console.log(`📅 Cutoff Date: ${cutoffDate.toLocaleDateString('en-IN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`);
  
  if (isDryRun) {
    console.log('🔍 Mode: DRY RUN (preview only)');
  } else {
    console.log('💥 Mode: LIVE DELETION (permanent)');
  }
  console.log();
  
  let success = false;
  
  try {
    success = await deleteOrdersBeforeDate(cutoffDate, isDryRun);
    
    if (success) {
      console.log('\n✅ Operation completed successfully!');
      if (!isDryRun) {
        console.log('💡 Tip: Consider running analytics scripts to update any cached data');
      }
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
