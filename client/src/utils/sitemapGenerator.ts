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

// Static pages for sitemap
export const staticPages: SitemapUrl[] = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/shop', changefreq: 'daily', priority: 0.9 },
  { url: '/customize', changefreq: 'weekly', priority: 0.9 },
  { url: '/about', changefreq: 'monthly', priority: 0.7 },
  { url: '/contact', changefreq: 'monthly', priority: 0.6 },
  { url: '/signup', changefreq: 'monthly', priority: 0.5 },
  { url: '/signin', changefreq: 'monthly', priority: 0.5 },
  { url: '/mockup-studio', changefreq: 'weekly', priority: 0.8 },
];

// Categories for sitemap (anime categories)
export const categoryPages: string[] = [
  '/shop?category=anime&subcategory=naruto',
  '/shop?category=anime&subcategory=one-piece',
  '/shop?category=anime&subcategory=demon-slayer',
  '/shop?category=anime&subcategory=attack-on-titan',
  '/shop?category=anime&subcategory=jujutsu-kaisen',
  '/shop?category=anime&subcategory=dragon-ball',
];

// Product types for sitemap
export const productTypePages: string[] = [
  '/shop?type=tshirt',
  '/shop?type=hoodie',
  '/shop?type=oversized',
  '/shop?type=sweatshirt',
];

// Generate complete sitemap
export const generateCompleteSitemap = (products: Array<{_id: string}>): string => {
  const allUrls: SitemapUrl[] = [
    ...staticPages,
    ...categoryPages.map(url => ({ url, changefreq: 'weekly' as const, priority: 0.8 })),
    ...productTypePages.map(url => ({ url, changefreq: 'weekly' as const, priority: 0.8 })),
    ...products.map(product => ({
      url: `/product/${product._id}`,
      changefreq: 'weekly' as const,
      priority: 0.7
    }))
  ];
  
  return generateSitemapXML(allUrls);
};
