# Database Truncation Script Guide

This guide explains how to use the database truncation script to clear data from MongoDB collections.

## ⚠️ **IMPORTANT WARNING**
**This script permanently deletes data from your database. Always backup your database before running any truncation operations!**

## 📁 Script Location
```
server/scripts/truncateData.js
```

## 🚀 Basic Usage

### Show Help
```bash
node server/scripts/truncateData.js --help
```

### Clear Specific Collections (Safe)
```bash
# Clear cart data (no confirmation needed)
node server/scripts/truncateData.js --collection cart

# Clear review data
node server/scripts/truncateData.js --collection review

# Clear design data  
node server/scripts/truncateData.js --collection design
```

### Clear Sensitive Collections (Requires Confirmation)
```bash
# Clear order data (requires --confirm)
node server/scripts/truncateData.js --collection order --confirm

# Clear user data (requires --confirm)
node server/scripts/truncateData.js --collection user --confirm

# Clear product data (requires --confirm)
node server/scripts/truncateData.js --collection product --confirm
```

### Preview Operations (Dry Run)
```bash
# See what would be deleted without actually deleting
node server/scripts/truncateData.js --collection order --dry-run

# Preview clearing all collections
node server/scripts/truncateData.js --collection all --dry-run
```

### Clear All Data (DANGEROUS)
```bash
# Clear ALL collections (requires --confirm)
node server/scripts/truncateData.js --collection all --confirm
```

## 📊 Available Collections

### Safe Collections (No confirmation required)
- `cart` - Shopping cart data
- `review` - Product reviews  
- `design` - Custom designs
- `wishlist` - User wishlists
- `coupon` - Discount coupons
- `rewardtransaction` - Reward point transactions
- `paymentaudit` - Payment audit logs
- `settings` - Application settings
- `category` - Product categories
- `producttype` - Product type definitions

### Sensitive Collections (Requires `--confirm`)
- `user` - User accounts and data
- `order` - Customer orders  
- `product` - Product catalog
- `invoice` - Invoice records

## 🔧 Command Options

| Option | Description | Example |
|--------|-------------|---------|
| `--collection <name>` | Specify which collection to truncate | `--collection cart` |
| `--confirm` | Required for sensitive operations | `--confirm` |
| `--dry-run` | Preview what would be deleted | `--dry-run` |
| `--help` | Show help message | `--help` |

## 📝 Example Workflows

### Development Reset
```bash
# Clear test data while preserving products and users
node server/scripts/truncateData.js --collection cart
node server/scripts/truncateData.js --collection order --confirm  
node server/scripts/truncateData.js --collection review
node server/scripts/truncateData.js --collection wishlist
```

### Complete Database Reset
```bash
# First, preview what will be deleted
node server/scripts/truncateData.js --collection all --dry-run

# If satisfied, run the actual truncation
node server/scripts/truncateData.js --collection all --confirm
```

### User Data Cleanup
```bash
# Clear user-related data only
node server/scripts/truncateData.js --collection user --confirm
node server/scripts/truncateData.js --collection cart  
node server/scripts/truncateData.js --collection wishlist
node server/scripts/truncateData.js --collection order --confirm
```

## 🛡️ Safety Features

### 1. **Confirmation Required**
Sensitive collections require the `--confirm` flag to prevent accidental deletion.

### 2. **Dry Run Mode**
Use `--dry-run` to preview operations without actually deleting data.

### 3. **Document Count Display**
Shows how many documents will be/were deleted.

### 4. **Error Handling** 
Graceful error handling with descriptive messages.

### 5. **Connection Management**
Properly manages database connections and cleanup.

## 🔍 Sample Output

### Dry Run Example
```bash
$ node server/scripts/truncateData.js --collection order --dry-run

🗄️  Database Truncation Script Starting...

🔌 Connecting to database...
✅ Connected to database
📍 Database: mongodb://***@localhost:27017/tshirt

🔍 DRY RUN: Would delete 25 documents from "order"

✅ Operation completed successfully!

🔌 Closing database connection...
👋 Done!
```

### Actual Truncation Example
```bash
$ node server/scripts/truncateData.js --collection cart

🗄️  Database Truncation Script Starting...

🔌 Connecting to database...
✅ Connected to database  
📍 Database: mongodb://***@localhost:27017/tshirt

⚠️  WARNING: This will permanently delete data!
💡 Consider running with --dry-run first to preview changes

🗑️  Truncating "cart" (15 documents)...
✅ Successfully deleted 15 documents from "cart"

✅ Operation completed successfully!

🔌 Closing database connection...
👋 Done!
```

## 🚨 Emergency Stop

If you need to stop the script while it's running:
- Press `Ctrl+C` to cancel the operation
- The script will cleanup database connections gracefully

## 📋 Best Practices

1. **Always Backup First**
   ```bash
   # MongoDB backup example
   mongodump --db your_database_name --out backup_folder
   ```

2. **Use Dry Run First**
   ```bash
   # Always preview first
   node server/scripts/truncateData.js --collection order --dry-run
   ```

3. **Test on Development Database**
   - Never run on production without testing first
   - Verify the script works as expected

4. **Document Your Actions**
   - Keep track of what you truncated and why
   - Note any issues or unexpected behavior

5. **Verify Results**
   ```bash
   # Check if truncation was successful
   node server/scripts/truncateData.js --collection cart --dry-run
   ```

## 🐛 Troubleshooting

### Connection Issues
```
❌ Failed to connect to database: connection refused
```
**Solution**: Check if MongoDB is running and connection string is correct.

### Permission Errors
```
❌ Failed to truncate "collection": unauthorized
```
**Solution**: Ensure database user has delete permissions.

### Model Not Found
```
❌ Model not found for collection: invalid_name
```
**Solution**: Check collection name spelling and available collections.

## 📞 Support

If you encounter issues:
1. Check MongoDB is running
2. Verify database connection string
3. Ensure you have proper permissions
4. Review error messages carefully
5. Use `--dry-run` to test first

## 🔗 Related Scripts

- `server/scripts/updateInventory.js` - Inventory management
- `server/clearProductsAndOrders.js` - Legacy cleanup script

---

**Remember: This script is powerful and destructive. Use with caution and always backup your data first!** 🛡️
