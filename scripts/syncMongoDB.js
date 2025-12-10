const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '../server/.env' });

// Configuration
const sourceUri = process.env.SOURCE_MONGO_URI || process.env.DATABASE;
const destUri = process.env.DEST_MONGO_URI || process.env.PRODUCTION_DATABASE;

// Collections to skip during sync
const SKIP_COLLECTIONS = ['system.indexes', 'system.views'];

// Collections that should use upsert (update if exists, insert if not)
const UPSERT_COLLECTIONS = [
  'users',
  'products',
  'categories',
  'producttypes',
  'orders',
  'carts',
  'addresses',
  'reviews',
  'wishlists'
];

async function syncData() {
  if (!sourceUri || !destUri) {
    console.error('❌ Error: SOURCE_MONGO_URI and DEST_MONGO_URI must be defined in .env');
    console.log('Please set these environment variables:');
    console.log('SOURCE_MONGO_URI=mongodb://...');
    console.log('DEST_MONGO_URI=mongodb://...');
    process.exit(1);
  }

  const sourceClient = new MongoClient(sourceUri, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  });
  const destClient = new MongoClient(destUri, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  });

  let totalDocsSynced = 0;
  let totalDocsUpdated = 0;
  let totalDocsInserted = 0;
  let totalDocsSkipped = 0;

  try {
    console.log('🔄 Connecting to databases...');
    await sourceClient.connect();
    await destClient.connect();

    const sourceDb = sourceClient.db();
    const destDb = destClient.db();

    console.log(`✅ Connected to source: ${sourceDb.databaseName}`);
    console.log(`✅ Connected to destination: ${destDb.databaseName}\n`);

    const collections = await sourceDb.listCollections().toArray();

    console.log(`📋 Found ${collections.length} collections to sync\n`);

    for (const collection of collections) {
      const collectionName = collection.name;

      // Skip system collections
      if (SKIP_COLLECTIONS.includes(collectionName)) {
        console.log(`⏭️  Skipping system collection: ${collectionName}`);
        continue;
      }

      console.log(`\n📦 Syncing collection: ${collectionName}`);
      console.log('─'.repeat(50));

      const sourceCollection = sourceDb.collection(collectionName);
      const destCollection = destDb.collection(collectionName);

      // Get documents from source
      const documents = await sourceCollection.find({}).toArray();
      console.log(`   Found ${documents.length} documents in source`);

      if (documents.length === 0) {
        console.log('   ⏭️  No documents to sync');
        continue;
      }

      let inserted = 0;
      let updated = 0;
      let skipped = 0;

      // Process each document
      for (const doc of documents) {
        try {
          // Check if document exists in destination
          const existing = await destCollection.findOne({ _id: doc._id });

          if (existing) {
            // Document exists - check if we should update
            const docUpdatedAt = doc.updatedAt || doc.createdAt;
            const existingUpdatedAt = existing.updatedAt || existing.createdAt;

            // Update if source is newer or if using upsert collection
            if (UPSERT_COLLECTIONS.includes(collectionName.toLowerCase())) {
              if (!existingUpdatedAt || !docUpdatedAt || 
                  new Date(docUpdatedAt) > new Date(existingUpdatedAt)) {
                await destCollection.replaceOne({ _id: doc._id }, doc);
                updated++;
              } else {
                skipped++;
              }
            } else {
              skipped++;
            }
          } else {
            // Document doesn't exist - insert it
            await destCollection.insertOne(doc);
            inserted++;
          }
        } catch (error) {
          console.error(`   ❌ Error processing document ${doc._id}:`, error.message);
        }
      }

      console.log(`   ✅ Inserted: ${inserted}`);
      console.log(`   🔄 Updated: ${updated}`);
      console.log(`   ⏭️  Skipped: ${skipped}`);

      totalDocsInserted += inserted;
      totalDocsUpdated += updated;
      totalDocsSkipped += skipped;
      totalDocsSynced += documents.length;
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ SYNC COMPLETED SUCCESSFULLY');
    console.log('='.repeat(50));
    console.log(`📊 Total documents processed: ${totalDocsSynced}`);
    console.log(`   ✅ Inserted: ${totalDocsInserted}`);
    console.log(`   🔄 Updated: ${totalDocsUpdated}`);
    console.log(`   ⏭️  Skipped: ${totalDocsSkipped}`);
    console.log('='.repeat(50));

  } catch (err) {
    console.error('\n❌ Error during data sync:', err);
    process.exit(1);
  } finally {
    await sourceClient.close();
    await destClient.close();
    console.log('\n🔌 Disconnected from databases');
  }
}

// Run the sync
console.log('🚀 Starting MongoDB Sync...\n');
syncData();
