const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('DB CONNECTED'))
.catch(err => console.log('DB CONNECTION ERROR:', err));

const Design = require('./models/design');

async function testDesignImages() {
  try {
    console.log('\n=== Testing Design Image Storage ===\n');
    
    // Find a few designs to check their image configuration
    const designs = await Design.find()
      .select('name imageUrl image.contentType')
      .limit(5);
    
    console.log(`Found ${designs.length} designs:\n`);
    
    designs.forEach((design, index) => {
      console.log(`${index + 1}. ${design.name}`);
      console.log(`   - Has imageUrl: ${!!design.imageUrl} ${design.imageUrl ? `(${design.imageUrl})` : ''}`);
      console.log(`   - Has image data: ${!!(design.image && design.image.contentType)}`);
      console.log('');
    });
    
    // Count designs by storage type
    const [totalDesigns, urlBasedDesigns, dataBasedDesigns] = await Promise.all([
      Design.countDocuments(),
      Design.countDocuments({ imageUrl: { $exists: true, $ne: null } }),
      Design.countDocuments({ 'image.contentType': { $exists: true, $ne: null } })
    ]);
    
    console.log('\nDesign Image Storage Summary:');
    console.log(`Total designs: ${totalDesigns}`);
    console.log(`URL-based designs: ${urlBasedDesigns}`);
    console.log(`Data-based designs: ${dataBasedDesigns}`);
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testDesignImages();
