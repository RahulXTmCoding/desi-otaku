// Dynamic SEO Utility for Attars Clothing - Premium Fashion India
import { 
  CATEGORY_SEO_TEMPLATES, 
  PAGE_SEO_DATA, 
  INDIA_FASHION_KEYWORDS,
  AI_PLATFORM_DATA,
  getCategoryStructuredData,
  getEnhancedProductStructuredData,
  getBreadcrumbStructuredData,
  BASE_URL
} from './SEOConfig';

export interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  structuredData?: any;
  ogImage?: string;
  robots?: string;
}

export class SEOUtils {
  
  // Generate SEO data for category pages
  static getCategorySEO(categoryName: string, products: any[] = []): SEOData {
    const template = CATEGORY_SEO_TEMPLATES[categoryName as keyof typeof CATEGORY_SEO_TEMPLATES];
    
    if (!template) {
      return this.getDefaultSEO(`Premium ${categoryName} India - Attars Clothing`);
    }

    return {
      title: template.title,
      description: template.description,
      keywords: [
        ...template.keywords,
        ...INDIA_FASHION_KEYWORDS.primary,
        ...INDIA_FASHION_KEYWORDS.productSpecific
      ],
      canonicalUrl: `${BASE_URL}/category/${categoryName}`,
      structuredData: getCategoryStructuredData(categoryName, products),
      ogImage: `/images/category-${categoryName}-og.jpg`
    };
  }

  // Generate SEO data for product pages
  static getProductSEO(product: any, category?: string): SEOData {
    const productTitle = `${product.name} - Premium ${category || 'Fashion'} India | Attars Clothing`;
    const productDescription = product.description 
      ? `${product.description.substring(0, 120)}... Premium quality, express delivery across India.`
      : `Buy ${product.name} premium ${category || 'fashion'} online in India. Designer quality, luxury materials, sizes S-XXL. Express shipping across India.`;

    return {
      title: productTitle,
      description: productDescription,
      keywords: [
        product.name.toLowerCase(),
        ...(category ? CATEGORY_SEO_TEMPLATES[category as keyof typeof CATEGORY_SEO_TEMPLATES]?.keywords || [] : []),
        ...INDIA_FASHION_KEYWORDS.primary,
        'premium quality india',
        'designer clothing india',
        'luxury apparel india'
      ],
      canonicalUrl: `${BASE_URL}/product/${product._id}`,
      structuredData: getEnhancedProductStructuredData(product, category),
      ogImage: product.images?.[0]?.url || '/images/default-product-og.jpg'
    };
  }

  // Generate SEO data for search results
  static getSearchSEO(query: string, resultCount: number = 0): SEOData {
    return {
      title: `Search "${query}" - Premium Fashion India | Attars Clothing`,
      description: `Found ${resultCount} premium fashion items for "${query}" in India. Shop designer t-shirts, hoodies, oversized clothing and luxury apparel at Attars Clothing.`,
      keywords: [
        query,
        'search premium fashion india',
        'find designer clothing india',
        ...INDIA_FASHION_KEYWORDS.primary
      ],
      canonicalUrl: `${BASE_URL}/search?q=${encodeURIComponent(query)}`,
      robots: 'noindex, follow' // Don't index search pages
    };
  }

