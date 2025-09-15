# Smart Inventory Management Script Guide

## Overview

The `updateInventory.js` script provides comprehensive inventory management for t-shirt products with size-based stock control. It's designed to handle bulk updates safely and efficiently.

## Location
```
server/scripts/updateInventory.js
```

## Features

### ✅ Smart Targeting
- Update all products in the database
- Update specific product(s) by ID
- Update multiple products at once

### ✅ Flexible Size Management
- Update specific sizes (S, M, L, XL, XXL)
- Update all sizes at once
- Set different quantities per size in one command

### ✅ Operation Modes
- **Set**: Set absolute quantity values
- **Add**: Increase current stock by specified amount
- **Subtract**: Decrease current stock by specified amount

### ✅ Safety Features
- Dry run mode for testing changes
- Interactive preview with confirmation
- Detailed change reporting
- Input validation and error handling
- Prevents negative stock values

## Usage Examples

### 1. Basic Operations

#### Set all sizes to 50 for all products
```bash
# From project root directory
node server/scripts/updateInventory.js --all --sizes=all --quantity=50 --mode=set

# OR from server directory
cd server
node scripts/updateInventory.js --all --sizes=all --quantity=50 --mode=set
```

#### Add 10 items to M and L sizes for all products
```bash
node server/scripts/updateInventory.js --all --sizes=M,L --quantity=10 --mode=add
```

#### Set specific product's XL size to 25
```bash
node server/scripts/updateInventory.js --product=66e7f8a9b1c2d3e4f5678901 --sizes=XL --quantity=25 --mode=set
```

### 2. Advanced Operations

#### Set different quantities per size for all products
```bash
node server/scripts/updateInventory.js --all --custom-sizes="S:30,M:50,L:40,XL:30,XXL:20" --mode=set
```

#### Update multiple specific products
```bash
node server/scripts/updateInventory.js --products=ID1,ID2,ID3 --sizes=all --quantity=100 --mode=set
```

#### Subtract 5 from all sizes of specific product
```bash
node server/scripts/updateInventory.js --product=PRODUCT_ID --sizes=all --quantity=5 --mode=subtract
```

### 3. Safe Testing

#### Preview changes without applying (dry run)
```bash
node server/scripts/updateInventory.js --all --sizes=all --quantity=100 --dry-run
```

#### Verbose output for detailed progress
```bash
node server/scripts/updateInventory.js --all --sizes=M,L --quantity=25 --mode=add --verbose
```

## Command Line Options

| Option | Description | Example |
|--------|-------------|---------|
| `--all` | Update all products | `--all` |
| `--product=ID` | Update specific product | `--product=66e7f8a9b1c2d3e4f5678901` |
| `--products=ID1,ID2` | Update multiple products | `--products=ID1,ID2,ID3` |
| `--product-type=ID` | Update all products of specific type | `--product-type=66e7f8a9b1c2d3e4f5678901` |
| `--sizes=S,M,L` | Specify sizes to update | `--sizes=M,L,XL` or `--sizes=all` |
| `--quantity=NUMBER` | Quantity value | `--quantity=50` |
| `--mode=MODE` | Operation mode | `--mode=set` (default), `--mode=add`, `--mode=subtract` |
| `--custom-sizes=PAIRS` | Different quantities per size | `--custom-sizes="S:30,M:50,L:40"` |
| `--dry-run` | Preview without applying | `--dry-run` |
| `--verbose` | Detailed progress output | `--verbose` |

## Common Use Cases

### 1. New Stock Arrival
When you receive new inventory, add to existing stock:
```bash
# Add 20 to all sizes for all products
node server/scripts/updateInventory.js --all --sizes=all --quantity=20 --mode=add

# Add specific amounts per size
node server/scripts/updateInventory.js --all --custom-sizes="S:10,M:20,L:15,XL:10,XXL:5" --mode=add
```

### 2. Inventory Reset
Set standard inventory levels:
```bash
# Set standard quantities per size
node server/scripts/updateInventory.js --all --custom-sizes="S:25,M:40,L:35,XL:25,XXL:15" --mode=set
```

### 3. Seasonal Adjustments
Reduce inventory for off-season items:
```bash
# Reduce all sizes by 10
node server/scripts/updateInventory.js --all --sizes=all --quantity=10 --mode=subtract
```

### 4. Product Type Updates
Update all products of a specific type (e.g., all T-shirts, all hoodies):
```bash
# Set all sizes to 30 for all T-shirts
node server/scripts/updateInventory.js --product-type=PRODUCT_TYPE_ID --sizes=all --quantity=30 --mode=set

# Add 15 to M and L sizes for all hoodies
node server/scripts/updateInventory.js --product-type=PRODUCT_TYPE_ID --sizes=M,L --quantity=15 --mode=add

# Set different quantities per size for all T-shirts
node server/scripts/updateInventory.js --product-type=PRODUCT_TYPE_ID --custom-sizes="S:25,M:40,L:35,XL:25,XXL:15" --mode=set
```

