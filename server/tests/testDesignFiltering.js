const mongoose = require('mongoose');
const Design = require('./models/design');
const Category = require('./models/category');
require('dotenv').config();

mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('DB CONNECTED'))
.catch(err => console.log('DB CONNECTION ERROR:', err));

async function testDesignFiltering() {
  try {
    console.log('\n=== Testing Design Filtering ===\n');

    // Test 1: Get all categories
    console.log('Test 1: Getting all categories');
    const categories = await Category.find();
    console.log(`Found ${categories.length} categories:`);
    categories.forEach(cat => {
      console.log(`- ${cat.name} (ID: ${cat._id})`);
    });

    if (categories.length === 0) {
      console.log('\nNo categories found. Please create some categories first.');
      return;
    }

    // Test 2: Get designs for first category
    const testCategory = categories[0];
    console.log(`\n\nTest 2: Filtering designs by category "${testCategory.name}" (ID: ${testCategory._id})`);
    
    // Try with ObjectId
    const designsByObjectId = await Design.find({ category: testCategory._id })
      .populate('category', 'name');
    console.log(`Found ${designsByObjectId.length} designs with category ObjectId`);

    // Try with string ID
    const designsByStringId = await Design.find({ category: testCategory._id.toString() })
      .populate('category', 'name');
    console.log(`Found ${designsByStringId.length} designs with category string ID`);

    // Test 3: Check design category structure
    console.log('\n\nTest 3: Checking design category structure');
    const sampleDesigns = await Design.find()
      .populate('category', 'name')
      .limit(5);
    
    console.log('Sample designs:');
    sampleDesigns.forEach(design => {
      console.log(`- ${design.name}:`);
      console.log(`  Category Type: ${typeof design.category}`);
      console.log(`  Category Value: ${JSON.stringify(design.category)}`);
      console.log(`  Raw Category ID: ${design.category?._id || design.category}`);
    });

    // Test 4: Test the actual query used in getAllDesigns
    console.log('\n\nTest 4: Testing getAllDesigns query');
    const query = { category: testCategory._id };
    const results = await Design.find(query)
      .select('-image')
      .populate('category', 'name');
    
    console.log(`Query: ${JSON.stringify(query)}`);
    console.log(`Results: ${results.length} designs found`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testDesignFiltering();
