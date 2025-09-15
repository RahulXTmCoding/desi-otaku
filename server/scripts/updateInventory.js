#!/usr/bin/env node

/**
 * Smart Inventory Management Script
 * 
 * Updates t-shirt quantities per size with flexible options:
 * - Update all products or specific product(s)
 * - Update specific size(s) or all sizes
 * - Set absolute quantities or add/subtract amounts
 * - Support bulk operations with different quantities per size
 * 
 * Usage Examples:
 * 
 * 1. Set all sizes to 50 for all products:
 *    node updateInventory.js --all --sizes=all --quantity=50 --mode=set
 * 
 * 2. Add 10 to L and XL sizes for all products:
 *    node updateInventory.js --all --sizes=L,XL --quantity=10 --mode=add
 * 
 * 3. Set specific product's M size to 25:
 *    node updateInventory.js --product=PRODUCT_ID --sizes=M --quantity=25 --mode=set
 * 
 * 4. Set different quantities per size for all products:
 *    node updateInventory.js --all --custom-sizes="S:30,M:50,L:40,XL:30,XXL:20" --mode=set
 * 
 * 5. Update multiple specific products:
 *    node updateInventory.js --products=ID1,ID2,ID3 --sizes=all --quantity=100 --mode=set
 */

const mongoose = require('mongoose');
const readline = require('readline');
const path = require('path');

// Load environment variables from the server directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Models
const Product = require('../models/product');
const ProductType = require('../models/productType');

const VALID_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const VALID_MODES = ['set', 'add', 'subtract'];

class InventoryManager {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async connectDB() {
    try {
      await mongoose.connect(process.env.DATABASE, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      process.exit(1);
    }
  }

  async disconnectDB() {
    await mongoose.disconnect();
    this.rl.close();
    console.log('✅ Database connection closed');
  }

  parseArguments() {
    const args = process.argv.slice(2);
    const config = {
      all: false,
      products: [],
      productType: null,
      sizes: [],
      quantity: null,
      mode: 'set',
      customSizes: {},
      dryRun: false,
      verbose: false
    };

    args.forEach(arg => {
      if (arg === '--all') {
        config.all = true;
      } else if (arg.startsWith('--product=')) {
        config.products = [arg.split('=')[1]];
      } else if (arg.startsWith('--products=')) {
        config.products = arg.split('=')[1].split(',');
      } else if (arg.startsWith('--product-type=')) {
        config.productType = arg.split('=')[1];
      } else if (arg.startsWith('--sizes=')) {
        const sizes = arg.split('=')[1];
        if (sizes === 'all') {
          config.sizes = [...VALID_SIZES];
        } else {
          config.sizes = sizes.split(',').filter(size => VALID_SIZES.includes(size.toUpperCase()));
        }
      } else if (arg.startsWith('--quantity=')) {
        config.quantity = parseInt(arg.split('=')[1]);
      } else if (arg.startsWith('--mode=')) {
        const mode = arg.split('=')[1];
        if (VALID_MODES.includes(mode)) {
          config.mode = mode;
        }
      } else if (arg.startsWith('--custom-sizes=')) {
        const customSizesStr = arg.split('=')[1];
        customSizesStr.split(',').forEach(pair => {
          const [size, qty] = pair.split(':');
          if (VALID_SIZES.includes(size.toUpperCase())) {
            config.customSizes[size.toUpperCase()] = parseInt(qty);
          }
        });
      } else if (arg === '--dry-run') {
        config.dryRun = true;
      } else if (arg === '--verbose') {
        config.verbose = true;
      }
    });

    return config;
  }

  validateConfig(config) {
    const errors = [];

    // Check if target is specified
    if (!config.all && config.products.length === 0) {
      errors.push('Must specify --all or --product(s)=ID');
    }

    // Check if sizes or custom sizes are specified
    if (config.sizes.length === 0 && Object.keys(config.customSizes).length === 0) {
      errors.push('Must specify --sizes or --custom-sizes');
    }

    // Check quantity for non-custom modes
    if (Object.keys(config.customSizes).length === 0 && (config.quantity === null || isNaN(config.quantity))) {
      errors.push('Must specify valid --quantity when not using --custom-sizes');
    }

    // Validate product IDs format
    config.products.forEach(id => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        errors.push(`Invalid product ID: ${id}`);
      }
    });