  // Generate location-specific SEO
  static getLocationSEO(city: string, category?: string): SEOData {
    const locationTitle = category 
      ? `Premium ${category} ${city} - Designer Clothing | Attars Clothing`
      : `Premium Fashion ${city} - Designer Clothing & Luxury Apparel | Attars Clothing`;
    
    const locationDescription = `Shop premium fashion in ${city} with Attars Clothing. Designer ${category || 'clothing'}, luxury apparel, express delivery. Premium quality guaranteed across ${city}.`;

    return {
      title: locationTitle,
      description: locationDescription,
      keywords: [
        `premium fashion ${city.toLowerCase()}`,
        `designer clothing ${city.toLowerCase()}`,
        `luxury apparel ${city.toLowerCase()}`,
        ...(category ? [`${category} ${city.toLowerCase()}`] : []),
        ...INDIA_FASHION_KEYWORDS.primary
      ],
      canonicalUrl: `${BASE_URL}/location/${city.toLowerCase()}${category ? `/${category}` : ''}`,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: `Attars Clothing - Premium Fashion ${city}`,
        description: locationDescription,
        areaServed: {
          '@type': 'City',
          name: city,
          addressCountry: 'IN'
        }
      }
    };
  }

  // Generate collection/filter SEO
  static getCollectionSEO(filters: any): SEOData {
    let title = 'Shop Premium Fashion India';
    let description = 'Browse our premium fashion collection in India';
    let keywords = [...INDIA_FASHION_KEYWORDS.primary];

    // Build dynamic title based on filters
    const titleParts = ['Shop'];
    
    if (filters.category) {
      titleParts.push(`Premium ${filters.category}`);
      keywords.push(`premium ${filters.category} india`);
    }
    
    if (filters.color) {
      titleParts.push(`${filters.color}`);
      keywords.push(`${filters.color} fashion india`);
    }
    
    if (filters.size) {
      titleParts.push(`Size ${filters.size}`);
    }
    
    titleParts.push('India - Attars Clothing');
    title = titleParts.join(' ');

    // Build description
    const descParts = ['Shop'];
    if (filters.category) descParts.push(`premium ${filters.category}`);
    if (filters.color) descParts.push(`in ${filters.color}`);
    descParts.push('with express delivery across India. Designer quality, luxury materials, contemporary designs.');
    description = descParts.join(' ');

    return {
      title,
      description,
      keywords: keywords.slice(0, 15), // Limit keywords
      canonicalUrl: `${BASE_URL}/shop${this.buildFilterQuery(filters)}`
    };
  }

  // Generate page-specific SEO
  static getPageSEO(pageName: string, customData?: Partial<SEOData>): SEOData {
    const pageData = PAGE_SEO_DATA[pageName];
    
    if (!pageData) {
      return this.getDefaultSEO(`${pageName} - Attars Clothing`);
    }

    return {
      title: pageData.title,
      description: pageData.description,
      keywords: pageData.keywords,
      canonicalUrl: pageData.canonicalUrl || `${BASE_URL}/${pageName === 'home' ? '' : pageName}`,
      structuredData: pageData.structuredData,
      ogImage: pageData.ogImage,
      ...customData
    };
  }

  // Generate default SEO fallback
  static getDefaultSEO(title: string): SEOData {
    return {
      title: `${title} | Attars Clothing - Premium Fashion India`,
      description: 'Discover premium fashion at Attars Clothing India. Designer t-shirts, hoodies, oversized clothing and luxury apparel with express delivery across India.',
      keywords: INDIA_FASHION_KEYWORDS.primary,
      canonicalUrl: BASE_URL
    };
  }

  // Generate breadcrumb data for any page
  static generateBreadcrumbs(path: string, product?: any, category?: any): any {
    const breadcrumbs = [
      { name: 'Home', url: BASE_URL }
    ];

    const pathParts = path.split('/').filter(Boolean);
    
    pathParts.forEach((part, index) => {
      const partPath = '/' + pathParts.slice(0, index + 1).join('/');
      
      switch (part) {
        case 'shop':
          breadcrumbs.push({ name: 'Shop', url: `${BASE_URL}/shop` });
          break;
        case 'product':
          if (product) {
            breadcrumbs.push({ name: product.name, url: `${BASE_URL}/product/${product._id}` });
          }
          break;
        case 'category':
          if (category) {
            breadcrumbs.push({ name: category.name, url: `${BASE_URL}/category/${category.slug}` });
          }
          break;
        default:
          breadcrumbs.push({ 
            name: part.charAt(0).toUpperCase() + part.slice(1), 
            url: `${BASE_URL}${partPath}` 
          });
      }
    });

    return getBreadcrumbStructuredData(breadcrumbs);
  }

  // AI Platform data for specific contexts
  static getAIPlatformData(context: 'general' | 'product' | 'category' = 'general') {
    switch (context) {
      case 'product':
        return {
          ...AI_PLATFORM_DATA.brand,
          context: 'product_information',
          capabilities: [
            'Product details and specifications',
            'Pricing and availability in India',
            'Size guides and fit information',
            'Material and care instructions',
            'Shipping and delivery options'
          ]
        };
      
      case 'category':
        return {
          ...AI_PLATFORM_DATA.brand,
          context: 'category_browsing',
          capabilities: [
            'Category-specific product recommendations',
            'Style guides and fashion tips',
            'Size and fit comparisons',
            'Trend insights for India market',
            'Collection highlights'
          ]
        };
      
      default:
        return AI_PLATFORM_DATA.brand;
    }
  }

  // Utility function to build filter query strings
  private static buildFilterQuery(filters: any): string {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value as string);
    });
    return params.toString() ? `?${params.toString()}` : '';
  }

  // Generate meta tags HTML
  static generateMetaTags(seoData: SEOData): string {
    return `
      <title>${seoData.title}</title>
      <meta name="description" content="${seoData.description}" />
      <meta name="keywords" content="${seoData.keywords.join(', ')}" />
      <link rel="canonical" href="${seoData.canonicalUrl}" />
      
      <!-- Open Graph Tags -->
      <meta property="og:title" content="${seoData.title}" />
      <meta property="og:description" content="${seoData.description}" />
      <meta property="og:url" content="${seoData.canonicalUrl}" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Attars Clothing" />
      ${seoData.ogImage ? `<meta property="og:image" content="${seoData.ogImage}" />` : ''}
      
      <!-- Twitter Card Tags -->
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${seoData.title}" />
      <meta name="twitter:description" content="${seoData.description}" />
      ${seoData.ogImage ? `<meta name="twitter:image" content="${seoData.ogImage}" />` : ''}
      
      <!-- Additional Meta Tags -->
      <meta name="robots" content="${seoData.robots || 'index, follow'}" />
      <meta name="author" content="Attars Clothing" />
      <meta name="coverage" content="India" />
      <meta name="distribution" content="India" />
      <meta name="rating" content="General" />
      
      ${seoData.structuredData ? `
      <!-- Structured Data -->
      <script type="application/ld+json">
        ${JSON.stringify(seoData.structuredData, null, 2)}
      </script>
      ` : ''}
    `.trim();
  }
}

// Export utility functions for easy access
export const generateCategorySEO = SEOUtils.getCategorySEO;
export const generateProductSEO = SEOUtils.getProductSEO;
export const generatePageSEO = SEOUtils.getPageSEO;
export const generateSearchSEO = SEOUtils.getSearchSEO;
export const generateLocationSEO = SEOUtils.getLocationSEO;
export const generateBreadcrumbs = SEOUtils.generateBreadcrumbs;
export const getAIPlatformData = SEOUtils.getAIPlatformData;
export const generateMetaTags = SEOUtils.generateMetaTags;
