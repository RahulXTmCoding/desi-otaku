// SEO Configuration for Attars Clothing - Premium Fashion Store

export interface SEOPageData {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  canonicalUrl?: string;
  structuredData?: any;
}

export const BASE_URL = 'https://attarsclothing.com'; // Update with your actual domain

export const DEFAULT_SEO = {
  siteName: 'Attars Clothing - Premium Fashion Store',
  defaultTitle: 'Attars Clothing - Premium Fashion Store | Designer Apparel & Contemporary Clothing',
  defaultDescription: 'Discover premium fashion at Attars Clothing. Shop our exclusive collection of designer apparel, t-shirts, hoodies, and contemporary clothing. Elevate your style with our curated fashion pieces.',
  defaultKeywords: [
    'premium fashion',
    'designer clothing',
    'attars clothing',
    'fashion store',
    'premium apparel',
    'designer t-shirts',
    'luxury fashion',
    'contemporary clothing',
    'fashion brand',
    'premium wear',
    'designer hoodies',
    'fashion boutique'
  ],
  defaultOgImage: '/og-image.jpg',
  twitterHandle: '@attarsclothing',
  facebookAppId: '', // Add your Facebook App ID
};

export const PAGE_SEO_DATA: Record<string, SEOPageData> = {
  home: {
    title: 'Attars Clothing - Premium Fashion Store | Designer Apparel & Contemporary Clothing',
    description: 'Discover premium fashion at Attars Clothing. Shop our exclusive collection of designer apparel, contemporary clothing & curated fashion pieces. Elevate your style with quality craftsmanship.',
    keywords: [
      'premium fashion store',
      'designer apparel',
      'contemporary clothing',
      'luxury fashion',
      'attars clothing',
      'premium brand',
      'designer t-shirts',
      'fashion boutique',
      'premium wear'
    ],
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Attars Clothing',
      url: BASE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${BASE_URL}/shop?search={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      }
    }
  },
  shop: {
    title: 'Shop Premium Fashion & Designer Clothing - Attars Clothing',
    description: 'Browse our collection of premium fashion, designer t-shirts, hoodies & contemporary clothing. Discover luxury apparel crafted with quality materials. Sizes S-XXL available.',
    keywords: [
      'buy premium fashion',
      'designer clothing online',
      'luxury apparel',
      'premium t-shirts',
      'designer hoodies',
      'contemporary fashion',
      'fashion store',
      'premium wear'
    ]
  },
  product: {
    title: '{productName} - Premium Fashion | Attars Clothing',
    description: 'Buy {productName} premium fashion item online. Superior quality, contemporary design, available in multiple colors & sizes (S-XXL). Express shipping across India.',
    keywords: [
      '{productName}',
      'premium fashion',
      'designer clothing',
      'luxury apparel',
      'contemporary wear',
      'fashion brand'
    ]
  },
  customize: {
    title: 'Create Custom Fashion Design Online - Attars Clothing',
    description: 'Design your own custom fashion pieces with our designer. Upload your artwork, choose colors & create unique apparel. Premium quality guaranteed.',
    keywords: [
      'custom fashion design',
      'create custom clothing',
      'design your own apparel',
      'custom fashion pieces',
      'personalized clothing',
      'custom printing',
      'fashion designer online',
      'make your own clothes'
    ]
  },
  about: {
    title: 'About Attars Clothing - Premium Fashion Brand',
    description: 'Attars Clothing is a premium fashion brand offering high-quality designer apparel & contemporary clothing. Discover our commitment to quality and style.',
    keywords: [
      'premium fashion brand',
      'luxury clothing brand',
      'designer apparel brand',
      'about attars clothing',
      'fashion brand story'
    ]
  },
  contact: {
    title: 'Contact Attars Clothing - Customer Support & Inquiries',
    description: 'Get in touch with Attars Clothing for orders, custom designs, bulk inquiries or support. We\'re here to help with your fashion needs.',
    keywords: [
      'contact attars clothing',
      'customer support',
      'fashion store contact',
      'bulk order inquiry'
    ]
  }
};

// Product structured data template
export const getProductStructuredData = (product: any) => ({
  '@context': 'https://schema.org/',
  '@type': 'Product',
  name: product.name,
  image: product.images || [],
  description: product.description,
  sku: product._id,
  brand: {
    '@type': 'Brand',
    name: 'Attars Clothing'
  },
  offers: {
    '@type': 'Offer',
    url: `${BASE_URL}/product/${product._id}`,
    priceCurrency: 'INR',
    price: product.price,
    priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    seller: {
      '@type': 'Organization',
      name: 'Attars Clothing'
    }
  },
  aggregateRating: product.rating ? {
    '@type': 'AggregateRating',
    ratingValue: product.rating,
    reviewCount: product.reviewCount || 0
  } : undefined
});

// Breadcrumb structured data
export const getBreadcrumbStructuredData = (items: Array<{name: string, url: string}>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url
  }))
});

// Organization structured data
export const ORGANIZATION_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Attars Clothing',
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  description: 'Premium fashion store offering designer apparel, contemporary clothing, and curated fashion pieces',
  sameAs: [
    'https://www.facebook.com/attarsclothing',
    'https://www.instagram.com/attarsclothing',
    'https://twitter.com/attarsclothing'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+91-XXXXXXXXXX', // Add your contact number
    contactType: 'customer service',
    areaServed: 'IN',
    availableLanguage: ['en', 'hi']
  }
};

// FAQ structured data for common questions
export const FAQ_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What sizes are available for fashion items?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our fashion items are available in sizes S, M, L, XL, and XXL. We offer both regular fit and oversized options for different styles.'
      }
    },
    {
      '@type': 'Question',
      name: 'Can I create custom fashion designs?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! You can create custom fashion designs using our online designer. Upload your artwork or choose from our design library.'
      }
    },
    {
      '@type': 'Question',
      name: 'What is the delivery time for orders?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Standard delivery takes 5-7 business days. Express shipping (2-3 days) is available. Custom designs may take an additional 2-3 days.'
      }
    },
    {
      '@type': 'Question',
      name: 'Do you offer international shipping?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Currently, we ship across India. International shipping will be available soon.'
      }
    }
  ]
};