### 5. Product-Specific Updates
Update individual products after sales or returns:
```bash
# Set specific product's L size to 0 (sold out)
node server/scripts/updateInventory.js --product=PRODUCT_ID --sizes=L --quantity=0 --mode=set

# Add returned items to specific product
node server/scripts/updateInventory.js --product=PRODUCT_ID --sizes=M,L --quantity=2 --mode=add
```

## Safety Guidelines

### 1. Always Use Dry Run First
Before making bulk changes, test with `--dry-run`:
```bash
node scripts/updateInventory.js --all --sizes=all --quantity=100 --dry-run
```

### 2. Start with Small Tests
Test on a single product first:
```bash
node scripts/updateInventory.js --product=TEST_PRODUCT_ID --sizes=M --quantity=10 --mode=set
```

### 3. Backup Recommendations
Consider backing up your database before major inventory changes:
```bash
# Example MongoDB backup (adjust for your setup)
mongodump --uri="your-mongodb-uri" --out backup-$(date +%Y%m%d)
```

## Script Output

### Preview Phase
```
🚀 Smart Inventory Management Script
=====================================

🔍 Finding products...

📋 INVENTORY UPDATE PREVIEW
==================================================
Mode: SET
Target: All products
Products to update: 25
Sizes: S, M, L, XL, XXL
Quantity: 50
Dry run: NO
==================================================

Anime T-Shirt Black (66e7f8a9b1c2d3e4f5678901):
  S: 10 → 50 (+40)
  M: 15 → 50 (+35)
  L: 8 → 50 (+42)
  XL: 12 → 50 (+38)
  XXL: 5 → 50 (+45)

... and 22 more products

Do you want to proceed? (y/N):
```

### Update Progress
```
🔄 Processing updates...

📊 UPDATE SUMMARY
==================
Total products: 25
Updated: 25
No changes: 0
Errors: 0

✅ Inventory update completed successfully!
```

## Error Handling

The script includes comprehensive error handling:

- **Invalid Product IDs**: Validates MongoDB ObjectId format
- **Invalid Sizes**: Only accepts S, M, L, XL, XXL
- **Missing Parameters**: Clear error messages for missing required options
- **Database Errors**: Graceful handling of connection and update failures
- **Negative Stock**: Prevents setting negative quantities

## Technical Details

### Database Integration
- Uses existing Product model and schema
- Updates `sizeStock` object with size-specific quantities
- Triggers pre-save hooks to recalculate `totalStock`
- Maintains data integrity with validation

### Performance
- Batch operations for efficiency
- Minimal database queries
- Progress tracking for large operations
- Memory-efficient processing

### Logging
- Detailed operation logs
- Error reporting with context
- Summary statistics
- Optional verbose mode

## Troubleshooting

### Common Issues

1. **"MongoDB connection failed: The `uri` parameter to `openUri()` must be a string, got "undefined""**
   - **Cause**: Missing or incorrect DATABASE environment variable
   - **Solution**: Check `server/.env` file has correct `DATABASE` URL
   ```bash
   # Example server/.env file should contain:
   DATABASE=mongodb://localhost:27017/your-database-name
   # OR for MongoDB Atlas:
   DATABASE=mongodb+srv://username:password@cluster.mongodb.net/database-name
   ```
   - Ensure MongoDB is running (if using local MongoDB)
   - Verify network connectivity

2. **"Cannot find module" errors**
   - **Cause**: Running script from wrong directory
   - **Solution**: Use correct path as shown in examples:
   ```bash
   # From project root (recommended):
   node server/scripts/updateInventory.js --all --sizes=all --quantity=5 --mode=add
   
   # OR change to server directory first:
   cd server
   node scripts/updateInventory.js --all --sizes=all --quantity=5 --mode=add
   ```

3. **"Invalid product ID"**
   - Use valid MongoDB ObjectId format (24 hex characters)
   - Get product IDs from admin panel or database

4. **"No products found"**
   - Check if products exist and aren't deleted
   - Verify product IDs are correct

5. **Permission errors on script execution**
   ```bash
   chmod +x server/scripts/updateInventory.js
   ```

### Getting Product IDs

From MongoDB shell:
```javascript
db.products.find({}, {_id: 1, name: 1}).limit(5)
```

From admin panel:
- Navigate to product management
- Copy product ID from URL or product details

## Best Practices

1. **Test First**: Always use `--dry-run` for new operations
2. **Small Batches**: Start with single products before bulk updates
3. **Monitor Results**: Use `--verbose` for important operations
4. **Regular Backups**: Backup before major inventory changes
5. **Document Changes**: Keep records of significant inventory updates
6. **Validate Results**: Check a few products manually after bulk updates

## Script Maintenance

The script is designed to be:
- **Self-documenting**: Clear help text and examples
- **Extensible**: Easy to add new features
- **Maintainable**: Clean, well-commented code
- **Robust**: Comprehensive error handling

For modifications or enhancements, the script follows Node.js best practices and MongoDB patterns used throughout the application.
