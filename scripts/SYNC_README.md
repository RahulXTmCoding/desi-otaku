# MongoDB Sync Script

Synchronize data between two MongoDB databases without creating duplicates.

## Features

- ✅ **No Duplicates**: Uses `_id` to check for existing documents
- 🔄 **Smart Updates**: Updates documents if source is newer
- ⏭️ **Skips Unchanged**: Skips documents that haven't changed
- 📊 **Detailed Reporting**: Shows inserted, updated, and skipped counts
- 🛡️ **Safe**: Won't overwrite newer data with older data

## Setup

### 1. Set Environment Variables

Add these to your `server/.env` file:

```bash
# Source database (the one with newer data)
SOURCE_MONGO_URI=mongodb://localhost:27017/your-source-db

# Destination database (the one that's behind)
DEST_MONGO_URI=mongodb://localhost:27017/your-dest-db

# Or use existing variables:
# SOURCE_MONGO_URI will default to DATABASE
# DEST_MONGO_URI will default to PRODUCTION_DATABASE
```

### 2. Install Dependencies

```bash
cd scripts
npm install
```

## Usage

### Sync Command (Recommended)

```bash
npm run sync
```

This will:
- Compare documents by `_id`
- Insert new documents from source
- Update existing documents if source is newer (based on `updatedAt`)
- Skip documents that are already up-to-date
- Show detailed progress for each collection

### Original Migrate Command (Use with caution)

```bash
npm run migrate
```

⚠️ **Warning**: This will duplicate all documents if run multiple times. Use `sync` instead.

## How It Works

### Sync Logic

For each document in source database:

1. **Check if exists** in destination by `_id`
2. **If doesn't exist**: Insert it
3. **If exists**: 
   - Compare `updatedAt` timestamps
   - Update if source is newer
   - Skip if destination is up-to-date or newer

### Collections Handled

The script automatically syncs these collections:
- ✅ users
- ✅ products
- ✅ categories
- ✅ producttypes
- ✅ orders
- ✅ carts
- ✅ addresses
- ✅ reviews
- ✅ wishlists

**Skipped**: System collections (system.indexes, system.views)

## Example Output

```
🚀 Starting MongoDB Sync...

🔄 Connecting to databases...
✅ Connected to source: tshirt-shop
✅ Connected to destination: tshirt-shop-prod

📋 Found 12 collections to sync

📦 Syncing collection: users
──────────────────────────────────────────────────
   Found 150 documents in source
   ✅ Inserted: 5
   🔄 Updated: 10
   ⏭️  Skipped: 135

📦 Syncing collection: products
──────────────────────────────────────────────────
   Found 245 documents in source
   ✅ Inserted: 12
   🔄 Updated: 8
   ⏭️  Skipped: 225

==================================================
✅ SYNC COMPLETED SUCCESSFULLY
==================================================
📊 Total documents processed: 1234
   ✅ Inserted: 45
   🔄 Updated: 32
   ⏭️  Skipped: 1157
==================================================
```

## Safety Features

### Timestamp-Based Updates

Documents are only updated if:
- Source has a newer `updatedAt` timestamp, OR
- No timestamps exist (will update to be safe)

### Preserved Data

The sync will NOT overwrite:
- Documents that are newer in destination
- Documents without changes

### Rollback

If something goes wrong:
1. Stop the script (Ctrl+C)
2. The destination database is not cleared, only updated
3. You can manually revert specific documents if needed

## Troubleshooting

### "Cannot connect to database"

- Check that both MongoDB instances are running
- Verify connection strings in `.env`
- Ensure network access if databases are remote

### "Duplicate key error"

- This shouldn't happen with sync script
- If it does, the script skips and continues
- Check the error message for details

### Large Databases

For very large databases (millions of documents):
- Consider syncing collection by collection
- Monitor memory usage
- Use MongoDB's native tools for initial bulk sync

## Advanced Usage

### Sync Specific Collections

Edit `syncMongoDB.js` and modify the collections loop:

```javascript
// Only sync products and categories
const collectionsToSync = ['products', 'categories'];
for (const collection of collections) {
  if (!collectionsToSync.includes(collection.name)) continue;
  // ... rest of sync logic
}
```

### Custom Update Logic

Modify the `UPSERT_COLLECTIONS` array to change which collections get updated:

```javascript
const UPSERT_COLLECTIONS = [
  'users',
  'products',
  // Add or remove collections here
];
```

## Related Scripts

- `migrate.js` - Original one-way migration (creates duplicates)
- `../server/scripts/truncateData.js` - Clear database
- `../server/scripts/seed.js` - Seed test data

## Best Practices

1. **Backup First**: Always backup both databases before syncing
2. **Test Environment**: Test sync in dev environment first
3. **Off-Peak Hours**: Run sync during low traffic times
4. **Monitor**: Watch the console output for any errors
5. **Verify**: Check a few documents manually after sync

## Support

For issues or questions, check the main project documentation or contact the development team.
