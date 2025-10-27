import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SEOPageData, DEFAULT_SEO, BASE_URL, ORGANIZATION_STRUCTURED_DATA, FAQ_STRUCTURED_DATA, getEnhancedProductStructuredData } from '../seo/SEOConfig';
import { SEOUtils } from '../seo/SEOUtils';

interface SEOHeadProps {
  pageData?: SEOPageData;
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  structuredData?: any;
  noindex?: boolean;
  // Enhanced props for AI platform optimization
  product?: any;
  category?: string;
  pageName?: string;
  includeOrganizationData?: boolean;
  includeFAQData?: boolean;
  breadcrumbs?: Array<{name: string, url: string}>;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  pageData,
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage,
  structuredData,
  noindex = false,
  product,
  category,
  pageName,
  includeOrganizationData = true,
  includeFAQData = false,
  breadcrumbs
}) => {
  // Generate dynamic SEO data if product or page name provided
  let dynamicSEOData = null;
  if (product) {
    dynamicSEOData = SEOUtils.getProductSEO(product, category);
  } else if (pageName) {
    dynamicSEOData = SEOUtils.getPageSEO(pageName);
  }

  const finalTitle = title || dynamicSEOData?.title || pageData?.title || DEFAULT_SEO.defaultTitle;
  const finalDescription = description || dynamicSEOData?.description || pageData?.description || DEFAULT_SEO.defaultDescription;
  const finalKeywords = keywords || dynamicSEOData?.keywords || pageData?.keywords || DEFAULT_SEO.defaultKeywords;
  const finalOgImage = ogImage || dynamicSEOData?.ogImage || pageData?.ogImage || DEFAULT_SEO.defaultOgImage;
  const finalCanonicalUrl = canonicalUrl || dynamicSEOData?.canonicalUrl || pageData?.canonicalUrl;

  // Generate structured data array
  const allStructuredData = [];
  
  if (includeOrganizationData) {
    allStructuredData.push(ORGANIZATION_STRUCTURED_DATA);
  }
  
  if (includeFAQData) {
    allStructuredData.push(FAQ_STRUCTURED_DATA);
  }
  
  if (product) {
    allStructuredData.push(getEnhancedProductStructuredData(product, category));
  }
  
  if (breadcrumbs) {
    allStructuredData.push(SEOUtils.generateBreadcrumbs(window.location.pathname, product, { name: category }));
  }
  
  if (structuredData) {
    allStructuredData.push(structuredData);
  }
  
  if (pageData?.structuredData) {
    allStructuredData.push(pageData.structuredData);
  }

  const finalStructuredData = allStructuredData.length > 0 ? allStructuredData : null;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="title" content={finalTitle} />
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords.join(', ')} />
      
      {/* Robots Meta Tag */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      )}
      
      {/* Canonical URL */}
      {finalCanonicalUrl && <link rel="canonical" href={finalCanonicalUrl} />}
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={finalCanonicalUrl || BASE_URL} />
      <meta property="og:image" content={`${BASE_URL}${finalOgImage}`} />
      <meta property="og:site_name" content={DEFAULT_SEO.siteName} />
      <meta property="og:locale" content="en_IN" />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={`${BASE_URL}${finalOgImage}`} />
      <meta name="twitter:site" content={DEFAULT_SEO.twitterHandle} />
      
      {/* Additional Meta Tags */}
      <meta name="author" content="Attars Clothing" />
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="theme-color" content="#1F2937" />
      
      {/* Language and Region */}
      <meta name="language" content="English" />
      <meta name="geo.region" content="IN" />
      <meta name="geo.placename" content="India" />
      
      {/* Structured Data */}
      {finalStructuredData && finalStructuredData.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
      
      {/* Facebook App ID */}
      {DEFAULT_SEO.facebookAppId && (
        <meta property="fb:app_id" content={DEFAULT_SEO.facebookAppId} />
      )}
    </Helmet>
  );
};

export default SEOHead;
