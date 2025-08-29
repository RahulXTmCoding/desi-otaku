import { BASE_URL } from '../seo/SEOConfig';

/**
 * Dynamic Canonical URL Management
 * Fixes conflicting canonical URLs issue by ensuring each page has correct canonical URL
 */

export const updateCanonicalUrl = (path: string) => {
  const canonicalElement = document.getElementById('canonical-url') as HTMLLinkElement;
  if (canonicalElement) {
    const fullUrl = path.startsWith('http') ? path : `${BASE_URL}${path}`;
    canonicalElement.href = fullUrl;
  }
};

export const updatePageMeta = (seoData: {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
}) => {
  // Update title
  if (seoData.title) {
    document.title = seoData.title;
    
    // Update OG title
    const ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
    if (ogTitle) ogTitle.content = seoData.title;
    
    // Update Twitter title
    const twitterTitle = document.querySelector('meta[property="twitter:title"]') as HTMLMetaElement;
    if (twitterTitle) twitterTitle.content = seoData.title;
  }

  // Update description
  if (seoData.description) {
    const descMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    if (descMeta) descMeta.content = seoData.description;
    
    // Update OG description
    const ogDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement;
    if (ogDesc) ogDesc.content = seoData.description;
    
    // Update Twitter description
    const twitterDesc = document.querySelector('meta[property="twitter:description"]') as HTMLMetaElement;
    if (twitterDesc) twitterDesc.content = seoData.description;
  }

  // Update keywords
  if (seoData.keywords) {
    const keywordsMeta = document.querySelector('meta[name="keywords"]') as HTMLMetaElement;
    if (keywordsMeta) keywordsMeta.content = seoData.keywords.join(', ');
  }

  // Update canonical URL
  if (seoData.canonicalUrl) {
    updateCanonicalUrl(seoData.canonicalUrl);
    
    // Update OG URL
    const ogUrl = document.querySelector('meta[property="og:url"]') as HTMLMetaElement;
    if (ogUrl) {
      const fullUrl = seoData.canonicalUrl.startsWith('http') 
        ? seoData.canonicalUrl 
        : `${BASE_URL}${seoData.canonicalUrl}`;
      ogUrl.content = fullUrl;
    }
    
    // Update Twitter URL
    const twitterUrl = document.querySelector('meta[property="twitter:url"]') as HTMLMetaElement;
    if (twitterUrl) {
      const fullUrl = seoData.canonicalUrl.startsWith('http') 
        ? seoData.canonicalUrl 
        : `${BASE_URL}${seoData.canonicalUrl}`;
      twitterUrl.content = fullUrl;
    }
  }

  // Update OG image
  if (seoData.ogImage) {
    const ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
    if (ogImage) {
      const fullImageUrl = seoData.ogImage.startsWith('http') 
        ? seoData.ogImage 
        : `${BASE_URL}${seoData.ogImage}`;
      ogImage.content = fullImageUrl;
    }
    
    // Update Twitter image
    const twitterImage = document.querySelector('meta[property="twitter:image"]') as HTMLMetaElement;
    if (twitterImage) {
      const fullImageUrl = seoData.ogImage.startsWith('http') 
        ? seoData.ogImage 
        : `${BASE_URL}${seoData.ogImage}`;
      twitterImage.content = fullImageUrl;
    }
  }
};

export const addStructuredData = (structuredData: any, id: string = 'structured-data') => {
  // Remove existing structured data with the same ID
  const existingScript = document.getElementById(id);
  if (existingScript) {
    existingScript.remove();
  }

  // Add new structured data
  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(structuredData);
  document.head.appendChild(script);
};

export const removeStructuredData = (id: string) => {
  const script = document.getElementById(id);
  if (script) {
    script.remove();
  }
};

// Get current page canonical URL based on location
export const getCurrentCanonicalUrl = (): string => {
  const currentPath = window.location.pathname;
  const currentSearch = window.location.search;
  return `${BASE_URL}${currentPath}${currentSearch}`;
};

// Initialize canonical URL for current page
export const initializePageSEO = () => {
  const currentCanonical = getCurrentCanonicalUrl();
  updateCanonicalUrl(currentCanonical);
};

// Route-specific canonical URL generators
export const getCanonicalUrlForRoute = (route: string, params?: Record<string, string>): string => {
  switch (route) {
    case 'home':
      return BASE_URL;
    case 'shop':
      return `${BASE_URL}/shop`;
    case 'product':
      return params?.productId ? `${BASE_URL}/product/${params.productId}` : `${BASE_URL}/shop`;
    case 'category':
      return params?.category ? `${BASE_URL}/shop?category=${params.category}` : `${BASE_URL}/shop`;
    case 'customize':
      return `${BASE_URL}/customize`;
    case 'about':
      return `${BASE_URL}/about`;
    case 'contact':
      return `${BASE_URL}/contact`;
    case 'size-guide':
      return `${BASE_URL}/size-guide`;
    case 'shipping-policy':
      return `${BASE_URL}/shipping-policy`;
    case 'return-policy':
      return `${BASE_URL}/return-policy`;
    case 'cancellation-policy':
      return `${BASE_URL}/cancellation-policy`;
    case 'terms-of-service':
      return `${BASE_URL}/terms-of-service`;
    case 'privacy-policy':
      return `${BASE_URL}/privacy-policy`;
    default:
      return getCurrentCanonicalUrl();
  }
};

// SEO optimization for page transitions
export const optimizePageTransition = (route: string, params?: Record<string, string>) => {
  const canonicalUrl = getCanonicalUrlForRoute(route, params);
  updateCanonicalUrl(canonicalUrl);
  
  // Update OG URL to match canonical
  updatePageMeta({ canonicalUrl });
};
