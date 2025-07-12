require("dotenv").config();
const mongoose = require('mongoose');
const Category = require('../models/category');

// MongoDB URI
const MONGODB_URI = process.env.DATABASE || 'mongodb://localhost:27017/tshirtstore';

async function updateCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get all categories
    const categories = await Category.find({});
    console.log(`Found ${categories.length} categories to update`);

    // Update each category
    for (const category of categories) {
      const updates = {};
      
      // Add isActive field if missing
      if (category.isActive === undefined) {
        updates.isActive = true;
      }
      
      // Add level field if missing
      if (category.level === undefined) {
        updates.level = category.parentCategory ? 1 : 0;
      }
      
      // Add icon field if missing
      if (category.icon === undefined) {
        updates.icon = '📁';
      }
      
      // Generate slug if missing
      if (!category.slug) {
        updates.slug = category.name
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/--+/g, '-')
          .trim();
      }
      
      // Update if there are changes
      if (Object.keys(updates).length > 0) {
        await Category.updateOne(
          { _id: category._id },
          { $set: updates }
        );
        console.log(`Updated category: ${category.name}`, updates);
      }
    }

    console.log('All categories updated successfully!');
    
    // Show updated categories
    const updatedCategories = await Category.find({}).select('name level icon isActive slug');
    console.log('\nUpdated categories:');
    updatedCategories.forEach(cat => {
      console.log(`- ${cat.name}: level=${cat.level}, icon=${cat.icon}, isActive=${cat.isActive}, slug=${cat.slug}`);
    });

  } catch (error) {
    console.error('Error updating categories:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the update
updateCategories();