    // Validate product type ID format if specified
    if (config.productType && !mongoose.Types.ObjectId.isValid(config.productType)) {
      errors.push(`Invalid product type ID: ${config.productType}`);
    }

    return errors;
  }

  async findProducts(config) {
    let query = { isDeleted: false };

    if (!config.all) {
      query._id = { $in: config.products.map(id => new mongoose.Types.ObjectId(id)) };
    }

    // Add product type filter if specified
    if (config.productType) {
      query.productType = new mongoose.Types.ObjectId(config.productType);
    }

    try {
      const products = await Product.find(query)
        .populate('productType', 'name')
        .select('_id name sizeStock totalStock productType');
      return products;
    } catch (error) {
      throw new Error(`Failed to find products: ${error.message}`);
    }
  }

  calculateNewStock(currentStock, quantity, mode) {
    switch (mode) {
      case 'set':
        return Math.max(0, quantity);
      case 'add':
        return Math.max(0, currentStock + quantity);
      case 'subtract':
        return Math.max(0, currentStock - quantity);
      default:
        return currentStock;
    }
  }

  async updateProductInventory(product, config) {
    const updates = {};
    const changes = [];

    // Determine which sizes to update and their quantities
    const sizesToUpdate = Object.keys(config.customSizes).length > 0 
      ? config.customSizes 
      : config.sizes.reduce((acc, size) => {
          acc[size] = config.quantity;
          return acc;
        }, {});

    // Calculate new stock for each size
    Object.entries(sizesToUpdate).forEach(([size, quantity]) => {
      if (VALID_SIZES.includes(size)) {
        const currentStock = product.sizeStock[size] || 0;
        const newStock = this.calculateNewStock(currentStock, quantity, config.mode);
        
        if (currentStock !== newStock) {
          updates[`sizeStock.${size}`] = newStock;
          changes.push({
            size,
            old: currentStock,
            new: newStock,
            change: newStock - currentStock
          });
        }
      }
    });

    return { updates, changes };
  }

  async performUpdate(product, updates, config) {
    if (config.dryRun) {
      return { success: true, modified: Object.keys(updates).length > 0 };
    }

    try {
      const result = await Product.findByIdAndUpdate(
        product._id,
        { $set: updates },
        { new: true, runValidators: true }
      );
      return { success: true, modified: result.modifiedCount > 0 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async showPreview(products, config) {
    console.log('\n📋 INVENTORY UPDATE PREVIEW');
    console.log('='.repeat(50));
    console.log(`Mode: ${config.mode.toUpperCase()}`);
    console.log(`Target: ${config.all ? 'All products' : `${config.products.length} specific product(s)`}`);
    console.log(`Products to update: ${products.length}`);
    
    if (Object.keys(config.customSizes).length > 0) {
      console.log('Custom sizes:', Object.entries(config.customSizes).map(([size, qty]) => `${size}:${qty}`).join(', '));
    } else {
      console.log(`Sizes: ${config.sizes.join(', ')}`);
      console.log(`Quantity: ${config.quantity}`);
    }
    
    console.log(`Dry run: ${config.dryRun ? 'YES' : 'NO'}`);
    console.log('='.repeat(50));

    // Show detailed preview for first few products
    const previewCount = Math.min(3, products.length);
    for (let i = 0; i < previewCount; i++) {
      const product = products[i];
      const { changes } = await this.updateProductInventory(product, config);
      
      if (changes.length > 0) {
        console.log(`\n${product.name} (${product._id}):`);
        changes.forEach(change => {
          const arrow = config.mode === 'set' ? '→' : (change.change > 0 ? '+' : '');
          console.log(`  ${change.size}: ${change.old} ${arrow} ${change.new} ${change.change !== 0 ? `(${change.change > 0 ? '+' : ''}${change.change})` : ''}`);
        });
      }
    }

    if (products.length > previewCount) {
      console.log(`\n... and ${products.length - previewCount} more products`);
    }
  }

  async askConfirmation() {
    return new Promise((resolve) => {
      this.rl.question('\nDo you want to proceed? (y/N): ', (answer) => {
        resolve(answer.toLowerCase().startsWith('y'));
      });
    });
  }

  async run() {
    try {
      console.log('🚀 Smart Inventory Management Script');
      console.log('=====================================\n');

      const config = this.parseArguments();
      
      // Validate configuration
      const errors = this.validateConfig(config);
      if (errors.length > 0) {
        console.error('❌ Configuration errors:');
        errors.forEach(error => console.error(`  - ${error}`));
        this.showUsage();
        process.exit(1);
      }

      // Connect to database
      await this.connectDB();

      // Find products
      console.log('🔍 Finding products...');
      const products = await this.findProducts(config);
      
      if (products.length === 0) {
        console.log('❌ No products found matching criteria');
        process.exit(1);
      }

      // Show preview
      await this.showPreview(products, config);

      // Ask for confirmation (unless dry run)
      if (!config.dryRun) {
        const confirmed = await this.askConfirmation();
        if (!confirmed) {
          console.log('❌ Operation cancelled');
          process.exit(0);
        }
      }

      // Perform updates
      console.log('\n🔄 Processing updates...');
      const results = {
        total: products.length,
        updated: 0,
        errors: 0,
        noChanges: 0
      };

      for (const product of products) {
        const { updates, changes } = await this.updateProductInventory(product, config);
        
        if (Object.keys(updates).length === 0) {
          results.noChanges++;
          if (config.verbose) {
            console.log(`⚪ ${product.name}: No changes needed`);
          }
          continue;
        }

        const result = await this.performUpdate(product, updates, config);
        
        if (result.success) {
          results.updated++;
          if (config.verbose) {
            console.log(`✅ ${product.name}: Updated ${changes.length} size(s)`);
          }
        } else {
          results.errors++;
          console.error(`❌ ${product.name}: ${result.error}`);
        }
      }

      // Show summary
      console.log('\n📊 UPDATE SUMMARY');
      console.log('==================');
      console.log(`Total products: ${results.total}`);
      console.log(`Updated: ${results.updated}`);
      console.log(`No changes: ${results.noChanges}`);
      console.log(`Errors: ${results.errors}`);
      
      if (config.dryRun) {
        console.log('\n💡 This was a dry run. No actual changes were made.');
        console.log('Remove --dry-run flag to apply changes.');
      } else {
        console.log('\n✅ Inventory update completed successfully!');
      }

    } catch (error) {
      console.error('💥 Script failed:', error.message);
      process.exit(1);
    } finally {
      await this.disconnectDB();
    }
  }

  showUsage() {
    console.log(`
Usage: node updateInventory.js [options]

Options:
  --all                    Update all products
  --product=ID             Update specific product
  --products=ID1,ID2       Update multiple products
  --product-type=ID        Update all products of specific type
  --sizes=S,M,L,XL,XXL     Sizes to update (or 'all')
  --quantity=NUMBER        Quantity value
  --mode=set|add|subtract  Operation mode (default: set)
  --custom-sizes=S:30,M:50 Different quantities per size
  --dry-run                Preview changes without applying
  --verbose                Show detailed progress

Examples:
  # Set all sizes to 50 for all products
  node updateInventory.js --all --sizes=all --quantity=50

  # Add 10 to M and L sizes for specific product
  node updateInventory.js --product=60f1b2c3d4e5f6789abc --sizes=M,L --quantity=10 --mode=add

  # Update all T-shirts (product type) with custom quantities
  node updateInventory.js --product-type=60f1b2c3d4e5f6789abc --custom-sizes="S:30,M:50,L:40,XL:30,XXL:20"

  # Set custom quantities per size for all products
  node updateInventory.js --all --custom-sizes="S:30,M:50,L:40,XL:30,XXL:20"

  # Preview changes without applying
  node updateInventory.js --all --sizes=all --quantity=100 --dry-run
`);
  }
}

// Execute if called directly
if (require.main === module) {
  const manager = new InventoryManager();
  manager.run().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = InventoryManager;
