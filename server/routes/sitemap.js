const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const Category = require('../models/category');
const ProductType = require('../models/productType');

// Sitemap generation utilities (adapted from frontend)
const BASE_URL = 'https://attars.club';

const generateSitemapXML = (urls) => {
  const today = new Date().toISOString().split('T')[0];
  
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
  const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const urlsetClose = '</urlset>';
  
  const urlElements = urls.map(({ url, changefreq, priority, lastmod }) => `
  <url>
    <loc>${BASE_URL}${url}</loc>
    <lastmod>${lastmod || today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('');
  
  return `${xmlHeader}\n${urlsetOpen}${urlElements}\n${urlsetClose}`;
};

const generateSitemapIndex = (sitemapFiles) => {
  const today = new Date().toISOString().split('T')[0];
  
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
  const sitemapindexOpen = '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const sitemapindexClose = '</sitemapindex>';
  
  // Sitemap index should point to backend domain where sitemaps are served
  const BACKEND_URL = 'https://backend.attars.club';
  const sitemapElements = sitemapFiles.map(file => `
  <sitemap>
    <loc>${BACKEND_URL}/api/sitemap/${file}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`).join('');
  
  return `${xmlHeader}\n${sitemapindexOpen}${sitemapElements}\n${sitemapindexClose}`;
};

// Cache configuration
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
let sitemapCache = {
  products: null,
  index: null,
  lastGenerated: null
};

// Static pages (public routes only)
const staticPages = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/shop', changefreq: 'daily', priority: 0.9 },
  { url: '/customize', changefreq: 'weekly', priority: 0.9 },
  { url: '/mockup-studio', changefreq: 'weekly', priority: 0.8 },
  { url: '/about', changefreq: 'monthly', priority: 0.7 },
  { url: '/contact', changefreq: 'monthly', priority: 0.6 },
  { url: '/size-guide', changefreq: 'monthly', priority: 0.5 },
  { url: '/shipping-policy', changefreq: 'monthly', priority: 0.4 },
  { url: '/return-policy', changefreq: 'monthly', priority: 0.4 },
  { url: '/cancellation-policy', changefreq: 'monthly', priority: 0.4 },
  { url: '/terms-of-service', changefreq: 'monthly', priority: 0.3 },
  { url: '/privacy-policy', changefreq: 'monthly', priority: 0.3 },
  { url: '/signup', changefreq: 'monthly', priority: 0.5 },
  { url: '/signin', changefreq: 'monthly', priority: 0.5 },
];

// Generate dynamic category pages from database
const generateDynamicCategoryPages = async () => {
  try {
    const dynamicPages = [];
    
    // Fetch real product types from database
    const productTypes = await ProductType.find({ isActive: true }).select('_id name slug displayName').lean();
    productTypes.forEach(type => {
      // Use ObjectID (not slug) to match frontend filter implementation
      if (type._id) {
        dynamicPages.push({
          url: `/shop?type=${type._id}`,
          changefreq: 'weekly',
          priority: 0.8
        });
      }
    });
    
    // Fetch real main categories from database
    const categories = await Category.find({ 
      isActive: true,
      parentCategory: { $exists: false } // Only main categories
    }).select('_id name slug').lean();
    
    categories.forEach(category => {
      // Use ObjectID to match frontend filter implementation
      if (category._id) {
        dynamicPages.push({
          url: `/shop?category=${category._id}`,
          changefreq: 'weekly',
          priority: 0.8
        });
      }
    });
    
    // Fetch subcategories and add them too
    const subcategories = await Category.find({ 
      isActive: true,
      parentCategory: { $exists: true, $ne: null }
    }).select('_id name slug parentCategory').lean();
    
    subcategories.forEach(subcategory => {
      if (subcategory.parentCategory) {
        dynamicPages.push({
          url: `/shop?category=${subcategory.parentCategory}&subcategory=${subcategory._id}`,
          changefreq: 'weekly',
          priority: 0.7
        });
      }
    });
    
    // Add popular search terms (keep some popular ones for SEO)
    const popularSearches = [
      'anime', 'streetwear', 'premium', 'designer', 'contemporary',
      'indian-culture', 'tv-shows', 'original-designs', 'oversized',
      'naruto', 'one-piece', 'dragon-ball', 'attack-on-titan'
    ];
    
    popularSearches.forEach(search => {
      dynamicPages.push({
        url: `/shop?search=${search}`,
        changefreq: 'weekly',
        priority: 0.7
      });
    });
    
    // Add availability filters
    dynamicPages.push(
      { url: '/shop?availability=instock', changefreq: 'daily', priority: 0.6 },
      { url: '/shop?availability=outofstock', changefreq: 'weekly', priority: 0.4 }
    );
    
    // Add size filters
    const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
    sizes.forEach(size => {
      dynamicPages.push({
        url: `/shop?sizes=${size}`,
        changefreq: 'weekly',
        priority: 0.5
      });
    });
    
    return dynamicPages;
    
  } catch (error) {
    console.error('Error generating dynamic category pages:', error);
    // Fallback to static pages if database query fails
    return [
      { url: '/shop?type=tshirt', changefreq: 'weekly', priority: 0.8 },
      { url: '/shop?type=hoodie', changefreq: 'weekly', priority: 0.8 },
      { url: '/shop?search=anime', changefreq: 'weekly', priority: 0.8 },
      { url: '/shop?search=streetwear', changefreq: 'weekly', priority: 0.8 }
    ];
  }
};

// Check if cache is valid
const isCacheValid = () => {
  return sitemapCache.lastGenerated && 
         (Date.now() - sitemapCache.lastGenerated < CACHE_DURATION);
};

// Generate sitemap index
router.get('/sitemap-index.xml', async (req, res) => {
  try {
    // Check cache first
    if (isCacheValid() && sitemapCache.index) {
      res.set('Content-Type', 'application/xml');
      return res.send(sitemapCache.index);
    }

    // Count total products to determine if we need pagination
    const productCount = await Product.countDocuments({ isActive: true });
    const sitemapFiles = ['sitemap-static.xml'];
    
    // Add product sitemaps based on count
    if (productCount > 0) {
      const productsPerSitemap = 100;
      const totalSitemaps = Math.ceil(productCount / productsPerSitemap);
      
      for (let i = 1; i <= totalSitemaps; i++) {
        sitemapFiles.push(`sitemap-products-${i}.xml`);
      }
    }

    const sitemapIndex = generateSitemapIndex(sitemapFiles);
    
    // Cache the result
    sitemapCache.index = sitemapIndex;
    sitemapCache.lastGenerated = Date.now();

    res.set('Content-Type', 'application/xml');
    res.send(sitemapIndex);
  } catch (error) {
    console.error('Error generating sitemap index:', error);
    res.status(500).send('Error generating sitemap index');
  }
});

// Generate static pages sitemap
router.get('/sitemap-static.xml', async (req, res) => {
  try {
    // Generate dynamic category pages from database
    const dynamicCategoryPages = await generateDynamicCategoryPages();
    const allStaticUrls = [...staticPages, ...dynamicCategoryPages];
    const staticSitemap = generateSitemapXML(allStaticUrls);
    
    res.set('Content-Type', 'application/xml');
    res.send(staticSitemap);
  } catch (error) {
    console.error('Error generating static sitemap:', error);
    res.status(500).send('Error generating static sitemap');
  }
});

// Generate paginated product sitemaps
router.get('/sitemap-products-:page.xml', async (req, res) => {
  try {
    const page = parseInt(req.params.page);
    const productsPerPage = 100;
    const skip = (page - 1) * productsPerPage;

    // Check cache for this specific page
    const cacheKey = `products-${page}`;
    if (isCacheValid() && sitemapCache[cacheKey]) {
      res.set('Content-Type', 'application/xml');
      return res.send(sitemapCache[cacheKey]);
    }

    // Fetch products for this page (only active products)
    const products = await Product.find({ isActive: true })
      .select('_id updatedAt')
      .skip(skip)
      .limit(productsPerPage)
      .lean();

    if (products.length === 0) {
      return res.status(404).send('Sitemap page not found');
    }

    // Generate product URLs
    const productUrls = products.map(product => ({
      url: `/product/${product._id}`,
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: product.updatedAt ? new Date(product.updatedAt).toISOString().split('T')[0] : undefined
    }));

    const productSitemap = generateSitemapXML(productUrls);
    
    // Cache this page
    sitemapCache[cacheKey] = productSitemap;
    sitemapCache.lastGenerated = Date.now();

    res.set('Content-Type', 'application/xml');
    res.send(productSitemap);
  } catch (error) {
    console.error('Error generating product sitemap:', error);
    res.status(500).send('Error generating product sitemap');
  }
});

// Main sitemap.xml endpoint (backwards compatibility)
router.get('/sitemap.xml', async (req, res) => {
  try {
    // For small sites, generate complete sitemap
    const productCount = await Product.countDocuments({ isActive: true });
    
    if (productCount <= 500) {
      // Generate complete sitemap for smaller catalogs
      const products = await Product.find({ isActive: true })
        .select('_id updatedAt')
        .lean();

      const productUrls = products.map(product => ({
        url: `/product/${product._id}`,
        changefreq: 'weekly',
        priority: 0.7,
        lastmod: product.updatedAt ? new Date(product.updatedAt).toISOString().split('T')[0] : undefined
      }));

      // Generate dynamic category pages from database
      const dynamicCategoryPages = await generateDynamicCategoryPages();
      const allUrls = [...staticPages, ...dynamicCategoryPages, ...productUrls];
      const completeSitemap = generateSitemapXML(allUrls);
      
      res.set('Content-Type', 'application/xml');
      res.send(completeSitemap);
    } else {
      // Redirect to sitemap index for larger catalogs
      res.redirect('/api/sitemap/sitemap-index.xml');
    }
  } catch (error) {
    console.error('Error generating main sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// Clear sitemap cache endpoint (for admin use)
router.post('/clear-cache', (req, res) => {
  sitemapCache = {
    products: null,
    index: null,
    lastGenerated: null
  };
  res.json({ message: 'Sitemap cache cleared successfully' });
});

// Dynamic filter data endpoint for frontend sitemap generation
router.get('/dynamic-data', async (req, res) => {
  try {
    // Get real categories (main categories only, like frontend does)
    const categories = await Category.find({ 
      isActive: true,
      parentCategory: { $exists: false } // Only main categories
    }).select('_id name slug').lean();
    
    // Get real product types (active ones only)
    const productTypes = await ProductType.find({ isActive: true })
      .select('_id name slug displayName')
      .lean();
    
    // Get available sizes (match frontend hardcoded array)
    const availableSizes = ['S', 'M', 'L', 'XL', 'XXL'];
    
    // Popular search terms (SEO optimized, match what frontend might search)
    const popularSearches = [
      'anime', 'streetwear', 'premium', 'designer', 'contemporary',
      'indian-culture', 'tv-shows', 'original-designs', 'oversized',
      'naruto', 'one-piece', 'dragon-ball', 'attack-on-titan'
    ];
    
    // Availability options (match frontend logic)
    const availabilityOptions = ['instock', 'outofstock'];
    
    // Price ranges (common ranges for sitemap)
    const priceRanges = [
      { min: 0, max: 500 },
      { min: 500, max: 1000 },
      { min: 1000, max: 2000 },
      { min: 2000, max: 5000 }
    ];
    
    const response = {
      categories: categories.map(cat => ({
        id: cat._id,
        name: cat.name,
        slug: cat.slug
      })),
      productTypes: productTypes.map(type => ({
        id: type._id,
        name: type.name,
        slug: type.slug || type.displayName?.toLowerCase().replace(/\s+/g, '-'),
        displayName: type.displayName
      })),
      sizes: availableSizes,
      searchTerms: popularSearches,
      availability: availabilityOptions,
      priceRanges: priceRanges
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error getting dynamic filter data:', error);
    res.status(500).json({ error: 'Error getting dynamic filter data' });
  }
});

// Sitemap statistics endpoint
router.get('/stats', async (req, res) => {
  try {
    const productCount = await Product.countDocuments({ isActive: true });
    const dynamicCategoryPages = await generateDynamicCategoryPages();
    const staticPagesCount = staticPages.length + dynamicCategoryPages.length;
    
    res.json({
      totalProducts: productCount,
      staticPages: staticPagesCount,
      totalUrls: productCount + staticPagesCount,
      cacheStatus: isCacheValid() ? 'valid' : 'expired',
      lastGenerated: sitemapCache.lastGenerated ? new Date(sitemapCache.lastGenerated).toISOString() : null
    });
  } catch (error) {
    console.error('Error getting sitemap stats:', error);
    res.status(500).json({ error: 'Error getting sitemap statistics' });
  }
});

module.exports = router;
