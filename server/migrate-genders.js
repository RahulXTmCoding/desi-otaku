/**
 * Migration Script: Add Default Genders to ProductTypes and Categories
 * 
 * This script sets default genders ['men', 'women', 'unisex'] on all existing
 * ProductTypes and Categories that don't have a genders field.
 * 
 * Run: node scripts/migrate-genders.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI or DATABASE environment variable not set');
  process.exit(1);
}

async function migrate() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to database');

    // Import models
    const ProductType = require('./models/ProductType');
    const Category = require('./models/category');

    // Update ProductTypes without genders
    console.log('\nMigrating ProductTypes...');
    const productTypesResult = await ProductType.updateMany(
      { 
        $or: [
          { genders: { $exists: false } },
          { genders: { $size: 0 } },
          { genders: null }
        ]
      },
      { 
        $set: { genders: ['men', 'unisex'] }
      }
    );
    console.log(`Updated ${productTypesResult.modifiedCount} ProductTypes`);

    // Update Categories without genders
    console.log('\nMigrating Categories...');
    const categoriesResult = await Category.updateMany(
      { 
        $or: [
          { genders: { $exists: false } },
          { genders: { $size: 0 } },
          { genders: null }
        ]
      },
      { 
        $set: { genders: ['men', 'unisex'] }
      }
    );
    console.log(`Updated ${categoriesResult.modifiedCount} Categories`);

    // Show summary
    console.log('\n=== Migration Summary ===');
    const totalProductTypes = await ProductType.countDocuments();
    const totalCategories = await Category.countDocuments();
    console.log(`Total ProductTypes: ${totalProductTypes}`);
    console.log(`Total Categories: ${totalCategories}`);

    // List all product types with their genders
    console.log('\n=== ProductTypes ===');
    const productTypes = await ProductType.find({}, 'displayName genders').lean();
    productTypes.forEach(pt => {
      console.log(`  ${pt.displayName}: ${pt.genders?.join(', ') || 'none'}`);
    });

    // List all categories with their genders
    console.log('\n=== Categories ===');
    const categories = await Category.find({}, 'name genders').lean();
    categories.forEach(cat => {
      console.log(`  ${cat.name}: ${cat.genders?.join(', ') || 'none'}`);
    });

    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from database');
  }
}

migrate();
