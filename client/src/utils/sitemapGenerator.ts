import { BASE_URL } from '../seo/SEOConfig';

interface SitemapUrl {
  url: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  lastmod?: string;
}

export const generateSitemapXML = (urls: SitemapUrl[]): string => {
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

// Static public pages for sitemap (no admin or private routes)
export const staticPages: SitemapUrl[] = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/shop', changefreq: 'daily', priority: 0.9 },
  { url: '/customize', changefreq: 'weekly', priority: 0.9 },
  { url: '/mockup-studio', changefreq: 'weekly', priority: 0.8 },
  { url: '/about', changefreq: 'monthly', priority: 0.7 },
  { url: '/contact', changefreq: 'monthly', priority: 0.6 },
  
  // Policy pages (good for SEO trust signals)
  { url: '/size-guide', changefreq: 'monthly', priority: 0.5 },
  { url: '/shipping-policy', changefreq: 'monthly', priority: 0.4 },
  { url: '/return-policy', changefreq: 'monthly', priority: 0.4 },
  { url: '/cancellation-policy', changefreq: 'monthly', priority: 0.4 },
  { url: '/terms-of-service', changefreq: 'monthly', priority: 0.3 },
  { url: '/privacy-policy', changefreq: 'monthly', priority: 0.3 },
  
  // Auth pages (for discoverability)
  { url: '/signup', changefreq: 'monthly', priority: 0.5 },
  { url: '/signin', changefreq: 'monthly', priority: 0.5 },
];

// Dynamic category fetching from backend API with real data parsing
export const fetchDynamicCategoryPages = async (): Promise<SitemapUrl[]> => {
  try {
    // Fetch real dynamic filter data from backend domain
    const BACKEND_URL = 'https://backend.attars.club';
    const response = await fetch(`${BACKEND_URL}/api/sitemap/dynamic-data`);
    if (!response.ok) {
      throw new Error('Failed to fetch dynamic filter data');
    }
    
    const data = await response.json();
    const dynamicPages: SitemapUrl[] = [];
    
    // Generate product type URLs (match frontend: ?type=id)
    if (data.productTypes && Array.isArray(data.productTypes)) {
      data.productTypes.forEach((type: any) => {
        if (type.id) {
          dynamicPages.push({
            url: `/shop?type=${type.id}`,
            changefreq: 'weekly',
            priority: 0.8
          });
        }
      });
    }
    
    // Generate category URLs (match frontend: ?category=id)
    if (data.categories && Array.isArray(data.categories)) {
      data.categories.forEach((category: any) => {
        dynamicPages.push({
          url: `/shop?category=${category.id}`,
          changefreq: 'weekly',
          priority: 0.8
        });
      });
    }
    
    // Generate search term URLs (match frontend: ?search=term)
    if (data.searchTerms && Array.isArray(data.searchTerms)) {
      data.searchTerms.forEach((term: string) => {
        dynamicPages.push({
          url: `/shop?search=${term}`,
          changefreq: 'weekly',
          priority: 0.7
        });
      });
    }
    
    // Generate size filter URLs (match frontend: ?sizes=size)
    if (data.sizes && Array.isArray(data.sizes)) {
      data.sizes.forEach((size: string) => {
        dynamicPages.push({
          url: `/shop?sizes=${size}`,
          changefreq: 'weekly',
          priority: 0.5
        });
      });
    }
    
    // Generate availability filter URLs (match frontend: ?availability=status)
    if (data.availability && Array.isArray(data.availability)) {
      data.availability.forEach((status: string) => {
        dynamicPages.push({
          url: `/shop?availability=${status}`,
          changefreq: status === 'instock' ? 'daily' : 'weekly',
          priority: status === 'instock' ? 0.6 : 0.4
        });
      });
    }
    
    // Generate price range URLs (match frontend: ?minPrice=X&maxPrice=Y)
    if (data.priceRanges && Array.isArray(data.priceRanges)) {
      data.priceRanges.forEach((range: any) => {
        dynamicPages.push({
          url: `/shop?minPrice=${range.min}&maxPrice=${range.max}`,
          changefreq: 'weekly',
          priority: 0.5
        });
      });
    }
    
    // Generate popular combinations dynamically (high-value SEO combinations)
    if (data.productTypes && data.searchTerms) {
      // Generate combinations from actual data - take first few types and searches for popular combos
      const topTypes = data.productTypes.slice(0, 3);
      const topSearches = data.searchTerms.slice(0, 3);
      
      topTypes.forEach((type: any) => {
        topSearches.forEach((search: string) => {
          if (type.id && search) {
            dynamicPages.push({
              url: `/shop?type=${type.id}&search=${search}`,
              changefreq: 'weekly',
              priority: 0.7
            });
          }
        });
      });
    }
    
    console.log(`Generated ${dynamicPages.length} dynamic sitemap URLs from real backend data`);
    return dynamicPages;
    
  } catch (error) {
    console.warn('Failed to fetch dynamic categories, API unavailable:', error);
    // Return empty array instead of hardcoded fallback - fully dynamic approach
    return [];
  }
};


