import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SEOPageData, DEFAULT_SEO, BASE_URL } from '../seo/SEOConfig';

interface SEOHeadProps {
  pageData?: SEOPageData;
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  structuredData?: any;
  noindex?: boolean;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  pageData,
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage,
  structuredData,
  noindex = false
}) => {
  const finalTitle = title || pageData?.title || DEFAULT_SEO.defaultTitle;
  const finalDescription = description || pageData?.description || DEFAULT_SEO.defaultDescription;
  const finalKeywords = keywords || pageData?.keywords || DEFAULT_SEO.defaultKeywords;
  const finalOgImage = ogImage || pageData?.ogImage || DEFAULT_SEO.defaultOgImage;
  const finalCanonicalUrl = canonicalUrl || pageData?.canonicalUrl;
  const finalStructuredData = structuredData || pageData?.structuredData;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
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
      {finalStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(finalStructuredData)}
        </script>
      )}
      
      {/* Facebook App ID */}
      {DEFAULT_SEO.facebookAppId && (
        <meta property="fb:app_id" content={DEFAULT_SEO.facebookAppId} />
      )}
    </Helmet>
  );
};

export default SEOHead;
