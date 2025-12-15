# Image Migration Guide

## Overview
This guide walks you through migrating your existing product images to a 3-version format for optimal performance.

## What This Does

**Before Migration:**
- Single image per product (~1MB each)
- Slow loading on shop/grid pages
- No optimization

**After Migration:**
- 3 versions per image:
  - **Thumb** (400x400, ~50KB) - For cards/grids
  - **Medium** (800x800, ~150KB) - For product details
  - **Original** (1920x1920, ~500KB-1MB) - For zoom/full quality

**Performance Improvement:**
- 🚀 **~20x faster** thumbnail loading
- 🚀 **~8x faster** product page loading
- 💰 **60-80% less bandwidth** usage

## Prerequisites

1. **Install Sharp** (image processing library):
```bash
cd server
npm install sharp
```

2. **Ensure R2 is configured** in your `.env`:
```bash
USE_R2=true
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your-domain.com
```

3. **Database connection** must be working

## Migration Steps

### Step 1: Backup Your Database
```bash
# MongoDB dump
mongodump --uri="your_mongodb_uri" --out=./backup-$(date +%Y%m%d)
```

### Step 2: Run Migration Script
```bash
cd server
node scripts/migrate-images-to-versions.js
```

**What happens:**
1. ✅ Connects to database
2. ✅ Finds all products with images
3. ✅ Downloads each image
4. ✅ Generates 3 optimized versions
5. ✅ Uploads all versions to R2
6. ✅ Updates database with new URLs
7. ✅ Shows progress and statistics

**Example output:**
```
🚀 Starting Image Migration to 3-Version Format

Configuration:
  - Thumb: 400x400 @ 80% quality
  - Medium: 800x800 @ 85% quality
  - Original: 1920x1920 @ 90% quality

Found 50 products with 150 images

[1/50] Processing: Cool T-Shirt (64f3a2...)
  Images to process: 3
  Image 1/3: front-view.jpg
    Downloading: https://cdn.com/products/123/front-view.jpg
    Downloaded original: 1.2MB
    ✅ Generated thumb: 400x400, 0.05MB
    ✅ Generated medium: 800x800, 0.15MB
    ✅ Generated original: 1920x1920, 0.80MB
    ✅ Uploaded thumb: https://cdn.com/products/123/front-view-thumb.jpg
    ✅ Uploaded medium: https://cdn.com/products/123/front-view-medium.jpg
    ✅ Uploaded original: https://cdn.com/products/123/front-view-original.jpg
    ✅ Image migrated successfully
  ...
  ✅ Product saved successfully

============================================================
📊 Migration Summary
============================================================
Total Products: 50
  ✅ Processed: 50
  ❌ Failed: 0

Total Images: 150
  ✅ Processed: 150
  ⏭️  Skipped: 0
  ❌ Failed: 0
============================================================

✅ Migration completed successfully!
```

### Step 3: Update Cloudflare Worker

Deploy the new worker code:

```bash
# Copy the new worker code
cp cloudflare-worker-multi-version.js wrangler-worker.js

# Deploy to Cloudflare
npx wrangler deploy
```

The worker now supports `?size=thumb|medium|original` parameter.

### Step 4: Update Frontend (Optional)

Use the new image helper in your components:

```tsx
import { getProductImageUrl } from '@/utils/imageHelper';

// In your component
const ProductCard = ({ product }) => {
  return (
    <img 
      src={getProductImageUrl(product, 'thumb')} 
      alt={product.name}
      loading="lazy"
    />
  );
};

// For product detail page
const ProductDetail = ({ product }) => {
  return (
    <img 
      src={getProductImageUrl(product, 'medium')} 
      alt={product.name}
    />
  );
};
```

## Usage Examples

### Backend (Automatic on New Uploads)
New products automatically get 3 versions:
```javascript
// Just upload normally - versions are generated automatically
const result = await createProduct({
  name: 'New Product',
  images: [/* base64 images */]
});

// Database will contain:
{
  images: [{
    url: 'https://cdn.com/products/123/image-original.jpg',
    versions: {
      thumb: 'https://cdn.com/products/123/image-thumb.jpg',
      medium: 'https://cdn.com/products/123/image-medium.jpg',
      original: 'https://cdn.com/products/123/image-original.jpg'
    }
  }]
}
```

### Frontend Usage

**Old way:**
```tsx
<img src={product.images[0].url} /> // Always loads 1MB image
```

**New way:**
```tsx
// Option 1: Use versions directly (if migrated)
<img src={product.images[0].versions?.thumb} />

// Option 2: Use helper (works with old and new)
import { getProductImageUrl } from '@/utils/imageHelper';
<img src={getProductImageUrl(product, 'thumb')} />

// Option 3: Use size parameter (fallback for legacy)
<img src={`${product.images[0].url}?size=thumb`} />
```

## Rollback

If something goes wrong:

1. **Restore database from backup:**
```bash
mongorestore --uri="your_mongodb_uri" ./backup-YYYYMMDD
```

2. **Keep old images** (they're not deleted, just new versions added)

## Monitoring

Check R2 storage usage:
```bash
# Cloudflare dashboard > R2 > Your Bucket > Metrics
```

Expected storage increase:
- **Before:** 50 products × 3 images × 1MB = ~150MB
- **After:** 50 products × 3 images × (50KB+150KB+800KB) = ~150MB
- **Total:** ~300MB (2x increase, but much faster delivery)

## Troubleshooting

### "Sharp not found"
```bash
cd server
npm install sharp --save
```

### "R2 not configured"
Check `.env` file has all R2 variables set.

### "Image download failed"
- Check if original URLs are accessible
- Check network/firewall settings
- Some images might be behind authentication

### "Migration taking too long"
- Run during off-peak hours
- Process products in batches
- Monitor R2 rate limits

## Cost Analysis

**Storage Cost** (Cloudflare R2):
- $0.015 per GB/month
- 300MB = ~$0.005/month (negligible)

**Bandwidth Savings:**
- Before: 1000 views × 1MB = 1GB bandwidth
- After: 1000 views × 50KB = 50MB bandwidth
- **Savings: 95% less bandwidth**

## Next Steps

After migration:

1. ✅ Update frontend components to use `getProductImageUrl()`
2. ✅ Add lazy loading to images
3. ✅ Implement image preloading for above-the-fold content
4. ✅ Monitor Core Web Vitals improvement
5. ✅ Celebrate faster load times! 🎉

## Support

If you encounter issues:
1. Check migration logs
2. Verify R2 configuration
3. Test with a single product first
4. Check Cloudflare Worker logs