// Generate complete sitemap with dynamic categories from backend
export const generateCompleteSitemap = async (products: Array<{_id: string}>): Promise<string> => {
  try {
    // Fetch dynamic categories from backend API
    const dynamicCategories = await fetchDynamicCategoryPages();
    
    const allUrls: SitemapUrl[] = [
      ...staticPages,
      ...dynamicCategories, // Use dynamic backend data instead of hardcoded
      ...products.map(product => ({
        url: `/product/${product._id}`,
        changefreq: 'weekly' as const,
        priority: 0.7
      }))
    ];
    
    return generateSitemapXML(allUrls);
  } catch (error) {
    console.warn('Failed to generate dynamic sitemap:', error);
    
    // Graceful fallback with just static pages and products (fully dynamic approach)
    const allUrls: SitemapUrl[] = [
      ...staticPages,
      ...products.map(product => ({
        url: `/product/${product._id}`,
        changefreq: 'weekly' as const,
        priority: 0.7
      }))
    ];
    
    return generateSitemapXML(allUrls);
  }
};


// Generate product-only sitemap for API endpoint
export const generateProductSitemap = (products: Array<{_id: string, updatedAt?: string}>): string => {
  const productUrls: SitemapUrl[] = products.map(product => ({
    url: `/product/${product._id}`,
    changefreq: 'weekly' as const,
    priority: 0.7,
    lastmod: product.updatedAt ? new Date(product.updatedAt).toISOString().split('T')[0] : undefined
  }));
  
  return generateSitemapXML(productUrls);
};

// Generate sitemap index for large product catalogs
export const generateSitemapIndex = (sitemapFiles: string[]): string => {
  const today = new Date().toISOString().split('T')[0];
  
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
  const sitemapindexOpen = '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const sitemapindexClose = '</sitemapindex>';
  
  const sitemapElements = sitemapFiles.map(file => `
  <sitemap>
    <loc>${BASE_URL}/api/${file}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`).join('');
  
  return `${xmlHeader}\n${sitemapindexOpen}${sitemapElements}\n${sitemapindexClose}`;
};

// Utility function to chunk products for pagination
export const chunkProducts = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

// Generate paginated product sitemaps
export const generatePaginatedProductSitemaps = (
  products: Array<{_id: string, updatedAt?: string}>,
  productsPerSitemap: number = 100
): { filename: string; content: string }[] => {
  const productChunks = chunkProducts(products, productsPerSitemap);
  
  return productChunks.map((chunk, index) => ({
    filename: `sitemap-products-${index + 1}.xml`,
    content: generateProductSitemap(chunk)
  }));
};

export default {
  generateSitemapXML,
  generateCompleteSitemap,
  generateProductSitemap,
  generateSitemapIndex,
  generatePaginatedProductSitemaps,
  staticPages,
  fetchDynamicCategoryPages
};
