require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("../models/category");

mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("DB CONNECTED");
    migrateCategories();
  })
  .catch((err) => {
    console.log("DB CONNECTION ERROR:", err);
  });

async function migrateCategories() {
  try {
    console.log("Starting category migration...");

    // Update all existing categories to have the new fields
    const categories = await Category.find({});
    console.log(`Found ${categories.length} categories to migrate`);

    for (const category of categories) {
      // Set default values for new fields if they don't exist
      let updated = false;

      if (category.parentCategory === undefined) {
        category.parentCategory = null;
        updated = true;
      }

      if (category.level === undefined) {
        category.level = 0; // All existing categories are main categories
        updated = true;
      }

      if (category.isActive === undefined) {
        category.isActive = true;
        updated = true;
      }

      if (!category.slug) {
        category.slug = category.name
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/--+/g, '-')
          .trim();
        updated = true;
      }

      if (updated) {
        await category.save();
        console.log(`✓ Updated category: ${category.name}`);
      } else {
        console.log(`✓ Category already up to date: ${category.name}`);
      }
    }

    console.log("\nMigration completed successfully!");

    // Optionally, create some sample subcategories
    const createSamples = process.argv.includes('--create-samples');
    if (createSamples) {
      console.log("\nCreating sample subcategories...");
      
      // Find the Anime category
      const animeCategory = await Category.findOne({ name: 'Anime' });
      if (animeCategory) {
        const animeSubcategories = [
          { name: 'One Piece', parentCategory: animeCategory._id, icon: '🏴‍☠️' },
          { name: 'Attack on Titan', parentCategory: animeCategory._id, icon: '⚔️' },
          { name: 'Dragon Ball', parentCategory: animeCategory._id, icon: '🐉' },
          { name: 'Naruto', parentCategory: animeCategory._id, icon: '🍥' },
          { name: 'Demon Slayer', parentCategory: animeCategory._id, icon: '🗡️' }
        ];

        for (const subcat of animeSubcategories) {
          const existing = await Category.findOne({ 
            name: subcat.name, 
            parentCategory: subcat.parentCategory 
          });
          
          if (!existing) {
            const newSubcategory = new Category(subcat);
            await newSubcategory.save();
            console.log(`✓ Created subcategory: ${subcat.name} under Anime`);
          } else {
            console.log(`✓ Subcategory already exists: ${subcat.name}`);
          }
        }
      }

      // Find the Gaming category
      const gamingCategory = await Category.findOne({ name: 'Gaming' });
      if (gamingCategory) {
        const gamingSubcategories = [
          { name: 'PlayStation', parentCategory: gamingCategory._id, icon: '🎮' },
          { name: 'Xbox', parentCategory: gamingCategory._id, icon: '🎯' },
          { name: 'Nintendo', parentCategory: gamingCategory._id, icon: '🍄' },
          { name: 'PC Gaming', parentCategory: gamingCategory._id, icon: '💻' }
        ];

        for (const subcat of gamingSubcategories) {
          const existing = await Category.findOne({ 
            name: subcat.name, 
            parentCategory: subcat.parentCategory 
          });
          
          if (!existing) {
            const newSubcategory = new Category(subcat);
            await newSubcategory.save();
            console.log(`✓ Created subcategory: ${subcat.name} under Gaming`);
          } else {
            console.log(`✓ Subcategory already exists: ${subcat.name}`);
          }
        }
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}
