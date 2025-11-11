const { MongoClient } = require('mongodb');
require('dotenv').config();

const sourceUri = process.env.SOURCE_MONGO_URI;
const destUri = process.env.DEST_MONGO_URI;

async function migrateData() {
  const sourceClient = new MongoClient(sourceUri, { useNewUrlParser: true, useUnifiedTopology: true });
  const destClient = new MongoClient(destUri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await sourceClient.connect();
    await destClient.connect();

    const sourceDb = sourceClient.db();
    const destDb = destClient.db();

    const collections = await sourceDb.listCollections().toArray();

    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`Migrating collection: ${collectionName}`);

      const sourceCollection = sourceDb.collection(collectionName);
      const destCollection = destDb.collection(collectionName);

      const documents = await sourceCollection.find({}).toArray();

      if (documents.length > 0) {
        await destCollection.insertMany(documents);
      }
    }

    console.log('Data migration completed successfully.');
  } catch (err) {
    console.error('Error during data migration:', err);
  } finally {
    await sourceClient.close();
    await destClient.close();
  }
}

migrateData();
